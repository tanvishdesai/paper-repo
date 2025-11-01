import json
import os
import re
from collections import defaultdict
from pathlib import Path

def normalize_subject(subject):
    """Normalize subject names to handle variations and inconsistencies."""
    if not subject:
        return None
    
    # Convert to title case and strip whitespace
    subject = subject.strip().title()
    
    # Define mapping for common variations
    subject_mappings = {
        # Operating System variations
        'Operating System': 'Operating System',
        'Operating Systems': 'Operating System',
        'Cos': 'Operating System',
        
        # Database variations
        'Dbms': 'Database Management System',
        'Databases': 'Database Management System',
        'Database': 'Database Management System',
        
        # Algorithm variations
        'Algorithm': 'Algorithms',
        'Algorithms': 'Algorithms',
        
        # Data Structure variations
        'Data Structure': 'Data Structures',
        'Data Structures': 'Data Structures',
        
        # Computer Networks variations
        'Computer Network': 'Computer Networks',
        'Computer Networks': 'Computer Networks',
        'Compute Networks': 'Computer Networks',
        
        # Mathematics variations
        'Engineering Maths': 'Engineering Mathematics',
        'Engineering Mathematics': 'Engineering Mathematics',
        'Engineering  Mathematics': 'Engineering Mathematics',
        'Engineering  Maths': 'Engineering Mathematics',
        'Engineering Mathematic': 'Engineering Mathematics',
        
        # Discrete Mathematics variations
        'Discrete Maths': 'Discrete Mathematics',
        'Discrete Mathematics': 'Discrete Mathematics',
        'Discrete  Maths': 'Discrete Mathematics',
        
        # Theory of Computation variations
        'Toc': 'Theory Of Computation',
        'Theory Of Computation': 'Theory Of Computation',
        
        # Computer Organization and Architecture
        'Coa': 'Computer Organization And Architecture',
        
        # Compiler Design
        'Compiler Design': 'Compiler Design',
        
        # Digital Logic
        'Digital Logic': 'Digital Logic',
        
        # C Programming variations
        'C Programming': 'C Programming',
        'C-Programming': 'C Programming',
        'C Programming Loops & Conditionals': 'C Programming',
        
        # Aptitude variations
        'Aptitude': 'Aptitude',
        'Quantitative Aptitude': 'Quantitative Aptitude',
        'Quantative Aptitude': 'Quantitative Aptitude',
        'Logical Aptitude': 'Logical Aptitude',
        'Verbal Aptitude': 'Verbal Aptitude',
        'Spatial Aptitude': 'Spatial Aptitude',
        
        # Probability and Statistics
        'Probability And Statistics': 'Probability And Statistics',
        'Probability  And Statistics': 'Probability And Statistics',
        
        # Software Engineering
        'Software Engineering': 'Software Engineering',
        
        # Miscellaneous
        'Miscellaneous': 'Miscellaneous',
        'Misceallaneous': 'Miscellaneous',
        
        # Machine Learning
        'Machine Learning': 'Machine Learning',
        
        # Artificial Intelligence
        'Artificial Intelligence': 'Artificial Intelligence',
        
        # Linear Algebra
        'Linear Algebra': 'Linear Algebra',
        
        # Calculus
        'Calculus': 'Calculus',
        
        # Python
        'Python': 'Python',
        
        # Programming
        'Programming': 'Programming',
        
        # Number System
        'Number System': 'Number System',
    }
    
    # Check if subject matches any mapping
    if subject in subject_mappings:
        return subject_mappings[subject]
    
    # Filter out question numbers that were mistakenly parsed as subjects
    if re.match(r'^Question\s+\d+$', subject):
        return None
    
    # Return the normalized subject if no mapping found
    return subject

