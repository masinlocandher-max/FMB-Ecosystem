#!/usr/bin/env python3
"""Static launch checks for the With love, FMB GitHub Pages site."""
from __future__ import annotations

import json
import re
import sys
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlparse

ROOT = Path(__file__).resolve().parents[1]
IGNORE_SCHEMES = ("http://", "https://", "mailto:", "tel:", "data:", "javascript:")
FORBIDDEN_PUBLIC_FEATURES = (
    "mabayani",
    "tina sambal",
    "sambal dictionary",
    "cultural archive",
    "heritage quiz",
)
MEMBER_READING_PAGES = (
    "reading.html",
    "womens-health.html",
    "men-can-cry.html",
    "coming-out-respect.html",
    "skin-care-makeup.html",
)


class SiteParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.ids: list[str] = []
        self.references: list[tuple[str, str]] = []
        self.images_without_alt: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        data = dict(attrs)
        if data.get("id"):
            self.ids.append(str(data["id"]))
        if tag in {"a", "link"} and data.get("href"):
            self.references.append(("href", str(data["href"])))
        if tag in {"img", "script", "source", "audio", "video"} and data.get("src"):
            self.references.append(("src", str(data["src"])))
        if tag == "img" and "alt" not in data:
            self.images_without_alt.append(str(data.get("src", "unknown image")))


def local_target(source: Path, reference: str) -> Path | None:
    value = unquote(reference.strip())
    if not value or value.startswith("#") or value.startswith(IGNORE_SCHEMES):
        return None
    parsed = urlparse(value)
    if parsed.scheme or parsed.netloc:
        return None
    path = parsed.path
    if not path:
        return None
    if path.startswith("/"):
        candidate = ROOT / path.lstrip("/")
    else:
        candidate = source.parent / path
    if path.endswith("/"):
        candidate = candidate / "index.html"
    return candidate.resolve()


def check_html(path: Path, errors: list[str]) -> None:
    text = path.read_text(encoding="utf-8")
    parser = SiteParser()
    try:
        parser.feed(text)
    except Exception as exc:  # pragma: no cover
        errors.append(f"{path.relative_to(ROOT)}: HTML parsing failed: {exc}")
        return

    duplicates = sorted({item for item in parser.ids if parser.ids.count(item) > 1})
    if duplicates:
        errors.append(f"{path.relative_to(ROOT)}: duplicate IDs: {', '.join(duplicates)}")
    if parser.images_without_alt:
        errors.append(f"{path.relative_to(ROOT)}: images without alt: {', '.join(parser.images_without_alt)}")

    for kind, reference in parser.references:
        target = local_target(path, reference)
        if target is None:
            continue
        try:
            target.relative_to(ROOT)
        except ValueError:
            errors.append(f"{path.relative_to(ROOT)}: {kind} escapes repository: {reference}")
            continue
        if not target.exists():
            errors.append(f"{path.relative_to(ROOT)}: broken {kind}: {reference}")

    lower = text.lower()
    for phrase in FORBIDDEN_PUBLIC_FEATURES:
        if phrase in lower:
            errors.append(f"{path.relative_to(ROOT)}: removed cultural feature remains: {phrase}")


def check_json(path: Path, errors: list[str]) -> None:
    try:
        json.loads(path.read_text(encoding="utf-8"))
    except Exception as exc:
        errors.append(f"{path.relative_to(ROOT)}: invalid JSON: {exc}")


def check_config(errors: list[str]) -> None:
    config = ROOT / "assets/js/config.js"
    if not config.exists():
        errors.append("assets/js/config.js is missing")
        return
    text = config.read_text(encoding="utf-8")
    if re.search(r"service[_-]?role", text, re.I):
        errors.append("assets/js/config.js must never contain a service-role credential")


def check_membership_features(errors: list[str]) -> None:
    for name in MEMBER_READING_PAGES:
        path = ROOT / name
        text = path.read_text(encoding="utf-8")
        if "assets/js/membership-gate.js" not in text:
            errors.append(f"{name}: membership reading gate is missing")
        if "assets/css/membership-gate.css" not in text:
            errors.append(f"{name}: membership gate styles are missing")

    member_js = (ROOT / "assets/js/member.js").read_text(encoding="utf-8")
    if "daily_checkins" not in member_js:
        errors.append("assets/js/member.js: daily check-in integration is missing")
    if "status:'pending'" not in member_js:
        errors.append("assets/js/member.js: community submissions must begin as pending")

    community_js = (ROOT / "assets/js/community.js").read_text(encoding="utf-8")
    if ".eq('status','published')" not in community_js:
        errors.append("assets/js/community.js: public community feed must only request published posts")


def check_navigation_experience(errors: list[str]) -> None:
    index = (ROOT / "index.html").read_text(encoding="utf-8")
    site_js = (ROOT / "assets/js/site.js").read_text(encoding="utf-8")
    site_css = (ROOT / "assets/css/site.css").read_text(encoding="utf-8")
    for marker in (
        'id="what-you-get"',
        "Explore freely",
        "Care for yourself privately",
        "Unlock the full library",
        "Share more safely",
    ):
        if marker not in index:
            errors.append(f"index.html: missing first-visit benefit: {marker}")
    for marker in ("setupFriendlyNavigation", "nav-mobile-actions", "Get help", "Join free"):
        if marker not in site_js:
            errors.append(f"assets/js/site.js: missing navigation UX marker: {marker}")
    if ".entry-benefits" not in site_css:
        errors.append("assets/css/site.css: first-visit benefit styles are missing")


def main() -> int:
    errors: list[str] = []
    html_files = sorted(ROOT.glob("*.html"))
    if not html_files:
        errors.append("No root HTML pages found")
    for path in html_files:
        check_html(path, errors)
    for path in sorted(ROOT.rglob("*.json")):
        if ".git" not in path.parts:
            check_json(path, errors)
    check_config(errors)
    check_membership_features(errors)
    check_navigation_experience(errors)

    if errors:
        print("Quality check failed:\n")
        for error in errors:
            print(f"- {error}")
        return 1
    print(f"Quality check passed for {len(html_files)} HTML pages.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
