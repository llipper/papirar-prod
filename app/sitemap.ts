import type { MetadataRoute } from "next"

const siteUrl = "https://www.papirar.com"
const lastModified = new Date("2026-09-14T00:00:00.000Z")

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: siteUrl, lastModified, changeFrequency: "weekly", priority: 1 },
    { url: `${siteUrl}/termos`, lastModified, changeFrequency: "yearly", priority: 0.3 },
    { url: `${siteUrl}/privacidade`, lastModified, changeFrequency: "yearly", priority: 0.3 },
    { url: `${siteUrl}/excluir-conta`, lastModified, changeFrequency: "yearly", priority: 0.3 },
  ]
}
