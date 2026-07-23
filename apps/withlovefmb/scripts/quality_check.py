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
FORBIDDEN_PUBLIC_FEATURES: tuple[str, ...] = ()
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
    for marker in (
        "showContinueGate",
        "revealCompleteReading",
        "product-email-access.js",
        "Enter your email to continue reading.",
        "Complete reading unlocked.",
    ):
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
        "signInWithPassword",
        "Registration is closed",
        "signupTab.disabled=true",
        "showPanel('signin')",
    ):
        if marker not in auth_js:
            errors.append(f"assets/js/auth.js: missing closed-registration marker: {marker}")
    if ".auth.signUp(" in auth_js:
        errors.append("assets/js/auth.js: closed registration must not call signUp")
    auth_html = (ROOT / "auth.html").read_text(encoding="utf-8")
    for marker in (
        "Normal sign-in does not send an email",
        "Registration is closed",
        'id="signinPanel"',
        'id="signupTab" type="button" role="tab" aria-controls="signupPanel" aria-selected="false" disabled',
        "assets/js/auth.js?v=",
    ):
        if marker not in auth_html:
            errors.append(f"auth.html: missing closed-registration guidance: {marker}")
    for forbidden in ("Join our community", "Creating a profile is free"):
        if forbidden in auth_html:
            errors.append(f"auth.html: closed registration still advertises signup: {forbidden}")

    app_html = (ROOT / "app/index.html").read_text(encoding="utf-8")
    for marker in (
        'id="accessGate"',
        'id="signupForm"',
        'id="signinForm"',
        'id="screen-community"',
        'id="wallForm"',
        'id="screen-profile"',
        'id="screen-listen"',
        'id="screen-read"',
        'id="screen-help"',
        "primeSignInSound",
        "playSignInSound",
        "/assets/js/supabase-client.js",
    ):
        if marker not in app_html:
            errors.append(f"app/index.html: missing verified app-entry marker: {marker}")
    go_targets = set(re.findall(r'data-go="([^"]+)"', app_html))
    screen_targets = set(re.findall(r'data-screen="([^"]+)"', app_html))
    for target in sorted(go_targets - screen_targets):
        errors.append(f"app/index.html: navigation button has no matching screen: {target}")
    for retired_script in ("yoni-visual-final.js", "yoni-reply-core.js", "yoni-human-taglish.js"):
        if retired_script in app_html:
            errors.append(f"app/index.html: retired static-mascot script remains loaded: {retired_script}")

    install_html = (ROOT / "app/install/index.html").read_text(encoding="utf-8")
    for marker in (
        'id="installNow"',
        'id="sharePromotion"',
        'id="installGuide"',
        "Your calmer space, one tap away.",
        "Open Yoni or sign in",
        'rel="manifest" href="/app/manifest.webmanifest"',
    ):
        if marker not in install_html:
            errors.append(f"app/install/index.html: missing app-promotion marker: {marker}")
    install_js = (ROOT / "app/install/install.js").read_text(encoding="utf-8")
    for marker in (
        "beforeinstallprompt",
        "appinstalled",
        "navigator.share",
        "Add to Home Screen",
        "serviceWorker.register('/service-worker.js')",
    ):
        if marker not in install_js:
            errors.append(f"app/install/install.js: missing device-aware installation marker: {marker}")
    app_access = (ROOT / "app/access.js").read_text(encoding="utf-8")
    for marker in (
        "signInWithPassword",
        "getUser",
        "const registrationOpen=false",
        "Registration is closed",
        "signupTab.disabled=true",
        "const greetings=[",
        "window.FMB_APP_SESSION",
    ):
        if marker not in app_access:
            errors.append(f"app/access.js: missing secure profile-access marker: {marker}")
    for forbidden in (".auth.signUp(", "registration_open===true"):
        if forbidden in app_access:
            errors.append(f"app/access.js: closed registration still contains: {forbidden}")
    product_email = (ROOT / "assets/js/product-email-access.js").read_text(encoding="utf-8")
    if "shouldCreateUser:false" not in product_email:
        errors.append("assets/js/product-email-access.js: email links must be existing-member only")
    if "shouldCreateUser:true" in product_email:
        errors.append("assets/js/product-email-access.js: email links must not create users")
    app_js = (ROOT / "app/app.js").read_text(encoding="utf-8")
    for marker in (
        "freedom_wall_posts",
        "Moderator approved",
        "username_changed_at",
        "avatar_preset",
        "app_theme",
        "fmb:app-auth-ready",
    ):
        if marker not in app_js:
            errors.append(f"app/app.js: missing complete member-experience marker: {marker}")
    identity_migration = (ROOT / "supabase/migrations/20260718142219_complete_member_app_profile.sql").read_text(encoding="utf-8")
    for marker in (
        "interval '60 days'",
        "Real name cannot be changed",
        "private.prepare_freedom_wall_post",
        "new.status := 'pending'",
        "app_theme",
        "avatar_preset",
    ):
        if marker not in identity_migration:
            errors.append(f"complete member app migration: missing identity or moderation marker: {marker}")

    music = json.loads((ROOT / "assets/data/music-library.json").read_text(encoding="utf-8"))
    tracks = [track for playlist in music.get("playlists", []) for track in playlist.get("tracks", [])]
    expected_music = {"calm-01", "calm-01a", "calm-02", "calm-02a", "calm-03", "calm-03a", "calm-04", "calm-04a", "calm-05", "calm-05a", "with-love-fmb-ost-01", "with-love-fmb-ost-02"}
    music_ids = {track.get("id") for track in tracks}
    if not expected_music.issubset(music_ids):
        errors.append("assets/data/music-library.json: the approved Calm collection or With Love, FMB OST is incomplete")
    if len(tracks) != 31:
        errors.append(f"assets/data/music-library.json: expected 31 tracks, found {len(tracks)}")
    for track in tracks:
        source = str(track.get("src") or track.get("audio_url") or "")
        target = local_target(ROOT / "index.html", source, "/")
        if target is None or not target.exists():
            errors.append(f"assets/data/music-library.json: missing audio for {track.get('id')}: {source}")

    loader = (ROOT / "assets/js/yoni-experience-loader.js").read_text(encoding="utf-8")
    for marker in ("yoni-native-libraries.js", "yoni-native-music.js", "yoni-native-ebooks.js"):
        if marker not in loader:
            errors.append(f"assets/js/yoni-experience-loader.js: native Yoni library is missing: {marker}")
    native_books = (ROOT / "assets/js/yoni-native-ebooks.js").read_text(encoding="utf-8")
    for name in MEMBER_READING_PAGES:
        if f"/{name}" not in native_books:
            errors.append(f"assets/js/yoni-native-ebooks.js: shared title is missing: {name}")


