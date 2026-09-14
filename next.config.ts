import type { NextConfig } from "next"

const isDevelopment = process.env.NODE_ENV !== "production"
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self'${isDevelopment ? " 'unsafe-eval'" : ""} 'unsafe-inline' https://apis.google.com https://www.gstatic.com`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://*.googleusercontent.com https://*.r2.dev https://*.r2.cloudflarestorage.com",
  "font-src 'self' data:",
  "connect-src 'self' https://*.googleapis.com https://*.firebaseio.com wss://*.firebaseio.com https://*.workers.dev",
  "media-src 'self' blob: https://*.r2.dev https://*.r2.cloudflarestorage.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-src 'self' https://accounts.google.com https://*.firebaseapp.com https://auth.papirar.com",
  "frame-ancestors 'none'",
].join("; ")

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    localPatterns: [
      { pathname: "/capas/**" },
      { pathname: "/mock/**", search: "" },
      { pathname: "/logo.svg", search: "" },
    ],
    remotePatterns: [],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: contentSecurityPolicy,
          },
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin-allow-popups",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(self), microphone=(), geolocation=()",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
        ],
      },
    ]
  },
  async rewrites() {
    // Firebase's OAuth helper must be proxied, not redirected, so the
    // browser keeps auth.papirar.com in the address bar and cookie context.
    return [
      {
        source: "/__/auth/:path*",
        destination: "https://papirar-72bc6.firebaseapp.com/__/auth/:path*",
      },
      {
        source: "/__/firebase/init.json",
        destination:
          "https://papirar-72bc6.firebaseapp.com/__/firebase/init.json",
      },
    ]
  },
}

export default nextConfig
