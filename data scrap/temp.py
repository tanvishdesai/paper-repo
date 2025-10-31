"""
Retry failed image migrations identified by the comparison script.

This script:
- Reads the migration failures report
- Extracts failed URLs with their context (file, row, column)
- Retries downloading and uploading only those specific images
- Updates the migrated CSV files with the new blob URLs
- Maintains proper folder structure in Vercel Blob (year/column/hash)
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

# Directory containing the migrated CSV files (will be updated in-place)
MIGRATED_DIRECTORY = "csv migrated"

# Hardcoded token (same as migration script)
BLOB_READ_WRITE_TOKEN = "vercel_blob_rw_RkokDQ5Fgqqf84hB_JnAeWigaxNq0ugwIxaZc3MwaxiP5uR"

# Folder prefix to organize uploads in the blob store
BLOB_PREFIX = "gate-cs"

# CSV columns that may contain image URLs
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

# Report file from comparison script
COMPARISON_REPORT_FILE = "migration_failures_report.txt"


# ---------------------- Logging ----------------------

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


# ---------------------- Helpers ----------------------

def split_urls_field(field_value) -> List[str]:
    """Split comma-separated URLs from a field."""
    if pd.isna(field_value) or not str(field_value).strip():
        return []
    parts = [p.strip() for p in str(field_value).split(",")]
    return [p for p in parts if p and p.lower() not in ['nan', 'none', '']]


def guess_filename_and_mime(url: str, fallback_ext: str = ".bin") -> Tuple[str, str]:
    """Extract filename and MIME type from URL."""
    filename = os.path.basename(url.split("?")[0].split("#")[0])
    if not filename or "." not in filename:
        url_hash = hashlib.sha256(url.encode("utf-8")).hexdigest()[:16]
        filename = f"blob_{url_hash}{fallback_ext}"
    mime, _ = mimetypes.guess_type(filename)
    if mime is None:
        mime = "application/octet-stream"
    return filename, mime


def build_blob_path(year: str, column_name: str, original_url: str) -> str:
    """Create a deterministic path under the prefix."""
    url_hash = hashlib.sha256(original_url.encode("utf-8")).hexdigest()[:16]
    safe_col = re.sub(r"[^a-zA-Z0-9_\-]", "_", column_name)
    fn, _ = guess_filename_and_mime(original_url)
    _, ext = os.path.splitext(fn)
    if not ext:
        ext = ".bin"
    return f"{BLOB_PREFIX}/{year}/{safe_col}/{url_hash}{ext}"


def http_get_bytes(url: str) -> bytes:
    """Download image with retries."""
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
    """Upload bytes to Vercel Blob via REST API and return the public URL."""
    headers = {
        "Authorization": f"Bearer {BLOB_READ_WRITE_TOKEN}",
        "x-vercel-blobs-filename": blob_path,
        "x-vercel-blobs-public": "true",
        "Content-Type": content_type or "application/octet-stream",
    }
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
        raise RuntimeError(f"Blob upload failed for {blob_path}: {resp.status_code} {resp.text}") from exc
    data = resp.json()
    url = data.get("url")
    if not url:
        raise RuntimeError(f"Blob upload response missing URL for {blob_path}: {data}")
    return url


def parse_comparison_report(report_file: str) -> List[Dict]:
    """
    Parse the comparison report to extract failed migrations.
    Returns list of dicts with: filename, row, column, original_url
    """
    if not os.path.exists(report_file):
        raise FileNotFoundError(f"Comparison report not found: {report_file}")
    
    failures = []
    current_file = None
    
    with open(report_file, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    for i, line in enumerate(lines):
        line = line.strip()
        
        # Detect file section
        if line.startswith("FILE: "):
            current_file = line.replace("FILE: ", "").strip()
            continue
        
        # Detect failure entry
        if line.startswith("Row ") and ", Column:" in line:
            # Parse: "Row 15, Column: Question_Images"
            match = re.match(r"Row (\d+), Column: (.+)", line)
            if match and current_file:
                row = int(match.group(1))
                column = match.group(2).strip()
                
                # Next line should be "Original: <url>"
                if i + 1 < len(lines):
                    orig_line = lines[i + 1].strip()
                    if orig_line.startswith("Original: "):
                        original_url = orig_line.replace("Original: ", "").strip()
                        # Remove trailing "..." if present
                        if original_url.endswith("..."):
                            original_url = original_url[:-3]
                        
                        failures.append({
                            'filename': current_file,
                            'row': row,
                            'column': column,
                            'original_url': original_url
                        })
    
    return failures


def retry_failed_migration(failure: Dict, migrated_dir: str) -> bool:
    """
    Retry a single failed migration and update the CSV.
    Returns True if successful, False otherwise.
    """
    filename = failure['filename']
    row_num = failure['row']
    column = failure['column']
    original_url = failure['original_url']
    
    csv_path = os.path.join(migrated_dir, filename)
    
    if not os.path.exists(csv_path):
        logger.error("CSV file not found: %s", csv_path)
        return False
    
    # Extract year from filename
    m = re.search(r"(\d{4})", filename)
    year = m.group(1) if m else "unknown"
    
    try:
        # Download image
        logger.info("Downloading: %s", original_url)
        file_bytes = http_get_bytes(original_url)
        
        # Prepare upload
        _, mime = guess_filename_and_mime(original_url)
        blob_path = build_blob_path(year, column, original_url)
        
        # Upload to Vercel Blob
        logger.info("Uploading to blob: %s", blob_path)
        new_url = upload_to_vercel_blob(file_bytes, blob_path, mime)
        logger.info("Successfully uploaded: %s", new_url)
        
        # Update CSV
        df = pd.read_csv(csv_path, encoding='utf-8')
        
        # Row number is 1-indexed and includes header, so actual index is row_num - 2
        csv_index = row_num - 2
        
        if csv_index < 0 or csv_index >= len(df):
            logger.error("Invalid row number %d for file %s", row_num, filename)
            return False
        
        if column not in df.columns:
            logger.error("Column %s not found in %s", column, filename)
            return False
        
        # Get current cell value
        current_value = df.loc[csv_index, column]
        current_urls = split_urls_field(current_value)
        
        # Replace the original URL with new URL
        updated_urls = []
        found_and_replaced = False
        
        for url in current_urls:
            if url == original_url or url.startswith(original_url[:50]):
                updated_urls.append(new_url)
                found_and_replaced = True
            else:
                updated_urls.append(url)
        
        # If URL wasn't found in list, add it
        if not found_and_replaced:
            if current_urls:
                updated_urls.append(new_url)
            else:
                updated_urls = [new_url]
        
        # Update cell
        df.loc[csv_index, column] = ", ".join(updated_urls)
        
        # Save CSV
        df.to_csv(csv_path, index=False, encoding='utf-8')
        logger.info("Updated CSV: %s (row %d, column %s)", filename, row_num, column)
        
        return True
        
    except Exception as e:
        logger.error("Failed to retry migration for %s: %s", original_url, e)
        return False


def retry_all_failed_migrations(report_file: str, migrated_dir: str) -> Dict:
    """
    Retry all failed migrations from the comparison report.
    Returns statistics about the retry attempts.
    """
    if not BLOB_READ_WRITE_TOKEN or BLOB_READ_WRITE_TOKEN.startswith("REPLACE_WITH_"):
        raise RuntimeError("BLOB_READ_WRITE_TOKEN is not set. Please set it in this script.")
    
    # Parse report
    logger.info("Parsing comparison report: %s", report_file)
    failures = parse_comparison_report(report_file)
    
    logger.info("Found %d failed migrations to retry", len(failures))
    
    if not failures:
        logger.info("No failures to retry!")
        return {'total': 0, 'success': 0, 'failed': 0}
    
    # Group by file for better logging
    by_file = {}
    for failure in failures:
        fname = failure['filename']
        if fname not in by_file:
            by_file[fname] = []
        by_file[fname].append(failure)
    
    logger.info("Failures grouped by file:")
    for fname, fails in by_file.items():
        logger.info("  %s: %d failures", fname, len(fails))
    
    # Retry each failure
    stats = {'total': len(failures), 'success': 0, 'failed': 0}
    
    for i, failure in enumerate(failures, 1):
        logger.info("")
        logger.info("=" * 60)
        logger.info("Retrying %d/%d: %s", i, len(failures), failure['original_url'][:60])
        logger.info("  File: %s, Row: %d, Column: %s", 
                   failure['filename'], failure['row'], failure['column'])
        
        success = retry_failed_migration(failure, migrated_dir)
        
        if success:
            stats['success'] += 1
            logger.info("✓ SUCCESS")
        else:
            stats['failed'] += 1
            logger.info("✗ FAILED")
        
        # Small delay between uploads
        time.sleep(0.5)
    
    return stats


def main():
    logger.info("=" * 80)
    logger.info("RETRY FAILED IMAGE MIGRATIONS")
    logger.info("=" * 80)
    logger.info("")
    logger.info("Comparison report: %s", COMPARISON_REPORT_FILE)
    logger.info("Migrated directory: %s", MIGRATED_DIRECTORY)
    logger.info("")
    
    stats = retry_all_failed_migrations(COMPARISON_REPORT_FILE, MIGRATED_DIRECTORY)
    
    logger.info("")
    logger.info("=" * 80)
    logger.info("RETRY COMPLETE")
    logger.info("=" * 80)
    logger.info("Total failures attempted: %d", stats['total'])
    logger.info("Successful retries: %d", stats['success'])
    logger.info("Failed retries: %d", stats['failed'])
    
    if stats['total'] > 0:
        success_rate = (stats['success'] / stats['total']) * 100
        logger.info("Retry success rate: %.2f%%", success_rate)
    
    logger.info("")
    logger.info("Updated CSV files are in: %s", MIGRATED_DIRECTORY)


if __name__ == "__main__":
    main()