def check_navigation_experience(errors: list[str]) -> None:
    index = (ROOT / "index.html").read_text(encoding="utf-8")
    site_js = (ROOT / "assets/js/site.js").read_text(encoding="utf-8")
    site_css = (ROOT / "assets/css/site.css").read_text(encoding="utf-8")
    for marker in (
        "Official FMB Bulletin",
        'id="latest-release"',
        'id="channels"',
        "Meet Yoni. A complete space to listen, read, write, and check in.",
        "https://yoni.francinemariebautista.com/",
        "/projects/",
        "/withlovefmb/#volunteer",
        "/gethelp/",
        "/assets/images/fmb-approved/fmb-master-transparent.webp",
        "/assets/js/fmb-bulletin-home.js",
    ):
        if marker not in index:
            errors.append(f"index.html: missing first-visit benefit: {marker}")
    for marker in ("setupFriendlyNavigation", "nav-mobile-actions", "nav-install-link", "https://yoni.francinemariebautista.com/", "About FMB", "News", "Projects", "Reading", "Music", "Get Involved", "Get Help", "FMB&CO."):
        if marker not in site_js:
            errors.append(f"assets/js/site.js: missing navigation UX marker: {marker}")
    if ".entry-benefits" not in site_css:
        errors.append("assets/css/site.css: first-visit benefit styles are missing")
