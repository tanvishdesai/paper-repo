import json
import re
import sys
from pathlib import Path


def extract_image_urls_from_text(text: str) -> list[str]:
    if not isinstance(text, str) or not text:
        return []

    urls: set[str] = set()

    # Extract from <img src="..."> tags
    for match in re.findall(r"<img[^>]+src=\"([^\"]+)\"", text, flags=re.IGNORECASE):
        urls.add(match)

    # Extract any plain URLs that look like images
    for match in re.findall(r"https?://[^\s'\"]+", text, flags=re.IGNORECASE):
        if re.search(r"\.(png|jpg|jpeg|gif|webp|svg)(\?|#|$)", match, flags=re.IGNORECASE):
            urls.add(match)

    return sorted(urls)


def extract_image_urls_from_obj(obj) -> list[str]:
    urls: set[str] = set()

    if isinstance(obj, dict):
        for key, value in obj.items():
            # Prefer fields that likely contain images
            if isinstance(value, str):
                if any(k in key.lower() for k in ("img", "image", "thumbnail", "banner", "icon")):
                    urls.update(extract_image_urls_from_text(value))
                else:
                    # Fallback: scan other string fields for <img> tags or direct image URLs
                    urls.update(extract_image_urls_from_text(value))
            elif isinstance(value, (dict, list)):
                urls.update(extract_image_urls_from_obj(value))

    elif isinstance(obj, list):
        for item in obj:
            urls.update(extract_image_urls_from_obj(item))

    return sorted(urls)


def main() -> None:
    # Resolve input path
    if len(sys.argv) > 1:
        json_path = Path(sys.argv[1])
    else:
        json_path = Path(__file__).with_name("2011.json")

    if not json_path.exists():
        print(f"File not found: {json_path}")
        sys.exit(1)

    with json_path.open("r", encoding="utf-8") as f:
        data = json.load(f)

    # Count questions
    results = data.get("results")
    if isinstance(results, list):
        num_questions = len(results)
    else:
        # Fallback: if top-level is a list
        num_questions = len(data) if isinstance(data, list) else int(data.get("count", 0))

    # Collect image URLs
    image_urls = extract_image_urls_from_obj(results if isinstance(results, list) else data)

    print(f"Questions: {num_questions}")
    if image_urls:
        print("Image URLs:")
        for url in image_urls:
            print(url)
    else:
        print("Image URLs: none found")


if __name__ == "__main__":
    main()


