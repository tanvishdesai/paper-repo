"""
GATE Exam Paper JSON Downloader
Downloads GATE exam papers from GeeksforGeeks by directly targeting the
backend JSON API and saves the raw JSON responses.
"""

import requests
import time
import os
import logging
import json
from urllib.parse import urlparse
from typing import List
import re


# The directory where the final JSON files will be saved.
OUTPUT_DIRECTORY = "GATE_Papers_JSON"


# --- Downloader Code ---

# Set up logging to see the script's progress and any potential issues.
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class GATEDownloader:
    """JSON downloader for GATE exam papers from GeeksforGeeks using their JSON API."""

    def __init__(self):
        self.session = requests.Session()
        # Use a standard User-Agent to avoid being blocked.
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        })

    def _get_slug_from_url(self, url: str) -> str:
        """Extracts the unique identifier (slug) from a GFG quiz URL."""
        return urlparse(url).path.strip('/').split('/')[-1]

    def _construct_api_url(self, slug: str) -> str:
        """Constructs the correct API endpoint URL from a quiz slug."""
        # This is the direct API endpoint that returns all question data in JSON format.
        # page_size=100 ensures we get all questions in a single request (GATE papers have < 100 questions).
        return f"https://apiwrite.geeksforgeeks.org/quiz/gfg/{slug}/?page_size=100"

    def _extract_year_from_slug(self, slug: str) -> str:
        """Extracts the year from the quiz slug for file naming."""
        match = re.search(r'(\d{4})', slug)
        return match.group(1) if match else "unknown_year"

    def download_paper(self, url: str) -> dict:
        """Downloads the JSON data for a given paper URL."""
        slug = self._get_slug_from_url(url)
        api_url = self._construct_api_url(slug)
        
        logger.info(f"Fetching data from API URL: {api_url}")
        
        try:
            response = self.session.get(api_url, timeout=20)
            response.raise_for_status()  # Raises an HTTPError for bad responses (4xx or 5xx)
            json_data = response.json()
            return json_data
        except (requests.exceptions.RequestException, json.JSONDecodeError) as e:
            logger.error(f"Could not fetch or parse JSON from {api_url}. Error: {e}")
            logger.warning(f"Skipping this URL ({slug}) as it might be an older format without a JSON API.")
            return None

    def download_multiple_papers(self, urls: List[str], output_dir: str):
        """Downloads JSON for multiple paper URLs and saves each to a JSON file."""
        if not os.path.exists(output_dir):
            os.makedirs(output_dir)
            logger.info(f"Created output directory: {output_dir}")
            
        for url in urls:
            slug = self._get_slug_from_url(url)
            year = self._extract_year_from_slug(slug)
            
            logger.info(f"--- Starting download for Year: {year}, Slug: {slug} ---")
            
            json_data = self.download_paper(url)
            
            if json_data:
                self.save_to_json(json_data, slug, output_dir)
                logger.info(f"Successfully downloaded {slug}.")
            else:
                logger.warning(f"No data was collected for {slug}.")
            
            time.sleep(1) # A respectful delay between requests.

    def save_to_json(self, json_data: dict, slug: str, output_dir: str):
        """Saves the JSON data to a file."""
        if not json_data:
            logger.warning(f"No data to save for slug {slug}")
            return
        
        filename = os.path.join(output_dir, f"{slug}.json")
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(json_data, f, indent=2, ensure_ascii=False)
        logger.info(f"Saved JSON data to {filename}")

def main():
    """Main function to run the downloader with the configured URLs."""
    downloader = GATEDownloader()
    from urls_config import GATE_PAPER_URLS, OUTPUT_DIRECTORY

    downloader.download_multiple_papers(GATE_PAPER_URLS, output_dir=OUTPUT_DIRECTORY)
    logger.info("--- Download process finished. ---")

if __name__ == "__main__":
    main()