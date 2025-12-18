import os
import shutil
import re

# Base directory
BASE_DIR = r"c:\Users\DELL\Desktop\code_playground\Paper Predictor\CS\html summaries"

# Subject Mappings
SUBJECTS = [
    "General Aptitude",
    "Engineering Mathematics",
    "Discrete Mathematics",
    "Digital Logic",
    "Computer Organization and Architecture",
    "Programming and Data Structure",
    "Algorithms",
    "Theory of Computation",
    "Compiler Design",
    "Operating System",
    "Databases",
    "Computer Networks"
]

# Suffix Mapping
SUFFIX_MAP = {
    "EM": "Engineering Mathematics",
    "DS": "Programming and Data Structure",
    "OS": "Operating System",
    "TOC": "Theory of Computation",
    "DM": "Discrete Mathematics",
    "DL": "Digital Logic",
    "DE": "Digital Logic",
    "AP": "General Aptitude",
    "COA": "Computer Organization and Architecture",
    "DBMS": "Databases"
}

# Keyword Mapping (Priority: check suffixes first, then keywords)
KEYWORD_MAP = {
    "General Aptitude": ["aptitude", "vocabulary", "reading", "speech", "verbal", "comprehension"],
    "Engineering Mathematics": ["calculus", "differential", "fourier", "laplace", "algebra", "numerical", "probability", "complex"],
    "Discrete Mathematics": ["graph theory", "mathematical logic"],
    "Digital Logic": ["gates", "circuit", "floating", "number system", "minimization", "combination", "sequential"],
    "Computer Organization and Architecture": ["alu", "instruction", "pipeline", "cache", "memory", "machine", "addressing"],
    "Programming and Data Structure": ["array", "list", "stack", "queue", "tree", "hash", "structure"],
    "Algorithms": ["algo", "greedy", "dynamic", "divide", "conquer", "backtracking", "heap"],
    "Theory of Computation": ["automata", "turing", "decidabil", "finite"],
    "Compiler Design": ["lexical", "syntax", "intermediate", "translation"],
    "Operating System": ["process", "scheduling", "deadlock", "file system", "system call", "thread"],
    "Databases": ["er model", "normalization", "transaction", "query", "indexing", "fd"],
    "Computer Networks": ["layer", "protocol", "tcp", "udp", "ipv4", "routing", "switching", "flow", "error", "mac", "ip"]
}

def normalize(name):
    return name.lower().replace("-", " ").replace("_", " ")

def get_subject(filename, normalized_name):
    # 1. Check for Suffixes (e.g. "Topic EM.html" or "Topic-EM.html")
    # We look for the suffix before .html
    name_root = os.path.splitext(filename)[0]
    
    # Split by space or hyphen/underscore?
    parts = re.split(r'[ _-]+', name_root)
    last_part = parts[-1].upper()
    
    if last_part in SUFFIX_MAP:
        return SUFFIX_MAP[last_part]
        
    # 2. Check for Keywords
    # Check "Computer Networks" first because "Network" might be a keyword? 
    # Or just iterate.
    
    # Special handling: "ipv4-computer network.html" -> explicitly mentions computer network
    if "computer network" in normalized_name:
        return "Computer Networks"
        
    for subject, keywords in KEYWORD_MAP.items():
        for keyword in keywords:
            if keyword in normalized_name:
                # Disambiguation
                # "memory" is in OS (Memory Management) and COA (Cache Memory/Secondary Memory).
                # If "memory management" -> OS. If "cache memory" -> COA.
                if keyword == "memory":
                    if "management" in normalized_name:
                        return "Operating System"
                    return "Computer Organization and Architecture"
                    
                return subject
                
    return None

def organize():
    files = [f for f in os.listdir(BASE_DIR) if f.lower().endswith('.html')]
    print(f"Found {len(files)} HTML files.")
    
    moved_count = 0
    skipped_count = 0
    
    for filename in files:
        if not os.path.isfile(os.path.join(BASE_DIR, filename)):
            continue
            
        normalized = normalize(filename)
        subject = get_subject(filename, normalized)
        
        if not subject:
            print(f"[SKIP] Unknown subject: {filename}")
            skipped_count += 1
            continue
            
        # Create Subject Dir
        subject_dir = os.path.join(BASE_DIR, subject)
        if not os.path.exists(subject_dir):
            os.makedirs(subject_dir)
            
        # We assume FLATTENED structure inside Subject for now? 
        # User said: "Arrange just how notes are arranged. In a similar structure."
        # Notes are: Subject/Chapter/File.pdf
        # Here we only have 1 HTML file per chapter usually.
        # So maybe `Subject/Chapter.html` is enough?
        # Or `Subject/Chapter/Chapter.html`?
        # The user said "I have the HTML summary pages of each of the chapters... I also wanted to arrange just how notes are arranged."
        # If I have `algorithms/dynamic programming.html`, it corresponds to `Algorithms/Dynamic Programming/`.
        # So I should probably put it directly in `Algorithms/dynamic programming.html`.
        # Unless the user wants a folder for the chapter too?
        # "html summaries directory... arrange just how notes are arranged. In a similar structure."
        # Notes: Subject -> Chapter -> PDFs.
        # HTMLs: Subject -> HTML file. (Because the HTML *is* the chapter summary).
        # Unlikely to need a folder for a single HTML file.
        # I will put them in `Subject/filename.html`.
        
        src_path = os.path.join(BASE_DIR, filename)
        dst_path = os.path.join(subject_dir, filename)
        
        try:
            shutil.move(src_path, dst_path)
            moved_count += 1
        except Exception as e:
            print(f"[ERROR] {filename}: {e}")
            
    print(f"Finished. Moved: {moved_count}, Skipped: {skipped_count}")

if __name__ == "__main__":
    organize()
