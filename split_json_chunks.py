import json
import os
import math

def split_json_into_chunks(input_file: str, chunk_size: int = 50, output_dir: str = "llm_chunks"):
    """
    Split a large JSON file into smaller chunks for LLM processing
    """
    # Create output directory if it doesn't exist
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    # Load the data
    with open(input_file, 'r', encoding='utf-8') as f:
        data = json.load(f)

    total_questions = len(data)
    num_chunks = math.ceil(total_questions / chunk_size)

    print(f"Total questions: {total_questions}")
    print(f"Chunk size: {chunk_size}")
    print(f"Number of chunks: {num_chunks}")

    # Create chunks
    for i in range(num_chunks):
        start_idx = i * chunk_size
        end_idx = min((i + 1) * chunk_size, total_questions)

        chunk_data = data[start_idx:end_idx]

        output_file = os.path.join(output_dir, f"chunk_{i+1:02d}.json")

        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(chunk_data, f, indent=2, ensure_ascii=False)

        print(f"Created {output_file} with {len(chunk_data)} questions (indices {start_idx}-{end_idx-1})")

    print(f"\nAll chunks saved in '{output_dir}' directory")

    return num_chunks

def main():
    input_file = "llm_cleaning_dataset.json"
    chunk_size = 200  # Adjust this based on your LLM's context window

    if not os.path.exists(input_file):
        print(f"Input file '{input_file}' not found!")
        return

    num_chunks = split_json_into_chunks(input_file, chunk_size)

    print(f"\nNext steps:")
    print(f"1. Process each chunk_{{:02d}}.json file with your LLM")
    print(f"2. Collect the cleaned data from each chunk")
    print(f"3. Use the provided LLM prompt for consistent cleaning")

if __name__ == "__main__":
    main()
