"use strict";

function text(value, max) {
  const clean = String(value || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!max || clean.length <= max) return clean;
  return clean.slice(0, max - 1).trim();
}

function hex(value, fallback) {
  const raw = String(value || "").trim();
  return /^#[0-9a-fA-F]{3,8}$/.test(raw) ? raw : fallback;
}

function js(value) {
  return JSON.stringify(text(value, 400));
}

function servicesOf(copy, media) {
  const slots = ["service1", "service2", "service3", "gallery1", "gallery2", "detail1"];
  const list = Array.isArray(copy?.services) ? copy.services : [];
  return list
    .map((item, index) => ({
      title: text(item?.title, 80),
      text: text(item?.text, 180),
      photo: mediaUrl(media, slots[index] || "service1"),
    }))
    .filter((item) => item.title)
    .slice(0, 6);
}

function mediaUrl(media, slot) {
  const url = String(media?.images?.[slot] || "").trim();
  if (!/^https:\/\//i.test(url)) return "";
  return url;
}

function siteSourceFiles(ctx, copy, plan, media) {
  const name = text(ctx?.businessName, 120) || "Local business";
  const phone = text(ctx?.phone, 40);
  const address = text(ctx?.address, 200);
  const hours = text(ctx?.hours, 200);
  const category = text(ctx?.category, 80);
  const palette = {
    bg: hex(copy?.palette?.bg || plan?.palette?.bg, "#ffffff"),
    surface: hex(copy?.palette?.surface || plan?.palette?.surface, "#ffffff"),
    ink: hex(copy?.palette?.ink || plan?.palette?.ink, "#1d1d1f"),
    muted: hex(copy?.palette?.muted || plan?.palette?.muted, "#6e6e73"),
    accent: hex(copy?.palette?.accent || plan?.palette?.accent, "#1d1d1f"),
  };
  const display = text(plan?.type?.display, 40) || "Manrope";
  const body = text(plan?.type?.body, 40) || display;
  const services = servicesOf(copy, media);
  const faqs = (Array.isArray(copy?.faqs) ? copy.faqs : [])
    .map((item) => ({ q: text(item?.q, 140), a: text(item?.a, 280) }))
    .filter((item) => item.q && item.a)
    .slice(0, 5);
  const hero = mediaUrl(media, "hero");
  const about = mediaUrl(media, "about");
  const headline = text(copy?.headline, 80);
  const lede = text(copy?.lede, 180);
  const cta = text(copy?.primaryCta, 40) || "Contact";

  const files = [
    {
      path: "brief.json",
      thought: "Reading " + name,
      contents: JSON.stringify(
        {
          businessName: name,
          category,
          phone,
          address,
          hours,
        },
        null,
        2
      ) + "\n",
    },
    {
      path: "src/copy.json",
      thought: "Writing the headlines and services",
      contents: JSON.stringify(
        {
          headline,
          lede,
          primaryCta: cta,
          servicesTitle: text(copy?.servicesTitle, 80),
          aboutTitle: text(copy?.aboutTitle, 80),
          aboutBody: text(copy?.aboutBody, 400),
          services,
          faqs,
        },
        null,
        2
      ) + "\n",
    },
    {
      path: "src/tokens.css",
      thought: "Setting the color and type",
      contents: `:root {
  --bg: ${palette.bg};
  --surface: ${palette.surface};
  --ink: ${palette.ink};
  --muted: ${palette.muted};
  --accent: ${palette.accent};
  --font-display: ${JSON.stringify(display)};
  --font-body: ${JSON.stringify(body)};
}

body {
  margin: 0;
  background: var(--bg);
  color: var(--ink);
  font-family: var(--font-body), sans-serif;
}

h1, h2 {
  font-family: var(--font-display), sans-serif;
  letter-spacing: -0.03em;
}

.btn {
  display: inline-flex;
  align-items: center;
  min-height: 2.75rem;
  padding: 0 1.1rem;
  border-radius: 999px;
  background: var(--accent);
  color: var(--bg);
  text-decoration: none;
}

.media, .gallery img {
  background: #e7e5e4;
}

.media {
  position: relative;
  overflow: hidden;
  aspect-ratio: 4 / 5;
  border-radius: 1rem;
}

.card {
  display: grid;
  gap: 0.75rem;
}

.media img, .card img, .gallery img {
  display: block;
  width: 100%;
  max-width: 100%;
  height: 100%;
  object-fit: cover;
}

.gallery {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.75rem;
}

.gallery img {
  height: auto;
  aspect-ratio: 4 / 3;
  border-radius: 1rem;
}

@media (prefers-reduced-motion: reduce) {
  * { animation: none !important; transition: none !important; }
}
`,
    },
    {
      path: "src/components/Nav.jsx",
      thought: "Building the navigation",
      contents: `export function Nav() {
  return (
    <header className="topbar">
      <a className="brand" href="#top">{${js(name)}}</a>
      <nav aria-label="Primary">
        <a href="#services">Services</a>
        <a href="#about">About</a>
        <a href="#gallery">Gallery</a>
        <a href="#faq">FAQ</a>
        <a href="#contact">Contact</a>
      </nav>
      <a className="btn" href="#contact">{${js(cta)}}</a>
    </header>
  );
}
`,
    },
    {
      path: "src/components/Hero.jsx",
      thought: "Building the hero",
      contents: `export function Hero() {
  return (
    <section id="hero" aria-label="Introduction">
      ${hero ? `<div className="media"><img src={${js(hero)}} alt="" /></div>` : ""}
      <h1>{${js(headline)}}</h1>
      <a className="btn" href="#contact">{${js(cta)}}</a>
    </section>
  );
}
`,
    },
    {
      path: "src/components/Services.jsx",
      thought: "Building the services",
      contents: `const services = ${JSON.stringify(services, null, 2)};

export function Services() {
  return (
    <section id="services">
      <h2>{${js(copy?.servicesTitle || "Services")}}</h2>
      <div className="grid">
        {services.map((service) => (
          <article className="card" key={service.title}>
            {service.photo ? (
              <div className="media">
                <img src={service.photo} alt="" />
              </div>
            ) : null}
            <h3>{service.title}</h3>
            <p>{service.text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
`,
    },
    {
      path: "src/components/About.jsx",
      thought: "Writing the about section",
      contents: `export function About() {
  return (
    <section id="about">
      ${about ? `<div className="media"><img src={${js(about)}} alt={${js(name)}} /></div>` : ""}
      <h2>{${js(copy?.aboutTitle || "About")}}</h2>
      <p>{${js(copy?.aboutBody || lede)}}</p>
    </section>
  );
}
`,
    },
    {
      path: "src/components/Gallery.jsx",
      thought: "Laying out the gallery",
      contents: `const photos = ${JSON.stringify(
        ["gallery1", "gallery2", "gallery3"]
          .map((slot) => mediaUrl(media, slot))
          .filter(Boolean)
      )};

export function Gallery() {
  return (
    <section id="gallery">
      <h2>A closer look</h2>
      {photos.length ? (
        <div className="gallery">
          {photos.map((src) => (
            <img key={src} src={src} alt="" />
          ))}
        </div>
      ) : null}
    </section>
  );
}
`,
    },
    {
      path: "src/components/Faq.jsx",
      thought: "Writing the questions",
      contents: `const faqs = ${JSON.stringify(faqs, null, 2)};

export function Faq() {
  return (
    <section id="faq">
      <h2>Questions</h2>
      {faqs.map((item) => (
        <details key={item.q}>
          <summary>{item.q}</summary>
          <p>{item.a}</p>
        </details>
      ))}
    </section>
  );
}
`,
    },
    {
      path: "src/components/Contact.jsx",
      thought: "Building the contact form",
      contents: `export function Contact() {
  return (
    <section id="contact">
      <h2>{${js(copy?.contactTitle || "Contact")}}</h2>
      <p>{${js(copy?.contactLead || "")}}</p>
      <p>{${js([address, phone, hours].filter(Boolean).join(" · "))}}</p>
      <form method="post" action="#">
        <label>Name<input name="name" type="text" autoComplete="name" required /></label>
        <label>Phone number<input name="phone" type="tel" autoComplete="tel" required /></label>
        <label>How can we help?<textarea name="message" required /></label>
        <button className="btn" type="submit" data-site-submit>Send message</button>
      </form>
    </section>
  );
}
`,
    },
    {
      path: "src/components/Footer.jsx",
      thought: "Closing the page",
      contents: `export function Footer() {
  return (
    <footer>
      <strong>{${js(name)}}</strong>
      <span>{${js([address, phone].filter(Boolean).join(" · "))}}</span>
    </footer>
  );
}
`,
    },
    {
      path: "src/App.jsx",
      thought: "Connecting the sections",
      contents: `import { Nav } from "./components/Nav";
import { Hero } from "./components/Hero";
import { Services } from "./components/Services";
import { About } from "./components/About";
import { Gallery } from "./components/Gallery";
import { Faq } from "./components/Faq";
import { Contact } from "./components/Contact";
import { Footer } from "./components/Footer";

export function App() {
  return (
    <>
      <Nav />
      <main id="top">
        <Hero />
        <Services />
        <About />
        <Gallery />
        <Faq />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
`,
    },
  ];

  return files;
}

module.exports = {
  siteSourceFiles,
};
