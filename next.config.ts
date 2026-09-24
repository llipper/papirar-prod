import type { NextConfig } from "next"

const isDevelopment = process.env.NODE_ENV !== "production"

const nextConfig: NextConfig = {
  poweredByHeader: false,

  // Renomeia /_next/ para /_s/ em produção — oculta fingerprint do Next.js
  // de ferramentas como Wappalyzer, Shodan e scanners automatizados.
  assetPrefix: !isDevelopment ? "/_s" : undefined,

  images: {
    localPatterns: [
      { pathname: "/capas/**" },
      { pathname: "/mock/**", search: "" },
      { pathname: "/logo__dark.svg", search: "" },
      { pathname: "/logo__white.svg", search: "" },
      { pathname: "/bg/**" },
      { pathname: "/bg-white.png", search: "" },
      { pathname: "/bg.png", search: "" },
    ],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "*.googleusercontent.com",
      },
    ],
  },
  async headers() {
    return [
      {
        // Firebase Auth serves its own OAuth helper under /__/. Applying the
        // application's CSP/X-Frame-Options to that proxied helper changes
        // the callback response and can leave the Google popup blank.
        source: "/((?!__/).*)",
        headers: [
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
          // Anti-fingerprint: remove identificação de servidor e tecnologia
          {
            key: "X-DNS-Prefetch-Control",
            value: "off",
          },
        ],
      },
    ]
  },
  async rewrites() {
    return [
      // Firebase OAuth proxy — mantém auth.papirar.com no contexto do cookie
      {
        source: "/__/auth/:path*",
        destination: "https://papirar-72bc6.firebaseapp.com/__/auth/:path*",
      },
      {
        source: "/__/firebase/init.json",
        destination:
          "https://papirar-72bc6.firebaseapp.com/__/firebase/init.json",
      },
      // Rewrite dos assets renomeados /_s/_next/* → /_next/*
      // Necessário para que o assetPrefix funcione corretamente em produção
      {
        source: "/_s/_next/:path*",
        destination: "/_next/:path*",
      },
    ]
  },
}

export default nextConfig
