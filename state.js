/* ============================================================
   STATE — the seam.
   Rung 1: hand-edit these values, save, redeploy.
   Rung 2: the local sanitizer (allow-list, fail-closed) emits
   exactly this object. Same object both ways — nothing wasted.

   Every field here is wired into the DOM via [data-state="<field>"]
   on every page (see site.js). Nothing status-bearing is hardcoded
   in markup anymore.
   ============================================================ */
window.STATE = {
  name: "THE WEATHER MACHINE",
  updated: "2026-06-17",       // YYYY-MM-DD
  gate: "4/4 CERTIFIED",
  edge: "IN FORWARD VALIDATION",
  firstFill: "PENDING · 06-18",
  universeCount: 9
};
