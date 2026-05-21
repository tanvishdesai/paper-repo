import json
import glob

all_data = []

for file in glob.glob("pass1_output/filtered_*.json"):
    with open(file) as f:
        all_data.append(json.load(f))

with open("pass2_input.json", "w") as f:
    json.dump(all_data, f, indent=2)
