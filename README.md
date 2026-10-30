# D³ Lab Website

**D³ Lab — Data · Dynamics · Discovery**, Graduate School of Data Science, Seoul National University

A static site in plain HTML, CSS, and JavaScript, with no build step.
Open `index.html` in a browser to preview it locally.

## Editing content

| What | Where |
|---|---|
| Lab name, menu order, contact info (email, office, address; shown in the footer), and the name to bold in author lists | `data/site.js` |
| Members (role: `pi`, `postdoc`, `phd`, `ms`, `intern`, `alumni`) | `data/members.js` |
| Publications (add new papers at the **top** of the file) | `data/publications.js` |
| News (sorted by date automatically) | `data/news.js` |
| Hero text, hiring notice, What we do | `index.html` |
| Research directions | `research.html` |
| Application guide (Google Docs link) | `join.html` |
| Courses | `teaching.html` |

- Set a paper's `direction` (`"systems"`, `"efficiency"`, or `"aix"`) to list it under that direction on the Research page.
- Put photos in `assets/img/people/` and set the `photo` path in `data/members.js`.
- When recruiting ends, remove the `<section class="block hiring-block">` block from `index.html`.

## Structure

```
*.html                 7 pages
assets/css/style.css   Styles (light colors in :root at the top, dark-mode colors right below)
assets/js/main.js      Header/footer, light/dark toggle, data rendering,
                       home animation (heroAnimation), Research animations (directionAnimation)
data/*.js              Content
```

## Deployment

Pushing to the `snu-dcube.github.io` repository in the `snu-dcube` GitHub organization
publishes the site with GitHub Pages. (Planned custom domain: `dcube.snu.ac.kr`)