def normalize_chapter(chapter):
    """Normalize chapter names to handle variations and inconsistencies."""
    if not chapter:
        return None
    
    # Convert to title case and strip whitespace
    chapter = chapter.strip().title()
    
    # Define mapping for common chapter variations
    chapter_mappings = {
        # Relational Algebra variations
        'Relational Algebra': 'Relational Algebra',
        'Relational Algbebra': 'Relational Algebra',
        
        # Synchronization variations
        'Synchronization': 'Synchronization',
        'Synchronisation': 'Synchronization',
        'Concurrency & Synchronisation': 'Concurrency & Synchronization',
        'Concurrency & Synchronization': 'Concurrency & Synchronization',
        
        # Regular Expression variations
        'Regular Expression': 'Regular Expression',
        'Regular Expressions': 'Regular Expression',
        'Regular Expression & Languages': 'Regular Expression & Languages',
        
        # Normalization variations
        'Normalization': 'Normalization',
        'Normalisation': 'Normalization',
        
        # Pipelining variations
        'Pipelining': 'Pipelining',
        'Pipeline': 'Pipelining',
        
        # Hashing variations
        'Hashing': 'Hashing',
        'Hash': 'Hashing',
        
        # Sorting variations
        'Sorting': 'Sorting',
        'Sort': 'Sorting',
        
        # Searching variations
        'Searching': 'Searching',
        'Search': 'Searching',
        
        # Tree variations
        'Trees': 'Trees',
        'Tree': 'Trees',
        'Binary Trees': 'Binary Trees',
        'Binary Tree': 'Binary Trees',
        'Binary Search Trees': 'Binary Search Trees',
        'Binary Search Tree': 'Binary Search Trees',
        
        # Graph variations
        'Graphs': 'Graphs',
        'Graph': 'Graphs',
        'Graph Theory': 'Graph Theory',
        
        # Linked List variations
        'Linked List': 'Linked List',
        'Linked Lists': 'Linked List',
        
        # Stack variations
        'Stack': 'Stack',
        'Stacks': 'Stack',
        
        # Queue variations
        'Queue': 'Queue',
        'Queues': 'Queue',
        
        # Heap variations
        'Heap': 'Heap',
        'Heaps': 'Heap',
        
        # Recursion variations
        'Recursion': 'Recursion',
        'Recursive': 'Recursion',
        
        # Dynamic Programming variations
        'Dynamic Programming': 'Dynamic Programming',
        'Dp': 'Dynamic Programming',
        
        # Greedy variations
        'Greedy': 'Greedy',
        'Greedy Algorithm': 'Greedy',
        'Greedy Algorithms': 'Greedy',
        
        # Divide and Conquer variations
        'Divide And Conquer': 'Divide And Conquer',
        'Divide & Conquer': 'Divide And Conquer',
        
        # Complexity variations
        'Complexity': 'Complexity Analysis',
        'Complexity Analysis': 'Complexity Analysis',
        'Time Complexity': 'Time Complexity',
        'Space Complexity': 'Space Complexity',
        
        # Memory variations
        'Memory': 'Memory Management',
        'Memory Management': 'Memory Management',
        'Cache': 'Cache Memory',
        'Cache Memory': 'Cache Memory',
        
        # Process variations
        'Process': 'Process',
        'Processes': 'Process',
        'Process Management': 'Process Management',
        
        # Thread variations
        'Thread': 'Thread',
        'Threads': 'Thread',
        'Threading': 'Thread',
        
        # Deadlock variations
        'Deadlock': 'Deadlock',
        'Deadlocks': 'Deadlock',
        
        # Scheduling variations
        'Scheduling': 'Scheduling',
        'Cpu Scheduling': 'CPU Scheduling',
        'Process Scheduling': 'Process Scheduling',
        
        # File System variations
        'File System': 'File System',
        'File Systems': 'File System',
        
        # SQL variations
        'Sql': 'SQL',
        
        # Normalization variations
        'Er Model': 'ER Model',
        'E-R Model': 'ER Model',
        
        # Transaction variations
        'Transaction': 'Transaction',
        'Transactions': 'Transaction',
        
        # Concurrency variations
        'Concurrency': 'Concurrency Control',
        'Concurrency Control': 'Concurrency Control',
        
        # Indexing variations
        'Indexing': 'Indexing',
        'Index': 'Indexing',
        
        # Network Layer variations
        'Network Layer': 'Network Layer',
        'Network': 'Network Layer',
        
        # Transport Layer variations
        'Transport Layer': 'Transport Layer',
        'Transport': 'Transport Layer',
        
        # Application Layer variations
        'Application Layer': 'Application Layer',
        'Application': 'Application Layer',
        
        # Data Link Layer variations
        'Data Link Layer': 'Data Link Layer',
        'Datalink Layer': 'Data Link Layer',
        
        # Physical Layer variations
        'Physical Layer': 'Physical Layer',
        
        # TCP variations
        'Tcp': 'TCP',
        'Tcp/Ip': 'TCP/IP',
        
        # UDP variations
        'Udp': 'UDP',
        
        # IP variations
        'Ip': 'IP',
        'Ipv4': 'IPv4',
        'Ipv6': 'IPv6',
        'Ip Header': 'IP Header',
        
        # Routing variations
        'Routing': 'Routing',
        'Routing Algorithm': 'Routing',
        'Routing Algorithms': 'Routing',
        'Routing Protocol': 'Routing Protocol',
        
        # Subnetting variations
        'Subnetting': 'Subnetting',
        'Subnet': 'Subnetting',
        
        # Finite Automata variations
        'Finite Automata': 'Finite Automata',
        'Finite Automaton': 'Finite Automata',
        
        # Context Free Grammar variations
        'Context Free Grammar': 'Context Free Grammar',
        'Cfg': 'Context Free Grammar',
        
        # Turing Machine variations
        'Turing Machine': 'Turing Machine',
        'Turing Machines': 'Turing Machine',
        
        # Pushdown Automata variations
        'Pushdown Automata': 'Pushdown Automata',
        'Pda': 'Pushdown Automata',
        
        # Decidability variations
        'Decidability': 'Decidability',
        'Undecidability': 'Undecidability',
        
        # Lexical Analysis variations
        'Lexical Analysis': 'Lexical Analysis',
        'Lexical Analyzer': 'Lexical Analysis',
        
        # Syntax Analysis variations
        'Syntax Analysis': 'Syntax Analysis',
        'Parsing': 'Syntax Analysis',
        'Parser': 'Syntax Analysis',
        
        # Semantic Analysis variations
        'Semantic Analysis': 'Semantic Analysis',
        
        # Code Generation variations
        'Code Generation': 'Code Generation',
        
        # Code Optimization variations
        'Code Optimization': 'Code Optimization',
        'Optimization': 'Code Optimization',
        
        # Boolean Algebra variations
        'Boolean Algebra': 'Boolean Algebra',
        
        # Combinational Circuit variations
        'Combinational Circuit': 'Combinational Circuit',
        'Combinational Circuits': 'Combinational Circuit',
        'Combinational Logic': 'Combinational Circuit',
        
        # Sequential Circuit variations
        'Sequential Circuit': 'Sequential Circuit',
        'Sequential Circuits': 'Sequential Circuit',
        'Sequential Logic': 'Sequential Circuit',
        
        # Number System variations
        'Number System': 'Number System',
        'Number Systems': 'Number System',
        
        # K-Map variations
        'K-Map': 'K-Map',
        'Karnaugh Map': 'K-Map',
        
        # Flip Flop variations
        'Flip Flop': 'Flip Flop',
        'Flip-Flop': 'Flip Flop',
        'Flip Flops': 'Flip Flop',
        
        # ALU variations
        'Alu': 'ALU',
        'Alu, Data-Path & Control Unit': 'ALU, Data-Path & Control Unit',
        
        # Control Unit variations
        'Control Unit': 'Control Unit',
        
        # Instruction Set variations
        'Instruction Set': 'Instruction Set',
        'Instruction': 'Instruction Set',
        
        # Addressing Mode variations
        'Addressing Mode': 'Addressing Mode',
        'Addressing Modes': 'Addressing Mode',
        
        # I/O variations
        'I/O': 'I/O',
        'Input Output': 'I/O',
        
        # Miscellaneous
        'Miscellaneous': 'Miscellaneous',
    }
    
    # Check if chapter matches any mapping
    if chapter in chapter_mappings:
        return chapter_mappings[chapter]
    
    # Filter out question numbers that were mistakenly parsed as chapters
    if re.match(r'^Question\s+\d+$', chapter):
        return None
    
    # Return the normalized chapter if no mapping found
    return chapter

