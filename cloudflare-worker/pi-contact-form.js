/**
 * Cloudflare Worker — Pervasive Insights contact form handler
 *
 * Deploy: wrangler deploy (from this directory, with wrangler.toml)
 * Route:  pi-contact-form.popedome.workers.dev  (or custom route at deploy time)
 *
 * Receives JSON POST from the PI site contact form, validates, and emails
 * the destination address via Cloudflare Email Workers (built-in, free).
 *
 * Required Wrangler binding (in wrangler.toml):
 *   [[send_email]]
 *   name = "PI_INBOX"
 *   destination_address = "info@cityresearchsolutions.com"   # the contact inbox
 *
 * NOTE: Cloudflare Email Workers requires the destination_address to be
 * VERIFIED at https://dash.cloudflare.com → Email → Email Workers → Destination
 * Addresses BEFORE the Worker can send to it. ~30-sec setup, one-time.
 */

import { EmailMessage } from "cloudflare:email";
import { createMimeMessage } from "mimetext";

const ALLOWED_ORIGINS = [
  "https://pervasiveinsights.ai",
  "https://www.pervasiveinsights.ai",
  "https://pervasive-insights.com",
  "https://www.pervasive-insights.com",
  "http://localhost:8000", // for local testing
];

function corsHeaders(origin) {
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
  };
}

function sanitize(s) {
  return String(s || "").slice(0, 5000).replace(/[\r\n]+/g, " ").trim();
}

function sanitizeMessage(s) {
  return String(s || "").slice(0, 10000).trim();
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    if (request.method !== "POST") {
      return new Response("Method not allowed", {
        status: 405,
        headers: corsHeaders(origin),
      });
    }

    let payload;
    try {
      payload = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON" }), {
        status: 400,
        headers: { ...corsHeaders(origin), "Content-Type": "application/json" },
      });
    }

    // Field names match the form fields in index.html. The current form uses
    // `topic` for the message body ("What would you most want to ask your
    // panel about?"); accept either `message` or `topic` for forward compat.
    const name = sanitize(payload.name);
    const email = sanitize(payload.email);
    const company = sanitize(payload.company);
    const message = sanitizeMessage(payload.message || payload.topic);

    // Attribution. `heard_about` is a required select on the form; the utm_* trio is
    // captured from the query string into hidden fields and is absent on direct visits.
    const heardAbout = sanitize(payload.heard_about);
    const utmSource = sanitize(payload.utm_source);
    const utmMedium = sanitize(payload.utm_medium);
    const utmCampaign = sanitize(payload.utm_campaign);

    // Only name + email are hard-required; message/topic is optional (user
    // may submit a meeting-request with no question body yet).
    if (!name || !email) {
      return new Response(
        JSON.stringify({ error: "Name and email are required" }),
        {
          status: 400,
          headers: { ...corsHeaders(origin), "Content-Type": "application/json" },
        },
      );
    }

    // Basic email shape check
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(JSON.stringify({ error: "Invalid email" }), {
        status: 400,
        headers: { ...corsHeaders(origin), "Content-Type": "application/json" },
      });
    }

    const destinationAddress = env.DESTINATION_EMAIL || "info@cityresearchsolutions.com";

    const msg = createMimeMessage();
    msg.setSender({ name: "Pervasive Insights Contact Form", addr: "noreply@pervasiveinsights.ai" });
    msg.setRecipient(destinationAddress);
    msg.setSubject(`[PI Contact] ${name}${company ? " (" + company + ")" : ""}`);
    msg.addMessage({
      contentType: "text/plain",
      data: [
        `New contact form submission from pervasiveinsights.ai`,
        ``,
        `Name:    ${name}`,
        `Email:   ${email}`,
        `Company: ${company || "(not provided)"}`,
        ``,
        `What they want to ask their panel about:`,
        message || "(no message provided)",
        ``,
        `---`,
        `Heard about us: ${heardAbout || "(not provided)"}`,
        `utm_source:     ${utmSource || "(none)"}`,
        `utm_medium:     ${utmMedium || "(none)"}`,
        `utm_campaign:   ${utmCampaign || "(none)"}`,
        ``,
        `Reply directly to ${email}.`,
      ].join("\n"),
    });

    const emailMessage = new EmailMessage(
      "noreply@pervasiveinsights.ai",
      destinationAddress,
      msg.asRaw(),
    );

    try {
      await env.PI_INBOX.send(emailMessage);
    } catch (err) {
      console.error("Email send failed:", err);
      return new Response(JSON.stringify({ error: "Email delivery failed" }), {
        status: 502,
        headers: { ...corsHeaders(origin), "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders(origin), "Content-Type": "application/json" },
    });
  },
};