def check_az_assistant(errors: list[str]) -> None:
    site_js = (ROOT / "assets/js/site.js").read_text(encoding="utf-8")
    app_html = (ROOT / "app/index.html").read_text(encoding="utf-8")
    worker = (ROOT / "service-worker.js").read_text(encoding="utf-8")
    assistant_path = ROOT / "assets/js/az-assistant.js"
    styles_path = ROOT / "assets/css/az-assistant.css"
    if not assistant_path.exists():
        errors.append("assets/js/az-assistant.js: AZ help flow is missing")
        return
    if not styles_path.exists():
        errors.append("assets/css/az-assistant.css: AZ help interface styles are missing")
        return
    assistant = assistant_path.read_text(encoding="utf-8")
    core_path = ROOT / "assets/js/az-assistant-core.js"
    if not core_path.exists():
        errors.append("assets/js/az-assistant-core.js: Pearly response bank is missing")
        return
    assistant += "\n" + core_path.read_text(encoding="utf-8")
    styles = styles_path.read_text(encoding="utf-8")
    for marker in (
        "FMB&CO. Receptionist",
        "Receptionist",
        "AZ does not invent prices, packages, payment instructions, or availability.",
        "verified premade reply bank",
        "UNKNOWN_QUESTION_KEY",
        "fmb:az-unmatched",
        "www.francinemariebautista.com",
        "FMB&amp;CO. Website Reception",
        "Outside AZ’s Website Role",
        "outside AZ’s capabilities",
        "does not provide mental-health guidance",
        "Website and Brands",
        "News and Publications",
        "Find Something",
        "Community Pages",
        "Website Privacy Information",
        "Work with FMB",
        "Volunteer and Collaborate",
        "Services, Fees, and Partnerships",
        "Report a Website Problem",
        "Frequently Asked Website Questions",
        "submit_contact_message",
    ):
        if marker not in assistant:
            errors.append(f"assets/js/az-assistant.js: missing guided-help marker: {marker}")
    for marker in (".az-help-trigger", ".az-help-panel", ".az-help-role", ".az-quick-reply", "min-height:44px", "min-width:150px", "fmb-mobile-host"):
        if marker not in styles:
            errors.append(f"assets/css/az-assistant.css: missing responsive help style: {marker}")
    for marker in ("az-assistant.css", "az-assistant.js", "YONI_HOST", "isPublicWebsiteHost"):
        if marker not in site_js:
            errors.append(f"assets/js/site.js: AZ website-only loading guard is missing: {marker}")
    for marker in ("az-assistant.css", "az-assistant.js"):
        if marker in app_html:
            errors.append(f"app/index.html: AZ must not load inside the companion app: {marker}")
        if marker in worker:
            errors.append(f"service-worker.js: AZ must not be part of the companion app shell: {marker}")
    if "yoni.francinemariebautista.com')return" not in assistant:
        errors.append("assets/js/az-assistant.js: AZ Yoni-host safety guard is missing")