def extract_year_subject_chapter(title):
    """Extract year, subject and chapter from title string."""
    parts = title.split('|')
    year = None
    subject = None
    chapter = None

    if len(parts) >= 3:
        # Extract year from third part (index 2)
        year_part = parts[2].strip()
        # Extract numeric year
        year_match = re.search(r'\d{4}', year_part)
        if year_match:
            year = int(year_match.group())

    if len(parts) >= 4:
        # Check if this is a "Set X" format (2014+ files)
        if len(parts) >= 6 and parts[3].strip().startswith('Set '):
            # Format: GATE | CS | 2014 | Set 1 | COA | Control Unit | Question 55
            subject = parts[4].strip()
            potential_chapter = parts[5].strip()
            # Don't treat "Question X" as a chapter
            if not potential_chapter.startswith('Question'):
                chapter = potential_chapter
        else:
            # Format: GATE | CS | 2000 | C Programming | Storage Classes | Question 11
            subject = parts[3].strip()
            if len(parts) >= 5:
                potential_chapter = parts[4].strip()
                # Don't treat "Question X" as a chapter
                if not potential_chapter.startswith('Question'):
                    chapter = potential_chapter

    # Normalize the subject and chapter
    subject = normalize_subject(subject)
    chapter = normalize_chapter(chapter)
    
    return year, subject, chapter

