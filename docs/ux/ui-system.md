# UI System (MUI)

This doc defines the UI system for the React + MUI frontend.

## Theme tokens (source of truth)

Color tokens
- `primary.main`: #1677C8
- `primary.dark`: #0A2A43
- `primary.light`: #52B9FF
- `secondary.main`: #0E1116
- `background.default`: #FFFFFF
- `background.paper`: #F4F8FB
- `divider`: #C5D6E5
- `text.primary`: #0A2A43
- `text.secondary`: #6B7B8C
- `info.main`: #3B82F6
- `success.main`: #12B981
- `warning.main`: #F59E0B
- `error.main`: #EF4444

Typography tokens
- `fontFamily`: "Space Grotesk", "Inter", "Segoe UI", Arial, sans-serif
- `h1`: 36 / 44 / 700
- `h2`: 28 / 36 / 600
- `h3`: 22 / 30 / 600
- `h4`: 20 / 28 / 600
- `body1`: 16 / 24 / 400
- `body2`: 14 / 20 / 400
- `button`: 14 / 16 / 600, letterSpacing 0.02em

Spacing
- Base unit: 8
- Page padding: 24 (mobile), 48 (desktop)
- Card padding: 24
- Section spacing: 72

Radii
- `xs`: 6
- `sm`: 10
- `md`: 14
- `lg`: 20

Shadows
- `soft`: 0 6px 24px rgba(10, 42, 67, 0.12)
- `glow`: 0 0 28px rgba(82, 185, 255, 0.35)

## Components

Buttons
- Primary: `contained` with Signal Blue and subtle glow on hover.
- Secondary: `outlined` with Signal Blue text, Mist border.
- Tertiary: `text` with underline on hover.

Cards
- Use `background.paper` with 1px Mist border.
- Add `soft` shadow on hover.

Inputs
- Default background: #FFFFFF
- Focus ring: Electric Blue with 2px outline

Links
- Use Signal Blue for inline links; add subtle underline on hover.

Chips
- Status chips use status colors with 15% opacity background.

## Layout

Grid
- 12-column layout
- Max content width: 1200px

Hero
- Gradient background + soft glass card overlay

## Motion
- Page reveal: 180ms ease-out with 20px upward offset
- Hover: 120ms ease-out
- Use staggered reveals for product cards

## Accessibility
- Ensure contrast ratio >= 4.5:1 for text
- Use focus-visible styles on all interactive elements