# FMB News separation boundary

FMB News is not part of this repository.

Canonical repository: `masinlocandher-max/FMBNews`

This repository must not contain or deploy any FMB News application code, editorial content, newsroom build output, `/news*` routing, legacy `/fmbnews*` routing, News-specific workflows, or News-specific validation scripts.

The parent FMB website may link users to FMB News as a normal external/site navigation concern, but it must not build, proxy, rewrite, publish, or own the newsroom application.

The ecosystem CI and build pipeline enforce this boundary. Any future change that reintroduces an FMB News surface here should fail validation.
