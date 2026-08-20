#!/usr/bin/env python3
"""Future-proof structural quality checks for the current FMB public/Yoni application.

This checker deliberately validates site integrity rather than freezing specific copy,
article slugs, image credits, or versioned stylesheet names. Editorial content and
visual design are expected to evolve; broken structure and missing runtime assets are not.
"""
from __future__ import annotations

import json
import re
import sys
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlparse

ROOT = Path(__file__).resolve().parents[1]

CRITICAL_HTML = (
    "index.html",
    "aboutfmb/index.html",
    "news/index.html",
    "app/index.html",
    "fmbandco/index.html",
    "gethelp/index.html",
    "profile/index.html",
)

CRITICAL_FILES = (
    "service-worker.js",
    "manifest.webmanifest",
    "assets/js/site.js",
    "assets/js/supabase-client.js",
)

MERGE_CONFLICT_LINE = re.compile(r"(?m)^\s*(?:<<<<<<< .+|=======|>>>>>>> .+)\s*$")
BAD_RUNTIME_REFERENCES = (
    'src="undefined"',
    "src='undefined'",
    'href="undefined"',
    "href='undefined'",
    'src="null"',
    "src='null'",
    'href="null"',
    "href='null'",
)


class PageParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.ids: list[str] = []
        self.title_depth = 0
        self.title_text: list[str] = []
        self.runtime_refs: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        data = dict(attrs)
        element_id = data.get("id")
        if element_id:
            self.ids.append(str(element_id))
        if tag == "title":
            self.title_depth += 1
        if tag == "script" and data.get("src"):
            self.runtime_refs.append(str(data["src"]))
        if tag == "link" and data.get("href"):
            rel = str(data.get("rel") or "").lower()
            href = str(data["href"])
            if "stylesheet" in rel or urlparse(href).path.lower().endswith(".css"):
                self.runtime_refs.append(href)

    def handle_endtag(self, tag: str) -> None:
        if tag == "title" and self.title_depth:
            self.title_depth -= 1

    def handle_data(self, data: str) -> None:
        if self.title_depth:
            self.title_text.append(data)


def local_runtime_target(page: Path, reference: str) -> Path | None:
    value = unquote(reference.strip())
    if not value or value.startswith(("http://", "https://", "//", "data:", "javascript:")):
        return None
    parsed = urlparse(value)
    if parsed.scheme or parsed.netloc or not parsed.path:
        return None
    if parsed.path.startswith("/"):
        candidate = ROOT / parsed.path.lstrip("/")
    else:
        candidate = page.parent / parsed.path
    try:
        resolved = candidate.resolve()
        resolved.relative_to(ROOT.resolve())
    except ValueError:
        return None
    return resolved


def check_text_file(relative: str, errors: list[str], minimum_bytes: int = 32) -> None:
    path = ROOT / relative
    if not path.is_file():
        errors.append(f"{relative}: critical file is missing")
        return
    try:
        text = path.read_text(encoding="utf-8")
    except UnicodeDecodeError:
        errors.append(f"{relative}: critical text file is not valid UTF-8")
        return
    if len(text.encode("utf-8")) < minimum_bytes:
        errors.append(f"{relative}: critical file is unexpectedly small")
    if MERGE_CONFLICT_LINE.search(text):
        errors.append(f"{relative}: unresolved merge-conflict block found")


def check_html(relative: str, errors: list[str]) -> None:
    path = ROOT / relative
    if not path.is_file():
        errors.append(f"{relative}: critical page is missing")
        return

    text = path.read_text(encoding="utf-8")
    if len(text.encode("utf-8")) < 256:
        errors.append(f"{relative}: critical page is unexpectedly small")
        return

    lower = text.lower()
    for marker in ("<html", "<head", "</head>", "<body", "</body>", "</html>"):
        if marker not in lower:
            errors.append(f"{relative}: incomplete HTML document, missing {marker}")

    if MERGE_CONFLICT_LINE.search(text):
        errors.append(f"{relative}: unresolved merge-conflict block found")
    for marker in BAD_RUNTIME_REFERENCES:
        if marker in lower:
            errors.append(f"{relative}: invalid runtime reference found: {marker}")

    parser = PageParser()
    try:
        parser.feed(text)
    except Exception as exc:
        errors.append(f"{relative}: HTML parser failed: {exc}")
        return

    title = "".join(parser.title_text).strip()
    if not title:
        errors.append(f"{relative}: page title is missing")

    seen: set[str] = set()
    duplicates: set[str] = set()
    for element_id in parser.ids:
        if element_id in seen:
            duplicates.add(element_id)
        seen.add(element_id)
    if duplicates:
        errors.append(f"{relative}: duplicate element IDs: {', '.join(sorted(duplicates))}")

    for reference in parser.runtime_refs:
        target = local_runtime_target(path, reference)
        if target is not None and not target.is_file():
            errors.append(f"{relative}: missing local runtime asset: {reference}")


def check_json_file(relative: str, errors: list[str]) -> None:
    path = ROOT / relative
    if not path.is_file():
        errors.append(f"{relative}: critical JSON/manifest file is missing")
        return
    try:
        json.loads(path.read_text(encoding="utf-8"))
    except Exception as exc:
        errors.append(f"{relative}: invalid JSON: {exc}")


def check_security_basics(errors: list[str]) -> None:
    config_candidates = (
        ROOT / "assets/js/config.js",
        ROOT / "assets/js/supabase-client.js",
    )
    service_role_pattern = re.compile(r"service[_-]?role|SUPABASE_SERVICE_ROLE", re.I)
    for path in config_candidates:
        if not path.is_file():
            continue
        text = path.read_text(encoding="utf-8")
        if service_role_pattern.search(text):
            errors.append(f"{path.relative_to(ROOT)}: public client code must not contain a service-role credential")


def main() -> int:
    errors: list[str] = []

    for relative in CRITICAL_HTML:
        check_html(relative, errors)

    for relative in CRITICAL_FILES:
        if relative.endswith((".json", ".webmanifest")):
            check_json_file(relative, errors)
        else:
            check_text_file(relative, errors)

    check_security_basics(errors)

    if errors:
        print("Quality check failed:\n")
        for error in errors:
            print(f"- {error}")
        return 1

    print(
        "Quality check passed: critical routes are structurally complete, local CSS/JS "
        "runtime references resolve, no merge-conflict blocks were found, and public "
        "client files pass the basic secret guard."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
