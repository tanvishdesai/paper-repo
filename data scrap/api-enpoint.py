import json

# === CONFIG ===
har_file = "C:/Users/DELL/Downloads/www.geeksforgeeks.org.har"  # Path to your .har file
output_file = "api_endpoints.txt"  # Optional: where to save the results

# === LOAD HAR FILE ===
with open(har_file, "r", encoding="utf-8") as f:
    har_data = json.load(f)

entries = har_data.get("log", {}).get("entries", [])

# === EXTRACT REQUEST INFO ===
api_endpoints = []

for entry in entries:
    request = entry.get("request", {})
    url = request.get("url")
    method = request.get("method")

    if not url or not method:
        continue

    # Optional: filter for likely API calls
    if any(x in url.lower() for x in ["api", "ajax", "data", "json"]):
        api_endpoints.append((method, url))

# === DISPLAY / SAVE RESULTS ===
if not api_endpoints:
    print("No likely API endpoints found.")
else:
    print(f"Found {len(api_endpoints)} possible API endpoints:\n")
    for method, url in api_endpoints:
        print(f"{method}  {url}")

    # Save to file
    with open(output_file, "w", encoding="utf-8") as out:
        for method, url in api_endpoints:
            out.write(f"{method}  {url}\n")

    print(f"\nSaved results to '{output_file}'")