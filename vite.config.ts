import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// Defense-in-depth CSP (see docs/security-v2.md). Injected only on `vite build`
// because the dev server relies on the React refresh inline preamble.
// XSS protection itself comes from sanitization (DOMPurify + sanitize-html);
// this policy limits what an injected payload could reach if one slipped through.
// If the deploy host already sends CSP headers, keep both in sync (headers win).
const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self'",
  // 'unsafe-inline' is required for the sandboxed email preview iframe
  // (srcdoc inherits this policy and email HTML is inline-style based).
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  // Email/campaign images are user-provided remote URLs.
  "img-src 'self' data: https:",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
  "frame-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

function injectCspMeta(): Plugin {
  return {
    name: "inject-csp-meta",
    apply: "build",
    transformIndexHtml(html) {
      return {
        html,
        tags: [
          {
            tag: "meta",
            attrs: {
              "http-equiv": "Content-Security-Policy",
              content: CONTENT_SECURITY_POLICY,
            },
            injectTo: "head-prepend",
          },
        ],
      };
    },
  };
}

export default defineConfig({
  server: {
    host: "127.0.0.1",
    port: 8080,
  },
  plugins: [react(), injectCspMeta()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
