import json
import os
import glob
from collections import defaultdict, Counter
import re

def analyze_json_files(directory_path):
    """
    Analyze JSON files in the given directory for consistency issues
    """
    # Get all JSON files in the directory (excluding subdirectories)
    json_files = glob.glob(os.path.join(directory_path, "*.json"))

    print(f"Found {len(json_files)} JSON files to analyze:")
    for file in sorted(json_files):
        print(f"  - {os.path.basename(file)}")
    print()

    # Initialize tracking variables
    all_fields = set()
    field_counts = defaultdict(int)
    question_no_formats = defaultdict(list)
    subtopic_issues = []
    subject_variations = defaultdict(set)
    chapter_variations = defaultdict(set)
    file_field_sets = {}

    for file_path in sorted(json_files):
        file_name = os.path.basename(file_path)

        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)

            # Check if it's a list of objects
            if not isinstance(data, list):
                print(f"WARNING: {file_name} is not a list of objects")
                continue

            # Track fields for this file
            file_fields = set()
            file_question_formats = set()

            for i, item in enumerate(data):
                if not isinstance(item, dict):
                    print(f"WARNING: {file_name} item {i} is not a dict")
                    continue

                # Track all fields seen
                item_fields = set(item.keys())
                file_fields.update(item_fields)
                all_fields.update(item_fields)

                # Track field counts
                for field in item_fields:
                    field_counts[field] += 1

                # Analyze question_no formats
                if 'question_no' in item:
                    q_no = str(item['question_no'])
                    file_question_formats.add(q_no)

                    # Categorize format
                    if q_no.startswith('Q.'):
                        question_no_formats['Q.dot_format'].append((file_name, q_no))
                    elif q_no.startswith('Q'):
                        question_no_formats['Q_format'].append((file_name, q_no))
                    elif q_no.isdigit():
                        question_no_formats['numeric_only'].append((file_name, q_no))
                    elif '(GA)' in q_no:
                        question_no_formats['with_ga'].append((file_name, q_no))
                    else:
                        question_no_formats['other'].append((file_name, q_no))

                # Analyze subtopic issues
                if 'subtopic' in item:
                    subtopic = str(item['subtopic'])
                    if subtopic.endswith('.'):
                        subtopic_issues.append((file_name, subtopic, 'trailing_period'))
                    if subtopic.startswith('.'):
                        subtopic_issues.append((file_name, subtopic, 'leading_period'))

                # Track subject variations
                if 'subject' in item:
                    subject_variations[file_name].add(str(item['subject']))

                # Track chapter variations
                if 'chapter' in item:
                    chapter_variations[file_name].add(str(item['chapter']))

            # Store field set for this file
            file_field_sets[file_name] = file_fields

            # Store question formats for this file
            if file_question_formats:
                question_no_formats[file_name] = list(file_question_formats)

        except Exception as e:
            print(f"ERROR processing {file_name}: {e}")
            continue

    return {
        'all_fields': all_fields,
        'field_counts': dict(field_counts),
        'file_field_sets': file_field_sets,
        'question_no_formats': dict(question_no_formats),
        'subtopic_issues': subtopic_issues,
        'subject_variations': dict(subject_variations),
        'chapter_variations': dict(chapter_variations)
    }

