"""Convert question JSON datasets into Neo4j-ready CSV node and relationship files.

This script reads all `*-data.json` files inside `fourth jsons/`, deduplicates
core entities (subjects, chapters, subtopics, papers, options) and writes a
collection of CSVs that can be uploaded to Neo4j Aura using the Data Importer
or `LOAD CSV` Cypher commands.

The generated CSVs follow Neo4j's convention for id columns such as
`nodeId:ID(Label)` and relationship columns such as
`:START_ID(Question)` / `:END_ID(Subject)`.

Usage:
    python convert_for_neo4j.py

Outputs are written to the `neo4j_import/` directory (created if missing).
"""

from __future__ import annotations

import csv
import json
import re
from pathlib import Path
from typing import Dict, Iterable, List, Optional, Sequence, Set, Tuple


INPUT_DIR = Path("fourth jsons")
OUTPUT_DIR = Path("neo4j_import")


def slugify(value: str, *, prefix: str = "", upper: bool = False) -> str:
    """Return a filesystem- and ID-friendly slug.

    Non-alphanumeric characters are replaced with single hyphens. Leading and
    trailing hyphens are stripped. Optionally prefix and uppercase the result.
    """

    sanitized = re.sub(r"[^0-9A-Za-z]+", "-", value.strip()).strip("-")
    if upper:
        sanitized = sanitized.upper()
    if prefix:
        if sanitized:
            return f"{prefix}{sanitized}"
        return prefix.rstrip("-")
    return sanitized or prefix or "UNSPECIFIED"


def ensure_output_dir(path: Path) -> None:
    path.mkdir(parents=True, exist_ok=True)


def read_question_files(directory: Path) -> Iterable[Tuple[Path, List[dict]]]:
    for json_path in sorted(directory.glob("*-data.json")):
        with json_path.open("r", encoding="utf-8") as handle:
            try:
                data = json.load(handle)
                if not isinstance(data, list):
                    raise ValueError("Expected top-level JSON array")
            except json.JSONDecodeError as err:
                raise RuntimeError(f"Failed to parse {json_path}: {err}") from err
        yield json_path, data


def make_question_id(year: Optional[int], paper_code: str, question_no: str) -> str:
    base = f"Q-{year}-{paper_code}-{question_no}" if year else f"Q-{paper_code}-{question_no}"
    return slugify(base, upper=True)


def make_subject_id(name: str) -> str:
    return slugify(name, prefix="SUB-", upper=True)


def make_chapter_id(name: str) -> str:
    return slugify(name, prefix="CH-", upper=True)


def make_subtopic_id(name: str) -> str:
    return slugify(name, prefix="ST-", upper=True)


def make_paper_id(year: Optional[int], paper_code: str) -> str:
    base = f"P-{year}-{paper_code}" if year else f"P-{paper_code}"
    return slugify(base, upper=True)


def make_option_id(question_id: str, index: int) -> str:
    return f"{question_id}-OPT-{index + 1}"


NORMALIZE_WHITESPACE = re.compile(r"\s+")


def normalize_text(value: str) -> str:
    return NORMALIZE_WHITESPACE.sub(" ", value.strip()).lower()


def detect_correct_option(options: Sequence[str], correct_answer: Optional[str]) -> Set[int]:
    """Return a set of option indices (0-based) that are correct for the question."""

    if not options or not isinstance(correct_answer, str) or not correct_answer.strip():
        return set()

    normalized_options = [normalize_text(opt) for opt in options]
    normalized_answer = normalize_text(correct_answer)

    matches = {idx for idx, opt in enumerate(normalized_options) if opt == normalized_answer}
    if matches:
        return matches

    option_letter_match = re.fullmatch(r"(?:option\s*)?([A-Z])", correct_answer.strip(), re.IGNORECASE)
    if option_letter_match:
        letter = option_letter_match.group(1).upper()
        idx = ord(letter) - ord("A")
        if 0 <= idx < len(options):
            return {idx}

    numeric_match = re.fullmatch(r"(?:option\s*)?(\d+)", correct_answer.strip(), re.IGNORECASE)
    if numeric_match:
        idx = int(numeric_match.group(1)) - 1
        if 0 <= idx < len(options):
            return {idx}

    # Handle delimited answers like "A and C" or "1 & 3"
    letter_tokens = re.findall(r"([A-D])", correct_answer.upper())
    if letter_tokens:
        indices = {ord(letter) - ord("A") for letter in letter_tokens if 0 <= ord(letter) - ord("A") < len(options)}
        if indices:
            return indices

    digit_tokens = re.findall(r"\b(\d+)\b", correct_answer)
    if digit_tokens:
        indices = {int(token) - 1 for token in digit_tokens if 0 < int(token) <= len(options)}
        if indices:
            return indices

    return set()


