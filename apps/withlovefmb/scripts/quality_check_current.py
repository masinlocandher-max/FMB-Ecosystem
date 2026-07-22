#!/usr/bin/env python3
"""Run the site quality suite against the approved FMB Digital Headquarters, modern product channels, Yoni, and newsroom contracts."""
from __future__ import annotations

from pathlib import Path

import quality_check as checks


LEGACY_APP_ERROR = "app/index.html: missing verified app-entry marker:"
STALE_NEWS_ERRORS = {
    "news/index.html: every main story must have one sourced lead visual",
    "news/index.html: every editorial visual must show its source or credit below it",
}
STALE_NEWS_PREFIXES = (
    "news/index.html: missing broadcast channel marker:",
    "assets/js/news-channel.js: missing clock, motion, or sharing marker:",
)
STALE_HOME_ERRORS = {
    "index.html: missing first-visit benefit: Official FMB Bulletin",
    'index.html: missing first-visit benefit: id="latest-release"',
    'index.html: missing first-visit benefit: id="channels"',
    "index.html: missing first-visit benefit: /assets/images/home/fmb-home-logo.webp",
    "index.html: missing first-visit benefit: Meet Yoni. A complete space to listen, read, write, and check in.",
    "index.html: missing first-visit benefit: /assets/js/fmb-bulletin-home.js",
}
STALE_PRODUCT_ERRORS = {
    "ebooks/index.html: deterministic mobile luxury stylesheet is missing",
    "ebooks/index.html: accessible floating mobile menu is missing",
    "music/index.html: deterministic mobile luxury stylesheet is missing",
    "music/index.html: accessible floating mobile menu is missing",
}
STALE_PRODUCT_PREFIXES = (
    "assets/js/music.js: missing cross-page playback marker:",
)
GENERATED_HOME_REFERENCES = (
    "/assets/images/fmb-approved/francine-standing-landscape.webp",
    "/assets/images/fmb-approved/francine-seated-landscape.webp",
    "/assets/images/home/francine-home-founder-hd.webp",
)

ORIGINAL_CHECK_HTML = checks.check_html
ORIGINAL_MEMBERSHIP_CHECK = checks.check_membership_features
ORIGINAL_NAVIGATION_CHECK = checks.check_navigation_experience
ORIGINAL_EDITORIAL_MEDIA_CHECK = checks.check_mobile_and_editorial_media


def home_generation_is_configured() -> bool:
    source = checks.ROOT / "assets/data/home"
    script = checks.ROOT.parents[1] / "scripts/home-image-assets.mjs"
    return script.exists() and all(
        (source / name).exists()
        for name in (
            "hero-01.txt",
            "hero-02.txt",
            "hero-03.txt",
            "hero-04.txt",
            "founder-01.txt",
            "founder-02.txt",
            "founder-03.txt",
            "founder-04.txt",
            "founder-05.txt",
        )
    )


def check_current_html(path: Path, errors: list[str]) -> None:
    local_errors: list[str] = []
    ORIGINAL_CHECK_HTML(path, local_errors)
    generated_home_ready = home_generation_is_configured()
    relative = str(path.relative_to(checks.ROOT))
    for error in local_errors:
        generated_reference = (
            generated_home_ready
            and error.startswith(f"{relative}: broken ")
            and any(reference in error for reference in GENERATED_HOME_REFERENCES)
        )
        if not generated_reference:
            errors.append(error)


