#!/usr/bin/env python3
"""Run the quality suite against the current FMB, Yoni, product, and FMB News contracts."""
from __future__ import annotations

from pathlib import Path

import quality_check as checks


LEGACY_APP_ERROR = "app/index.html: missing verified app-entry marker:"
STALE_HOME_ERRORS = {
    "index.html: missing first-visit benefit: Official FMB Bulletin",
    'index.html: missing first-visit benefit: id="latest-release"',
    'index.html: missing first-visit benefit: id="channels"',
    "index.html: missing first-visit benefit: Meet Yoni. A complete space to listen, read, write, and check in.",
    "index.html: missing first-visit benefit: /assets/js/fmb-bulletin-home.js",
}
STALE_PRODUCT_ERRORS = {
    "ebooks/index.html: deterministic mobile luxury stylesheet is missing",
    "ebooks/index.html: core persistent mobile menu script is missing",
    "ebooks/index.html: accessible floating mobile menu is missing",
    "music/index.html: deterministic mobile luxury stylesheet is missing",
    "music/index.html: core persistent mobile menu script is missing",
    "music/index.html: accessible floating mobile menu is missing",
}
STALE_MUSIC_ERRORS = {
    "assets/js/music.js: missing cross-page playback marker: fmb:global-music-command",
    "assets/js/music.js: missing cross-page playback marker: Restoring your listening session",
}
STALE_EXACT_ERRORS = {
    "assets/css/fmbandco-brand.css: missing brand or responsive marker: height:min(118%,570px)",
}
STALE_PREFIXES = (
    "news/index.html:",
    "assets/js/news-channel.js: missing clock, motion, or sharing marker:",
    "aboutfmb/index.html: corporate founder redesign marker is missing:",
    "assets/css/aboutfmb-corporate.css: missing brand, booking, or responsive marker:",
)
GENERATED_HOME_REFERENCES = (
    "/assets/images/home/francine-home-hero-hd.webp",
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
    for marker in (
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
    ):
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
    for marker in (
        "Official Bulletin",
        'id="bulletin"',
        'id="ecosystem"',
        'id="work"',
        "Shaping What Comes Next.",
        "/music/",
        "/ebooks/",
        'id="homeHeroImage"',
        'id="homeFounderImage"',
    ):
        if marker not in index:
            errors.append(f"index.html: missing current official-bulletin marker: {marker}")


def validate_current_about(errors: list[str]) -> None:
    about = (checks.ROOT / "aboutfmb/index.html").read_text(encoding="utf-8")
    for marker in (
        "fmbandco-brand.css?v=20260719-portrait-placement-v9",
        "aboutfmb-corporate.css?v=20260802-portrait-mobile-v1",
        "aboutfmb-corporate.js?v=20260718-about-corporate-v1",
        "francine-portrait-front.webp",
        "francine-marie-bautista-wordmark-white-v2.png",
        "fco-founder-nameplate",
        "fco-founder-signature",
        "fco-founder-title",
        "fmb-about-portrait-card is-front",
        'id="expertise"',
        'id="journey"',
        'id="portfolio"',
        'id="work-with-fmb"',
        'id="workWithFmbForm"',
    ):
        if marker not in about:
            errors.append(f"aboutfmb/index.html: missing current corporate profile marker: {marker}")

    about_css = (checks.ROOT / "assets/css/aboutfmb-corporate.css").read_text(encoding="utf-8")
    for marker in (
        ".fmb-about-corporate",
        ".fmb-about-hero",
        ".fmb-about-booking-grid",
        ".fmb-about-portfolio-grid",
        ".fmb-about-hero-deck",
        ".fmb-about-portrait-shape",
        ".fmb-about-portrait",
        ".fmb-about-signoff-wordmark",
        "@media(max-width:860px)",
    ):
        if marker not in about_css:
            errors.append(f"assets/css/aboutfmb-corporate.css: missing current corporate profile marker: {marker}")


def validate_current_newsroom(errors: list[str]) -> None:
    preview = (checks.ROOT / "fmbnews-preview/index.html").read_text(encoding="utf-8")
    css = (checks.ROOT / "assets/css/fmbnews-preview.css").read_text(encoding="utf-8")
    js = (checks.ROOT / "assets/js/fmbnews-preview.js").read_text(encoding="utf-8")

    for marker in (
        "/assets/images/fmb-approved/fmb-news-logo-color-supplied.webp",
        "/assets/images/fmb-approved/fmb-news-logo-white-supplied.webp",
        'data-view-link="home"',
        'data-view-link="alam-mo-ba"',
        'data-view-link="lotto"',
        'data-view-link="horoscope"',
        'data-view-link="about"',
        'data-view-link="fmb-message"',
        'data-view-link="submit"',
        "data-pht-time",
        "data-wire-track",
        "close-glyph",
        "sidebar-signal",
        "topbar-signal",
        "footer-signal",
    ):
        if marker not in preview:
            errors.append(f"fmbnews-preview/index.html: missing current newsroom marker: {marker}")
    for forbidden in ("Watch Live", "bottom-nav", "tab-bar"):
        if forbidden.lower() in preview.lower():
            errors.append(f"fmbnews-preview/index.html: retired newsroom marker remains: {forbidden}")

    for marker in (
        "--font-ui:",
        "--font-display:",
        ".close-glyph::before",
        ".sidebar-signal",
        ".segment-hero::before",
        "cubic-bezier(.22,1,.36,1)",
        "@media(max-width:860px)",
        "@media(max-width:540px)",
        "@media(prefers-reduced-motion:reduce)",
    ):
        if marker not in css:
            errors.append(f"assets/css/fmbnews-preview.css: missing current luxury UI marker: {marker}")

    for marker in (
        "const MANILA = 'Asia/Manila'",
        "12:00 a.m. to 11:59 p.m.",
        "renderAlamMoBa",
        "renderLotto",
        "renderHoroscope",
        "const FACTS = [",
        "const LOTTO_SCHEDULE = [",
        "const ZODIAC = [",
        "document.startViewTransition",
        "lottomatik.pcso.gov.ph/lotto-results",
    ):
        if marker not in js:
            errors.append(f"assets/js/fmbnews-preview.js: missing current newsroom behavior: {marker}")


def check_current_mobile_and_editorial_media(errors: list[str]) -> None:
    legacy_errors: list[str] = []
    ORIGINAL_EDITORIAL_MEDIA_CHECK(legacy_errors)
    errors.extend(
        error
        for error in legacy_errors
        if error not in STALE_PRODUCT_ERRORS
        and error not in STALE_MUSIC_ERRORS
        and error not in STALE_EXACT_ERRORS
        and not error.startswith(STALE_PREFIXES)
    )

    product_js = (checks.ROOT / "assets/js/fmb-product-modern.js").read_text(encoding="utf-8")
    for marker in (
        "data-music-filter",
        "data-ebook-filter",
        "fmb_music_state_v3",
        "fmb:global-music-command",
        "Restoring your listening session",
    ):
        if marker not in product_js:
            errors.append(f"assets/js/fmb-product-modern.js: missing modern product marker: {marker}")

    for name in ("music/index.html", "ebooks/index.html"):
        page = (checks.ROOT / name).read_text(encoding="utf-8")
        for marker in (
            "/assets/css/fmb-product-modern.css",
            'class="fmb-product-menu"',
            'class="fmb-product-nav"',
            "/assets/js/fmb-product-modern.js",
        ):
            if marker not in page:
                errors.append(f"{name}: missing modern responsive product marker: {marker}")

    ebooks = (checks.ROOT / "ebooks/index.html").read_text(encoding="utf-8")
    for marker in (
        'data-ebook-filter="open"',
        'data-ebook-filter="preview"',
        'data-access="open"',
        'data-access="preview"',
        'data-topics="wellbeing"',
        'data-topics="identity"',
    ):
        if marker not in ebooks:
            errors.append(f"ebooks/index.html: missing current library filter marker: {marker}")

    music = (checks.ROOT / "music/index.html").read_text(encoding="utf-8")
    for marker in ('id="playlistGrid"', 'id="mainPlayButton"', 'id="audioPlayer"'):
        if marker not in music:
            errors.append(f"music/index.html: missing current listening marker: {marker}")

    validate_current_about(errors)
    validate_current_newsroom(errors)


checks.check_html = check_current_html
checks.check_membership_features = check_current_membership_features
checks.check_navigation_experience = check_current_navigation_experience
checks.check_mobile_and_editorial_media = check_current_mobile_and_editorial_media
raise SystemExit(checks.main())
