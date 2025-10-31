import json
import os
from collections import defaultdict
from typing import Dict, List, Any

def load_cleaned_chunks(temp_dir: str) -> Dict[tuple, List[Dict[str, Any]]]:
    """
    Load all cleaned chunks and group them by (year, paper_code)
    """
    cleaned_data = defaultdict(list)

    # Get all chunk files in temp directory
    chunk_files = []
    for filename in os.listdir(temp_dir):
        if filename.startswith('chunk ') and filename.endswith('.json'):
            chunk_files.append(os.path.join(temp_dir, filename))

    print(f"Found {len(chunk_files)} cleaned chunk files:")
    for file_path in chunk_files:
        print(f"  - {os.path.basename(file_path)}")

    for chunk_file in chunk_files:
        try:
            with open(chunk_file, 'r', encoding='utf-8') as f:
                chunk_data = json.load(f)

            print(f"Processing {os.path.basename(chunk_file)} with {len(chunk_data)} questions")

            for question in chunk_data:
                year = question['year']
                paper_code = question['paper_code']
                key = (year, paper_code)
                cleaned_data[key].append(question)

        except Exception as e:
            print(f"Error processing {chunk_file}: {e}")
            continue

    print(f"\nGrouped data by (year, paper_code):")
    for (year, paper_code), questions in cleaned_data.items():
        print(f"  ({year}, {paper_code}): {len(questions)} questions")

    return dict(cleaned_data)

def update_original_files(fourth_jsons_dir: str, cleaned_data: Dict[tuple, List[Dict[str, Any]]]):
    """
    Update the original JSON files in fourth jsons directory with cleaned data
    """
    total_files_updated = 0
    total_questions_updated = 0

    # Get all JSON files in fourth jsons directory
    json_files = []
    for filename in os.listdir(fourth_jsons_dir):
        if filename.endswith('.json') and not filename.startswith('dia'):
            json_files.append(filename)

    print(f"\nFound {len(json_files)} original JSON files to update")

    for filename in sorted(json_files):
        file_path = os.path.join(fourth_jsons_dir, filename)

        try:
            # Load original file
            with open(file_path, 'r', encoding='utf-8') as f:
                original_data = json.load(f)

            print(f"\nProcessing {filename} with {len(original_data)} questions")

            # Determine year and paper_code from filename or first question
            if original_data:
                first_question = original_data[0]
                year = first_question.get('year')
                paper_code = first_question.get('paper_code')

                # Check if we have cleaned data for this (year, paper_code)
                key = (year, paper_code)
                if key in cleaned_data:
                    cleaned_questions = cleaned_data[key]
                    print(f"  Found {len(cleaned_questions)} cleaned questions for {key}")

                    # Create a mapping from question_no to cleaned question
                    cleaned_by_qno = {}
                    for cleaned_q in cleaned_questions:
                        q_no = cleaned_q['question_no']
                        cleaned_by_qno[q_no] = cleaned_q

                    # Update original questions with cleaned data
                    updated_count = 0
                    for original_q in original_data:
                        orig_q_no = original_q['question_no']
                        # Clean the question_no format for matching
                        clean_q_no = orig_q_no.replace('Q.', '').replace('Q', '').replace('(GA)', '').strip()
                        clean_q_no = f"Q.{clean_q_no}"

                        if clean_q_no in cleaned_by_qno:
                            cleaned_q = cleaned_by_qno[clean_q_no]

                            # Update the fields
                            original_q['question_no'] = cleaned_q['question_no']
                            original_q['subject'] = cleaned_q['subject']
                            original_q['chapter'] = cleaned_q['chapter']
                            original_q['subtopic'] = cleaned_q['subtopic']

                            updated_count += 1

                    print(f"  Updated {updated_count} questions in {filename}")

                    # Save the updated file
                    with open(file_path, 'w', encoding='utf-8') as f:
                        json.dump(original_data, f, indent=2, ensure_ascii=False)

                    total_files_updated += 1
                    total_questions_updated += updated_count

                else:
                    print(f"  No cleaned data found for {key} in {filename}")

        except Exception as e:
            print(f"Error processing {filename}: {e}")
            continue

    print("\nSummary:")
    print(f"  Files updated: {total_files_updated}")
    print(f"  Questions updated: {total_questions_updated}")

def main():
    temp_dir = "temp"
    fourth_jsons_dir = "fourth jsons"

    if not os.path.exists(temp_dir):
        print(f"Temp directory '{temp_dir}' not found!")
        return

    if not os.path.exists(fourth_jsons_dir):
        print(f"Fourth jsons directory '{fourth_jsons_dir}' not found!")
        return

    # Load and group cleaned data
    print("Loading cleaned chunks from temp directory...")
    cleaned_data = load_cleaned_chunks(temp_dir)

    # Update original files
    print("\nUpdating original files...")
    update_original_files(fourth_jsons_dir, cleaned_data)

    print("\n✅ Data cleaning merge completed!")

if __name__ == "__main__":
    main()
