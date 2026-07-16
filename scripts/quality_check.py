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
    "dress-with-intention.html",
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
    for marker in ("publicBooks", "reading.html", "coming-out-respect.html", "men-can-cry.html", "This complete reading is open to everyone", "This guide is part of our member library"):
        if marker not in public_gate:
            errors.append(f"assets/js/membership-gate.js: member access marker is missing: {marker}")

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
    auth_js = (ROOT / "assets/js/auth.js").read_text(encoding="utf-8")
    if "/profile/" not in auth_js:
        errors.append("assets/js/auth.js: successful sign-in must open /profile/")
    for marker in (
        "showExistingAccount",
        "data.user.identities.length===0",
        "Normal sign-in does not send an email",
        "Already verified profiles will not receive another signup email",
    ):
        if marker not in auth_js:
            errors.append(f"assets/js/auth.js: missing existing-account guidance: {marker}")
    auth_html = (ROOT / "auth.html").read_text(encoding="utf-8")
    for marker in (
        "Normal sign-in does not send an email",
        'id="verificationLead"',
        "Already verified profiles will not receive another verification email",
        "auth.js?v=20260716-existing-account-fix",
    ):
        if marker not in auth_html:
            errors.append(f"auth.html: missing member access guidance: {marker}")

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
        "Begin with a public guide",
        "Listen inside our member space",
        "Visit the Freedom Wall",
        "Access public support",
    ):
        if marker not in index:
            errors.append(f"index.html: missing first-visit benefit: {marker}")
    for marker in ("setupFriendlyNavigation", "nav-mobile-actions", "Get help", "News", "Freedom Wall", "Community Engagements", "FMB & Co."):
        if marker not in site_js:
            errors.append(f"assets/js/site.js: missing navigation UX marker: {marker}")
    if ".entry-benefits" not in site_css:
        errors.append("assets/css/site.css: first-visit benefit styles are missing")


def check_advertising_flow(errors: list[str]) -> None:
    site_js = (ROOT / "assets/js/site.js").read_text(encoding="utf-8")
    banner_css = (ROOT / "assets/css/experience-refresh.css").read_text(encoding="utf-8")
    about = (ROOT / "aboutfmb/index.html").read_text(encoding="utf-8")
    edge_path = ROOT / "supabase/functions/advertising-inquiry/index.ts"
    for marker in (
        "With love, FMB is brought to you by:",
        "/assets/images/projects/senz-logo.png",
        "/assets/images/projects/cognita-logo.png",
        "Advertise your brand or business across the website",
        "/aboutfmb/?category=advertise-with-us#work-with-fmb",
        "client.functions.invoke('advertising-inquiry'",
        "button.disabled=!(name&&business&&isValidEmail(email))",
    ):
        if marker not in site_js:
            errors.append(f"assets/js/site.js: missing advertising marker: {marker}")
    for marker in (".top-shell", "position:fixed!important", ".promo-marquee", "animation:fmb-public-care-marquee", ".banner-divider", ".banner-advertise-button"):
        if marker not in banner_css:
            errors.append(f"assets/css/experience-refresh.css: missing moving banner marker: {marker}")
    for marker in ('id="workBusiness"', 'id="advertisePrefill"', "Request the advertising tier packages"):
        if marker not in about:
            errors.append(f"aboutfmb/index.html: missing advertising form marker: {marker}")
    if not edge_path.exists():
        errors.append("supabase/functions/advertising-inquiry/index.ts: advertising email function is missing")
    else:
        edge = edge_path.read_text(encoding="utf-8")
        for marker in ("withlovefmb@gmail.com", "RESEND_API_KEY", "emails/batch", "submit_contact_message", "noreply@francinemariebautista.com"):
            if marker not in edge:
                errors.append(f"supabase/functions/advertising-inquiry/index.ts: missing delivery marker: {marker}")


