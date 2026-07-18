# New Website Structure To-Do

Status: approved direction, not yet applied to the public main website.

This checklist is based on the saved `francinemariebautista-new-landing-preview.html` structure and the latest approved routing decisions. The mental-health app remains separate at `app.francinemariebautista.com`.

## Approved primary navigation

Use this order:

1. Home
2. About FMB
3. News
4. Projects
5. Reading
6. Music
7. Get Involved
8. Get Help
9. FMB&CO.

Do not place Explore or Member Access in the public primary navigation. Member tools belong inside the app. Open App does not need a permanent navigation item because the app belongs under Projects and may also appear as a contextual call to action.

## Route responsibilities

### Home

- Present the main bulletin, current highlights, and clear entrances to the platform.
- Feature Projects as applications and digital builds.
- Keep the public website distinct from the private mental-health app.

### About FMB

- Present Francine's authority, portfolio, public mission, and professional positioning.
- Keep Work with FMB connected to the existing booking calendar.

### News

- Hold announcements, verified articles, project updates, and public notes from FMB.

### Projects

- Reserve this section for applications and digital builds created, developed, or directed by FMB.
- Feature the With Love, FMB Mental Health App as a live application.
- Add Mabayani and the Sambal Language Project only with accurate status labels and defined project routes.
- Do not use Projects as a duplicate company portfolio. SENZ and Cognita belong under FMB&CO.

### Reading

- Keep the public reading library and approved access rules.

### Music

- Keep the music library and approved access rules.

### Get Involved

- Replace the public-facing Community Engagements label.
- Limit this section to community-service context, volunteer opportunities, partnerships, collaborations, and ways to support the work.
- Route application discovery to Projects instead of duplicating the project catalog here.

### Get Help

- Keep public support information, verified resources, and emergency guidance outside the private app.

### FMB&CO.

- Treat FMB&CO. as a standalone corporate landing experience.
- Include About, SENZ, and Cognita.
- Route SENZ links to the SENZ destination and Cognita links to the Cognita destination.
- Route consultation and founder calls to action to the existing With Love, FMB booking calendar.
- Keep FMB&CO., SENZ, and Cognita outside the mental-health app.

Implementation checkpoint:

- [x] Establish `/fmb&co/` as the canonical standalone corporate route.
- [x] Apply the Royal Navy Purple, champagne gold, pearl, and Apple-style system-interface treatment.
- [x] Add cleaned transparent FMB&CO., SENZ, and Cognita web exports without redrawing or recoloring the approved marks.
- [x] Use the exact approved FMB&CO. ampersand for decorative marks and a transparent reversed logo on dark corporate surfaces.
- [x] Add restrained homepage motion with reduced-motion support and an iPhone-style safe-area mobile dock.
- [x] Keep SENZ at `/fmb&co/senz/` and Cognita at `/fmb&co/cognita/`.
- [x] Route consultation and founder calls to the existing About FMB and booking-calendar destinations.

## Implementation sequence

### Phase 1: repository health

- [x] Verify the app subdomain redirect and app loading.
- [x] Repair stale static-quality expectations.
- [x] Repair the GitHub Pages bundle workflow for the current repository.
- [x] Record the approved structure before public implementation.

### Phase 2: route foundations

- [ ] Confirm the final route slugs for Projects, Get Involved, Get Help, and FMB&CO.
- [ ] Create the Projects landing page and individual project routes.
- [ ] Prepare the Get Involved landing page using only volunteer, partnership, and collaboration content.
- [ ] Confirm backward-compatible redirects before replacing old route labels.

### Phase 3: public navigation

- [ ] Replace the current public navigation only after every destination page exists.
- [ ] Remove Explore and public Member Access navigation entries.
- [ ] Place the mental-health app inside Projects and contextual calls to action.
- [ ] Update desktop navigation, mobile navigation, footer links, and the AZ guided-help routes together.

### Phase 4: content and SEO alignment

- [ ] Update homepage directory cards and featured-project content.
- [ ] Update canonical URLs, sitemap entries, structured data, page titles, and descriptions.
- [ ] Update legacy FMB&CO. links to the final canonical route.
- [ ] Preserve current reading, music, support, authentication, and app access rules unless separately approved.

### Phase 5: validation and release

- [ ] Validate internal links, redirects, assets, HTML, JSON, and JavaScript.
- [ ] Test desktop, tablet, and phone layouts.
- [ ] Test the main website separately from the app subdomain.
- [ ] Test visitor and signed-in experiences without exposing private member data.
- [ ] Review a Vercel preview before merging any public-website redesign.

## Hold point

Do not modify or deploy the public main website structure until Phase 2 routes and backward-compatible redirects are ready for review.
