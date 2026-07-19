# Materials Consistency Standard

This project uses the existing working implementation as the default standard whenever new materials are added.

## Core rule

New materials must follow the same storage, naming, metadata, access, interface, and testing pattern as equivalent materials already working in production. A different method may be used only when there is a documented technical reason and the change is reviewed before deployment.

## Music and audio

1. Google Drive is an intake and source location, not the production playback source.
2. Download the original audio file without conversion or recompression.
3. Store production MP3 files under `assets/audio/<collection>/`.
4. Use lowercase, zero-padded, kebab-case filenames.
5. Reference the local `assets/audio/...` path in `assets/data/music-library.json`.
6. Remove temporary Drive IDs and Drive download URLs after migration.
7. Confirm the direct asset returns an audio MIME type and supports browser playback.
8. Test play, pause, track switching, persistent mini-player behavior, mobile placement, and service-worker caching before deployment.
9. Do not mark an audio collection complete until playback has been verified on the deployed site.

## General materials

For images, documents, videos, and other additions, preserve the established folder structure, naming conventions, metadata format, responsive behavior, access rules, and visual treatment. New material should look and behave as part of one system, not as a separate experiment.
