import type { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard/", "/login", "/cadastro", "/signup", "/recuperar-senha"],
    },
    sitemap: "https://papirar.com/sitemap.xml",
    host: "https://papirar.com",
  }
}
