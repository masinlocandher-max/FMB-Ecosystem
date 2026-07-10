# With love, FMB

Official personal website and editorial home of **Francine Marie Bautista**.

- Planned domain: `www.francinemariebautista.com`
- Contact email: `Withlovefmb@gmail.com`
- Location: Masinloc, Zambales, Philippines
- Instagram: `@bb.fmb`
- Main company: [SENZ Strategic Communications](https://senzpr.com/)
- Education platform: Cognita Institute of AI

## Website architecture

### Public access

Visitors can see the complete website structure, topic descriptions, reading previews, project introductions, journal previews, ebook listings, contact information, and emergency mental-health contacts.

Emergency information must never be hidden behind membership, payment, login, or Herra access.

### Free membership

Free membership is the access gate for:

- continuing full Source of Truth readings
- opening complete journal and blog entries
- accessing free ebooks
- purchasing paid ebooks
- sending an authenticated message after email verification

The interface is implemented, but real account creation and email verification require a secure backend and email provider.

### Herra paid access

Herra is a separately paid AI companion service. A free website membership does not automatically include Herra.

Herra must never present herself as a doctor, therapist, emergency service, or substitute for professional care. Crisis screens must direct people to real emergency and crisis services before offering Herra.

Real Herra access still requires authentication, billing, subscription entitlements, model hosting, safety monitoring, logging rules, privacy controls, and cancellation/refund handling.

## Source of Truth

The searchable library includes structured previews and full source data for:

1. Women's Health
2. Transgender Health
3. Bahaghari: LGBTQIA+ identity, respect, stereotypes, allyship, and coming out at one's own pace
4. Mental Health

Full structured reading records are stored in the deployed website at:

`assets/data/source-library.json`

Health content is educational and source-led. It is not individualized diagnosis or treatment.

## Project identities

- SENZ uses its official identity and links to `https://senzpr.com/`.
- Cognita uses the official wordmark system derived from the Cognita source repository.
- Cogniya is not part of this website architecture.

## Contact and messaging

The contact interface collects:

- full name
- email address
- role or organization
- message type
- subject
- message
- consent acknowledgment

Sending is designed to require free membership and verified email first. The present static deployment does not yet create accounts, issue verification links, save messages, or send email.

## Repository structure

- `with-love-fmb-apple.zip`: original visual assets, portraits, logo files, and opening video
- `build/overlay.part-*`: base64 parts of the corrected website overlay
- `.github/workflows/pages.yml`: reconstructs the overlay and deploys the finished site
- `DOMAIN_SETUP.md`: GitHub Pages and DNS guide

The deployment workflow verifies that the homepage, Source of Truth data, and Cognita identity asset exist before publishing.

## GitHub Pages

1. Open **Settings > Pages**.
2. Choose **GitHub Actions** as the source.
3. Enter `www.francinemariebautista.com` under **Custom domain** after the domain is active.
4. Configure the DNS records in `DOMAIN_SETUP.md`.
5. Enable **Enforce HTTPS** when GitHub makes it available.

## Backend still required

Before the site can honestly provide full production membership and commerce, connect:

- authentication and member database
- transactional email verification
- secure contact-message storage and delivery
- ebook storage, ownership records, and protected delivery
- payment provider and webhook verification
- Herra subscription entitlements and AI service
- moderation, abuse prevention, rate limiting, audit logs, and deletion workflows
- final privacy, terms, refund, and cancellation policies
