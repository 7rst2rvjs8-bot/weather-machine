# The Weather Machine

A multi-page static site visualizing the Weather Machine project's method, machine,
findings, and trajectory. No framework, no build step — plain HTML, one folder per route,
with shared `style.css`, `site.js`, and `state.js`. Relative links so it works under the
GitHub Pages project path.

Routes: `/` (Forecast) · `/method/` · `/machine/` · `/measured/` · `/fork/` ·
`/trajectory/` · `/state/` · `/creator/` · `/colophon/`, plus a plain-English Field
Guide at `/guide/` (`start-here`, `the-gate`, `the-edge`, `the-fill`, `shadow-streams`,
`the-loop`). Two reading levels: a plain surface anyone can follow, with the rigor one
click deeper. The home is an interactive tree — green branches open build pages, red “?”
apples open guide pages — with View-Transition page choreography.

Live status lives in one `STATE` object in `state.js` — the hand-edit seam today, and the
target a local sanitizer will emit into later. Every status value is wired into the DOM via
`[data-state]`; nothing status-bearing is hardcoded.

No P&L is claimed or implied — there is none yet, by design.
