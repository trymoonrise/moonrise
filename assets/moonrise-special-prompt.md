# Moonrise Special Prompt

Paste this whole prompt into any coding agent. It redesigns the website or application in the project you have open.

This is not a persona and not a Moonrise agent. Do not introduce yourself as Moonrise. Do not build a Moonrise clone. Read the project, keep what it does, and raise the interface until it looks professionally designed.

Live controls to copy from: https://trymoonrise.com/ui-library
Raw HTML and CSS for every type: https://github.com/trymoonrise/moonrise-special-prompt (`ui/`)
The calm finish to aim for, without copying the page: https://trymoonrise.com

## Credit

Interface rules here follow [unslop](https://github.com/heydamir/unslop) by [Damir Sokolovsky](https://x.com/heydamir) ([heydamir.design/unslop](https://heydamir.design/unslop)), licensed [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Keep that credit if you copy the rules. Use unslop as the bar for a professional screen that does not look generated.

## What to do

Restyle the existing website or app. Unslop it. Give it real padding, consistent spacing, rounded controls, quiet color, and short smooth motion. Make the whole product look finished.

Keep every route, feature, and true fact: names, prices, phone numbers, addresses, hours, testimonials, and legal text that are already real. Do not invent reviews, clients, prices, stats, or contact details. If a fact is missing, leave it out.

Do not copy the Moonrise landing page. Do not reuse its sentences, its section order, its hero, or its product name. Borrow only the finish: lots of air, ink type, hairline rules, one clear action, and controls that match the UI Library.

If the screen is already strong, change only what is still sloppy. Say what you left alone.

## How to work

1. Read the project. Name what the screen is for and what must stay.
2. List the slop: purple gradients, glows, glass cards, emoji icons, shouty copy, uneven padding, mixed radii, five button styles, pulsing chrome, template hero stacks, missing empty and error states.
3. Pick one direction from Design directions and use it on every screen.
4. For each control, open the closest UI Library type and follow its spacing, radius, and states. Change labels and colors. Do not redraw the control.
5. Edit in passes: spacing, then color, then type, then buttons, then layout, then copy, then motion. Prefer editing existing files.
6. Check the finish bar at the end. Fix anything unfinished before you stop.

## Design directions

Pick one direction and keep it. Do not mix two looks on one product.

- **Paper.** Warm off-white page, ink type, hairline sections, one strong photo or product view, pill or soft-rounded button, quiet footer.
- **Night.** Near-black page, off-white type, one light band for the form or the main action, white pill.
- **Split.** Words on one side, the real product or place on the other. On a small screen the visual stacks under the headline.
- **Type-first.** A large headline on a plain ground, one wide visual under the action, then a simple list.
- **Editorial.** Serif headlines, plain body, left aligned, one image per section, thin rules, almost no cards.
- **Gallery.** The work leads. A large image grid, short captions, a quiet nav, contact at the end.
- **Product.** An app shell: sidebar or top bar, one canvas, calm tables and forms. The Moonrise landing page is not the layout. The same padding, type, and button rules still apply.

One accent. One type pairing. One button system.

## The finish

Match the calm of the Moonrise public site, then make it this product's own.

- Background is a soft gray or warm paper (`#f5f5f7` or `#f3f1ee`), or a near-black night ground. Not a rainbow mesh.
- Ink is near-black (`#1d1d1f`). Muted text is a gray (`#6e6e73`). Hairlines are about 8% black, or the night equivalent.
- Headlines can use a quiet serif. Body stays a plain system or grotesk face. At most two families.
- Sections breathe. A marketing section uses `clamp(4rem, 8vw, 7rem)` of vertical padding. An app view uses 24 to 32px around the canvas.
- Page gutter is `clamp(1.25rem, 4vw, 2rem)`. Content width stays readable. Long text stays near 36rem.
- One primary action is obvious. Everything else is quiet.

## Unslop

Remove these wherever they are decoration:

- Purple, indigo, neon, gold, and rainbow gradients on chrome
- Glow, glassmorphism, 3D tilt, liquid blobs, orbs, and stock "AI brain" art
- Emoji used as icons, badges, or bullets
- "Welcome to", "Your trusted", "Supercharge", "Seamless", "Unlock", "Revolutionize", "Next-gen", and "AI-powered" on everything
- Exclamation marks in labels and buttons
- Uppercase tracked labels
- A different color theme in every section
- Icon-card walls, stat chips, and floating badges with nothing to say
- `animate-pulse`, ping, and breathing glows on things that are not live
- Fake reviews, fake logos, and fake numbers

Put richness in one or two real moments: a photograph, the product, a map, or a piece of the actual work. Chrome stays calm.

## Spacing and padding

Use a 4px grid: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96.

- Padding inside a control is smaller than the gap around it.
- Space inside a group is smaller than space between groups.
- A label sits closer to its field than to the group above.
- Cards in one row share one padding. List rows share one height.
- Do not use 7px, 13px, or 15px.
- Do not leave a huge empty band above a cramped block.
- Text must not touch the edge of a card, a button, a field, or the viewport.
- Minimum card padding is 20px. Prefer 24px. Hero and section intro blocks can use 32px.
- Stacked form fields have 12 to 16px between them. A form group and the next group have 24 to 32px.
- Nav items have at least 8px between them and 12px of vertical padding.
- Sticky bars do not cover the first line of content. Add scroll padding.

## Radius

Round controls. Do not mix a 2px button, a 16px button, and a pill on the same screen.

- Buttons and fields: 12px, or a full pill (`999px`) when that is the one button system you chose.
- Cards and panels: 16 to 20px.
- Nested radius: inner radius = outer radius minus the padding, and never below 4px.
- Avatars and status dots can be circles. Everything else follows the system above.
- Images inside cards use the same radius as the card, or the nested radius if they sit inside padding.

## Type

- At most five sizes. Body is 16px. Small meta is 13 or 14px. Section titles step up clearly from body.
- Two weights are enough: 400 or 500 for body, 600 for titles and buttons. Do not set every heading to 800.
- Sentence case. No wide-tracked uppercase labels.
- Line length for paragraphs stays near 36rem. Line height for body is about 1.5. Headlines are tighter, about 1.05 to 1.15.
- Letter spacing on body can be slightly tight (`-0.015em`). Small text does not go negative. Do not italicize for emphasis.
- Numbers that are data use tabular figures.

## Color

- One neutral ramp: background, surface (`#fafafa` or white), ink, muted, hairline.
- One accent, used once or twice per view on the thing that matters: the primary button, the current nav item, or a single figure.
- No gradient text. No colored glow. No neon border. Depth comes from a surface step and a hairline, not a stack of shadows.
- Text has three roles: primary, secondary, muted.
- Text on a filled button and the accent on a light surface need about 4.5:1 contrast.
- Success and error colors appear only when they mean success or error, and they stay quiet.

## Buttons

Every product gets one button system.

- Primary, secondary, and ghost. Add danger only where something is destroyed.
- One primary button per view. A hero has one primary and at most one secondary.
- Height is at least 44px. Horizontal padding is about 1.15 to 1.35rem. The label does not touch the radius.
- Hover changes the surface slightly or darkens the fill. Press scales to about 0.98. Disabled is muted, with no hover and no press.
- A loading button keeps its box size, sets `aria-busy="true"`, and swaps the label for a small spinner.
- Do not fill every button with the primary color. Links in prose are underlined or clearly colored, not fake buttons.
- Focus is a 2px ink outline with 2px offset. Never remove focus styles.

## Forms, menus, and feedback

- Fields have 12 to 14px of padding, the shared radius, a hairline, and a visible focus ring.
- Placeholders are examples, not labels. The label stays visible.
- Errors sit under the field in plain language.
- Password fields can reveal. Search fields can clear.
- Menus, dialogs, and sheets close on Escape and on the backdrop. Focus stays inside while they are open. They fade and rise about 8px in 200ms.
- Toggles, checkboxes, radios, and tabs share one selected look: ink or a surface step, not a glowing gradient.
- Loading: a skeleton when the shape is known, a short spinner when it is not, a progress bar only when there is a real percent.
- Empty, error, and success states exist for the main data. Prefer a quiet inline note or toast over a blocking alert.
- Toasts sit in a corner with padding, the shared radius, and a short enter and leave. They do not cover the primary action.

## Layout

- Mobile first. Tap targets stay at least 44px. No horizontal page scroll.
- Align columns. Do not leave an icon with no job.
- Images and video reserve their space (`aspect-ratio` or a set height) so the page does not jump.
- A marketing first screen is one composition: a name or eyebrow, one headline, one short line, one action group, one real visual. Not a centered stack of a badge, three buttons, avatar coins, and floating blobs.
- Long headlines align with the layout, usually left.
- An app keeps one canvas. Sidebars and top bars use the same padding and type. Tables have row padding, a sticky header only when it helps, and a quiet empty state.
- Cards are for a repeated item or a form, not for every paragraph.

## Motion

Motion is short, smooth, and easy to miss. It never blocks the task.

- Duration is 160 to 280ms. Ease is `cubic-bezier(0.22, 1, 0.36, 1)`.
- Enter with opacity and a rise of about 8px. Do not bounce.
- Hover and press use transform and opacity, or a background change. Do not animate width, height, top, or left.
- Menus, sheets, and dialogs fade and slide a few pixels. Page changes do not flash.
- One marquee or dock motion is enough if the UI Library type you chose has it. Do not add looping motion to headlines, cards, and icons.
- Honor `prefers-reduced-motion`: cut the travel and keep the opacity change, or turn the motion off.

## What a website should have

Add a piece only when the product needs it, and only with real content. Use a UI Library type for each one.

- A skip link and a simple nav: name, a few links, one action. On a small screen, a menu that opens and closes cleanly.
- A first view that says what this is, who it is for, and what to do next.
- The real offer: services, features, work, or the product. Not a wall of identical icon cards.
- Proof only when it exists: a short quote, a logo row, or numbers the project already has.
- Pricing only when prices are real.
- A short FAQ only when the questions are real.
- A way to continue: a form, a sign-in, or a contact line with the real details.
- A footer with the real links. No fake columns.
- Focus states, a responsive layout, and reduced-motion support.
- Empty, loading, and error states on anything that loads data.

## What an application should have

- A clear home for the main task, not a marketing hero pasted on top of the tool.
- Navigation that shows where you are.
- The same button, field, and radius system as the rest of the product.
- Padding inside every panel, table cell, and dialog. Content does not touch the frame.
- Loading, empty, and error states for each main list.
- Destructive actions are quiet until confirmed.
- Settings, account, and sign-out stay easy to find when those features exist.

## UI Library

The controls live at https://trymoonrise.com/ui-library. Raw files live at https://github.com/trymoonrise/moonrise-special-prompt under `ui/`. Shared CSS is `ui/css/ui-library.css` and `ui/css/ui-library-lab.css`.

Before you style a control, open the closest type and follow it.

Sections: announcements, borders, calls to action, clients, comparisons, docks, FAQs, features, footers, galleries, heroes, images, maps, navigation menus, pricing, stats, steppers, team, testimonials, text, timelines, videos.

Components: accordions, alerts, avatars, badges, buttons, cards, checkboxes, dialogs, dropdowns, empty states, forms, inputs, lists, menus, notifications, progress, radio groups, search, selects, sidebars, sign in, sign up, tables, tabs, text areas, toasts, toggles, tooltips.

Screens: authentication, onboarding, navigation systems, data tables, and the other full screens in the library.

Rules for using a type:

- Keep its structure, spacing, radius, and states: rest, hover, press, focus, disabled, loading, empty, error.
- Change the words and, if needed, the accent so they belong to this product.
- Do not paste a second button style next to it.
- Do not copy Moonrise marketing copy into the control.
- Skip shaders, globes, and decorative cursor effects unless the product already needs that kind of moment.

## Copy

- Headlines say what this product does, in plain words. They should not fit another brand if you only swap the name.
- Button labels are short: "Start", "Save", "Send". Not "Click here to get started today".
- No trailing periods on buttons and labels.
- A number needs a reference if you keep it. If you cannot verify it, remove it.
- Badges such as New, Pro, or Beta appear only when they are true, as quiet text.

## Done when

- Slop listed in the audit is gone, or you named why a piece stayed.
- Spacing is on the 4px grid. Padding is visible inside every card, button, field, and section.
- One radius system. One button system, with hover, press, focus, disabled, and a loading path where something submits.
- Type is calm. Color is one ramp plus one accent.
- Motion is short, smooth, and reduced when the person asks for less motion.
- The first screen looks specific to this product and does not look like the Moonrise landing page.
- Real facts are unchanged. Nothing fake was added.
- Empty, error, and loading states exist for the main data.
- Overlays close on Escape and return focus.
- The layout works on a phone and does not scroll sideways.
- You can name the files you changed.

---

Adapted with credit to [unslop](https://github.com/heydamir/unslop) by Damir Sokolovsky, CC BY 4.0.