def check_advertising_flow(errors: list[str]) -> None:
    site_js = (ROOT / "assets/js/site.js").read_text(encoding="utf-8")
    banner_css = (ROOT / "assets/css/experience-refresh.css").read_text(encoding="utf-8")
    about = (ROOT / "aboutfmb/index.html").read_text(encoding="utf-8")
    for marker in (
        "From the FMB&amp;CO. ecosystem:",
        "/assets/images/projects/senz-logo.png",
        "/assets/images/projects/cognita-logo.png",
        "Official inquiries begin at the FMB reception desk",
        "/aboutfmb/#work-with-fmb",
        "setupWorkInquiry",
        "submit_contact_message",
    ):
        if marker not in site_js:
            errors.append(f"assets/js/site.js: missing verified inquiry marker: {marker}")
    for marker in (".top-shell", "position:fixed!important", ".promo-marquee", "animation:fmb-public-care-marquee", ".banner-divider", ".banner-advertise-button"):
        if marker not in banner_css:
            errors.append(f"assets/css/experience-refresh.css: missing moving banner marker: {marker}")
    for marker in ('id="workWithFmbForm"', 'id="workService"', 'id="workBrief"', "does not confirm availability, a meeting, pricing, or a service agreement"):
        if marker not in about:
            errors.append(f"aboutfmb/index.html: missing verified inquiry marker: {marker}")
    for retired_marker in ("advertising tier packages", "Request advertising tiers", "Open availability", "Full, priority review"):
        if retired_marker in about or retired_marker in site_js:
            errors.append(f"retired simulated offer or availability remains: {retired_marker}")


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
    standalone_footer_pages = {
        Path("fmbandco/senz/index.html"),
        Path("fmbandco/cognita/index.html"),
    }
    for page in ROOT.rglob("*.html"):
        relative_page = page.relative_to(ROOT)
        if relative_page in standalone_footer_pages:
            continue
        page_text = page.read_text(encoding="utf-8")
        if '<footer class="footer"' in page_text and footer_release not in page_text:
            errors.append(f"{relative_page}: refined responsive footer stylesheet is missing")


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
        "focusableItems",
        "visualViewport",
        "senz-logo.png?v=20260716-desktop-premium-v1",
        "cognita-logo.png?v=20260716-desktop-premium-v1",
        "Official FMB Bulletin",
        "Get Involved",
        "Get Help",
        "/projects/",
    ):
        if marker not in hotfix_js:
            errors.append(f"assets/js/live-hotfix.js: missing accessible mobile menu marker: {marker}")

    for logo in ("senz-logo.png", "cognita-logo.png"):
        if not (ROOT / "assets/images/projects" / logo).exists():
            errors.append(f"assets/images/projects/{logo}: clean transparent partner logo is missing")

    clean_brand_logos = (
        "assets/images/fmbandco/fmbandco-primary-transparent.png",
        "assets/images/fmbandco/fmbandco-primary-clean.png",
        "assets/images/fmbandco/fmbandco-primary-reversed.png",
        "assets/images/fmbandco/fmbandco-ampersand-gold.png",
        "assets/images/projects/senz-logo-clean.png",
        "assets/images/projects/cognita-logo-clean.png",
        "assets/images/fmb/francine-marie-bautista-wordmark-white-v2.png",
    )
    for name in clean_brand_logos:
        logo_path = ROOT / name
        if not logo_path.exists():
            errors.append(f"{name}: transparent brand mark is missing")
            continue
        png = logo_path.read_bytes()
        if len(png) < 26 or png[:8] != b"\x89PNG\r\n\x1a\n" or png[25] not in {4, 6}:
            errors.append(f"{name}: brand mark must remain a PNG with transparency")

    for name in (
        "fmb-master-purple-square.webp",
        "fmb-master-transparent.webp",
        "fmb-news-official-transparent.webp",
        "fmb-music-official-transparent.webp",
        "fmb-ebook-official-transparent.webp",
        "francine-standing-landscape.webp",
        "francine-seated-landscape.webp",
        "francine-portrait-angle-left.webp",
        "francine-portrait-angle-right.webp",
        "francine-portrait-front.webp",
    ):
        webp_path = ROOT / "assets/images/fmb-approved" / name
        if not webp_path.exists():
            errors.append(f"assets/images/fmb-approved/{name}: exact approved FMB asset is missing")
            continue
        webp = webp_path.read_bytes()
        if len(webp) < 16 or webp[:4] != b"RIFF" or webp[8:12] != b"WEBP":
            errors.append(f"assets/images/fmb-approved/{name}: exact approved asset must remain WebP")

    fmbandco_css_path = ROOT / "assets/css/fmbandco-brand.css"
    if not fmbandco_css_path.exists():
        errors.append("assets/css/fmbandco-brand.css: standalone FMB&CO. brand system is missing")
    else:
        fmbandco_css = fmbandco_css_path.read_text(encoding="utf-8")
        for marker in (
            "--fco-purple:#291744",
            "--fco-purple-deep:#160c27",
            "--fco-gold:#c8a96b",
            "--fco-pearl:#f6f3ed",
            "--senz-blue:#145dff",
            ".fco-mobile-dock",
            "env(safe-area-inset-bottom)",
            "@media(max-width:860px)",
            "@keyframes fco-hero-rise",
            "@keyframes fco-portrait-float",
            "@keyframes fco-founder-card-shape-drift",
            ".fco-portrait-shape",
            ".fco-founder-card-shape",
            ".fco-founder-card-portrait",
            ".fco-founder-portrait-card.is-side",
            "height:min(118%,570px)",
            "mask-image:linear-gradient",
            ".fco-reveal-target",
        ):
            if marker not in fmbandco_css:
                errors.append(f"assets/css/fmbandco-brand.css: missing brand or responsive marker: {marker}")
        for marker in ('content:"&"', "background:rgba(255,255,255,.94);text-decoration:none", "background:rgba(255,255,255,.92);box-shadow", 'font-family:"Great Vibes"', "great-vibes-latin-400-normal.woff2"):
            if marker in fmbandco_css:
                errors.append(f"assets/css/fmbandco-brand.css: retired white-panel or generic-ampersand treatment remains: {marker}")

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
        "communityengagements/index.html",
        "dress-with-intention.html",
        "ebooks/index.html",
        "freedom-wall.html",
        "gethelp/index.html",
        "music/index.html",
    )
    for name in public_mobile_routes:
        page = (ROOT / name).read_text(encoding="utf-8")
        if "fmb-mobile-luxury.css?v=20260716-mobile-first-v6" not in page:
            errors.append(f"{name}: deterministic mobile luxury stylesheet is missing")
        if "site.js?v=20260716-mobile-first-v6" not in page:
            errors.append(f"{name}: core persistent mobile menu script is missing")
        if "live-hotfix.js?v=20260716-mobile-first-v6" not in page:
            errors.append(f"{name}: accessible floating mobile menu is missing")

    fmbandco_pages = (
        "fmbandco/index.html",
        "fmbandco/senz/index.html",
        "fmbandco/cognita/index.html",
    )
    for name in fmbandco_pages:
        page = (ROOT / name).read_text(encoding="utf-8")
        for marker in (
            "fmbandco-brand.css?v=20260719-portrait-placement-v9",
            "fmbandco-primary-reversed.png",
            "fmbandco-ampersand-gold.png",
            'class="fco-nav-links"',
            'class="fco-mobile-dock"',
            "/aboutfmb/#work-with-fmb",
        ):
            if marker not in page:
                errors.append(f"{name}: missing standalone FMB&CO. brand marker: {marker}")
        for marker in ('class="fco-note-mark" aria-hidden="true">&amp;', 'class="fco-founder-mark" aria-hidden="true">&amp;', 'class="fco-dock-amp" aria-hidden="true">&amp;'):
            if marker in page:
                errors.append(f"{name}: generic decorative ampersand remains: {marker}")

    fmbandco_home = (ROOT / "fmbandco/index.html").read_text(encoding="utf-8")
    for marker in ("francine-standing-landscape.webp", "francine-portrait-front.webp", "francine-marie-bautista-wordmark-white-v2.png", 'class="fco-hero-visual"', 'fetchpriority="high"', "fco-founder-nameplate", "fco-founder-signature", "fco-founder-title", "fco-founder-portrait-card is-front", "fco-founder-portrait-card is-side", "Founder", "Francine Marie Bautista"):
        if marker not in fmbandco_home:
            errors.append(f"fmbandco/index.html: responsive founder hero marker is missing: {marker}")
    if "fmbandco-motion.js?v=20260718-motion-v1" not in fmbandco_home:
        errors.append("fmbandco/index.html: restrained homepage motion script is missing")
    fmbandco_motion_path = ROOT / "assets/js/fmbandco-motion.js"
    if not fmbandco_motion_path.exists():
        errors.append("assets/js/fmbandco-motion.js: homepage motion script is missing")
    else:
        fmbandco_motion = fmbandco_motion_path.read_text(encoding="utf-8")
        for marker in ("IntersectionObserver", "prefers-reduced-motion", "fco-motion-ready"):
            if marker not in fmbandco_motion:
                errors.append(f"assets/js/fmbandco-motion.js: missing motion or accessibility marker: {marker}")

    about = (ROOT / "aboutfmb/index.html").read_text(encoding="utf-8")
    for marker in (
        "fmbandco-brand.css?v=20260719-portrait-placement-v9",
        "aboutfmb-corporate.css?v=20260719-portrait-placement-v3",
        "aboutfmb-corporate.js?v=20260718-about-corporate-v1",
        "francine-standing-landscape.webp",
        "francine-portrait-front.webp",
        "francine-marie-bautista-wordmark-white-v2.png",
        "fco-founder-nameplate",
        "fco-founder-signature",
        "fco-founder-title",
        "fmb-about-portrait-card is-front",
        "Founder &middot; Strategist &middot; Creative Director &middot; Storyteller",
        'id="expertise"',
        'id="journey"',
        'id="portfolio"',
        'id="work-with-fmb"',
        'id="workWithFmbForm"',
        "site.js?v=20260716-mobile-first-v6",
    ):
        if marker not in about:
            errors.append(f"aboutfmb/index.html: corporate founder redesign marker is missing: {marker}")
    for retired_marker in ("site.css?v=20260716-mobile-first-v6", "organized-pages.css", "authority-hero", "assets/images/founder.webp\" alt="):
        if retired_marker in about:
            errors.append(f"aboutfmb/index.html: retired mixed-style About marker remains: {retired_marker}")

    about_css_path = ROOT / "assets/css/aboutfmb-corporate.css"
    about_motion_path = ROOT / "assets/js/aboutfmb-corporate.js"
    if not about_css_path.exists():
        errors.append("assets/css/aboutfmb-corporate.css: dedicated corporate About system is missing")
    else:
        about_css = about_css_path.read_text(encoding="utf-8")
        for marker in (".fmb-about-corporate", ".fmb-about-booking-grid", ".fmb-about-portfolio-grid", ".fmb-about-hero-deck", ".fmb-about-portrait-shape", ".fmb-about-portrait", "height:min(118%,570px)", ".fmb-about-signoff-wordmark", "fmbandco-ampersand-gold.png", "@media(max-width:860px)"):
            if marker not in about_css:
                errors.append(f"assets/css/aboutfmb-corporate.css: missing brand, booking, or responsive marker: {marker}")
        if 'content:"&"' in about_css:
            errors.append("assets/css/aboutfmb-corporate.css: generic decorative ampersand remains")
        for retired_marker in ('font-family:"Great Vibes"', "great-vibes-latin-400-normal.woff2"):
            if retired_marker in about_css:
                errors.append(f"assets/css/aboutfmb-corporate.css: generic script treatment remains: {retired_marker}")
    if not about_motion_path.exists():
        errors.append("assets/js/aboutfmb-corporate.js: About motion system is missing")
    else:
        about_motion = about_motion_path.read_text(encoding="utf-8")
        for marker in ("IntersectionObserver", "prefers-reduced-motion", "about-motion-ready"):
            if marker not in about_motion:
                errors.append(f"assets/js/aboutfmb-corporate.js: missing motion or accessibility marker: {marker}")

    news = (ROOT / "news/index.html").read_text(encoding="utf-8")
    news_css_path = ROOT / "assets/css/news-channel.css"
    news_js_path = ROOT / "assets/js/news-channel.js"
    if not news_css_path.exists():
        errors.append("assets/css/news-channel.css: broadcast channel styles are missing")
    if not news_js_path.exists():
        errors.append("assets/js/news-channel.js: news interaction layer is missing")
    for marker in (
        "FMB&amp;CO. News Network",
        "The day, clearly told.",
        "Latest bulletin",
        'id="rundown"',
        "News formats built for understanding.",
        'id="editorial-standard"',
        'class="nc-site-header nc-broadcast-header"',
        "/news/china-ai-monkey-video/",
        "/news/cleopatra-barrera/",
        "/news/impeachment/",
        "/news/pax-silica/",
        "/news/good-news/",
        "news-channel.css?v=20260719-broadcast-v3",
        "news-channel.js?v=20260719-broadcast-v3",
    ):
        if marker not in news:
            errors.append(f"news/index.html: missing broadcast channel marker: {marker}")
    if news_css_path.exists():
        news_css = news_css_path.read_text(encoding="utf-8")
        for marker in (".nc-broadcast-identity", ".nc-broadcast-grid", ".nc-rundown-panel", ".nc-signal-tag", ".nc-network-clock", "prefers-reduced-motion"):
            if marker not in news_css:
                errors.append(f"assets/css/news-channel.css: missing broadcast or responsive marker: {marker}")
    if news_js_path.exists():
        news_js = news_js_path.read_text(encoding="utf-8")
        for marker in ("Asia/Manila", "data-news-clock", "IntersectionObserver", "navigator.share"):
            if marker not in news_js:
                errors.append(f"assets/js/news-channel.js: missing clock, motion, or sharing marker: {marker}")
    for route in (
        "subic-aeta-landfill",
        "pax-silica-water",
        "binibining-pilipinas-2026",
        "china-ai-monkey-video",
        "cleopatra-barrera",
        "impeachment",
        "pax-silica",
        "good-news",
    ):
        story = (ROOT / "news" / route / "index.html").read_text(encoding="utf-8")
        for marker in ('nc-article-layout', 'data-news-share', 'class="nc-sources"', 'rel="canonical"', 'nc-broadcast-header', 'data-news-clock'):
            if marker not in story:
                errors.append(f"news/{route}/index.html: incomplete broadcast story marker: {marker}")
        if "location.replace" in story or 'content="noindex' in story:
            errors.append(f"news/{route}/index.html: story route must be a complete indexable article")
    for name in (
        "subic-aeta-dumpsite-iwitness.jpg",
        "new-clark-city-pax-silica-pia.jpg",
        "binibining-pilipinas-2026-winners.jpg",
        "china-ai-propaganda-editorial.webp",
        "good-news-briefing.png",
    ):
        if name not in news:
            errors.append(f"news/index.html: missing sourced editorial visual: {name}")
        if not (ROOT / "assets/images/news" / name).exists():
            errors.append(f"assets/images/news/{name}: news sharing image is missing")
    visual_count = news.count('class="news-visual"')
    caption_count = news.count("<figcaption>")
    if visual_count < 5:
        errors.append("news/index.html: the main rundown must retain its sourced lead visuals")
    if caption_count != visual_count or "GMA Public Affairs / I-Witness" not in news or "Philippine Information Agency" not in news or "Earl D.C. Bracamonte / Philstar.com" not in news or "does not reproduce the racist video" not in news:
        errors.append("news/index.html: every editorial visual must show its source or credit below it")
    china_ai_story = (ROOT / "news/china-ai-monkey-video/index.html").read_text(encoding="utf-8")
    for marker in ("Reuters", "Associated Press", "Permanent Court of Arbitration", "FMB&amp;CO. perspective · Opinion", "did not represent China’s official position"):
        if marker not in china_ai_story:
            errors.append(f"news/china-ai-monkey-video/index.html: missing sourced analysis marker: {marker}")
    subic_story = (ROOT / "news/subic-aeta-landfill/index.html").read_text(encoding="utf-8")
    for marker in ("Francine’s perspective · Opinion", "Philippine News Agency", "Republic Act 9003", "water are safe", "GMA Public Affairs"):
        if marker not in subic_story:
            errors.append(f"news/subic-aeta-landfill/index.html: missing reporting or labeled-opinion marker: {marker}")
    pax_water_story = (ROOT / "news/pax-silica-water/index.html").read_text(encoding="utf-8")
    for marker in ("Pax Silica will need a lot of water", "151 to 303 MLD", "150 to 200 MLD", "complete water plan", "U.S. Department of Energy", "Francine’s perspective · Opinion"):
        if marker not in pax_water_story:
            errors.append(f"news/pax-silica-water/index.html: missing water-demand analysis marker: {marker}")
    for retired_marker in ("Verdict: Unsupported", "fails the scale test", "viral-sized claim"):
        if retired_marker in pax_water_story:
            errors.append(f"news/pax-silica-water/index.html: retired debunk framing remains: {retired_marker}")
    binibini_story = (ROOT / "news/binibining-pilipinas-2026/index.html").read_text(encoding="utf-8")
    for marker in ("Gwendoline Meliz Frias Soriano", "Sasha-Juli Belle Penuliar Lacuna", "first time in Binibining Pilipinas history", "Earl D.C. Bracamonte"):
        if marker not in binibini_story:
            errors.append(f"news/binibining-pilipinas-2026/index.html: missing coronation or credit marker: {marker}")
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
    html_files = sorted(path for path in ROOT.rglob("*.html") if "build" not in path.parts)
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
    check_az_assistant(errors)
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
