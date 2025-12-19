import os
import re

# Configuration
SEARCH_DIR = r"c:\Users\DELL\Desktop\code_playground\Paper Predictor\CS\html summaries"

# Dark Mode CSS (Improved)
# Added --sidebar-bg for the specifically requested RED menu
DARK_MODE_CSS = """
        :root {
            --primary: #60a5fa;
            --primary-dark: #2563eb;
            --secondary: #6366f1;
            --accent: #f59e0b;
            --bg: #000000;
            --surface: #111111;
            --text: #e2e8f0;
            --text-heading: #ffffff;
            --text-light: #94a3b8;
            --border: #333333;
            --code-bg: #1a1a1a;
            --code-text: #f1f5f9;
            --card-bg: #111111; 
            --sidebar-bg: #7f1d1d; /* Deep Red for sidebar */
            --sidebar-text: #ffffff;
        }
"""

def update_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Update Mermaid Theme
    mermaid_pattern = r"(mermaid\.initialize\s*\(\s*{[^}]*theme:\s*)['\"][\w]+['\"]"
    content = re.sub(mermaid_pattern, r"\1'dark'", content)

    # 2. Update CSS Variables (Inject :root)
    # We replace the existing :root block with our new one
    css_pattern = r":root\s*{[^}]+}"
    if re.search(css_pattern, content):
        formatted_css = DARK_MODE_CSS.strip().replace('\n', '\n        ')
        content = re.sub(css_pattern, formatted_css, content)

    # 3. FIX HARDCODED WHITE BACKGROUNDS
    # We need to replace specific CSS rules that might be setting background: white;
    # Strategy: Regex replace specific selectors if they exist in the <style> block.
    
    # Tables
    # table { ... background: white; ... } -> background: var(--surface);
    content = re.sub(r"(table\s*{[^}]*background\s*:\s*)white", r"\1var(--surface)", content)
    
    # Mermaid
    # .mermaid { ... background: white; ... } -> background: var(--surface);
    content = re.sub(r"(\.mermaid\s*{[^}]*background\s*:\s*)white", r"\1var(--surface)", content)

    # Th (Table Headers)
    # th { ... background: #f1f5f9; ... } -> background: var(--border);
    content = re.sub(r"(th\s*{[^}]*background\s*:\s*)#[a-fA-F0-9]{3,6}", r"\1var(--border)", content)

    # Table Rows (Striped)
    # tr:nth-child(even) { background: #f8fafc; } -> background: var(--code-bg);
    content = re.sub(r"(tr:nth-child\(even\)\s*{[^}]*background\s*:\s*)#[a-fA-F0-9]{3,6}", r"\1var(--code-bg)", content)

    # Details/Summary
    # details { background: #f8fafc; ... } -> background: var(--surface);
    content = re.sub(r"(details\s*{[^}]*background\s*:\s*)#[a-fA-F0-9]{3,6}", r"\1var(--surface)", content)

    # 4. SIDEBAR STYLING (Red Menu)
    # Target 1: .sidebar { ... } 
    # Target 2: nav { ... } (used in transaction.html)
    
    # Regex to find 'nav' or '.sidebar' block and ensure background uses --sidebar-bg
    # This is tricky without a full parser, but we can try to replace the color if likely found.
    # transaction.html uses: nav { background: var(--secondary); ... }
    # analysis.html uses: .sidebar { background: var(--surface); ... }
    
    # Generic approach:
    # Look for sidebar selectors and replace their background color logic.
    
    # Replace background in .sidebar
    content = re.sub(r"(\.sidebar\s*{[^}]*background\s*:\s*)[^;]+", r"\1var(--sidebar-bg)", content)
    # Replace background in nav (only if valid selector)
    content = re.sub(r"(nav\s*{[^}]*background\s*:\s*)[^;]+", r"\1var(--sidebar-bg)", content)
    
    # Ensure sidebar text is white
    # .sidebar h2 { color: var(--primary); } -> color: var(--sidebar-text);
    content = re.sub(r"(\.sidebar\s+h2\s*{[^}]*color\s*:\s*)var\(--primary\)", r"\1var(--sidebar-text)", content)


    # 5. COLLAPSIBLE TOC PREP (Placeholder)
    # ... (existing code)

    # 6. INJECT MATHJAX CONFIGURATION
    # We need to enable '$' for inline math.
    # Check if config already exists
    if "window.MathJax" not in content:
        mathjax_config = """
    <script>
        window.MathJax = {
            tex: {
                inlineMath: [['$', '$'], ['\\\\(', '\\\\)']]
            }
        };
    </script>
    """
        # Insert before the MathJax script loader
        # Look for the script that loads tex-mml-chtml.js
        # Pattern: <script ... src="...mathjax..."></script>
        # We'll insert before <script id="MathJax-script" ... or just before </head> if not found.
        
        if 'id="MathJax-script"' in content:
            content = content.replace('<script id="MathJax-script"', mathjax_config + '\n    <script id="MathJax-script"')
        elif '</head>' in content:
            content = content.replace('</head>', mathjax_config + '\n</head>')
        else:
            print(f"Warning: Could not find location to inject MathJax config in {filepath}")

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Updated: {filepath}")

def main():
    if not os.path.exists(SEARCH_DIR):
        print(f"Directory not found: {SEARCH_DIR}")
        return

    count = 0
    for root, dirs, files in os.walk(SEARCH_DIR):
        for file in files:
            if file.lower().endswith('.html'):
                filepath = os.path.join(root, file)
                try:
                    update_file(filepath)
                    count += 1
                except Exception as e:
                    print(f"Error updating {filepath}: {e}")
    
    print(f"Total files updated: {count}")

if __name__ == "__main__":
    main()