def check_sharing_and_footer(errors: list[str]) -> None:
    site_js = (ROOT / "assets/js/site.js").read_text(encoding="utf-8")
    content_css = (ROOT / "assets/css/fmb-content.css").read_text(encoding="utf-8")
    for marker in (
        "setupContentActions",
        "fmb_saved_content_v1",
        "facebook.com/sharer/sharer.php",
        "twitter.com/intent/tweet",
        'data-share="messenger"',
        "sms:?body=",
        "item-action-row",
        "ebook-card-shell",
        "news-article[id]",
        "Masinloc, Zambales 2211",
        "Republic of the Philippines",
        "/assets/images/signature-transparent.png?v=20260716-signature-v5",
        "setupArticleSignatures",
        ".news-article .news-body",
    ):
        if marker not in site_js:
            errors.append(f"assets/js/site.js: missing sharing or footer marker: {marker}")
    for marker in (".content-action-panel", ".content-action-music", "body .footer:after", "opacity:.5", ".footer-brand-lockup:before", "background:transparent"):
        if marker not in content_css:
            errors.append(f"assets/css/fmb-content.css: missing responsive sharing or footer style: {marker}")
    for marker in ("animation:fmb-content-partner-marquee", "@keyframes fmb-content-partner-marquee"):
        if marker not in content_css:
            errors.append(f"assets/css/fmb-content.css: moving partner banner is missing: {marker}")

    signature = ROOT / "assets/images/signature-transparent.png"
    if not signature.exists():
        errors.append("assets/images/signature-transparent.png: transparent FMB signature is missing")
    else:
        png = signature.read_bytes()
        if len(png) < 26 or png[:8] != b"\x89PNG\r\n\x1a\n" or png[25] not in {4, 6}:
            errors.append("assets/images/signature-transparent.png: signature must remain a PNG with transparency")

    for name in MEMBER_READING_PAGES:
        article = (ROOT / name).read_text(encoding="utf-8")
        if "reader-signoff article-signature" not in article or "signature-transparent.png?v=20260716-signature-v5" not in article:
            errors.append(f"{name}: transparent closing signature is missing")

    site_css = (ROOT / "assets/css/site.css").read_text(encoding="utf-8")
    for marker in ("body .footer-brand-lockup .footer-logo", "body .article-signature", "filter:none!important"):
        if marker not in site_css:
            errors.append(f"assets/css/site.css: missing transparent signature presentation: {marker}")

    footer_css_path = ROOT / "assets/css/fmb-footer-v2.css"
    if not footer_css_path.exists():
        errors.append("assets/css/fmb-footer-v2.css: refined responsive footer is missing")
    else:
        footer_css = footer_css_path.read_text(encoding="utf-8")
        for marker in (
            "body .footer::after{display:none!important}",
            "grid-template-columns:minmax(300px,1.2fr)",
            "grid-template-columns:repeat(2,minmax(0,1fr))",
            "body .footer .footer-brand-lockup",
            "background:transparent!important",
            "@media(max-width:360px)",
        ):
            if marker not in footer_css:
                errors.append(f"assets/css/fmb-footer-v2.css: missing refined footer marker: {marker}")

    footer_release = "/assets/css/fmb-footer-v2.css?v=20260716-footer-v2"
    for page in ROOT.rglob("*.html"):
        page_text = page.read_text(encoding="utf-8")
        if '<footer class="footer"' in page_text and footer_release not in page_text:
            errors.append(f"{page.relative_to(ROOT)}: refined responsive footer stylesheet is missing")


