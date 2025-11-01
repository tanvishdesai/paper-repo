import csv
import json
import sys
from pathlib import Path


def detect_header(headers, candidates):
    """Find the first matching header from candidates (case-insensitive)."""
    lower = {h.lower(): h for h in headers}
    for cand in candidates:
        if cand.lower() in lower:
            return lower[cand.lower()]
    return None


def read_csv_keys(csv_path):
    """Read (file_name, Question_Number) pairs from CSV."""
    with open(csv_path, "r", encoding="utf-8", newline="") as f:
        reader = csv.DictReader(f)
        headers = reader.fieldnames or []
        # Strip BOM characters that may appear at the start of headers
        headers = [h.lstrip('\ufeff') for h in headers]
        
        file_hdr = detect_header(headers, [
            "file_name", "filename", "file", "source_file"
        ])
        qnum_hdr = detect_header(headers, [
            "Question_Number", "question_number", "q_no", "qnum", "question_id"
        ])
        
        if not file_hdr or not qnum_hdr:
            raise ValueError(
                f"Could not detect required headers. Found: {headers}. "
                f"Need a file name and a question number column."
            )
        
        keys = []
        for row in reader:
            # Handle BOM characters in row keys if headers weren't properly cleaned
            file_name = ""
            for key in row.keys():
                if key.lstrip('\ufeff') == file_hdr:
                    file_name = (row[key] or "").strip()
                    break
            qnum = ""
            for key in row.keys():
                if key.lstrip('\ufeff') == qnum_hdr:
                    qnum = row[key]
                    qnum = "" if qnum is None else str(qnum).strip()
                    break
            keys.append((file_name, qnum))
        return keys, file_hdr, qnum_hdr


def read_csv_rows(csv_path):
    """Read all rows from CSV as dictionaries."""
    with open(csv_path, "r", encoding="utf-8", newline="") as f:
        reader = csv.DictReader(f)
        headers = reader.fieldnames or []
        # Strip BOM characters that may appear at the start of headers
        headers = [h.lstrip('\ufeff') for h in headers]
        rows = list(reader)
        return rows, headers


def read_json_keys(json_path):
    """Read (fileName, questionNumber) pairs from JSON."""
    with open(json_path, "r", encoding="utf-8") as f:
        try:
            data = json.load(f)
        except json.JSONDecodeError as e:
            raise ValueError(f"Invalid JSON in {json_path}: {e}")
    
    if not isinstance(data, list):
        raise ValueError("JSON root must be an array")
    
    keys = []
    for i, item in enumerate(data):
        if not isinstance(item, dict):
            raise ValueError(f"Item {i} is not an object")
        fn = str(item.get("fileName", "")).strip()
        qn = item.get("questionNumber", "")
        qn = "" if qn is None else str(qn).strip()
        keys.append((fn, qn))
    return keys


def write_missing_csv(csv_path, missing_keys, output_path):
    """Write a CSV containing only the rows with missing keys."""
    rows, headers = read_csv_rows(csv_path)

    file_hdr = detect_header(headers, [
        "file_name", "filename", "file", "source_file"
    ])
    qnum_hdr = detect_header(headers, [
        "Question_Number", "question_number", "q_no", "qnum", "question_id"
    ])

    missing_set = set(missing_keys)
    missing_rows = []

    for row in rows:
        file_name = (row.get(file_hdr, "") or "").strip()
        qnum = row.get(qnum_hdr, "")
        qnum = "" if qnum is None else str(qnum).strip()

        if (file_name, qnum) in missing_set:
            # Create a new row dict with cleaned header keys to match fieldnames
            cleaned_row = {}
            for orig_key, value in row.items():
                # Strip BOM from keys to match the cleaned headers
                clean_key = orig_key.lstrip('\ufeff')
                cleaned_row[clean_key] = value
            missing_rows.append(cleaned_row)

    with open(output_path, "w", encoding="utf-8", newline="") as f:
        if missing_rows:
            writer = csv.DictWriter(f, fieldnames=headers)
            writer.writeheader()
            writer.writerows(missing_rows)

    return len(missing_rows)


