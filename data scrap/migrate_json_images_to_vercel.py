"""
Migrate image URLs in scraped JSON files to Vercel Blob storage and rewrite URLs.

- Scans jsons raw_cleaned directory for JSON files
- For each question object, parses HTML content in question, explanation, and answer fields
- Extracts image URLs from <img> tags, downloads them, uploads to Vercel Blob
- Replaces original URLs with new Vercel blob URLs
- Writes updated JSON files back to the same directory with "_migrated" suffix

Notes:
- Uses BeautifulSoup for HTML parsing to extract and replace img src attributes
- Caches uploads per original URL to avoid duplicate uploads
- Preserves all HTML formatting while only replacing image URLs
"""

import os
import re
import json
import mimetypes
import hashlib
import logging
import time
from typing import Dict, List, Tuple, Any

import requests
from bs4 import BeautifulSoup


# ---------------------- Configuration ----------------------

# Directory containing the source JSON files
INPUT_DIRECTORY = os.path.join("jsons raw_cleaned")

# Hardcoded token as requested by the user (keep secure in real projects)
BLOB_READ_WRITE_TOKEN = "apna daliye ji"

# Optional: base public URL for the store (not required for upload; response includes full URL)
# Provided by user for reference/documentation
STORE_PUBLIC_BASE_URL = "https://rkokdq5fgqqf84hb.public.blob.vercel-storage.com"

# Folder prefix to organize uploads in the blob store
BLOB_PREFIX = "gate-images"

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

def guess_filename_and_mime(url: str, fallback_ext: str = ".bin") -> Tuple[str, str]:
    """Extract filename and MIME type from URL."""
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


def build_blob_path(year: str, question_id: str, original_url: str) -> str:
    """Create a deterministic path under the prefix."""
    url_hash = hashlib.sha256(original_url.encode("utf-8")).hexdigest()[:16]
    # Preserve extension if present; otherwise, infer by mime
    fn, _ = guess_filename_and_mime(original_url)
    _, ext = os.path.splitext(fn)
    if not ext:
        ext = ".bin"
    return f"{BLOB_PREFIX}/{year}/q_{question_id}/{url_hash}{ext}"


def http_get_bytes(url: str) -> bytes:
    """Download bytes from URL with retries."""
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

    Endpoint: PUT https://blob.vercel-storage.com
    Headers:
      - Authorization: Bearer <token>
      - x-vercel-blobs-filename: <desired path in store>
      - x-vercel-blobs-public: true
    Body: binary body (octet-stream).
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


def extract_and_replace_images(html_content: str, question_id: str, year: str, url_cache: Dict[str, str]) -> str:
    """
    Parse HTML content, extract image URLs, upload to Vercel blob, and replace URLs.
    Returns the modified HTML content.
    """
    if not html_content or not isinstance(html_content, str):
        return html_content

    soup = BeautifulSoup(html_content, 'html.parser')
    images = soup.find_all('img')

    if not images:
        return html_content

    for img in images:
        src = img.get('src')
        if not src:
            continue

        # Skip if already a Vercel blob URL
        if 'vercel-storage.com' in src:
            continue

        # Check cache first
        if src in url_cache:
            logger.info("Using cached URL for: %s", src)
            img['src'] = url_cache[src]
            continue

        try:
            logger.info("Downloading and uploading: %s", src)
            # Download
            file_bytes = http_get_bytes(src)
            _, mime = guess_filename_and_mime(src)
            blob_path = build_blob_path(year, question_id, src)

            # Upload
            new_url = upload_to_vercel_blob(file_bytes, blob_path, mime)
            url_cache[src] = new_url
            img['src'] = new_url
            logger.info("Successfully migrated: %s -> %s", src, new_url)

        except Exception as e:
            logger.error("Failed to migrate image %s for question %s: %s", src, question_id, e)
            # Keep original URL if migration fails

    return str(soup)


def process_question_object(question_obj: Dict[str, Any], url_cache: Dict[str, str]) -> Dict[str, Any]:
    """Process a single question object and migrate its images."""
    # Extract metadata
    question_id = str(question_obj.get('id', 'unknown'))
    year = str(question_obj.get('year', 'unknown'))

    # Process question field
    if 'question' in question_obj:
        question_obj['question'] = extract_and_replace_images(
            question_obj['question'], question_id, year, url_cache
        )

    # Process explanation field
    if 'explanation' in question_obj:
        question_obj['explanation'] = extract_and_replace_images(
            question_obj['explanation'], question_id, year, url_cache
        )

    # Process answers array
    if 'answers' in question_obj and isinstance(question_obj['answers'], list):
        for answer in question_obj['answers']:
            if 'answer' in answer:
                answer['answer'] = extract_and_replace_images(
                    answer['answer'], question_id, year, url_cache
                )

    return question_obj


def migrate_json_file(json_path: str, url_cache: Dict[str, str]) -> None:
    """Process a single JSON file and migrate all images."""
    logger.info("Processing JSON: %s", json_path)

    # Read JSON file
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    # Check if it has the expected structure
    if 'results' not in data or not isinstance(data['results'], list):
        logger.warning("Skipping %s: unexpected JSON structure", json_path)
        return

    # Process each question
    total_questions = len(data['results'])
    logger.info("Found %d questions in %s", total_questions, json_path)

    for i, question in enumerate(data['results']):
        if i % 10 == 0:  # Log progress every 10 questions
            logger.info("Processing question %d/%d", i + 1, total_questions)
        data['results'][i] = process_question_object(question, url_cache)

    # Write updated JSON file
    output_path = json_path.replace('.json', '_migrated.json')
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

    logger.info("Wrote migrated JSON: %s", output_path)


def migrate_all_json_files(input_dir: str) -> None:
    """Process all JSON files in the input directory."""
    if not BLOB_READ_WRITE_TOKEN or BLOB_READ_WRITE_TOKEN.startswith("REPLACE_WITH_"):
        raise RuntimeError("BLOB_READ_WRITE_TOKEN is not set. Please set it in this script.")

    if not os.path.isdir(input_dir):
        raise FileNotFoundError(f"Input directory does not exist: {input_dir}")

    json_files = [
        os.path.join(input_dir, f)
        for f in os.listdir(input_dir)
        if f.lower().endswith(".json")
    ]

    if not json_files:
        logger.warning("No JSON files found in %s", input_dir)
        return

    # Initialize URL cache to avoid duplicate uploads
    url_cache: Dict[str, str] = {}

    logger.info("Found %d JSON files to process", len(json_files))

    for json_path in sorted(json_files):
        try:
            migrate_json_file(json_path, url_cache)
            # Small delay to be respectful with both source and destination services
            time.sleep(0.25)
        except Exception as e:
            logger.error("Failed to process %s: %s", json_path, e)
            continue

    logger.info("Migration completed. URL cache had %d entries", len(url_cache))


if __name__ == "__main__":
    migrate_all_json_files(INPUT_DIRECTORY)
