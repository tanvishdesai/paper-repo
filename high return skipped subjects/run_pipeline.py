import os
import json
import time
import google.generativeai as genai

# ==========================
# CONFIG
# ==========================

API_KEY = os.getenv("GEMINI_API_KEY")
INPUT_DIR = "input"
PASS1_OUTPUT_DIR = "pass1_output"
PROMPT_FILE = "prompts/pass1_prompt.txt"

MODEL_NAME = "models/gemini-1.5-flash"  # or gemini-3-flash
SLEEP_BETWEEN_CALLS = 2  # seconds (rate limit safety)

os.makedirs(PASS1_OUTPUT_DIR, exist_ok=True)

# ==========================
# INIT GEMINI
# ==========================

genai.configure(api_key=API_KEY)
model = genai.GenerativeModel(MODEL_NAME)

# ==========================
# LOAD PROMPT
# ==========================

with open(PROMPT_FILE, "r", encoding="utf-8") as f:
    BASE_PROMPT = f.read()

# ==========================
# PASS 1 PROCESSING
# ==========================

def process_year_file(filename):
    year = filename.replace(".json", "")
    input_path = os.path.join(INPUT_DIR, filename)
    output_path = os.path.join(PASS1_OUTPUT_DIR, f"filtered_{filename}")

    print(f"Processing year {year}...")

    with open(input_path, "r", encoding="utf-8") as f:
        year_data = json.load(f)

    prompt = f"""
{BASE_PROMPT}

YEAR: {year}

INPUT JSON:
{json.dumps(year_data, ensure_ascii=False)}
"""

    response = model.generate_content(
        prompt,
        generation_config={
            "temperature": 0.2,
            "top_p": 0.9,
            "max_output_tokens": 8192
        }
    )

    # Gemini sometimes wraps JSON in markdown
    text = response.text.strip()
    if text.startswith("```"):
        text = text.split("```")[1]

    try:
        parsed = json.loads(text)
    except json.JSONDecodeError:
        print(f"❌ JSON parse failed for year {year}")
        return

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(parsed, f, indent=2)

    print(f"✅ Saved: {output_path}")

# ==========================
# MAIN LOOP
# ==========================

for file in sorted(os.listdir(INPUT_DIR)):
    if file.endswith(".json"):
        process_year_file(file)
        time.sleep(SLEEP_BETWEEN_CALLS)

print("🎯 PASS 1 COMPLETE")
