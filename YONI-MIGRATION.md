# Yoni migration parking note

Date: 2026-08-20

This branch preserves Yoni before it is removed from the FMB Ecosystem and moved to its own repository.

## Source to preserve

- Primary Yoni application: `apps/withlovefmb/app/`
- Yoni-specific supporting assets under `apps/withlovefmb/assets/` should be migrated only when they are actually referenced by the Yoni application.
- The parked application should retain its core wellbeing experience, including private check-ins, journaling, supportive companion/chat, grounding and breathing tools, profile/privacy/help flows, and other Yoni-native features.

## Deliberately removed before migration

The FMB eBook and FMB Music product integrations are not part of the parked Yoni product and must not be re-imported into the new repository.

Removed from this branch:

- `apps/withlovefmb/assets/js/yoni-native-ebooks.js`
- `apps/withlovefmb/assets/js/yoni-native-music.js`
- `apps/withlovefmb/assets/js/global-music.js`
- `apps/withlovefmb/assets/css/yoni-native-libraries.css`
- `apps/withlovefmb/assets/css/yoni-native-reader-compat.css`

`apps/withlovefmb/assets/js/yoni-experience-loader.js` was also reduced so it no longer loads the eBook library, Music library, or their reader/library styles.

## Migration rule

The destination should be a separate Yoni repository. Copy the preserved Yoni application and only the supporting assets it genuinely depends on. Do not bring back FMB Music, the FMB music catalog/player, the FMB eBook library, or the six mirrored FMB publication readers.

This branch is a migration source, not the long-term production location for Yoni.
