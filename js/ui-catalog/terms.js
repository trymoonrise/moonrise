(function () {
  "use strict";
  const LX = window.LX;

  function term(cat, id, title, text) {
    return LX.card(cat + "-" + id, title, '<p class="dt-dict">' + text + "</p>", { stage: "dt-dict-stage" });
  }

  LX.spec("motion-terms", [], [
    term("motion", "ease-out", "Ease-out", "An entrance starts quickly and settles. Use it when something appears."),
    term("motion", "ease-in-out", "Ease-in-out", "Use this when an object moves from one place to another. The start and the end are both soft."),
    term("motion", "dropdown-time", "Dropdown timing", "A menu or popover opens in 150 to 250 milliseconds. Longer than that feels late."),
    term("motion", "press-scale", "Press scale", "A press scales the control to 0.97, then lets it return. It should not shrink further."),
    term("motion", "knob-stretch", "Knob stretch", "A slider knob can stretch about 12% along its travel while it moves, then settle back."),
    term("motion", "stagger", "Stagger", "Rows in a list follow one another by about 30 milliseconds, so the details settle in order."),
    term("motion", "arc", "Arc", "An object that changes place can travel on a slight curve. A straight jump feels mechanical."),
    term("motion", "success-pulse", "Success pulse", "Pulse once to confirm a finished action, then stop. Do not leave it breathing."),
    term("motion", "popover-scale", "Popover scale", "A popover starts near 95% of its size and grows into place from the trigger."),
    term("motion", "enter-trigger", "Enter from the trigger", "The panel comes from the button that opened it, not from the center of the screen."),
    term("motion", "exit-trigger", "Exit to the trigger", "The panel leaves back toward that same button."),
    term("motion", "no-bounce", "No bounce", "Everyday controls do not bounce. A bounce is for a toy, not a form."),
    term("motion", "hold-still", "Hold still", "Do not keep animating a control while the finger or pointer is holding it."),
    term("motion", "shorter-exit", "Shorter exit", "The way out is about 20% shorter than the way in."),
    term("motion", "overlap", "Overlap states", "Show the next state before the old one has fully gone, so the screen does not flash blank."),
    term("motion", "mask", "Reveal mask", "Use a mask to uncover a new color or image. A hard cut feels unfinished."),
    term("motion", "icon-crossfade", "Icon crossfade", "When an icon changes, fade the old one out as the new one fades in."),
    term("motion", "rubber-band", "Rubber band", "Stretch past the end of a real scroll or drag, then spring back. Do not do this on ordinary buttons."),
    term("motion", "shared-element", "Shared element", "When the same object moves to a new place, keep that one element. Do not destroy it and draw a new one."),
    term("motion", "origin", "Origin-aware", "The motion starts from the point the person touched, not from a random corner."),
    term("motion", "interruptible", "Interruptible", "A new gesture can take over before the last animation has finished.")
  ]);

  LX.spec("type-terms", [], [
    term("type", "kerning", "Kerning", "The space between one pair of letters. Tighten a pair that looks loose, such as A and V."),
    term("type", "tracking", "Tracking", "The space across a whole line. Body type can be slightly tight. Small text should not go tighter."),
    term("type", "leading", "Leading", "The space between lines. Body copy needs more air than a headline."),
    term("type", "x-height", "x-height", "The height of the lowercase letters. Two faces pair more easily when their x-heights are close."),
    term("type", "tabular", "Tabular numbers", "Digits that share one width, so prices, times, and counts line up in a column."),
    term("type", "widow", "Widow", "A single word left alone on the last line. Balance a headline so that word stays with the rest."),
    term("type", "orphan", "Orphan", "A single word pushed to the start of the next column. Keep it with the line before it."),
    term("type", "line-length", "Line length", "A paragraph stays near 36rem. Longer lines are hard to follow back to the left."),
    term("type", "optical-center", "Optical centre", "A mark looks centered when it sits a little above the measured middle."),
    term("type", "italic", "Italic", "Use italics for a real title or a citation. Do not slant one word in a headline for style."),
    term("type", "mono", "Mono", "A monospace face is for code or raw data. Labels and sentences stay in the text face."),
    term("type", "hierarchy", "Hierarchy", "Use a few sizes. The title is clearly larger than the body, and the body is clearly larger than the note."),
    term("type", "baseline", "Baseline", "The line the letters sit on. When type sits beside an icon, share that line.")
  ]);

  LX.spec("layout-terms", [], [
    term("layout", "spacing", "Spacing", "Space inside a group is smaller than the space between groups. A label sits closer to its field than to the block above."),
    term("layout", "alignment", "Alignment", "Line things up. If a strict grid leaves a hole, move the piece by eye until it looks even."),
    term("layout", "touch-target", "Touch target", "A control is at least 44px tall so a finger can hit it without hitting its neighbor."),
    term("layout", "safe-area", "Safe area", "Keep type and buttons inside the inset of a phone notch and the home bar."),
    term("layout", "layout-shift", "Layout shift", "Reserve the size of a picture before it arrives, so the page does not jump."),
    term("layout", "aspect-ratio", "Aspect ratio", "Give an image a frame, such as 4:3 or 16:9, so the layout is stable."),
    term("layout", "nested-radius", "Nested radius", "The corner inside a card is the outer corner minus the padding. It should not be sharper than the outside."),
    term("layout", "contrast", "Contrast", "Text needs a clear difference from its background. Aim for about 4.5 to 1 for body copy."),
    term("layout", "accent", "Accent", "One color, used on the action that matters. The rest of the page stays in the neutral ramp."),
    term("layout", "hairline", "Hairline", "A 1px line at low opacity. It separates two areas without becoming a heavy frame."),
    term("layout", "surface", "Surface", "A step lighter or darker than the page, used for a card or a field. Depth comes from that step, not a stack of shadows."),
    term("layout", "grid", "Grid", "Columns that collapse. One on a phone, two when there is room, three only on a wide screen.")
  ]);

  LX.spec("interaction-terms", [], [
    term("interaction", "affordance", "Affordance", "The control looks like what it does. A button looks pressable. A field looks like it can be typed in."),
    term("interaction", "combobox", "Combobox", "A field that filters a list and lets the person choose one item."),
    term("interaction", "disclosure", "Progressive disclosure", "Keep the secondary detail closed until someone asks for it."),
    term("interaction", "optimistic", "Optimistic update", "Show the result right away, and undo it if the request fails."),
    term("interaction", "loading", "Loading state", "Use a skeleton when you know the shape. Use a short spinner when you do not. Keep the button the same size while it waits."),
    term("interaction", "focus", "Focus ring", "A visible outline on the control that has the keyboard. Never remove it."),
    term("interaction", "reduced-motion", "Reduced motion", "When a person asks for less motion, drop the travel and keep a fade, or turn the motion off."),
    term("interaction", "empty", "Empty state", "A quiet note when a list has nothing in it yet, with one way to add the first item."),
    term("interaction", "feedback", "Useful feedback", "Animate the result of an action, such as a saved note or a single check. Do not decorate idle chrome."),
    term("interaction", "cta", "Call to action", "One obvious next step on the screen. The other actions stay quiet."),
    term("interaction", "redundant-label", "Redundant label", "A label that repeats the heading or the button. Drop it."),
    term("interaction", "filler-badge", "Filler badge", "A New, Pro, or Beta chip that is not true. Leave it out.")
  ]);

  LX.spec("looks-terms", [], [
    term("looks", "dithering", "Dithering", "A grain of dots laid over a photo. It dates the page. Use the photograph as it is."),
    term("looks", "ascii-video", "ASCII over video", "Letters standing in for a picture. They hide the real work."),
    term("looks", "infinite-canvas", "Infinite canvas", "A page that pans in every direction. A site should scroll one way."),
    term("looks", "disco-logo", "Disco logo", "A mark that cycles through colors. The name should stay still."),
    term("looks", "renaissance", "Renaissance branding", "Cherubs, marble, and gold frames used as a costume. They do not explain the product."),
    term("looks", "monet", "Monet background", "A painted wash behind the type. A flat paper color is enough."),
    term("looks", "gradient-hero", "Dark gradient hero", "A glow that fades across the first screen. Use one photo or one solid band."),
    term("looks", "pixel-loader", "Pixel loader", "A blocky spinner. Use a quiet spinner or a skeleton."),
    term("looks", "instrument-serif", "Display serif as costume", "A fashionable serif used because it is current, not because the words need it."),
    term("looks", "one-italic", "One italic word", "A single slanted word in a headline, added for style. Write the sentence in one weight."),
    term("looks", "cream-scene", "Cream as a scene", "A painted cream backdrop. A flat warm ground is fine. A picture of cream is not."),
    term("looks", "all-caps", "All-caps eyebrow", "A tracked uppercase label above a title. Use a normal sentence instead."),
    term("looks", "pulse-dot", "Pulsing live dot", "A radar ping on a status. A live state can change opacity. It should not pulse forever."),
    term("looks", "sparkle", "Sparkle icon", "A star used as decoration. An icon needs a job."),
    term("looks", "liquid-glass", "Liquid glass", "Frosted blur and shine on ordinary chrome. A hairline and a surface step are enough."),
    term("looks", "three-cards", "Three icon cards", "A row of identical cards, each with an icon, a title, and one sentence. Show the real offer instead."),
    term("looks", "flowchart", "Decorative flowchart", "Boxes and arrows that do not explain a real step. Draw the path only when someone must follow it."),
    term("looks", "marquee", "Endless marquee", "A strip of words that loops forever. Say the thing once."),
    term("looks", "squircle", "Squircle", "A square with a special corner, mixed with other radii. Pick one radius and keep it."),
    term("looks", "pretext-wrap", "Pretext wrapping", "A headline broken into a trick line. Balance the lines so they read as a sentence.")
  ]);
})();
