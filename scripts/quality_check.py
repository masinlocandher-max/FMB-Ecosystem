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
        self.base_href: str | None = None

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        data = dict(attrs)
        if tag == "base" and data.get("href"):
            self.base_href = str(data["href"])
        if data.get("id"):
            self.ids.append(str(data["id"]))
        if tag in {"a", "link"} and data.get("href"):
            self.references.append(("href", str(data["href"])))
        if tag in {"img", "script", "source", "audio", "video"} and data.get("src"):
            self.references.append(("src", str(data["src"])))
        if tag == "img" and "alt" not in data:
            self.images_without_alt.append(str(data.get("src", "unknown image")))


def local_target(source: Path, reference: str, base_href: str | None = None) -> Path | None:
    value = unquote(reference.strip())
    if not value or value.startswith("#") or value.startswith(IGNORE_SCHEMES):
        return None
    parsed = urlparse(value)
    if parsed.scheme or parsed.netloc:
        return None
    path = parsed.path
    if not path:
        return None
    if path.startswith("/") or base_href == "/":
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
        target = local_target(path, reference, parser.base_href)
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

    public_gate = (ROOT / "assets/js/membership-gate.js").read_text(encoding="utf-8")
    if "The complete reading is open to everyone" not in public_gate:
        errors.append("assets/js/membership-gate.js: temporary public reading access is missing")

    member_js = (ROOT / "assets/js/member.js").read_text(encoding="utf-8")
    if "daily_checkins" not in member_js:
        errors.append("assets/js/member.js: daily check-in integration is missing")
    if "status:'pending'" not in member_js:
        errors.append("assets/js/member.js: community submissions must begin as pending")

    community_js = (ROOT / "assets/js/community.js").read_text(encoding="utf-8")
    if ".eq('status','published')" not in community_js:
        errors.append("assets/js/community.js: public community feed must only request published posts")

    daily_html = (ROOT / "daily.html").read_text(encoding="utf-8")
    if 'content="noindex,nofollow"' not in daily_html:
        errors.append("daily.html: hidden member-tools advisory must remain noindex")
    for marker in ('id="guestCheckinForm"', 'id="guestJournalForm"', 'id="guestCommunityForm"'):
        if marker in daily_html:
            errors.append(f"daily.html: public member tool must stay hidden: {marker}")

    freedom_wall = (ROOT / "freedom-wall.html").read_text(encoding="utf-8")
    for marker in ("With love, FMB reflection", "Visitor contributions are not yet open", "disabled"):
        if marker not in freedom_wall:
            errors.append(f"freedom-wall.html: missing transparent maintenance marker: {marker}")

    profile_html = (ROOT / "profile/index.html").read_text(encoding="utf-8")
    for marker in ('id="checkinForm"', 'id="noteForm"', 'id="communityForm"', "Freedom Wall"):
        if marker not in profile_html:
            errors.append(f"profile/index.html: missing signed-in member tool: {marker}")
    if "/profile/" not in (ROOT / "assets/js/auth.js").read_text(encoding="utf-8"):
        errors.append("assets/js/auth.js: successful sign-in must open /profile/")

    music = json.loads((ROOT / "assets/data/music-library.json").read_text(encoding="utf-8"))
    tracks = [track for playlist in music.get("playlists", []) for track in playlist.get("tracks", [])]
    expected_music = {"calm-01", "calm-01a", "calm-02", "calm-02a", "calm-03", "calm-03a", "calm-04", "calm-04a", "calm-05", "calm-05a", "with-love-fmb-ost-01", "with-love-fmb-ost-02"}
    music_ids = {track.get("id") for track in tracks}
    if not expected_music.issubset(music_ids):
        errors.append("assets/data/music-library.json: the approved Calm collection or With Love, FMB OST is incomplete")


def check_navigation_experience(errors: list[str]) -> None:
    index = (ROOT / "index.html").read_text(encoding="utf-8")
    site_js = (ROOT / "assets/js/site.js").read_text(encoding="utf-8")
    site_css = (ROOT / "assets/css/site.css").read_text(encoding="utf-8")
    for marker in (
        'id="what-you-get"',
        "Read every guide",
        "Listen without signing in",
        "Visit the Freedom Wall",
        "Access public support",
    ):
        if marker not in index:
            errors.append(f"index.html: missing first-visit benefit: {marker}")
    for marker in ("setupFriendlyNavigation", "nav-mobile-actions", "Get help", "Freedom Wall", "Community Engagements", "FMB & Co."):
        if marker not in site_js:
            errors.append(f"assets/js/site.js: missing navigation UX marker: {marker}")
    if ".entry-benefits" not in site_css:
        errors.append("assets/css/site.css: first-visit benefit styles are missing")


def main() -> int:
    errors: list[str] = []
    route_pages = [
        ROOT / "ebooks/index.html",
        ROOT / "music/index.html",
        ROOT / "communityengagements/index.html",
        ROOT / "aboutfmb/index.html",
        ROOT / "fmbandco/index.html",
        ROOT / "profile/index.html",
    ]
    html_files = sorted(ROOT.glob("*.html")) + route_pages
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
