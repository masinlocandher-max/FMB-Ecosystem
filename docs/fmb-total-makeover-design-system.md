# FMB Total Makeover Design System

Status: review branch only. Do not merge or deploy until Francine Marie Bautista approves the complete visual result.

## Design objective

The public Francine Marie Bautista website must feel like one authored digital headquarters, not a collection of independently styled microsites. Every public route keeps its existing content, working links, forms, media, metadata, and project boundaries, but shares one coherent visual language.

The visual authority comes from FMB&CO.: royal purple, luminous lavender, clean white, restrained gold, generous space, disciplined typography, and a recurring light-line supergraphic. The system should feel corporate, elegant, modern, editorial, and distinctly FMB rather than template-driven.

## Brand source

The attached FMB&CO. references establish the visual direction:

- Deep royal-violet foundation
- White and lavender illuminated surfaces
- Metallic gold used selectively for the ampersand and key accents
- Fine orbital and wave-line supergraphics
- Wide tracking for formal supporting typography
- Clear, centered logo treatment with substantial negative space

The site uses repository-contained approved logos and portraits. The reference JPEGs guide palette, light, rhythm, and visual atmosphere; they are not treated as replacement logo masters.

## Core palette

- Ink: `#100129`
- Midnight violet: `#18033F`
- Royal purple: `#3F157F`
- Signature violet: `#6F35D8`
- Electric lavender: `#A97AF0`
- Soft lavender: `#E8D8F5`
- Lavender mist: `#F3E8F8`
- Paper: `#FCF9FE`
- White: `#FFFFFF`
- Gold: `#D8A23A`
- Bright gold: `#ECAF47`
- Text ink: `#1B0B2A`
- Muted ink: `#6F637B`

Gold is not a general decoration color. It identifies priority, founder authority, and FMB&CO. ownership.

## Typography

- Display and editorial headings: `Cormorant Garamond`
- Interface, body, labels, and navigation: `Manrope`

Large headings use restrained line length, normal or slightly tight tracking, and generous line height. Formal labels may use wider tracking, but the site avoids excessive all-caps copy.

## Shared page architecture

Every public page receives the same:

1. Unified top announcement line
2. Unified FMB&CO. header and navigation
3. Consistent page canvas and first-section treatment
4. Shared section spacing and container widths
5. Shared card, list, button, image, form, and table systems
6. Unified footer and official contact channels
7. Mobile navigation behavior

No page may introduce a different header, footer, font pairing, corner system, button style, background palette, or navigation model.

## Page rhythm

The public site alternates three controlled surfaces only:

- Dark authority surface: midnight violet with white text
- Light editorial surface: paper white with ink text
- Lavender transition surface: pale lavender with royal-purple text

Sections may differ in composition to match their content, but not in visual identity. Layout variation comes from image scale, editorial columns, rails, timelines, and lists, not from unrelated themes.

## Component rules

### Header

- FMB&CO. mark at left
- Essential navigation only
- One clear primary action
- Compact mobile menu
- No competing secondary headers

### Buttons

- Primary: royal-purple fill, white text
- Founder/company priority: gold fill, midnight text
- Secondary: transparent or white surface with violet border
- Same height, radius, tracking, and focus state sitewide

### Cards and content surfaces

- 20 to 28 pixel corner radius
- Fine lavender border
- Soft, controlled violet shadow
- No nested-card clutter
- No random glass effects

### Images

- Approved portraits remain faithful and unfiltered
- Consistent framing, crop logic, radius, and background treatment
- Project and company logos retain their own identities inside neutral presentation frames

### Decorative language

- One shared orbital/wave light-line supergraphic
- Low-opacity use only
- No unrelated neon, bento, sci-fi dashboard, corporate-blue, beige-luxury, or rainbow-gradient styles

## Content and product boundaries

- Preserve all public content and working routes.
- Do not expose Yoni journals, check-ins, private records, or member tools on public pages.
- Yoni keeps its own product interface and privacy boundary.
- The Data Center remains a private operational surface.
- SENZ and Cognita keep their own brand identities and standalone domains; public FMB gateway pages present them inside the shared FMB&CO. shell.
- News and reading articles use the same editorial system without deleting citations, credits, or long-form copy.

## Repository cleanup rule

The previous release stacked multiple post-build redesign, reception, contact, strategy, performance, and content-correction scripts. The makeover replaces that chain with one public design-system transformation step plus existing technical integrity checks.

Legacy scripts and bundles removed from the active build must not be reintroduced as additional visual patches. Future design changes belong in the unified stylesheet, shared shell script, source content, or the single public-design build transformer.

## Approval and deployment boundary

- Work only on `redesign/fmb-total-makeover`.
- Open a draft pull request for review.
- Do not merge to `main`.
- Do not deploy to Vercel.
- Deployment is the final step after visual review and explicit approval.