def bool_to_str(value: Optional[bool]) -> str:
    return "true" if value else "false"


def write_csv(path: Path, fieldnames: Sequence[str], rows: Iterable[Dict[str, object]]) -> None:
    with path.open("w", encoding="utf-8", newline="") as csv_file:
        writer = csv.DictWriter(csv_file, fieldnames=fieldnames, quoting=csv.QUOTE_MINIMAL)
        writer.writeheader()
        for row in rows:
            writer.writerow({key: row.get(key, "") for key in fieldnames})


def main() -> None:
    if not INPUT_DIR.exists():
        raise SystemExit(f"Input directory '{INPUT_DIR}' does not exist.")

    ensure_output_dir(OUTPUT_DIR)

    question_nodes: List[Dict[str, object]] = []
    subject_nodes: Dict[str, Dict[str, object]] = {}
    chapter_nodes: Dict[str, Dict[str, object]] = {}
    subtopic_nodes: Dict[str, Dict[str, object]] = {}
    paper_nodes: Dict[str, Dict[str, object]] = {}
    option_nodes: List[Dict[str, object]] = []

    question_subject_edges: Set[Tuple[str, str]] = set()
    question_chapter_edges: Set[Tuple[str, str]] = set()
    question_subtopic_edges: Set[Tuple[str, str]] = set()
    chapter_subject_edges: Set[Tuple[str, str]] = set()
    subtopic_chapter_edges: Set[Tuple[str, str]] = set()
    question_paper_edges: Set[Tuple[str, str]] = set()
    question_option_edges: List[Dict[str, object]] = []

    for json_path, questions in read_question_files(INPUT_DIR):
        for entry in questions:
            year = entry.get("year")
            paper_code = (entry.get("paper_code") or "").strip() or "UNKNOWN"
            question_no = (entry.get("question_no") or "").strip() or "UNKNOWN"
            question_id = make_question_id(year, paper_code, question_no)

            subject_name = (entry.get("subject") or "Unknown").strip() or "Unknown"
            chapter_name = (entry.get("chapter") or subject_name).strip() or subject_name
            subtopic_name = (entry.get("subtopic") or chapter_name).strip() or chapter_name

            subject_id = make_subject_id(subject_name)
            chapter_id = make_chapter_id(chapter_name)
            subtopic_id = make_subtopic_id(subtopic_name)
            paper_id = make_paper_id(year, paper_code)

            if subject_id not in subject_nodes:
                subject_nodes[subject_id] = {
                    "subjectId:ID(Subject)": subject_id,
                    "name": subject_name,
                }

            if chapter_id not in chapter_nodes:
                chapter_nodes[chapter_id] = {
                    "chapterId:ID(Chapter)": chapter_id,
                    "name": chapter_name,
                }

            if subtopic_id not in subtopic_nodes:
                subtopic_nodes[subtopic_id] = {
                    "subtopicId:ID(Subtopic)": subtopic_id,
                    "name": subtopic_name,
                }

            if paper_id not in paper_nodes:
                paper_nodes[paper_id] = {
                    "paperId:ID(Paper)": paper_id,
                    "paper_code": paper_code,
                    "year:Int": year or "",
                }

            question_nodes.append(
                {
                    "questionId:ID(Question)": question_id,
                    "question_no": question_no,
                    "question_text": entry.get("question_text", "").strip(),
                    "marks:Float": entry.get("marks", ""),
                    "theoretical_practical": entry.get("theoretical_practical", ""),
                    "year:Int": year or "",
                    "paper_code": paper_code,
                    "provenance": entry.get("provenance", ""),
                    "confidence:Float": entry.get("confidence", ""),
                    "correct_answer": entry.get("correct_answer", ""),
                    "has_diagram:Boolean": bool_to_str(entry.get("has_diagram")),
                }
            )

            question_subject_edges.add((question_id, subject_id))
            question_chapter_edges.add((question_id, chapter_id))
            question_subtopic_edges.add((question_id, subtopic_id))
            chapter_subject_edges.add((chapter_id, subject_id))
            subtopic_chapter_edges.add((subtopic_id, chapter_id))
            question_paper_edges.add((question_id, paper_id))

            options = entry.get("options") or []
            correct_answer = entry.get("correct_answer")
            correct_indices = detect_correct_option(options, correct_answer)
            for index, option_text in enumerate(options):
                option_id = make_option_id(question_id, index)
                option_nodes.append(
                    {
                        "optionId:ID(Option)": option_id,
                        "text": option_text.strip() if isinstance(option_text, str) else option_text,
                        "option_index:Int": index + 1,
                    }
                )
                question_option_edges.append(
                    {
                        ":START_ID(Question)": question_id,
                        ":END_ID(Option)": option_id,
                        ":TYPE": "HAS_OPTION",
                        "is_correct:Boolean": bool_to_str(index in correct_indices),
                    }
                )

    write_csv(
        OUTPUT_DIR / "questions.csv",
        [
            "questionId:ID(Question)",
            "question_no",
            "question_text",
            "marks:Float",
            "theoretical_practical",
            "year:Int",
            "paper_code",
            "provenance",
            "confidence:Float",
            "correct_answer",
            "has_diagram:Boolean",
        ],
        question_nodes,
    )

    write_csv(
        OUTPUT_DIR / "subjects.csv",
        ["subjectId:ID(Subject)", "name"],
        subject_nodes.values(),
    )

    write_csv(
        OUTPUT_DIR / "chapters.csv",
        ["chapterId:ID(Chapter)", "name"],
        chapter_nodes.values(),
    )

    write_csv(
        OUTPUT_DIR / "subtopics.csv",
        ["subtopicId:ID(Subtopic)", "name"],
        subtopic_nodes.values(),
    )

    write_csv(
        OUTPUT_DIR / "papers.csv",
        ["paperId:ID(Paper)", "paper_code", "year:Int"],
        paper_nodes.values(),
    )

    write_csv(
        OUTPUT_DIR / "options.csv",
        ["optionId:ID(Option)", "text", "option_index:Int"],
        option_nodes,
    )

    def edge_rows(edge_pairs: Set[Tuple[str, str]], rel_type: str, start_label: str, end_label: str) -> List[Dict[str, object]]:
        return [
            {
                f":START_ID({start_label})": start,
                f":END_ID({end_label})": end,
                ":TYPE": rel_type,
            }
            for start, end in sorted(edge_pairs)
        ]

    write_csv(
        OUTPUT_DIR / "question_subject.csv",
        [":START_ID(Question)", ":END_ID(Subject)", ":TYPE"],
        edge_rows(question_subject_edges, "BELONGS_TO", "Question", "Subject"),
    )

    write_csv(
        OUTPUT_DIR / "question_chapter.csv",
        [":START_ID(Question)", ":END_ID(Chapter)", ":TYPE"],
        edge_rows(question_chapter_edges, "IS_IN_CHAPTER", "Question", "Chapter"),
    )

    write_csv(
        OUTPUT_DIR / "question_subtopic.csv",
        [":START_ID(Question)", ":END_ID(Subtopic)", ":TYPE"],
        edge_rows(question_subtopic_edges, "HAS_SUBTOPIC", "Question", "Subtopic"),
    )

    write_csv(
        OUTPUT_DIR / "chapter_subject.csv",
        [":START_ID(Chapter)", ":END_ID(Subject)", ":TYPE"],
        edge_rows(chapter_subject_edges, "BELONGS_TO", "Chapter", "Subject"),
    )

    write_csv(
        OUTPUT_DIR / "subtopic_chapter.csv",
        [":START_ID(Subtopic)", ":END_ID(Chapter)", ":TYPE"],
        edge_rows(subtopic_chapter_edges, "BELONGS_TO", "Subtopic", "Chapter"),
    )

    write_csv(
        OUTPUT_DIR / "question_paper.csv",
        [":START_ID(Question)", ":END_ID(Paper)", ":TYPE"],
        edge_rows(question_paper_edges, "ASKED_IN", "Question", "Paper"),
    )

    write_csv(
        OUTPUT_DIR / "question_option.csv",
        [":START_ID(Question)", ":END_ID(Option)", ":TYPE", "is_correct:Boolean"],
        question_option_edges,
    )

    print(f"Generated Neo4j CSV files in '{OUTPUT_DIR.resolve()}'")


if __name__ == "__main__":
    main()


