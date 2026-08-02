import type { Plugin } from "@docusaurus/types";

/**
 * Client-timezone default theme.
 *
 * A reader who has never chosen a theme gets light during the day and dark in
 * the evening, decided from the *browser's* wall-clock hour (`new Date()
 * .getHours()` already resolves in the visitor's zone and is DST-correct by
 * construction — no `Intl` lookup, no geo-IP, no server or build-time clock).
 *
 * Precedence, highest first:
 *
 *   1. Explicit stored choice (`localStorage["theme"]`) — wins permanently.
 *   2. Pre-existing `?docusaurus-theme=` URL override — untouched.
 *   3. OS `prefers-color-scheme: dark` — dark at *every* hour. Forcing light at
 *      14:00 on someone who set OS dark removes an accommodation they
 *      configured, and the browser cannot distinguish "OS is light" from "OS
 *      said nothing". So the time rule may only ever resolve the *light*
 *      branch's counterpart: it upgrades light -> dark, never dark -> light.
 *   4. Client-local hour — {@link resolveTimeOfDayTheme}.
 *   5. On any error — leave Docusaurus's own resolution intact. Fail OPEN.
 *
 * Steps 1-3 are already implemented by Docusaurus's own pre-body color-mode
 * script (`respectPrefersColorScheme: true`). This plugin only supplies step 4,
 * as a narrow correction layered on top of that script's result.
 *
 * Mechanism: `injectHtmlTags().preBodyTags` places our script immediately
 * *after* Docusaurus's color-mode script and immediately *before*
 * `<div id="__docusaurus">` — nothing paints in between, so there is no flash.
 * (`headTags` would be too early: it runs before Docusaurus's script and would
 * simply be overwritten.) `scripts/check-theme-script-order.mjs` asserts that
 * ordering against real build output.
 *
 * Hydration is safe: `theme-common`'s `useColorModeState` seeds React state
 * *from* `ColorModeAttribute.get()` and its mount effect re-reads the same
 * attribute, so the provider adopts our DOM value rather than overwriting it.
 *
 * Deliberately NOT done: seeding `localStorage["theme"]`. Docusaurus derives
 * `data-theme-choice` from that key, so seeding would fabricate a *permanent
 * explicit choice* and the theme would never re-derive by time again.
 */

/** Local hour at which the light window opens, inclusive. */
export const DAY_START_HOUR = 7;

/** Local hour at which the dark window opens, inclusive. */
export const NIGHT_START_HOUR = 18;

export type TimeOfDayTheme = "light" | "dark";

/**
 * The whole rule, as a pure function of the visitor's local hour.
 *
 * | Local hour  | Theme |
 * | ----------- | ----- |
 * | 00:00-06:59 | dark  |
 * | 07:00-17:59 | light |
 * | 18:00-23:59 | dark  |
 */
export function resolveTimeOfDayTheme(hour: number): TimeOfDayTheme {
  return hour >= NIGHT_START_HOUR || hour < DAY_START_HOUR ? "dark" : "light";
}

export const PLUGIN_NAME = "time-of-day-theme";

/**
 * Marker attribute stamped on the injected `<script>` tag.
 *
 * The ordering guard finds our script by this attribute (and Docusaurus's by a
 * stable *content* signature) so it can assert relative order without pinning
 * byte offsets. It lives on the tag rather than in the script body because
 * Docusaurus minifies inline script bodies with terser (`minifyJS: true`),
 * which strips comments and drops unused values; tag attributes survive.
 */
export const SCRIPT_MARKER_ATTRIBUTE = "data-time-of-day-theme";

/**
 * Runs immediately after Docusaurus's own color-mode script, so
 * `data-theme` / `data-theme-choice` are already populated.
 *
 * Acts only when all three hold, and then only ever sets `dark`:
 *   - `data-theme-choice === "system"` — no explicit choice and no URL override
 *     (Docusaurus sets the choice attribute to the chosen value otherwise);
 *   - the OS is not asking for dark;
 *   - the local hour is in the night window.
 *
 * It writes nothing to `localStorage` and never touches `data-theme-choice`, so
 * the visit stays an unmade choice and re-derives by time on every later visit.
 */
const INLINE_SCRIPT = `(function () {
  try {
    var el = document.documentElement;
    if (el.getAttribute("data-theme-choice") !== "system") {
      return;
    }
    if (typeof window.matchMedia !== "function") {
      return;
    }
    if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      return;
    }
    var hour = new Date().getHours();
    if (hour >= ${NIGHT_START_HOUR} || hour < ${DAY_START_HOUR}) {
      el.setAttribute("data-theme", "dark");
    }
  } catch (e) {
    // Fail open: leave Docusaurus's own resolution intact.
  }
})();`;

export default function timeOfDayThemePlugin(): Plugin<void> {
  return {
    name: PLUGIN_NAME,

    injectHtmlTags() {
      return {
        preBodyTags: [
          {
            tagName: "script",
            attributes: { [SCRIPT_MARKER_ATTRIBUTE]: "1" },
            innerHTML: INLINE_SCRIPT,
          },
        ],
      };
    },
  };
}
