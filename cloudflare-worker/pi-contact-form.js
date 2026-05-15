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
 *   destination_address = "popedome@gmail.com"   # set to Brian's chosen inbox
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

    // Field names match the form fields in pervasive_insights_site.html
    const name = sanitize(payload.name);
    const email = sanitize(payload.email);
    const company = sanitize(payload.company);
    const message = sanitizeMessage(payload.message);

    if (!name || !email || !message) {
      return new Response(
        JSON.stringify({ error: "Name, email, and message are required" }),
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
        `Message:`,
        message,
        ``,
        `---`,
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
