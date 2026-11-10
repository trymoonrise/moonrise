(function () {
  "use strict";
  const LX = window.LX;

  function ex(html) {
    return '<div class="lx-ex" aria-hidden="true">' + html + "</div>";
  }

  function term(cat, id, title, text, visual) {
    return LX.card("term-" + cat + "-" + id, title, ex(visual) + '<p class="dt-dict">' + text + "</p>", { stage: "dt-dict-stage" });
  }

  LX.spec("motion-terms", [], [
    term("motion", "ease-out", "Ease-out", "An entrance starts quickly and settles. Use it when something appears.", '<span class="xd-bar"></span>'),
    term("motion", "ease-in-out", "Ease-in-out", "Use this when an object moves from one place to another. The start and the end are both soft.", '<span class="xd-track"><i></i></span>'),
    term("motion", "dropdown-time", "Dropdown timing", "A menu or popover opens in 150 to 250 milliseconds. Longer than that feels late.", '<span class="xd-menu"><b>Open</b><b>Rename</b></span>'),
    term("motion", "press-scale", "Press scale", "A press scales the control to 0.97, then lets it return. It should not shrink further.", '<span class="xd-press"><i></i><span class="xd-btn is-pressed">Save</span></span>'),
    term("motion", "knob-stretch", "Knob stretch", "A slider knob can stretch about 12% along its travel while it moves, then settle back.", '<span class="xd-slider"><i></i></span>'),
    term("motion", "stagger", "Stagger", "Rows in a list follow one another by about 30 milliseconds, so the details settle in order.", '<span class="xd-rows"><i></i><i></i><i></i></span>'),
    term("motion", "arc", "Arc", "An object that changes place can travel on a slight curve. A straight jump feels mechanical.", '<svg class="xd-arc" viewBox="0 0 120 48" fill="none"><path d="M8 40C36 40 48 8 112 8" stroke="#1d1d1f" stroke-width="2"/><circle cx="112" cy="8" r="4" fill="#1d1d1f"/></svg>'),
    term("motion", "success-pulse", "Success pulse", "Pulse once to confirm a finished action, then stop. Do not leave it breathing.", '<span class="xd-check">✓</span>'),
    term("motion", "popover-scale", "Popover scale", "A popover starts near 95% of its size and grows into place from the trigger.", '<span class="xd-menu"><b>Share</b><b>Copy link</b></span>'),
    term("motion", "enter-trigger", "Enter from the trigger", "The panel comes from the button that opened it, not from the center of the screen.", '<span class="xd-from"><span class="xd-menu"><b>Today</b><b>This week</b></span><span class="xd-btn">Filter</span></span>'),
    term("motion", "exit-trigger", "Exit to the trigger", "The panel leaves back toward that same button.", '<span class="xd-from xd-out"><span class="xd-menu"><b>Today</b><b>This week</b></span><span class="xd-btn">Filter</span></span>'),
    term("motion", "no-bounce", "No bounce", "Everyday controls do not bounce. A bounce is for a toy, not a form.", '<span class="xd-bar is-flat"></span>'),
    term("motion", "hold-still", "Hold still", "Do not keep animating a control while the finger or pointer is holding it.", '<span class="xd-btn is-hold">Hold</span>'),
    term("motion", "shorter-exit", "Shorter exit", "The way out is about 20% shorter than the way in.", '<span class="xd-times"><span></span><span></span></span>'),
    term("motion", "overlap", "Overlap states", "Show the next state before the old one has fully gone, so the screen does not flash blank.", '<span class="xd-overlap"><i></i><i></i></span>'),
    term("motion", "mask", "Reveal mask", "Use a mask to uncover a new color or image. A hard cut feels unfinished.", '<span class="xd-mask"></span>'),
    term("motion", "icon-crossfade", "Icon crossfade", "When an icon changes, fade the old one out as the new one fades in.", '<span class="xd-icons"><i></i><i></i></span>'),
    term("motion", "rubber-band", "Rubber band", "Stretch past the end of a real scroll or drag, then spring back. Do not do this on ordinary buttons.", '<span class="xd-band"><i></i><i></i><i></i></span>'),
    term("motion", "shared-element", "Shared element", "When the same object moves to a new place, keep that one element. Do not destroy it and draw a new one.", '<span class="xd-share"><b></b><b></b></span>'),
    term("motion", "origin", "Origin-aware", "The motion starts from the point the person touched, not from a random corner.", '<span class="xd-origin"><i></i><i></i></span>'),
    term("motion", "interruptible", "Interruptible", "A new gesture can take over before the last animation has finished.", '<span class="xd-take"><s>Auto</s>Drag</span>')
  ]);

  LX.spec("type-terms", [], [
    term("type", "kerning", "Kerning", "The space between one pair of letters. Tighten a pair that looks loose, such as A and V.", '<span class="xd-type"><strong class="is-tight">AV</strong><span class="is-note">tighter pair</span></span>'),
    term("type", "tracking", "Tracking", "The space across a whole line. Body type can be slightly tight. Small text should not go tighter.", '<span class="xd-type"><strong class="is-loose">LABEL</strong></span>'),
    term("type", "leading", "Leading", "The space between lines. Body copy needs more air than a headline.", '<span class="xd-type"><strong class="is-lead">Body lines<br>need more air.</strong></span>'),
    term("type", "x-height", "x-height", "The height of the lowercase letters. Two faces pair more easily when their x-heights are close.", '<span class="xd-pair"><b>x</b><b>x</b></span>'),
    term("type", "tabular", "Tabular numbers", "Digits that share one width, so prices, times, and counts line up in a column.", '<span class="xd-nums"><span>1,111</span><span>8,888</span></span>'),
    term("type", "widow", "Widow", "A single word left alone on the last line. Balance a headline so that word stays with the rest.", '<span class="xd-widow">Keep the last line with its sentence.</span>'),
    term("type", "orphan", "Orphan", "A single word pushed to the start of the next column. Keep it with the line before it.", '<span class="xd-type"><strong class="is-head">Title</strong><span class="is-note">stays with the next lines</span></span>'),
    term("type", "line-length", "Line length", "A paragraph stays near 36rem. Longer lines are hard to follow back to the left.", '<span class="xd-measure"></span>'),
    term("type", "optical-center", "Optical centre", "A mark looks centered when it sits a little above the measured middle.", '<span class="xd-optical"><i></i></span>'),
    term("type", "italic", "Italic", "Use italics for a real title or a citation. Do not slant one word in a headline for style.", '<span class="xd-type"><em>The Sun Also Rises</em></span>'),
    term("type", "mono", "Mono", "A monospace face is for code or raw data. Labels and sentences stay in the text face.", '<span class="xd-type"><strong class="is-mono">14:02</strong></span>'),
    term("type", "hierarchy", "Hierarchy", "Use a few sizes. The title is clearly larger than the body, and the body is clearly larger than the note.", '<span class="xd-type"><strong class="is-head">Title</strong><span class="is-note">Supporting line</span></span>'),
    term("type", "baseline", "Baseline", "The line the letters sit on. When type sits beside an icon, share that line.", '<span class="xd-base"><i></i><b>Label</b></span>')
  ]);

  LX.spec("layout-terms", [], [
    term("layout", "spacing", "Spacing", "Space inside a group is smaller than the space between groups. A label sits closer to its field than to the block above.", '<span class="xd-stack"><label>Name<span class="xd-field"></span></label><label>City<span class="xd-field"></span></label></span>'),
    term("layout", "alignment", "Alignment", "Line things up. If a strict grid leaves a hole, move the piece by eye until it looks even.", '<span class="xd-align"><i></i><i></i><i></i></span>'),
    term("layout", "touch-target", "Touch target", "A control is at least 44px tall so a finger can hit it without hitting its neighbor.", '<span class="xd-btn xd-hit">Save</span>'),
    term("layout", "safe-area", "Safe area", "Keep type and buttons inside the inset of a phone notch and the home bar.", '<span class="xd-phone"><i></i></span>'),
    term("layout", "layout-shift", "Layout shift", "Reserve the size of a picture before it arrives, so the page does not jump.", '<span class="xd-frame"></span>'),
    term("layout", "aspect-ratio", "Aspect ratio", "Give an image a frame, such as 4:3 or 16:9, so the layout is stable.", '<span class="xd-frame"></span>'),
    term("layout", "nested-radius", "Nested radius", "The corner inside a card is the outer corner minus the padding. It should not be sharper than the outside.", '<span class="xd-nest"><i></i></span>'),
    term("layout", "contrast", "Contrast", "Text needs a clear difference from its background. Aim for about 4.5 to 1 for body copy.", '<span class="xd-contrast"><b>Aa</b><b>Aa</b></span>'),
    term("layout", "accent", "Accent", "One color, used on the action that matters. The rest of the page stays in the neutral ramp.", '<span class="xd-accent"><span class="xd-btn">Save</span><span class="xd-btn is-quiet">Cancel</span></span>'),
    term("layout", "hairline", "Hairline", "A 1px line at low opacity. It separates two areas without becoming a heavy frame.", '<span class="xd-line"></span>'),
    term("layout", "surface", "Surface", "A step lighter or darker than the page, used for a card or a field. Depth comes from that step, not a stack of shadows.", '<span class="xd-surface"><i></i></span>'),
    term("layout", "grid", "Grid", "Columns that collapse. One on a phone, two when there is room, three only on a wide screen.", '<span class="xd-cols"><i></i><i></i><i></i></span>')
  ]);

  LX.spec("interaction-terms", [], [
    term("interaction", "affordance", "Affordance", "The control looks like what it does. A button looks pressable. A field looks like it can be typed in.", '<span class="xd-btn">Continue</span>'),
    term("interaction", "combobox", "Combobox", "A field that filters a list and lets the person choose one item.", '<span class="xd-combo"><span class="xd-field">Search</span><b>Search results</b></span>'),
    term("interaction", "disclosure", "Progressive disclosure", "Keep the secondary detail closed until someone asks for it.", '<span class="xd-disc"><strong>Details</strong><b>Hidden until opened</b></span>'),
    term("interaction", "optimistic", "Optimistic update", "Show the result right away, and undo it if the request fails.", '<span class="xd-check">✓</span>'),
    term("interaction", "loading", "Loading state", "Use a skeleton when you know the shape. Use a short spinner when you do not. Keep the button the same size while it waits.", '<span class="xd-skel"><i></i><i></i><i></i></span>'),
    term("interaction", "focus", "Focus ring", "A visible outline on the control that has the keyboard. Never remove it.", '<span class="xd-focus">Next</span>'),
    term("interaction", "reduced-motion", "Reduced motion", "When a person asks for less motion, drop the travel and keep a fade, or turn the motion off.", '<span class="xd-overlap"><i></i><i></i></span>'),
    term("interaction", "empty", "Empty state", "A quiet note when a list has nothing in it yet, with one way to add the first item.", '<span class="xd-empty"><p>No leads yet</p><span class="xd-btn">Add one</span></span>'),
    term("interaction", "feedback", "Useful feedback", "Animate the result of an action, such as a saved note or a single check. Do not decorate idle chrome.", '<span class="xd-toast">Saved</span>'),
    term("interaction", "cta", "Call to action", "One obvious next step on the screen. The other actions stay quiet.", '<span class="xd-accent"><span class="xd-btn">Publish</span><span class="xd-btn is-quiet">Preview</span></span>'),
    term("interaction", "redundant-label", "Redundant label", "A label that repeats the heading or the button. Drop it.", '<span class="xd-drop">Name the name</span>'),
    term("interaction", "filler-badge", "Filler badge", "A New, Pro, or Beta chip that is not true. Leave it out.", '<span class="xd-drop">New</span>')
  ]);

  LX.spec("looks-terms", [], [
    term("looks", "dithering", "Dithering", "A grain of dots laid over a photo. It dates the page. Use the photograph as it is.", '<span class="xd-grain"></span>'),
    term("looks", "ascii-video", "ASCII over video", "Letters standing in for a picture. They hide the real work.", '<span class="xd-ascii">▓ ░ ▒ ▓</span>'),
    term("looks", "infinite-canvas", "Infinite canvas", "A page that pans in every direction. A site should scroll one way.", '<span class="xd-pan"></span>'),
    term("looks", "disco-logo", "Disco logo", "A mark that cycles through colors. The name should stay still.", '<span class="xd-disco">M<i>o</i><i>o</i>n</span>'),
    term("looks", "renaissance", "Renaissance branding", "Cherubs, marble, and gold frames used as a costume. They do not explain the product.", '<span class="xd-gold">Est.</span>'),
    term("looks", "monet", "Monet background", "A painted wash behind the type. A flat paper color is enough.", '<span class="xd-wash">Scene</span>'),
    term("looks", "gradient-hero", "Dark gradient hero", "A glow that fades across the first screen. Use one photo or one solid band.", '<span class="xd-glow">Headline</span>'),
    term("looks", "pixel-loader", "Pixel loader", "A blocky spinner. Use a quiet spinner or a skeleton.", '<span class="xd-pixel"></span>'),
    term("looks", "instrument-serif", "Display serif as costume", "A fashionable serif used because it is current, not because the words need it.", '<span class="xd-serif">Headline</span>'),
    term("looks", "one-italic", "One italic word", "A single slanted word in a headline, added for style. Write the sentence in one weight.", '<span class="xd-type"><strong>Make it <em>sing</em></strong></span>'),
    term("looks", "cream-scene", "Cream as a scene", "A painted cream backdrop. A flat warm ground is fine. A picture of cream is not.", '<span class="xd-wash">Card</span>'),
    term("looks", "all-caps", "All-caps eyebrow", "A tracked uppercase label above a title. Use a normal sentence instead.", '<span class="xd-bad">Read this now</span>'),
    term("looks", "pulse-dot", "Pulsing live dot", "A radar ping on a status. A live state can change opacity. It should not pulse forever.", '<span class="xd-ping"></span>'),
    term("looks", "sparkle", "Sparkle icon", "A star used as decoration. An icon needs a job.", '<span class="xd-check">✓</span>'),
    term("looks", "liquid-glass", "Liquid glass", "Frosted blur and shine on ordinary chrome. A hairline and a surface step are enough.", '<span class="xd-glass">Panel</span>'),
    term("looks", "three-cards", "Three icon cards", "A row of identical cards, each with an icon, a title, and one sentence. Show the real offer instead.", '<span class="xd-three"><i></i><i></i><i></i></span>'),
    term("looks", "flowchart", "Decorative flowchart", "Boxes and arrows that do not explain a real step. Draw the path only when someone must follow it.", '<span class="xd-flow">A → B → C</span>'),
    term("looks", "marquee", "Endless marquee", "A strip of words that loops forever. Say the thing once.", '<span class="xd-loop">Scrolling text scrolling text</span>'),
    term("looks", "squircle", "Squircle", "A square with a special corner, mixed with other radii. Pick one radius and keep it.", '<span class="xd-squircle"></span>'),
    term("looks", "pretext-wrap", "Pretext wrapping", "A headline broken into a trick line. Balance the lines so they read as a sentence.", '<span class="xd-widow">Let the sentence wrap on its own.</span>')
  ]);
})();
