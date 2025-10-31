import json
import os
import glob
from typing import List, Dict, Any

def extract_question_data(file_path: str) -> List[Dict[str, Any]]:
    """
    Extract required fields from a single JSON file
    """
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)

        extracted_data = []

        if isinstance(data, list):
            for item in data:
                if isinstance(item, dict):
                    # Extract only the required fields
                    extracted_item = {
                        'year': item.get('year'),
                        'paper_code': item.get('paper_code'),
                        'question_no': item.get('question_no'),
                        'question_text': item.get('question_text'),
                        'subject': item.get('subject'),
                        'chapter': item.get('chapter'),
                        'subtopic': item.get('subtopic')
                    }
                    extracted_data.append(extracted_item)
        else:
            print(f"Warning: {file_path} is not a list of objects")

        return extracted_data

    except Exception as e:
        print(f"Error processing {file_path}: {e}")
        return []

def create_llm_cleaning_dataset(directory_path: str, output_file: str):
    """
    Create a single JSON file with all question data for LLM cleaning
    """
    # Get all JSON files in the directory (excluding subdirectories)
    json_files = glob.glob(os.path.join(directory_path, "*.json"))

    print(f"Found {len(json_files)} JSON files to process:")
    for file in sorted(json_files):
        print(f"  - {os.path.basename(file)}")

    all_questions = []

    for file_path in sorted(json_files):
        file_name = os.path.basename(file_path)
        print(f"Processing {file_name}...")

        questions = extract_question_data(file_path)
        all_questions.extend(questions)

        print(f"  Extracted {len(questions)} questions from {file_name}")

    print(f"\nTotal questions extracted: {len(all_questions)}")

    # Save to output file
    print(f"Saving to {output_file}...")
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(all_questions, f, indent=2, ensure_ascii=False)

    print(f"Successfully saved {len(all_questions)} questions to {output_file}")

    # Print some statistics
    print("\nDataset Statistics:")
    print(f"Total questions: {len(all_questions)}")

    # Count by year
    years = {}
    subjects = {}
    for question in all_questions:
        year = question.get('year')
        subject = question.get('subject')

        if year:
            years[year] = years.get(year, 0) + 1
        if subject:
            subjects[subject] = subjects.get(subject, 0) + 1

    print(f"Years covered: {sorted(years.keys())}")
    print("Questions per year:")
    for year in sorted(years.keys()):
        print(f"  {year}: {years[year]} questions")

    print(f"\nUnique subjects: {len(subjects)}")
    print("Questions per subject:")
    for subject in sorted(subjects.keys()):
        print(f"  {subject}: {subjects[subject]} questions")

def main():
    directory_path = "fourth jsons"
    output_file = "llm_cleaning_dataset.json"

    if not os.path.exists(directory_path):
        print(f"Directory '{directory_path}' not found!")
        return

    create_llm_cleaning_dataset(directory_path, output_file)

if __name__ == "__main__":
    main()
