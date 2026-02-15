# Style Guide

## Core Color Tokens
Source: `index.html` (`:root`)

- `--form-bg`: `#00000045` (black with alpha)
- `--form-border`: `#CBD5E1`
- `--form-text`: `#0F172A`
- `--form-placeholder`: `#1F2937`
- `--form-focus`: `rgba(59, 130, 246, 0.45)` (`#3B82F673`)

- `--button-bg`: `#1F2937`
- `--button-bg-hover`: `#374151`
- `--button-text`: `#E5E7EB`
- `--button-border`: `#475569`

## Primary Action Buttons
Source: `index.html` (`.btn-primary`, `button.text-purple`)

- Default gradient: `#1D4ED8` -> `#2563EB`
- Hover gradient: `#1E40AF` -> `#1D4ED8`
- Border: `#1D4ED8`
- Text: `#FFFFFF`
- Shadow: `rgba(37, 99, 235, 0.22)` (`#2563EB38`)

## Secondary / Accent Button Colors
Source: `index.html`

- Secondary border (indigo outline): `#C7D2FE`
- Secondary border hover: `#818CF8`
- Generic button hover border: `#64748B`

## Surface / Text Defaults
Source: `index.html`

- App text default: `#0F172A`
- App background default: `#FFFFFF`
- Body background: `#1F2937`
- Body text: `#E5E7EB`

## Misc UI Colors
Source: `index.html`

- Avatar border: `#CCCCCC`
- Role pill text: `#E2E8F0`
- Role pill background: `rgba(30, 41, 59, 0.5)` (`#1E293B80`)

## Notes
- If you change palette values, update both:
  - `index.html` CSS variables
  - Any hardcoded class-level colors in `index.html` (primary/secondary button rules)
