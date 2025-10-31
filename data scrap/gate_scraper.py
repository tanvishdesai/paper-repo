"""
GATE Exam Paper Web Scraper (JSON API - Final Version)
Scrapes GATE exam papers from GeeksforGeeks by directly targeting the
backend JSON API for maximum speed, accuracy, and reliability.

This enhanced version correctly parses HTML content within the JSON to
extract image URLs for questions, options, and explanations, and saves
all required data into a structured CSV file for each paper.
"""

import requests
from bs4 import BeautifulSoup
import pandas as pd
import re
import time
import os
import logging
import json
from urllib.parse import urlparse
from typing import List, Dict, Tuple



# The directory where the final CSV files will be saved.
OUTPUT_DIRECTORY = "GATE_Papers_CSV"


# --- Scraper Code ---

# Set up logging to see the script's progress and any potential issues.
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class GATEScraper:
    """Web scraper for GATE exam papers from GeeksforGeeks using their JSON API."""

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

    def _parse_html_content(self, html_string: str) -> Tuple[str, List[str]]:
        """
        Parses an HTML string to extract both clean text and image URLs.
        This is a key function that was missing in the original script.
        """
        if not html_string:
            return "", []
            
        soup = BeautifulSoup(html_string, 'html.parser')
        
        # Find all image tags and extract their 'src' attribute.
        image_urls = [img['src'] for img in soup.find_all('img') if 'src' in img.attrs]
        
        # Get the clean text, replacing tags with spaces for readability.
        clean_text = soup.get_text(separator=' ', strip=True)
        
        return clean_text, image_urls

    def scrape_paper(self, url: str) -> List[Dict]:
        """Scrapes all questions for a given paper URL by hitting the JSON API."""
        slug = self._get_slug_from_url(url)
        api_url = self._construct_api_url(slug)
        
        logger.info(f"Fetching data from API URL: {api_url}")
        
        try:
            response = self.session.get(api_url, timeout=20)
            response.raise_for_status()  # Raises an HTTPError for bad responses (4xx or 5xx)
            json_data = response.json()
        except (requests.exceptions.RequestException, json.JSONDecodeError) as e:
            logger.error(f"Could not fetch or parse JSON from {api_url}. Error: {e}")
            logger.warning(f"Skipping this URL ({slug}) as it might be an older format without a JSON API.")
            return []

        all_questions_data = []
        
        # The 'results' key in the JSON response contains the list of all questions.
        for idx, question_json in enumerate(json_data.get('results', []), 1):
            try:
                # 1. Parse Question Text and Images
                question_text, question_images = self._parse_html_content(question_json.get('question', ''))

                # 2. Parse Options and Correct Answer
                options_text = [''] * 4
                options_images = [[] for _ in range(4)]
                correct_answer_label = ''
                
                # The answers are not always in order, so we sort them by 'sort_order'.
                answer_options = sorted(question_json.get('answers', []), key=lambda x: x['sort_order'])
                labels = ['A', 'B', 'C', 'D']
                
                for i, ans in enumerate(answer_options):
                    if i < len(labels):
                        opt_text, opt_imgs = self._parse_html_content(ans.get('answer', ''))
                        options_text[i] = f"{opt_text}"
                        options_images[i].extend(opt_imgs)
                        if ans.get('correct'):
                            correct_answer_label = labels[i]

                # 3. Parse Explanation
                explanation_text, explanation_images = self._parse_html_content(question_json.get('explanation', ''))

                # 4. Assemble the data for the CSV row
                question_data = {
                    'Question_Number': idx,
                    'Question_Text': question_text,
                    'Question_Images': ", ".join(question_images),
                    'Option_A': options_text[0],
                    'Option_A_Images': ", ".join(options_images[0]),
                    'Option_B': options_text[1],
                    'Option_B_Images': ", ".join(options_images[1]),
                    'Option_C': options_text[2],
                    'Option_C_Images': ", ".join(options_images[2]),
                    'Option_D': options_text[3],
                    'Option_D_Images': ", ".join(options_images[3]),
                    'Correct_Answer': correct_answer_label,
                    'Question_Type': 'MCQ',  # Assuming MCQ by default, as this is not specified in the API.
                    'Explanation': explanation_text,
                    'Explanation_Images': ", ".join(explanation_images)
                }
                all_questions_data.append(question_data)
                
            except Exception as e:
                logger.error(f"Error processing question #{idx} for slug {slug}: {e}")
                continue
        
        return all_questions_data

    def scrape_multiple_papers(self, urls: List[str], output_dir: str):
        """Orchestrates scraping for multiple paper URLs and saves each to a CSV."""
        if not os.path.exists(output_dir):
            os.makedirs(output_dir)
            logger.info(f"Created output directory: {output_dir}")
            
        for url in urls:
            slug = self._get_slug_from_url(url)
            year = self._extract_year_from_slug(slug)
            
            logger.info(f"--- Starting scrape for Year: {year}, Slug: {slug} ---")
            
            questions_data = self.scrape_paper(url)
            
            if questions_data:
                self.save_to_csv(questions_data, year, output_dir)
                logger.info(f"Successfully scraped {slug} with {len(questions_data)} questions.")
            else:
                logger.warning(f"No data was collected for {slug}.")
            
            time.sleep(1) # A respectful delay between requests.

    def save_to_csv(self, questions_data: List[Dict], year: str, output_dir: str):
        """Saves the extracted data to a CSV file."""
        if not questions_data:
            logger.warning(f"No data to save for year {year}")
            return
        
        df = pd.DataFrame(questions_data)
        
        # Define the exact order of columns for the final CSV file.
        columns_order = [
            'Question_Number', 'Question_Text', 'Question_Images',
            'Option_A', 'Option_A_Images',
            'Option_B', 'Option_B_Images',
            'Option_C', 'Option_C_Images',
            'Option_D', 'Option_D_Images',
            'Correct_Answer', 'Question_Type',
            'Explanation', 'Explanation_Images'
        ]
        
        # Reorder the DataFrame columns.
        df = df[columns_order]
        
        filename = os.path.join(output_dir, f"GATE_CS_{year}.csv")
        df.to_csv(filename, index=False, encoding='utf-8')
        logger.info(f"Saved {len(questions_data)} questions to {filename}")

def main():
    """Main function to run the scraper with the configured URLs."""
    scraper = GATEScraper()
    from urls_config import GATE_PAPER_URLS, OUTPUT_DIRECTORY

    scraper.scrape_multiple_papers(GATE_PAPER_URLS, output_dir=OUTPUT_DIRECTORY)
    logger.info("--- Scraping process finished. ---")

if __name__ == "__main__":
    main()