def check_mobile_and_editorial_media(errors: list[str]) -> None:
    mobile_path = ROOT / "assets/css/fmb-mobile-clean.css"
    if not mobile_path.exists():
        errors.append("assets/css/fmb-mobile-clean.css: mobile-only design layer is missing")
        return
    mobile_css = mobile_path.read_text(encoding="utf-8")
    for marker in (
        "@media(max-width:800px)",
        ".mobile-chrome-compact",
        ".mobile-menu-open",
        ".ebook-grid{display:flex!important",
        'background-size:contain!important',
        ".authority-copy{order:1}",
        ".footer-grid>div:nth-child(2)",
    ):
        if marker not in mobile_css:
            errors.append(f"assets/css/fmb-mobile-clean.css: missing mobile UX marker: {marker}")

    site_js = (ROOT / "assets/js/site.js").read_text(encoding="utf-8")
    for marker in ("setupMobileChrome", "MOBILE_EXPERIENCE_HOST", "mobile.francinemariebautista.com", "isDedicatedMobileHost", "fmb-mobile-host", "setupMemberExperience", "fmb:auth-ready", "scope:'local'", "document.createElement('nav')", "fmb-mobile-clean.css", "createActions", "navigator.share", "coreMenuBound", "mobile-menu-fab", "aria-modal", "focusableItems", "visualViewport", "fmb-mobile-menu-anchor", "document.body.appendChild(menu)", "promoGroup", "register('/service-worker.js'"):
        if marker not in site_js:
            errors.append(f"assets/js/site.js: missing mobile or item-action marker: {marker}")

    luxury_path = ROOT / "assets/css/fmb-mobile-luxury.css"
    if not luxury_path.exists():
        errors.append("assets/css/fmb-mobile-luxury.css: iPhone-style mobile layer is missing")
    else:
        luxury_css = luxury_path.read_text(encoding="utf-8")
        for marker in (
            "@media(max-width:800px)",
            ".mobile-menu-fab",
            "position:fixed!important",
            "grid-template-columns:repeat(2,minmax(0,1fr))",
            "backdrop-filter:blur(38px)",
            "--fmb-mobile-safe-bottom",
            "animation:fmb-mobile-partner-marquee",
            "background:linear-gradient(108deg,#2a063b",
            "z-index:2147483646!important",
            "animation:fmb-mobile-partner-marquee 38s linear infinite!important",
        ):
            if marker not in luxury_css:
                errors.append(f"assets/css/fmb-mobile-luxury.css: missing luxury mobile marker: {marker}")

    hotfix_js = (ROOT / "assets/js/live-hotfix.js").read_text(encoding="utf-8")
    for marker in (
        "mobile-menu-fab",
        "aria-modal",
        "focusableItems",
        "visualViewport",
        "senz-logo.png?v=20260716-desktop-premium-v1",
        "cognita-logo.png?v=20260716-desktop-premium-v1",
    ):
        if marker not in hotfix_js:
            errors.append(f"assets/js/live-hotfix.js: missing accessible mobile menu marker: {marker}")

    for logo in ("senz-logo.png", "cognita-logo.png"):
        if not (ROOT / "assets/images/projects" / logo).exists():
            errors.append(f"assets/images/projects/{logo}: clean transparent partner logo is missing")

    premium_css_path = ROOT / "assets/css/desktop-premium.css"
    if not premium_css_path.exists():
        errors.append("assets/css/desktop-premium.css: premium desktop and persistent player layer is missing")
    else:
        premium_css = premium_css_path.read_text(encoding="utf-8")
        for marker in (
            "width:100vw!important",
            "body.desktop-nav-hidden .nav-glass",
            ".fmb-music-dock",
            "body.landing-home .home-welcome",
            "body.music-app .featured-player",
            "@media(min-width:1025px)",
        ):
            if marker not in premium_css:
                errors.append(f"assets/css/desktop-premium.css: missing desktop or player marker: {marker}")

    for name, markers in {
        "assets/css/member-experience.css": ("fmb-member-banner-loop", ".nav-account-icon", ".member-access-card", ".music-member-locked"),
        "assets/css/mobile-app.css": ("html.fmb-mobile-host", ".mobile-app-welcome", "mobile.francinemariebautista.com"),
    }.items():
        path = ROOT / name
        if not path.exists():
            errors.append(f"{name}: member mobile layer is missing")
            continue
        content = path.read_text(encoding="utf-8")
        for marker in markers:
            if marker not in content:
                errors.append(f"{name}: missing marker: {marker}")

    desktop_js_path = ROOT / "assets/js/desktop-premium.js"
    global_music_path = ROOT / "assets/js/global-music.js"
    music_js_path = ROOT / "assets/js/music.js"
    for path in (desktop_js_path, global_music_path):
        if not path.exists():
            errors.append(f"{path.relative_to(ROOT)}: global experience script is missing")
    if desktop_js_path.exists():
        desktop_js = desktop_js_path.read_text(encoding="utf-8")
        for marker in ("desktop-nav-hidden", "IntersectionObserver", "data-page-ending"):
            if marker not in desktop_js:
                errors.append(f"assets/js/desktop-premium.js: missing marker: {marker}")
    if global_music_path.exists():
        global_music_js = global_music_path.read_text(encoding="utf-8")
        for marker in ("fmb_music_state_v2", "fmb:global-music-command", "fmb-music-dock", "pagehide", "MediaMetadata"):
            if marker not in global_music_js:
                errors.append(f"assets/js/global-music.js: missing persistent player marker: {marker}")
    if music_js_path.exists():
        music_js = music_js_path.read_text(encoding="utf-8")
        for marker in ("fmb:music-state", "fmb:global-music-command", "Restoring your listening session"):
            if marker not in music_js:
                errors.append(f"assets/js/music.js: missing cross-page playback marker: {marker}")
    for marker in ("desktop-premium.css", "desktop-premium.js", "global-music.js", "senz-logo.png", "cognita-logo.png"):
        if marker not in site_js:
            errors.append(f"assets/js/site.js: missing global premium asset marker: {marker}")

    public_mobile_routes = (
        "index.html",
        "aboutfmb/index.html",
        "communityengagements/index.html",
        "dress-with-intention.html",
        "ebooks/index.html",
        "fmbandco/index.html",
        "freedom-wall.html",
        "gethelp/index.html",
        "music/index.html",
        "news/index.html",
    )
    for name in public_mobile_routes:
        page = (ROOT / name).read_text(encoding="utf-8")
        if "fmb-mobile-luxury.css?v=20260716-mobile-first-v6" not in page:
            errors.append(f"{name}: deterministic mobile luxury stylesheet is missing")
        if "site.js?v=20260716-mobile-first-v6" not in page:
            errors.append(f"{name}: core persistent mobile menu script is missing")
        if "live-hotfix.js?v=20260716-mobile-first-v6" not in page:
            errors.append(f"{name}: accessible floating mobile menu is missing")

    news = (ROOT / "news/index.html").read_text(encoding="utf-8")
    for name in (
        "cleopatra-barrera-zambales-ocean-feature.jpeg",
        "sara-duterte-impeachment.webp",
        "pax-silica-briefing.png",
        "good-news-briefing.png",
    ):
        if name not in news:
            errors.append(f"news/index.html: missing sourced editorial visual: {name}")
        if not (ROOT / "assets/images/news" / name).exists():
            errors.append(f"assets/images/news/{name}: news sharing image is missing")
    if news.count('class="news-visual"') != 4:
        errors.append("news/index.html: every main story must have one sourced lead visual")
    if news.count("<figcaption>") != 4 or "Photo: AP Photo/Basilio Sepe" not in news or "Digitally created pageant editorial supplied by FMB" not in news:
        errors.append("news/index.html: every editorial visual must show its source or credit below it")
    for retired_name in (
        "cleopatra-barrera-reina-filipinas-zambales.jpeg",
        "cleopatra-barrera-maritime-editorial.jpeg",
        "cleopatra-barrera-blue-gown-editorial.jpeg",
    ):
        if retired_name in news:
            errors.append(f"news/index.html: retired Cleopatra visual is still referenced: {retired_name}")
    if "news-portrait-pair" in news or "news-supporting-visual" in news:
        errors.append("news/index.html: Cleopatra feature must use one editorial photo only")


def main() -> int:
    errors: list[str] = []
    route_pages = [
        ROOT / "ebooks/index.html",
        ROOT / "music/index.html",
        ROOT / "communityengagements/index.html",
        ROOT / "aboutfmb/index.html",
        ROOT / "fmbandco/index.html",
        ROOT / "gethelp/index.html",
        ROOT / "news/index.html",
        ROOT / "news/cleopatra-barrera/index.html",
        ROOT / "news/impeachment/index.html",
        ROOT / "news/pax-silica/index.html",
        ROOT / "news/good-news/index.html",
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
    check_advertising_flow(errors)
    check_sharing_and_footer(errors)
    check_mobile_and_editorial_media(errors)

    if errors:
        print("Quality check failed:\n")
        for error in errors:
            print(f"- {error}")
        return 1
    print(f"Quality check passed for {len(html_files)} HTML pages.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