def create_json_mapping(json_path):
    """Create mapping from (fileName, questionNumber) to (subject, chapter, subtopic) from JSON."""
    with open(json_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    mapping = {}
    for item in data:
        fn = str(item.get("fileName", "")).strip()
        qn = str(item.get("questionNumber", "")).strip()
        subject = item.get("subject")
        chapter = item.get("chapter")
        subtopic = item.get("subtopic")

        # Convert null to empty string for consistency
        subject = "" if subject is None else str(subject)
        chapter = "" if chapter is None else str(chapter)
        subtopic = "" if subtopic is None else str(subtopic)

        mapping[(fn, qn)] = (subject, chapter, subtopic)

    return mapping


def update_csv_with_json_data(csv_path, json_mapping, output_path=None):
    """Update CSV with subject, chapter, subtopic data from JSON mapping."""
    rows, headers = read_csv_rows(csv_path)

    file_hdr = detect_header(headers, [
        "file_name", "filename", "file", "source_file"
    ])
    qnum_hdr = detect_header(headers, [
        "Question_Number", "question_number", "q_no", "qnum", "question_id"
    ])

    subject_hdr = detect_header(headers, ["subject"])
    chapter_hdr = detect_header(headers, ["chapter"])
    subtopic_hdr = detect_header(headers, ["subtopic"])

    if not all([file_hdr, qnum_hdr, subject_hdr, chapter_hdr, subtopic_hdr]):
        raise ValueError("Required columns not found in CSV")

    updated_rows = []
    updated_count = 0

    for row in rows:
        # Handle BOM characters when accessing row values
        file_name = ""
        for key in row.keys():
            if key.lstrip('\ufeff') == file_hdr:
                file_name = (row[key] or "").strip()
                break

        qnum = ""
        for key in row.keys():
            if key.lstrip('\ufeff') == qnum_hdr:
                qnum = row[key]
                qnum = "" if qnum is None else str(qnum).strip()
                break

        # Create a new row dict with cleaned keys
        new_row = {}
        for orig_key, value in row.items():
            clean_key = orig_key.lstrip('\ufeff')
            new_row[clean_key] = value

        # Look up data in JSON mapping
        json_data = json_mapping.get((file_name, qnum))
        if json_data:
            subject, chapter, subtopic = json_data
            new_row[subject_hdr] = subject
            new_row[chapter_hdr] = chapter
            new_row[subtopic_hdr] = subtopic
            updated_count += 1

        updated_rows.append(new_row)

    # Write updated CSV
    output_path = output_path or csv_path
    with open(output_path, "w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=headers)
        writer.writeheader()
        writer.writerows(updated_rows)

    return updated_count, len(rows)


def main():
    # Hard-coded paths
    csv_path = Path("extracted_questions_part3.csv")
    json_path = Path("part-3.json")
    missing_csv_path = Path("missing_in_json.csv")

    if not csv_path.exists():
        print(f"CSV not found: {csv_path}", file=sys.stderr)
        sys.exit(1)
    if not json_path.exists():
        print(f"JSON not found: {json_path}", file=sys.stderr)
        sys.exit(1)

    # Create JSON mapping
    print("Creating JSON mapping...")
    json_mapping = create_json_mapping(json_path)
    print(f"Loaded {len(json_mapping)} entries from JSON")

    # Update CSV with JSON data
    print("Updating CSV with JSON data...")
    backup_path = csv_path.with_suffix('.backup.csv')
    updated_count, total_count = update_csv_with_json_data(csv_path, json_mapping, backup_path)

    print(f"Updated {updated_count} out of {total_count} CSV rows with subject/chapter/subtopic data")
    print(f"Backup created at: {backup_path}")
    print(f"Original file preserved at: {csv_path}")

    # Replace original with updated version
    import shutil
    shutil.move(str(backup_path), str(csv_path))
    print(f"✓ Replaced original file with updated version")

    # Verify coverage
    csv_keys, file_hdr, qnum_hdr = read_csv_keys(csv_path)
    json_keys = read_json_keys(json_path)

    csv_set = set(csv_keys)
    json_set = set(json_keys)

    missing_in_json = sorted(csv_set - json_set)
    missing_in_csv = sorted(json_set - csv_set)

    print(f"\nCoverage check:")
    print(f"CSV rows: {len(csv_keys)} (unique keys: {len(csv_set)})")
    print(f"JSON rows: {len(json_keys)} (unique keys: {len(json_set)})")
    print(f"Missing in JSON: {len(missing_in_json)}")
    print(f"Missing in CSV: {len(missing_in_csv)}")

    if not missing_in_json:
        print("✓ All CSV questions are covered in JSON.")
    else:
        print(f"⚠ Missing in JSON: {len(missing_in_json)}")
        # Write missing entries to a separate CSV
        count = write_missing_csv(csv_path, missing_in_json, missing_csv_path)
        print(f"Wrote {count} missing entries to: {missing_csv_path}")

    # Duplicates detection
    if len(csv_set) != len(csv_keys):
        print("Note: CSV contains duplicate (file_name, Question_Number) pairs.")
    if len(json_set) != len(json_keys):
        print("Note: JSON contains duplicate (fileName, questionNumber) pairs.")


if __name__ == "__main__":
    main()
