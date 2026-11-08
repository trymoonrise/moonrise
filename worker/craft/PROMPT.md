# Moonrise Special Prompt

Paste this whole file into any coding agent (Cursor, Claude, Codex, Copilot, and similar). The agent should read the project it is already in, keep every feature and all content, and raise the interface. Do not rebuild the product. Do not invent features.

## Goal

Make the current screen look designed: calm surfaces, clear hierarchy, real controls with padding, hover, press, focus, loading, empty, and error states. If this project is Moonrise, copy a matching pattern from Designer Tips / this repo’s `presets/` instead of inventing a new control. Everywhere else, apply the same rules in that project’s stack (HTML/CSS, React, Vue, Svelte, Tailwind, or whatever is already there).

## How to work

1. State what the screen is for and what must stay (routes, copy, data, behavior).
2. List only the weak spots: spacing, type, color, buttons, loading, hover/press, focus, empty/error/success.
3. Edit in short passes. One concern per pass. Prefer editing existing files over new files.
4. When a preset in `presets/` fits, paste it and change only colors and labels. Do not redraw the control.
5. When finished, name what changed. Leave the rest of the project alone.

If the screen is already strong, say so and suggest a few small refinements instead of a redesign.

## Spacing

- Put every margin, padding, gap, and fixed height on a 4px grid (4, 8, 12, 16, 20, 24, 32…).
- Padding inside a control is smaller than the gap around that control.
- Cards in a row share one padding. List rows share one height.
- Space inside a group is smaller than space between groups. A section label sits closer to its own items than to the section above.
- Remove odd values like 7px, 13px, or 15px unless they are required by a system font metric.

## Color and surfaces

- One neutral ramp (background, surface, fill, hairline) and one accent.
- Use the accent once or twice per screen on the thing that matters most.
- No gradient text. No purple-to-blue or rainbow gradients as decoration. No colored glows. No blurred color blobs behind content.
- Depth comes from surface steps and hairline borders (about 6–10% opacity), not from neon outlines.
- Text has three roles at most: primary, secondary, muted.

## Type

- At most five sizes. Prefer two weights (for example 400/500 or 500/650). Headings get size, not extreme weight.
- Sentence case for labels and buttons. No trailing periods on buttons.
- Quiet captions for meta. Mono only for codes, IDs, and tabular numbers.
- Replace hype words with what the thing actually does. No emoji used as icons.

## Buttons

Provide primary, secondary, ghost, and danger when the product needs them.

- One primary action per view.
- Target height about 44px. Horizontal padding about 1.2rem. Pill or soft-rect radius that matches the rest of the screen.
- Hover: slight scale (~1.03) and a soft shadow. Press: a little further (~1.05). Disabled: muted, no hover, no press.
- Keep the button’s box size stable while loading. Swap the label for a spinner, set `aria-busy="true"`, then show a short done state when it fits.
- Do not put a primary fill on every button. Secondary and ghost stay quiet.

## Loading and feedback

- Skeleton when the final shape is known.
- Progress bar when there is a real percent.
- Spinner for a short indeterminate wait.
- Full-screen boot bar only for first paint / boot — not for every fetch.
- Always design empty, error, and success. Prefer a quiet toast or inline callout over a blocking alert.
- Respect `prefers-reduced-motion`. Motion stays short (about 150–220ms) with a calm ease.

## Forms and overlays

- Fields get a visible focus ring, comfortable padding, and clear placeholder text.
- Password fields get reveal. Search fields get a clear control.
- Validation sits under the field in plain language.
- Menus, modals, and sheets close on Escape and on the backdrop. Focus stays inside while open.
- Toggles, checkboxes, radios, and segmented controls share one selected language.

## Layout

- Mobile first. Tap targets stay large. Sticky bars do not cover content.
- Align columns. Avoid orphan icons with no job. One icon set, one stroke width.
- Images reserve space so the layout does not jump.
- Prefer the product’s real content over fake marketing filler.

## Moonrise note

When the project is Moonrise Studio / trymoonrise.com:

- Prefer patterns from https://trymoonrise.com/designer-tips.html and the snippets in https://github.com/trymoonrise/moonrise-special-prompt (`presets/`).
- Keep Moonrise ink and surfaces calm (near-black primary, soft fills, hairline borders).
- Do not rename product features or change checkout, auth, or publish behavior while applying this prompt.

## Ship bar (generated sites)

When assembling a full business website (Moonrise Builder agent or similar):

- Modern, minimal, professional. Calm surfaces. One accent. No purple gradients, glows, glass blobs, or noisy motion.
- Exact business name, phone, address, and hours when provided. Never invent contact facts. Never leave placeholders.
- Complete document: doctype, viewport, nav, hero, content, contact form, footer, closed tags.
- Shared button system with hover, press, disabled, and a stable loading state. Visible field focus rings.
- Motion about 150–220ms with `prefers-reduced-motion`. No stuttering loops or broken overlays.
- Finished components only: aligned columns, reserved image space, no cut-off text, no overlapping controls, no horizontal page scroll.
- Prefer a simpler complete page over a broken fancy one. Do not ship a page that fails this bar.

## Done when

- Spacing is on the grid.
- Buttons have hover, press, disabled, and a loading path where submit exists.
- Loading, empty, and error states exist for the main data on the screen.
- Focus and keyboard dismissal work for overlays.
- You can name the few files you changed, and nothing unrelated moved.
- For full generated sites: every ship-bar item above passes.
