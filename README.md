# Hazlett Health — Jekyll theme

A Jekyll conversion of the original single-file `index.html` landing page. The
design is unchanged; what changed is the structure. Content now lives in data
files and Markdown posts, presentation lives in layouts and includes, and there
is no longer an in-browser admin panel — to publish an article you add a
Markdown file and push to your repository.

## How it maps to the old site

| Old single-file site | This theme |
|---|---|
| `ARTICLES_SEED` array in `<script>` | one Markdown file per article in `_posts/` |
| Articles opened in a modal (`?article=slug`) | each article is a real page at `/articles/<slug>/` |
| In-page admin panel + "download & re-upload" | add a `.md` file, commit, push |
| Hardcoded hero / about / contact copy | `_data/*.yml` |
| Hardcoded analytics IDs, email, etc. | `_config.yml` |
| All CSS inline in `<style>` | `_sass/main.scss` → compiled to `/assets/css/style.css` |
| All JS inline | `assets/js/site.js` |

## Running it locally

You need Ruby (3.0+). Then:

```bash
bundle install
bundle exec jekyll serve
```

Open `http://localhost:4000`. The site rebuilds as you edit.

## Editing the page content

You should rarely need to touch HTML. Everything visible on the landing page is
driven by these files:

- `_config.yml` — site title, description, URL, email, copyright, analytics IDs
  (Umami / GA4), the Cusdis comments app ID, Google site-verification, the footer
  membership badge, and `words_per_minute` (used to estimate reading time).
- `_data/hero.yml` — the eyebrow, headline, description, credential bullets, the
  two call-to-action buttons, the hero photo, and the three stat tiles.
- `_data/about.yml` — the section heading, the three expandable cards, the
  paragraphs revealed on expand, and the closing pull-quote.
- `_data/contact.yml` — the intro paragraph and the contact link cards
  (LinkedIn / email / calendar).
- `_data/nav.yml` — the header and mobile navigation links.

Change a value, save, and the page updates.

## Adding or editing an article

Create a file in `_posts/` named `YYYY-MM-DD-the-title.md`. The date in the
filename is the publish date and controls ordering (newest first). For example:

```text
_posts/2026-07-01-a-new-article.md
```

Front matter at the top of the file:

```yaml
---
layout: post
tag: Research            # Research | Clinical | Education | Reflections
title: "A new article"
excerpt: "One or two sentences shown on the article card on the homepage."
read_time: "5 min read"  # optional — auto-estimated from word count if omitted
media: [video, infographics]   # optional — shows badges on the card
---
```

Below the front matter, write the body. You can use Markdown, or HTML if you
need it (the existing articles use HTML `<p>` and `<h3>` tags, which is fine).
Section headings inside an article use `<h3>` (or Markdown `###`).

- **Category colours** are derived automatically from `tag`: the card and the
  article header get the class `tag-research`, `tag-clinical`, `tag-education`,
  or `tag-reflections`.
- **Reading time** uses `read_time` if you set it, otherwise it's estimated from
  the word count using `words_per_minute` in `_config.yml`.

### Images and figures inside an article

Put image files in `assets/img/` and reference them with a root-relative path:

```html
<figure style="margin:1.5rem 0;cursor:pointer;" onclick="openLightbox('fig1')">
  <img id="fig1" src="/assets/img/my-diagram.png" alt="My diagram"
       style="width:100%;border-radius:4px;border:1px solid #e7e3dc;">
  <figcaption style="font-size:0.75rem;color:#8a8278;margin-top:0.4rem;text-align:center;">
    Caption — click to enlarge
  </figcaption>
</figure>
```

`openLightbox('id')` (in `assets/js/site.js`) opens a click-to-zoom overlay for
the image with that `id`.

## Images this theme expects

Drop these into `assets/img/` (they're referenced by the data files and the
seed articles):

```
hero-1.jpg            mccs.png              trustpilot.png
runners-high.png      indica-sativa.png     clopidogrel-cbd.png
p1.png  p2.png  p3.png  p4.png  p5.png
```

Until they're added, those spots simply show a broken-image placeholder; nothing
else breaks.

## Analytics and comments

- **Umami** loads on every page (cookieless, no consent needed). Set
  `analytics.umami_website_id` in `_config.yml`, or leave it blank to disable.
- **Google Analytics 4** only loads after the visitor accepts the cookie banner.
  Set `analytics.ga4_measurement_id` (and optionally `ga4_cookie_domain`). Leave
  the measurement ID blank to remove the banner and GA entirely.
- **Comments** use [Cusdis](https://cusdis.com). Set `cusdis_app_id` in
  `_config.yml`. Each article's thread is keyed to its page URL. Leave it blank
  and the comments box shows a "not set up yet" message.

The contact form has no server: it composes a `mailto:` to `site.email`. To use
a real form backend (Formspree, Netlify Forms, etc.) you can wire `form_action`
in `_data/contact.yml` and adjust `_includes/contact.html`.

## Deploying

This theme uses only core Jekyll features (no custom plugins), so it builds on
**GitHub Pages** unchanged:

1. Push this folder to a repository.
2. In the repo, go to **Settings → Pages** and set the source to your branch.
3. Set `url` (and `baseurl` if the site lives in a sub-path) in `_config.yml`.

It also deploys anywhere that can serve static files — run
`bundle exec jekyll build` and upload the generated `_site/` folder.