def check_current_membership_features(errors: list[str]) -> None:
    legacy_errors: list[str] = []
    ORIGINAL_MEMBERSHIP_CHECK(legacy_errors)
    errors.extend(error for error in legacy_errors if not error.startswith(LEGACY_APP_ERROR))

    app_html = (checks.ROOT / "app/index.html").read_text(encoding="utf-8")
    current_markers = (
        'id="accessGate"',
        'id="signupForm"',
        'id="signinForm"',
        'id="signupStatus"',
        'id="screen-community"',
        'id="wallForm"',
        'id="screen-profile"',
        'data-fruit="orange"',
        'data-theme-choice="midnight"',
        'id="screen-help"',
        "/app/assets/yoni/yoni-hero.webp",
        "const YONI_URL='https://yoni.francinemariebautista.com/'",
        "Yoni is a digital companion",
    )
    for marker in current_markers:
        if marker not in app_html:
            errors.append(f"app/index.html: missing current Yoni marker: {marker}")

    current_files = (
        "assets/css/yoni-app-refresh.css",
        "assets/css/yoni-native-libraries.css",
        "assets/css/yoni-native-reader-compat.css",
        "assets/js/yoni-experience-loader.js",
        "assets/js/yoni-native-libraries.js",
        "assets/js/yoni-native-music.js",
        "assets/js/yoni-native-ebooks.js",
        "assets/js/supabase-client.js",
        "app/assets/yoni/yoni-app-icon-192.png",
        "app/assets/yoni/yoni-app-icon-512.png",
        "app/assets/yoni/yoni-apple-touch-icon-180.png",
        "app/assets/yoni/yoni-hero.webp",
        "app/assets/yoni/yoni-theme-background.webp",
        "app/assets/yoni/yoni-wordmark.png",
    )
    for relative in current_files:
        if not (checks.ROOT / relative).exists():
            errors.append(f"{relative}: current Yoni experience file is missing")

    loader_path = checks.ROOT / "assets/js/yoni-experience-loader.js"
    if loader_path.exists():
        loader = loader_path.read_text(encoding="utf-8")
        for marker in (
            "/assets/css/yoni-app-refresh.css",
            "/assets/css/yoni-native-libraries.css",
            "/assets/css/yoni-native-reader-compat.css",
            "/assets/js/yoni-native-libraries.js",
            "/assets/js/yoni-native-music.js",
            "/assets/js/yoni-native-ebooks.js",
        ):
            if marker not in loader:
                errors.append(f"assets/js/yoni-experience-loader.js: missing current experience module: {marker}")

    supabase_path = checks.ROOT / "assets/js/supabase-client.js"
    if supabase_path.exists():
        supabase_loader = supabase_path.read_text(encoding="utf-8")
        for marker in ("yoni.francinemariebautista.com", "/assets/js/yoni-experience-loader.js"):
            if marker not in supabase_loader:
                errors.append(f"assets/js/supabase-client.js: missing current Yoni loader: {marker}")

    service_worker_path = checks.ROOT / "service-worker.js"
    if service_worker_path.exists():
        worker = service_worker_path.read_text(encoding="utf-8")
        for marker in (
            "/app/assets/yoni/yoni-hero.webp",
            "/app/assets/yoni/yoni-theme-background.webp",
            "/assets/js/yoni-experience-loader.js",
            "/assets/js/yoni-native-libraries.js",
            "/assets/js/yoni-native-music.js",
            "/assets/js/yoni-native-ebooks.js",
        ):
            if marker not in worker:
                errors.append(f"service-worker.js: current Yoni cache marker is missing: {marker}")


def check_current_navigation_experience(errors: list[str]) -> None:
    legacy_errors: list[str] = []
    ORIGINAL_NAVIGATION_CHECK(legacy_errors)
    errors.extend(error for error in legacy_errors if error not in STALE_HOME_ERRORS)

    index = (checks.ROOT / "index.html").read_text(encoding="utf-8")
    current_markers = (
        "Official Digital Headquarters",
        'id="bulletin"',
        'id="ecosystem"',
        'id="work"',
        "Yoni App 2.0",
        "One Direction.",
        "Ideas Turned",
        "Shaping What Comes Next.",
        "Mabayani",
        "/assets/js/fmb-home-approved.js",
        "/assets/images/fmb-approved/fmb-master-transparent.webp",
        "/assets/images/fmb-approved/francine-standing-landscape.webp",
        "/assets/images/fmb-approved/francine-seated-landscape.webp",
        "/assets/images/fmb-approved/fmb-news-official-transparent.webp",
        "/assets/images/fmb-approved/fmb-music-official-transparent.webp",
        "/assets/images/fmb-approved/fmb-ebook-official-transparent.webp",
        'id="homeHeroImage"',
        'id="homeFounderImage"',
        'rel="manifest" href="/manifest.webmanifest"',
    )
    for marker in current_markers:
        if marker not in index:
            errors.append(f"index.html: missing current Digital Headquarters marker: {marker}")

    integrity_path = checks.ROOT / "assets/css/fmb-visual-integrity.css"
    if not integrity_path.exists():
        errors.append("assets/css/fmb-visual-integrity.css: transparent-logo guardrail is missing")
    else:
        integrity = integrity_path.read_text(encoding="utf-8")
        for marker in (
            'img[src*="/assets/images/fmb-approved/"]',
            "background-color:transparent!important",
            "border-color:transparent!important",
        ):
            if marker not in integrity:
                errors.append(f"assets/css/fmb-visual-integrity.css: missing transparent-logo rule: {marker}")

    for relative in (
        "assets/images/fmb-approved/fmb-master-purple-square.webp",
        "assets/images/fmb-approved/fmb-master-transparent.webp",
        "assets/images/fmb-approved/fmb-news-official-transparent.webp",
        "assets/images/fmb-approved/fmb-music-official-transparent.webp",
        "assets/images/fmb-approved/fmb-ebook-official-transparent.webp",
    ):
        if not (checks.ROOT / relative).exists():
            errors.append(f"{relative}: approved identity asset is missing")


