import os
import shutil
import re

# Base directory
BASE_DIR = r"c:\Users\DELL\Desktop\code_playground\Paper Predictor\CS\notes"

# Subject Mappings
SUBJECT_MAPPING = {
    "General Aptitude": ["Aptitude", "Vocabulary", "Reading Comprehension", "Parts of Speech"],
    "Engineering Mathematics": ["Calculus", "Differential Equation", "Complex Analysis", "Laplace", "Linear Algebra", "Numerical Methods", "Fourier", "Probability and Statistics"],
    "Discrete Mathematics": ["Graph Theory", "Mathematical logic"],
    "Digital Logic": ["Logic Gate", "Combinational Circuit", "Sequential Circuit", "Minimization", "Number System", "Floating Point"],
    "Computer Organization and Architecture": ["Introduction of COA", "Introduction Of COA", "Address", "Pipeline", "Instruction Pipelining", "Cache", "Secondary Memory", "ALU & Control Unit", "Machine Instruction"],
    "Programming and Data Structure": ["Introduction to Data structures", "Data structures", "Arrays", "Linked List", "Stack and Queues", "Tree", "Hashing"],
    "Algorithms": ["Analysis Of Algorithm", "Analysis of Algorithm", "Algorithm", "Greedy", "Dynamic Programming", "Backtracking", "Design Strategies", "Introduction and background", "Graph Algorithms", "Heap Algorithms"],
    "Theory of Computation": ["Automata", "Turing Machine", "Decidability"],
    "Compiler Design": ["Lexical Analysis & Syntax Analysis", "Lexical", "Syntax"],
    "Operating System": ["Process", "CPU Scheduling", "Dead Lock", "Memory Management", "File System", "System Call", "Threads", "Device Management"],
    "Databases": ["ER Model", "FD's", "Normalization", "Transaction", "Query Language", "File Org", "Indexing"],
    "Computer Networks": ["Application Layer", "Protocol", "TCP", "UDP", "IP", "Routing", "Flow Control", "Error Control", "Medium Access", "Switching"]
}

def normalize_name(name):
    return name.lower().replace(" ", "").replace("&", "").replace("-", "")

def get_subject(filename, normalized_filename):
    for subject, keywords in SUBJECT_MAPPING.items():
        for keyword in keywords:
            # Check if simple keyword is in filename
            if keyword.lower() in filename.lower():
               return subject
            
            # Helper for more complex matches if needed? 
            # Actually, the simple check covers most.
            # But let's be careful about shorter words matching Parts of longer ones.
            # E.g. "IP" might match "IPod" (not here, but logic wise).
            # Given the file list, the keywords are quite specific.
    return None

def get_chapter(filename):
    # Pattern: "Chapter Name 01 _ Class Notes..."
    # We want "Chapter Name"
    # Some have "Chapter Name 01" without the rest.
    # We essentially want everything before the first digit that is part of the numbering.
    
    # Heuristic: Split by " _ Class Notes" first? Or look for the number pattern.
    # regex: ^(.*?)\s+\d+
    match = re.match(r"^(.*?)\s+\d+", filename)
    if match:
        return match.group(1).strip()
    
    # Fallback if no number found (rare in this dataset but possible)
    # Just return filename without extension
    return os.path.splitext(filename)[0]

def organize():
    # 1. Inspect all files
    files = [f for f in os.listdir(BASE_DIR) if f.lower().endswith('.pdf')]
    
    moved_count = 0
    skipped_count = 0
    
    print(f"Found {len(files)} PDF files.")
    
    for filename in files:
        subject = get_subject(filename, normalize_name(filename))
        
        if not subject:
            print(f"[SKIP] Could not identify subject for: {filename}")
            skipped_count += 1
            continue
            
        chapter = get_chapter(filename)
        
        # Create directories
        subject_dir = os.path.join(BASE_DIR, subject)
        chapter_dir = os.path.join(subject_dir, chapter)
        
        if not os.path.exists(chapter_dir):
            os.makedirs(chapter_dir)
            
        # Move file
        src_path = os.path.join(BASE_DIR, filename)
        dst_path = os.path.join(chapter_dir, filename)
        
        try:
            shutil.move(src_path, dst_path)
            # print(f"[MOVE] {filename} -> {subject}/{chapter}/")
            moved_count += 1
        except Exception as e:
            print(f"[ERROR] Failed to move {filename}: {e}")
            
    print(f"Finished. Moved: {moved_count}, Skipped: {skipped_count}")

if __name__ == "__main__":
    organize()
