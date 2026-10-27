# sorrz.github.io: portfolio

Personal portfolio for Dan Stjärnborg (QA Lead · DevOps · Developer), styled as broken tech.

Plain static HTML/CSS/JS with no build step, so it can be served directly by GitHub Pages.

```
index.html             content
assets/css/style.css   theme + glitch effects
assets/js/main.js      boot sequence, parallax, glitch scheduler, noise
```

## How the glitch layers work

| Behaviour | Where | What it does |
|---|---|---|
| **Fixed** | `.fx`, `.hud`, `.errbox` | Holds in place while the page scrolls under it (scanlines, dead pixels, stuck tear line, error dialog). |
| **Sticky** | `.sect-num` | The giant section number holds through its section, then scrolls away with it. |
| **Parallax** | any element with `data-speed` | `0` scrolls normally, `> 0` lags behind (background), `< 0` rushes past (foreground). |
| **Bursts** | `.glitchable` | Random slice/jitter bursts, screen tears that sometimes freeze in place, whole-page jolts. |

`prefers-reduced-motion` keeps the broken look but turns off all motion.

## Run locally

Open `index.html` in a browser, or run `npx serve .`.

## Editing content

Projects live in `index.html` under `<!-- ===== 04 FILES ===== -->`. Copy a `.file-wrap` block,
alternate its `data-speed` sign, and use `st--ok` + a link for public repos or `st--lock` +
`ACCESS DENIED` for private ones.
