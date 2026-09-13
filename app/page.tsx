import { LandingPage } from "@/components/landing/landing-page"

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://papirar.com/#organization",
      name: "Papirar",
      url: "https://papirar.com",
      logo: "https://papirar.com/logo.svg",
      email: "suporte@papirar.com",
    },
    {
      "@type": "WebSite",
      "@id": "https://papirar.com/#website",
      name: "Papirar",
      url: "https://papirar.com",
      inLanguage: "pt-BR",
      publisher: { "@id": "https://papirar.com/#organization" },
    },
    {
      "@type": "SoftwareApplication",
      name: "Papirar",
      applicationCategory: "EducationalApplication",
      operatingSystem: "Android, Web",
      url: "https://papirar.com",
      description: "Aplicativo para estudar legislação brasileira com leitura organizada, áudio e ferramentas de revisão.",
      offers: {
        "@type": "Offer",
        price: "24.99",
        priceCurrency: "BRL",
        availability: "https://schema.org/InStock",
        url: "https://papirar.com/#premium",
      },
    },
  ],
}

export default function Page() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <LandingPage />
    </>
  )
}