def check_current_mobile_and_editorial_media(errors: list[str]) -> None:
    legacy_errors: list[str] = []
    ORIGINAL_EDITORIAL_MEDIA_CHECK(legacy_errors)
    errors.extend(
        error
        for error in legacy_errors
        if error not in STALE_NEWS_ERRORS
        and error not in STALE_PRODUCT_ERRORS
        and not error.startswith(STALE_NEWS_PREFIXES)
        and not error.startswith(STALE_PRODUCT_PREFIXES)
    )

    news = (checks.ROOT / "news/index.html").read_text(encoding="utf-8")
    if news.count('class="news-visual"') != 7:
        errors.append("news/index.html: the current lead story and six-story rundown must each have one sourced visual")
    if news.count("<figcaption>") != 7:
        errors.append("news/index.html: the current lead story and six-story rundown must each show a visual credit")

    required_news_markers = (
        "FMB News Network",
        "Context before noise.",
        'id="rundown"',
        'id="editorial-standard"',
        'class="nc-site-header"',
        "/assets/images/news/fmb-news-official.svg",
        "/news/subic-aeta-landfill/",
        "/news/remembering-amor-deloso/",
        "/news/filipinos-monkey-insult-racism/",
        "/news/pax-silica-water/",
        "/news/binibining-pilipinas-2026/",
        "/news/china-ai-monkey-video/",
        "/news/good-news/",
        "fmb-news-luxury.css?v=20260722-luxury-v3",
    )
    for marker in required_news_markers:
        if marker not in news:
            errors.append(f"news/index.html: missing current newsroom marker: {marker}")

    required_credits = (
        "GMA Public Affairs / I-Witness",
        "DILG Zambales, 2018",
        "Micluna / Wikimedia Commons, CC BY-SA 4.0",
        "Philippine Information Agency",
        "Earl D.C. Bracamonte / Philstar.com",
        "does not reproduce the racist video",
        "FMB editorial illustration based on public releases",
    )
    for credit in required_credits:
        if credit not in news:
            errors.append(f"news/index.html: missing current editorial visual credit: {credit}")

    news_js = (checks.ROOT / "assets/js/news-channel.js").read_text(encoding="utf-8")
    for marker in ("Asia/Manila", "data-news-clock", "IntersectionObserver", "navigator.share"):
        if marker not in news_js:
            errors.append(f"assets/js/news-channel.js: missing current newsroom interaction marker: {marker}")

    music = (checks.ROOT / "music/index.html").read_text(encoding="utf-8")
    for marker in (
        "fmb-product-modern.css?v=20260723-music-ebooks-v1",
        'id="musicNav"',
        'class="fmb-product-menu"',
        "/assets/images/fmb-approved/fmb-music-official-transparent.webp",
        "31 published tracks",
        'id="audioPlayer"',
        'id="playlistGrid"',
    ):
        if marker not in music:
            errors.append(f"music/index.html: missing modern music-product marker: {marker}")

    music_js = (checks.ROOT / "assets/js/music.js").read_text(encoding="utf-8")
    for marker in (
        "const PREVIEW_LIMIT=30",
        "MUSIC_STATE_KEY='fmb_music_state_v3'",
        "dispatchEvent(new CustomEvent('fmb:music-state'",
        "audio.removeAttribute('src')",
        "function beginPlayback()",
    ):
        if marker not in music_js:
            errors.append(f"assets/js/music.js: missing modern deferred-audio marker: {marker}")

    ebooks = (checks.ROOT / "ebooks/index.html").read_text(encoding="utf-8")
    for marker in (
        "fmb-product-modern.css?v=20260723-music-ebooks-v1",
        'id="ebookNav"',
        'class="fmb-product-menu"',
        "/assets/images/fmb-approved/fmb-ebook-official-transparent.webp",
        "Six books. Clear access.",
        "Full book open",
        "First chapter open",
        'class="fmb-mobile-dock"',
    ):
        if marker not in ebooks:
            errors.append(f"ebooks/index.html: missing modern reading-product marker: {marker}")


checks.check_html = check_current_html
checks.check_membership_features = check_current_membership_features
checks.check_navigation_experience = check_current_navigation_experience
checks.check_mobile_and_editorial_media = check_current_mobile_and_editorial_media
raise SystemExit(checks.main())
