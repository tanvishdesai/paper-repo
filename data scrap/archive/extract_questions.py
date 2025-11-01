import csv
import os
from pathlib import Path

# Directory containing all CSV files
csv_directory = "csv scraped"

# Output CSV file
output_file = "extracted_questions.csv"

# Get all CSV files in the directory
csv_files = sorted(Path(csv_directory).glob("GATE_CS_*.csv"))

print(f"Found {len(csv_files)} CSV files to process...")

# Open output file for writing
with open(output_file, 'w', newline='', encoding='utf-8') as outfile:
    # Define field names for output
    fieldnames = ['file_name', 'Question_Number', 'Question_Text', 'subject', 'chapter', 'subtopic']
    
    # Create CSV writer
    writer = csv.DictWriter(outfile, fieldnames=fieldnames)
    
    # Write header
    writer.writeheader()
    
    # Process each CSV file
    for csv_file in csv_files:
        file_name = csv_file.name
        print(f"Processing {file_name}...")
        
        try:
            # Read the CSV file
            with open(csv_file, 'r', encoding='utf-8') as infile:
                reader = csv.DictReader(infile)
                
                for row in reader:
                    # Extract Question_Number and Question_Text
                    question_num = row.get('Question_Number', '')
                    question_text = row.get('Question_Text', '')
                    
                    # Write row with file_name and extracted fields
                    # Empty values for subject, chapter, subtopic as requested
                    writer.writerow({
                        'file_name': file_name,
                        'Question_Number': question_num,
                        'Question_Text': question_text,
                        'subject': '',
                        'chapter': '',
                        'subtopic': ''
                    })
                    
        except Exception as e:
            print(f"Error processing {file_name}: {e}")

print(f"\nExtraction complete! Output saved to {output_file}")

