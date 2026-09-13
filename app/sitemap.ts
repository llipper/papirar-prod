import type { MetadataRoute } from "next"

const siteUrl = "https://papirar.com"

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: siteUrl, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${siteUrl}/termos`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: `${siteUrl}/privacidade`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: `${siteUrl}/excluir-conta`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
  ]
}
