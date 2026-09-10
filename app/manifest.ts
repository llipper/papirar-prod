import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Papirar",
    short_name: "Papirar",
    description: "Estude leis com clareza.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#111111",
    lang: "pt-BR",
    icons: [
      { src: "/logo_p_black.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/logo_p_white.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
    ],
  }
}
