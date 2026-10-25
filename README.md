# PIXEL — Creative Digital Studio

PIXEL is a fictional creative digital studio landing page built with semantic
HTML5 and CSS3. It presents a small studio that brings brand strategy,
interface design, and web development together in one process.

The site is intentionally designed to work without active JavaScript. The
original JavaScript remains preserved in `script.js` as comments for reference,
but the file is not loaded by the page.

## Run it

No build step, package manager, or local server is required.

1. Open `index.html` in a modern browser.
2. If the browser blocks remote resources when opening a local file, run the
   folder with any simple static HTTP server instead.

## Project structure

```text
pixel/
├── index.html          # Page structure and inline artwork
├── style.css           # Layout, visual design, responsive rules, and motion
├── script.js           # Original JavaScript, fully preserved as comments
├── README.md           # Project documentation
└── assets/
    └── favicon.svg     # Browser tab icon
```

## Page sections

`index.html` contains:

- Skip link and accessible fixed header
- PIXEL wordmark and primary navigation
- Hero section with animated abstract artwork
- Rotating services badge
- Animated services marquee
- About section with the studio's process and values
- Services section covering:
  - Brand identity and strategy
  - UI/UX design
  - Web development
- Team section for:
  - Yasmine Trabelsi — Creative Director
  - Karim Ben Salah — UI/UX Designer
  - Lina Haddad — Web Developer
- Contact section with studio details and a front-end demo form
- Footer navigation, social placeholders, and project information

## No-JavaScript behavior

JavaScript is not loaded from `index.html`. The original progressive-enhancement
implementation is retained in `script.js` as commented code and has not been
deleted.

The page still provides the following behavior through HTML and CSS:

- All page content remains visible without scroll-reveal JavaScript.
- Anchor links provide smooth scrolling to each section.
- The mobile navigation uses a native checkbox and CSS selectors.
- The mobile menu can be opened and closed with the menu control.
- Menu controls remain keyboard-focusable.
- The contact form keeps native browser validation using `required`,
  `minlength`, and `type="email"`.
- The form is clearly identified as a front-end demo and has no server
  endpoint.
- Hover and focus states remain available for buttons, links, services, and
  portraits.
- The footer year is written directly in the HTML because no script updates it.

The inactive JavaScript originally provided scroll-based header styling,
scroll-reveal observers, active-section navigation state, demo form messaging,
and automatic footer-year updates. Those features are intentionally disabled
to keep the page HTML/CSS-only.

## Visual design and animation

`style.css` is organized into numbered sections covering:

1. Design tokens and color variables
2. Reset and base typography
3. Utilities and accessibility helpers
4. Buttons
5. Header and navigation
6. Hero artwork
7. Services marquee
8. About section
9. Services section
10. Team section
11. Contact section and form
12. Footer
13. Keyframes
14. Responsive layouts
15. Reduced-motion behavior

The visual system uses:

- Fraunces for display headings
- DM Sans for body copy
- A plum, berry, pink, mint, blue, and paper color palette
- CSS gradients, blobs, waves, underlines, marquee motion, and hover effects
- `clamp()` sizing for fluid typography and spacing
- Responsive breakpoints for tablet and mobile layouts
- `prefers-reduced-motion: reduce` support

## Team portraits

The team portraits use professional remote image references inside inline SVG
frames:

- Yasmine uses a professional female portrait.
- Karim uses a professional male portrait.
- Lina uses a professional female portrait.

Each portrait:

- Keeps a custom, smooth organic SVG background shape.
- Uses an SVG `clipPath` so the photograph follows the organic frame.
- Includes a slightly enlarged frame for a fuller visual presence.
- Uses `preserveAspectRatio="xMidYMid slice"` for consistent cropping.
- Has a subtle CSS hover zoom effect.
- Includes descriptive accessible `aria-label` text.

The photos are loaded from Unsplash URLs in `index.html`, so an internet
connection is required for the photographic portraits to appear. If remote
images are unavailable, the colored SVG background shapes remain in place.

## Accessibility

The page includes:

- Semantic HTML landmarks and headings
- A skip-to-content link
- Descriptive labels for form controls
- Native form validation
- Visible keyboard focus styles
- Accessible navigation labels
- `aria-labelledby` relationships for major sections
- Text alternatives for portrait images and decorative SVG artwork
- Reduced-motion support

## Dependencies

There are no build dependencies or JavaScript packages.

The page references these external resources:

- Google Fonts:
  - Fraunces
  - DM Sans
- Unsplash portrait images

Fallback fonts are provided if Google Fonts cannot be loaded:

- Georgia / Times New Roman for display text
- system-ui and platform sans-serif fonts for body text

## Validation

Before submitting changes, validate the markup and stylesheet with:

- HTML: <https://validator.w3.org/nu/>
- CSS: <https://jigsaw.w3.org/css-validator/>

Upload `index.html` to the HTML validator and `style.css` to the CSS
validator. Also test the page at desktop and mobile widths, with JavaScript
disabled, and with reduced motion enabled in the browser or operating system.
