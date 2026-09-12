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
  GA_MEASUREMENT_ID: "",        // Google tag, e.g. "G-XXXXXXXXXX"
  UET_TAG_ID: "",               // Microsoft UET tag id, e.g. "12345678"
  OPENAI_PIXEL_ID: "",          // OpenAI Ads pixel id

  GOOGLE_SITE_VERIFICATION: "", // Google Search Console meta content value
  BING_SITE_VERIFICATION: ""    // Bing Webmaster Tools meta content value
};
