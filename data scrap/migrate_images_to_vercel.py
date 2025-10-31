"""
Migrate image URLs in scraped CSV files to Vercel Blob storage and rewrite URLs.

- Scans input directory for CSVs (default: "csv scraped")
- For each image URL field, downloads the image, uploads to Vercel Blob via REST
  using a Read/Write token, and replaces the URL with the new public blob URL
- Writes updated CSVs to an output directory (default: "csv migrated")

Notes:
- The Vercel Blob REST upload is done via multipart POST to
  https://blob.vercel-storage.com with Authorization: Bearer <token>.
- This script caches uploads per original URL to avoid duplicate uploads.
"""

import os
import re
import mimetypes
import hashlib
import logging
import time
from typing import Dict, List, Tuple

import requests
import pandas as pd


# ---------------------- Configuration ----------------------

# Directory containing the source CSV files
INPUT_DIRECTORY = os.path.join("csv scraped")

# Directory to write updated CSV files
OUTPUT_DIRECTORY = os.path.join("csv migrated")

# Hardcoded token as requested by the user (keep secure in real projects)
BLOB_READ_WRITE_TOKEN="vercel_blob_rw_RkokDQ5Fgqqf84hB_JnAeWigaxNq0ugwIxaZc3MwaxiP5uR"

# Optional: base public URL for the store (not required for upload; response includes full URL)
# Provided by user for reference/documentation
STORE_PUBLIC_BASE_URL = "https://rkokdq5fgqqf84hb.public.blob.vercel-storage.com"

# Folder prefix to organize uploads in the blob store
BLOB_PREFIX = "gate-cs"

# CSV columns that may contain comma-separated image URLs
IMAGE_COLUMNS = [
    "Question_Images",
    "Option_A_Images",
    "Option_B_Images",
    "Option_C_Images",
    "Option_D_Images",
    "Explanation_Images",
]

# Network settings
HTTP_TIMEOUT_SECONDS = 30
RETRY_COUNT = 3
RETRY_BACKOFF_SECONDS = 1.5


# ---------------------- Logging ----------------------

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


# ---------------------- Helpers ----------------------

def split_urls_field(field_value: str) -> List[str]:
    if not isinstance(field_value, str) or not field_value.strip():
        return []
    # The scraper joins with ", ", but handle both comma+space and plain comma
    parts = [p.strip() for p in field_value.split(",")]
    return [p for p in parts if p]


def guess_filename_and_mime(url: str, fallback_ext: str = ".bin") -> Tuple[str, str]:
    # Try to extract filename/extension from URL
    filename = os.path.basename(url.split("?")[0].split("#")[0])
    if not filename or "." not in filename:
        # Generate a stable name from hash
        url_hash = hashlib.sha256(url.encode("utf-8")).hexdigest()[:16]
        filename = f"blob_{url_hash}{fallback_ext}"
    mime, _ = mimetypes.guess_type(filename)
    if mime is None:
        mime = "application/octet-stream"
    return filename, mime


def build_blob_path(year: str, column_name: str, original_url: str) -> str:
    # Create a deterministic path under the prefix
    url_hash = hashlib.sha256(original_url.encode("utf-8")).hexdigest()[:16]
    safe_col = re.sub(r"[^a-zA-Z0-9_\-]", "_", column_name)
    # Preserve extension if present; otherwise, infer by mime
    fn, _ = guess_filename_and_mime(original_url)
    _, ext = os.path.splitext(fn)
    if not ext:
        ext = ".bin"
    return f"{BLOB_PREFIX}/{year}/{safe_col}/{url_hash}{ext}"


def http_get_bytes(url: str) -> bytes:
    last_exc = None
    for attempt in range(1, RETRY_COUNT + 1):
        try:
            resp = requests.get(url, timeout=HTTP_TIMEOUT_SECONDS)
            resp.raise_for_status()
            return resp.content
        except Exception as exc:
            last_exc = exc
            logger.warning("GET failed (attempt %d/%d) for %s: %s", attempt, RETRY_COUNT, url, exc)
            time.sleep(RETRY_BACKOFF_SECONDS * attempt)
    raise RuntimeError(f"Failed to download after {RETRY_COUNT} attempts: {url}") from last_exc


