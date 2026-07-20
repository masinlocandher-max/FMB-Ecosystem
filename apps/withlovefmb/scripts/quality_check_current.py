#!/usr/bin/env python3
"""Run the site quality suite using the current Yoni application contract."""
from __future__ import annotations

import quality_check as checks


LEGACY_APP_ERROR = "app/index.html: missing verified app-entry marker:"
ORIGINAL_MEMBERSHIP_CHECK = checks.check_membership_features


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
        'data-yoni-asset="mascot"',
        "const YONI_URL='https://yoni.francinemariebautista.com/'",
        "Yoni is a digital companion",
    )
    for marker in current_markers:
        if marker not in app_html:
            errors.append(f"app/index.html: missing current Yoni marker: {marker}")

    experience_css_path = checks.ROOT / "assets/css/yoni-experience.css"
    experience_js_path = checks.ROOT / "assets/js/yoni-experience.js"
    loader_path = checks.ROOT / "assets/js/supabase-client.js"
    for path in (experience_css_path, experience_js_path, loader_path):
        if not path.exists():
            errors.append(f"{path.relative_to(checks.ROOT)}: Yoni experience file is missing")

    if experience_css_path.exists():
        css = experience_css_path.read_text(encoding="utf-8")
        for marker in (
            ".yoni-comfort-dock",
            ".yoni-comfort-layer",
            ".yoni-preferences-card",
            ".yoni-reading-status",
            "prefers-reduced-motion",
        ):
            if marker not in css:
                errors.append(f"assets/css/yoni-experience.css: missing emotional UI marker: {marker}")

    if experience_js_path.exists():
        script = experience_js_path.read_text(encoding="utf-8")
        for marker in (
            "yoni-language-v2",
            "yoni-sound-effects-v2",
            "Binabasa ko nang maayos",
            "reviewed response library",
            "911",
            "NCMH",
            "Yoni remains a digital companion",
        ):
            if marker not in script:
                errors.append(f"assets/js/yoni-experience.js: missing pacing, language, or safety marker: {marker}")

    if loader_path.exists():
        loader = loader_path.read_text(encoding="utf-8")
        for marker in (
            "yoni.francinemariebautista.com",
            "/assets/css/yoni-experience.css",
            "/assets/js/yoni-experience.js",
        ):
            if marker not in loader:
                errors.append(f"assets/js/supabase-client.js: missing Yoni experience loader: {marker}")


checks.check_membership_features = check_current_membership_features
raise SystemExit(checks.main())