def print_analysis_report(results):
    """
    Print a comprehensive analysis report
    """
    print("=" * 80)
    print("JSON CONSISTENCY ANALYSIS REPORT")
    print("=" * 80)

    # 1. Field Consistency Analysis
    print("\n1. FIELD CONSISTENCY ANALYSIS")
    print("-" * 40)

    all_fields = results['all_fields']
    field_counts = results['field_counts']
    file_field_sets = results['file_field_sets']

    print(f"Total unique fields across all files: {len(all_fields)}")
    print("Fields and their occurrence counts:")
    for field in sorted(all_fields):
        count = field_counts.get(field, 0)
        print(f"  {field}: {count}")

    # Check for field consistency across files
    print("\nField consistency check:")
    common_fields = None
    inconsistent_files = []

    for file_name, fields in file_field_sets.items():
        if common_fields is None:
            common_fields = fields
        elif common_fields != fields:
            inconsistent_files.append(file_name)

    if not inconsistent_files:
        print("✓ All files have consistent field sets")
    else:
        print("✗ Field inconsistency found in files:")
        for file in inconsistent_files:
            print(f"    - {file}")

        print("\nDetailed field comparison:")
        for file_name, fields in file_field_sets.items():
            missing_fields = common_fields - fields
            extra_fields = fields - common_fields
            if missing_fields or extra_fields:
                print(f"  {file_name}:")
                if missing_fields:
                    print(f"    Missing: {sorted(missing_fields)}")
                if extra_fields:
                    print(f"    Extra: {sorted(extra_fields)}")

    # 2. Question Number Format Analysis
    print("\n2. QUESTION NUMBER FORMAT ANALYSIS")
    print("-" * 40)

    q_formats = results['question_no_formats']

    # Count different formats
    format_counts = defaultdict(int)
    for key, items in q_formats.items():
        if key in ['Q.dot_format', 'Q_format', 'numeric_only', 'with_ga', 'other']:
            format_counts[key] += len(items)
        elif key.endswith('.json'):
            # This is a filename, count the formats in this file
            for fmt in items:
                if fmt.startswith('Q.'):
                    format_counts['Q.dot_format'] += 1
                elif fmt.startswith('Q'):
                    format_counts['Q_format'] += 1
                elif fmt.isdigit():
                    format_counts['numeric_only'] += 1
                elif '(GA)' in fmt:
                    format_counts['with_ga'] += 1
                else:
                    format_counts['other'] += 1

    print("Question number format distribution:")
    print(f"  Q.dot_format (Q.1, Q.2, etc.): {format_counts['Q.dot_format']}")
    print(f"  Q_format (Q1, Q2, etc.): {format_counts['Q_format']}")
    print(f"  numeric_only (1, 2, etc.): {format_counts['numeric_only']}")
    print(f"  with_ga (Q.1 (GA), etc.): {format_counts['with_ga']}")
    print(f"  other formats: {format_counts['other']}")

    # Show files with mixed formats
    print("\nFiles with different question number formats:")
    for file_name in sorted(q_formats.keys()):
        if file_name.endswith('.json') and file_name in q_formats:
            formats = set()
            for fmt in q_formats[file_name]:
                if fmt.startswith('Q.'):
                    formats.add('Q.dot')
                elif fmt.startswith('Q'):
                    formats.add('Q')
                elif fmt.isdigit():
                    formats.add('numeric')
                elif '(GA)' in fmt:
                    formats.add('GA')
                else:
                    formats.add('other')

            if len(formats) > 1:
                print(f"  {file_name}: {sorted(formats)}")

    # 3. Subtopic Issues Analysis
    print("\n3. SUBTOPIC ISSUES ANALYSIS")
    print("-" * 40)

    subtopic_issues = results['subtopic_issues']

    if subtopic_issues:
        print(f"Found {len(subtopic_issues)} subtopic formatting issues:")

        issue_counts = Counter([issue[2] for issue in subtopic_issues])
        for issue_type, count in issue_counts.items():
            print(f"  {issue_type}: {count}")

        print("\nExamples of problematic subtopics:")
        for file_name, subtopic, issue_type in subtopic_issues[:10]:  # Show first 10
            print(f"  {file_name}: '{subtopic}' ({issue_type})")

        if len(subtopic_issues) > 10:
            print(f"  ... and {len(subtopic_issues) - 10} more")
    else:
        print("✓ No subtopic formatting issues found")

    # 4. Subject Variations Analysis
    print("\n4. SUBJECT VARIATIONS ANALYSIS")
    print("-" * 40)

    subject_variations = results['subject_variations']

    all_subjects = set()
    for subjects in subject_variations.values():
        all_subjects.update(subjects)

    print(f"Total unique subjects across all files: {len(all_subjects)}")
    print("Subjects found:")
    for subject in sorted(all_subjects):
        print(f"  '{subject}'")

    # Check for subject consistency per file
    print("\nSubject consistency per file:")
    for file_name, subjects in subject_variations.items():
        if len(subjects) > 1:
            print(f"  {file_name}: {sorted(subjects)}")
        else:
            print(f"  {file_name}: {list(subjects)[0] if subjects else 'None'}")

    # 5. Chapter Variations Analysis
    print("\n5. CHAPTER VARIATIONS ANALYSIS")
    print("-" * 40)

    chapter_variations = results['chapter_variations']

    all_chapters = set()
    for chapters in chapter_variations.values():
        all_chapters.update(chapters)

    print(f"Total unique chapters across all files: {len(all_chapters)}")
    print("Chapters found:")
    for chapter in sorted(all_chapters):
        print(f"  '{chapter}'")

    # Check for chapter consistency per file
    print("\nChapter consistency per file:")
    for file_name, chapters in chapter_variations.items():
        if len(chapters) > 1:
            print(f"  {file_name}: {sorted(chapters)}")
        else:
            print(f"  {file_name}: {list(chapters)[0] if chapters else 'None'}")

    print("\n" + "=" * 80)
    print("ANALYSIS COMPLETE")
    print("=" * 80)

def main():
    directory_path = "fourth jsons"
    if not os.path.exists(directory_path):
        print(f"Directory '{directory_path}' not found!")
        return

    results = analyze_json_files(directory_path)
    print_analysis_report(results)

if __name__ == "__main__":
    main()
