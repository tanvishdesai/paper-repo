#!/usr/bin/env python3
"""
Script to map subject, chapter, and subtopic fields from extracted_questions files
to the corresponding rows in the csv migrated GATE CS files.
"""

import csv
import os
from pathlib import Path

def load_mappings():
    """Load subject/chapter/subtopic mappings from all extracted files."""
    mapping = {}

    extracted_files = [
        'extracted_questions_part1.csv',
        'extracted_questions_part2.csv',
        'extracted_questions_part3.csv'
    ]

    for filename in extracted_files:
        if not os.path.exists(filename):
            print(f"Warning: {filename} not found, skipping...")
            continue

        try:
            with open(filename, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    file_name = row.get('file_name', '').strip()
                    question_num = row.get('Question_Number', '').strip()
                    subject = row.get('subject', '').strip()
                    chapter = row.get('chapter', '').strip()
                    subtopic = row.get('subtopic', '').strip()

                    # Skip malformed rows
                    if not file_name or not question_num:
                        continue

                    if file_name not in mapping:
                        mapping[file_name] = {}

                    mapping[file_name][question_num] = {
                        'subject': subject,
                        'chapter': chapter,
                        'subtopic': subtopic
                    }

        except Exception as e:
            print(f"Error reading {filename}: {e}")

    return mapping

def update_csv_file(csv_path, mapping):
    """Update a single CSV file with subject/chapter/subtopic columns."""
    filename = os.path.basename(csv_path)

    # Skip if no mapping exists for this file
    if filename not in mapping:
        print(f"No mapping found for {filename}, skipping...")
        return False

    file_mapping = mapping[filename]
    temp_path = csv_path + '.tmp'

    try:
        with open(csv_path, 'r', encoding='utf-8') as infile, \
             open(temp_path, 'w', encoding='utf-8', newline='') as outfile:

            reader = csv.DictReader(infile)
            fieldnames = reader.fieldnames + ['subject', 'chapter', 'subtopic']
            writer = csv.DictWriter(outfile, fieldnames=fieldnames)

            # Write header
            writer.writeheader()

            # Write rows with added columns
            for row in reader:
                question_num = row.get('Question_Number', '').strip()

                # Get classification data
                classification = file_mapping.get(question_num, {
                    'subject': '',
                    'chapter': '',
                    'subtopic': ''
                })

                # Add classification columns
                row['subject'] = classification['subject']
                row['chapter'] = classification['chapter']
                row['subtopic'] = classification['subtopic']

                writer.writerow(row)

        # Replace original file with updated one
        os.replace(temp_path, csv_path)
        return True

    except Exception as e:
        print(f"Error updating {csv_path}: {e}")
        # Clean up temp file if it exists
        if os.path.exists(temp_path):
            os.remove(temp_path)
        return False

def main():
    """Main function to process all CSV files."""
    print("Loading subject/chapter/subtopic mappings...")

    # Load all mappings
    mapping = load_mappings()

    print(f"Loaded mappings for {len(mapping)} files:")
    for filename, questions in mapping.items():
        print(f"  {filename}: {len(questions)} questions")

    # Process all CSV files in csv migrated folder
    csv_migrated_dir = Path('csv migrated')

    if not csv_migrated_dir.exists():
        print(f"Error: {csv_migrated_dir} directory not found!")
        return

    csv_files = list(csv_migrated_dir.glob('GATE_CS_*.csv'))

    if not csv_files:
        print("No GATE_CS_*.csv files found in csv migrated directory!")
        return

    print(f"\nProcessing {len(csv_files)} CSV files...")

    success_count = 0
    total_questions = 0

    for csv_file in sorted(csv_files):
        filename = csv_file.name
        print(f"Processing {filename}...")

        if update_csv_file(str(csv_file), mapping):
            # Count questions in the file
            try:
                with open(csv_file, 'r', encoding='utf-8') as f:
                    reader = csv.DictReader(f)
                    question_count = sum(1 for row in reader if row.get('Question_Number', '').strip())
                    total_questions += question_count
                    print(f"  ✓ Updated {question_count} questions")
                    success_count += 1
            except Exception as e:
                print(f"  ✗ Error counting questions in {filename}: {e}")
        else:
            print("  ✗ Failed to update")

    print(f"\nSummary:")
    print(f"  Successfully updated: {success_count}/{len(csv_files)} files")
    print(f"  Total questions processed: {total_questions}")

    # Verify mappings
    print("\nVerifying mappings...")
    missing_mappings = 0

    for csv_file in sorted(csv_files):
        filename = csv_file.name
        if filename not in mapping:
            continue

        file_mapping = mapping[filename]

        try:
            with open(csv_file, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    question_num = row.get('Question_Number', '').strip()
                    if question_num and question_num in file_mapping:
                        subj = row.get('subject', '').strip()
                        chap = row.get('chapter', '').strip()
                        subtop = row.get('subtopic', '').strip()

                        expected = file_mapping[question_num]
                        if not (subj == expected['subject'] and
                               chap == expected['chapter'] and
                               subtop == expected['subtopic']):
                            missing_mappings += 1
        except Exception as e:
            print(f"Error verifying {filename}: {e}")

    if missing_mappings == 0:
        print("✓ All mappings verified successfully!")
    else:
        print(f"✗ {missing_mappings} mapping issues found")

if __name__ == "__main__":
    main()
