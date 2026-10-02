/* Site tag configuration.
 *
 * This site is static HTML served straight from Cloudflare Pages: there is no build
 * step and no server, so there is nothing to expand an environment variable. This
 * file is the substitute. Every tag below stays inert while its value is an empty
 * string; paste an id in and that tag, and only that tag, starts firing.
 *
 * Nothing here is secret. These are public client-side ids.
 */
window.PI_CONFIG = {
  /* Google tag. Accepts EITHER an Analytics measurement id ("G-XXXXXXXXXX") or a
   * Google Ads conversion id ("AW-XXXXXXXXX"). Both load through gtag.js and the
   * loader does not test for a prefix. Ours is an Ads id, not Analytics.
   * GA_MEASUREMENT_ID below is the former name of this field, kept as a fallback
   * so an older cached page cannot silently lose its tag. Set GOOGLE_TAG_ID. */
  GOOGLE_TAG_ID: "AW-18458200377",
  GA_MEASUREMENT_ID: "",        // legacy alias for GOOGLE_TAG_ID; leave empty

  UET_TAG_ID: "187275175",      // Microsoft UET tag id

  /* OpenAI Ads pixel. Page views only, and this site passes NO user object, so
   * nothing is handed over explicitly. Read this before changing anything here:
   *
   * Passing no user data is NOT sufficient on its own. The SDK harvests email,
   * phone and name itself when "automatic advanced matching" is enabled, and
   * that is a SERVER-SIDE per-pixel setting in OpenAI Ads Manager with no code
   * flag, no init option and no query parameter. Measured 2 Oct 2026, it is ON
   * for this pixel:
   *   curl https://bzrcdn.openai.com/pixel-config/v1/BA84fRCtastmoM7xjjUxWC.json
   *   -> {"automatic_advanced_matching_enabled":true}
   * A page_viewed event is NOT exempt; it carries the harvested block too.
   *
   * So the protection here is placement, not the event type: the pixel is
   * absent from index.html, the only page with a form. Per Brian Pope's
   * ruling, 2 Oct 2026. Before adding the pixel to the home page, or adding
   * any input field to another page, re-read that config URL and require
   * false. */
  OPENAI_PIXEL_ID: "BA84fRCtastmoM7xjjUxWC",

  GOOGLE_SITE_VERIFICATION: "", // Search Console is verified by DNS; meta tag not needed
  BING_SITE_VERIFICATION: ""    // Bing account does not exist yet
};