def upload_to_vercel_blob(file_bytes: bytes, blob_path: str, content_type: str) -> str:
    """
    Uploads bytes to Vercel Blob via REST API and returns the public URL.

    Endpoint: POST https://blob.vercel-storage.com
    Headers:
      - Authorization: Bearer <token>
      - x-vercel-blobs-filename: <desired path in store>
      - x-vercel-blobs-public: true
    Body: binary body (octet-stream). Use PUT for uploads.
    """
    headers = {
        "Authorization": f"Bearer {BLOB_READ_WRITE_TOKEN}",
        "x-vercel-blobs-filename": blob_path,
        "x-vercel-blobs-public": "true",
        "Content-Type": content_type or "application/octet-stream",
    }
    # Provide pathname in the URL to avoid "Invalid pathname" errors
    upload_url = f"https://blob.vercel-storage.com/{blob_path}"
    resp = requests.put(
        upload_url,
        headers=headers,
        data=file_bytes,
        timeout=HTTP_TIMEOUT_SECONDS,
    )
    try:
        resp.raise_for_status()
    except Exception as exc:
        # Include server message to aid debugging
        raise RuntimeError(f"Blob upload failed for {blob_path}: {resp.status_code} {resp.text}") from exc
    data = resp.json()
    # Expecting a JSON with a "url" field
    url = data.get("url")
    if not url:
        raise RuntimeError(f"Blob upload response missing URL for {blob_path}: {data}")
    return url


def migrate_csv_file(csv_path: str, output_dir: str, url_cache: Dict[str, str]) -> None:
    logger.info("Processing CSV: %s", csv_path)

    # Extract year from filename if present
    base = os.path.basename(csv_path)
    m = re.search(r"(\d{4})", base)
    year = m.group(1) if m else "unknown"

    df = pd.read_csv(csv_path, encoding='utf-8')

    # Ensure all image columns exist in the dataframe; skip missing gracefully
    cols_in_df = [c for c in IMAGE_COLUMNS if c in df.columns]
    if not cols_in_df:
        logger.info("No image columns found in %s, skipping.", csv_path)
        return

    for col in cols_in_df:
        logger.info("Processing column: %s", col)
        new_values: List[str] = []
        
        # Replace NaN with empty string before converting to string
        for idx, value in enumerate(df[col].fillna("").astype(str).tolist()):
            urls = split_urls_field(value)
            
            # Skip empty cells
            if not urls:
                new_values.append("")
                continue

            # Process rows with actual URLs
            new_urls: List[str] = []
            for src_url in urls:
                # Additional safety check
                if not src_url or src_url.lower() in ['nan', 'none']:
                    continue
                
                # Check cache first
                if src_url in url_cache:
                    logger.info("Using cached URL for: %s", src_url)
                    new_urls.append(url_cache[src_url])
                    continue

                try:
                    logger.info("Downloading and uploading: %s", src_url)
                    # Download
                    file_bytes = http_get_bytes(src_url)
                    _, mime = guess_filename_and_mime(src_url)
                    blob_path = build_blob_path(year, col, src_url)

                    # Upload
                    new_url = upload_to_vercel_blob(file_bytes, blob_path, mime)
                    url_cache[src_url] = new_url
                    new_urls.append(new_url)
                    logger.info("Successfully migrated: %s -> %s", src_url, new_url)
                    
                except Exception as e:
                    logger.error("Failed to migrate URL %s (row %d): %s", src_url, idx, e)
                    # Keep original URL if migration fails (or skip by not appending)
                    new_urls.append(src_url)

            new_values.append(", ".join(new_urls))
        
        df[col] = new_values

    os.makedirs(output_dir, exist_ok=True)
    out_path = os.path.join(output_dir, base)
    df.to_csv(out_path, index=False, encoding='utf-8')
    logger.info("Wrote migrated CSV: %s", out_path)

def migrate_all(input_dir: str, output_dir: str) -> None:
    if not BLOB_READ_WRITE_TOKEN or BLOB_READ_WRITE_TOKEN.startswith("REPLACE_WITH_"):
        raise RuntimeError("BLOB_READ_WRITE_TOKEN is not set. Please set it in this script.")

    if not os.path.isdir(input_dir):
        raise FileNotFoundError(f"Input directory does not exist: {input_dir}")

    csv_files = [
        os.path.join(input_dir, f)
        for f in os.listdir(input_dir)
        if f.lower().endswith(".csv")
    ]
    if not csv_files:
        logger.warning("No CSV files found in %s", input_dir)
        return

    url_cache: Dict[str, str] = {}
    for csv_path in sorted(csv_files):
        migrate_csv_file(csv_path, output_dir, url_cache)
        # Small delay to be respectful with both source and destination services
        time.sleep(0.25)


if __name__ == "__main__":
    migrate_all(INPUT_DIRECTORY, OUTPUT_DIRECTORY)