def clean_question(question_obj):
    """Clean a single question object by adding normalized fields and removing title, slug, and title_slug."""
    title = question_obj.get('title', '')
    answers = question_obj.get('answers', [])
    
    # Count correct answers to determine MCQ or MSQ
    correct_count = sum(1 for ans in answers if ans.get('correct') == True)
    question_type = 'MCQ' if correct_count == 1 else 'MSQ' if correct_count > 1 else 'Unknown'
    
    # Extract year, subject and chapter
    year, subject, chapter = extract_year_subject_chapter(title)
    
    # Remove title, slug, and title_slug if they exist
    if 'title' in question_obj:
        del question_obj['title']
    if 'slug' in question_obj:
        del question_obj['slug']
    if 'title_slug' in question_obj:
        del question_obj['title_slug']
    
    # Add new fields
    question_obj['year'] = year
    question_obj['subject'] = subject
    question_obj['chapter'] = chapter
    question_obj['question_type'] = question_type
    
    return question_obj

def clean_json_files(folder_path, output_folder=None):
    """Clean all JSON files in the given folder."""
    folder = Path(folder_path)
    
    if not folder.exists():
        print(f"Error: Folder '{folder_path}' does not exist!")
        return
    
    # Set output folder (default to same folder with '_cleaned' suffix)
    if output_folder is None:
        output_folder = folder.parent / (folder.name + '_cleaned')
    else:
        output_folder = Path(output_folder)
    
    # Create output folder if it doesn't exist
    output_folder.mkdir(parents=True, exist_ok=True)
    
    # Get all JSON files
    json_files = list(folder.glob('*.json'))
    
    if not json_files:
        print(f"No JSON files found in '{folder_path}'")
        return
    
    print(f"Found {len(json_files)} JSON file(s) to clean")
    print(f"Output folder: {output_folder}")
    print("="*80)
    
    # Process each file
    files_processed = 0
    questions_processed = 0
    
    for json_file in json_files:
        try:
            print(f"\nProcessing: {json_file.name}")
            
            with open(json_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            # Extract questions from the 'results' key
            questions = data.get('results', [])
            
            if not questions:
                print(f"  Warning: No questions found in {json_file.name}")
                continue
            
            # Clean each question
            cleaned_questions = []
            for question in questions:
                cleaned_question = clean_question(question)
                cleaned_questions.append(cleaned_question)
            
            # Update the data with cleaned questions
            data['results'] = cleaned_questions
            
            # Write to output file
            output_file = output_folder / json_file.name
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            
            print(f"  ✓ Cleaned {len(cleaned_questions)} questions")
            print(f"  ✓ Saved to: {output_file.name}")
            
            files_processed += 1
            questions_processed += len(cleaned_questions)
            
        except json.JSONDecodeError as e:
            print(f"  ✗ Error: Invalid JSON in {json_file.name}: {e}")
        except Exception as e:
            print(f"  ✗ Error processing {json_file.name}: {e}")
    
    # Print summary
    print("\n" + "="*80)
    print("CLEANING SUMMARY")
    print("="*80)
    print(f"Files processed: {files_processed}/{len(json_files)}")
    print(f"Total questions cleaned: {questions_processed}")
    print(f"Output location: {output_folder}")
    print("\nCleaning complete!")

if __name__ == "__main__":
    # Replace with your folder path
    folder_path = "jsons raw"
    
    # Remove quotes if user pastes path with quotes
    folder_path = folder_path.strip('"').strip("'")
    
    # Optional: specify output folder (if None, will create 'jsons raw_cleaned')
    output_folder = None  # or specify like "jsons cleaned"
    
    clean_json_files(folder_path, output_folder)