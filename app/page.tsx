import { LandingPage } from "@/components/landing/landing-page"

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://www.papirar.com/#organization",
      name: "Papirar",
      url: "https://www.papirar.com",
      logo: "https://www.papirar.com/icon.png",
      email: "suporte@papirar.com",
      sameAs: [
        "https://www.instagram.com/papirarapp",
        "https://twitter.com/papirarapp",
        "https://www.youtube.com/@papirar",
        "https://www.linkedin.com/company/papirar",
        "https://www.facebook.com/papirarapp",
      ],
    },
    {
      "@type": "WebSite",
      "@id": "https://www.papirar.com/#website",
      name: "Papirar",
      url: "https://www.papirar.com",
      inLanguage: "pt-BR",
      publisher: { "@id": "https://www.papirar.com/#organization" },
    },
    {
      "@type": "SoftwareApplication",
      "@id": "https://www.papirar.com/#app",
      name: "Papirar",
      applicationCategory: "EducationalApplication",
      operatingSystem: "Android, iOS, Web",
      url: "https://www.papirar.com",
      description:
        "Plataforma completa para estudo da legislação brasileira, Constituição Federal e códigos com leitura organizada, resumos em áudio e marcações.",
      inLanguage: "pt-BR",
      publisher: { "@id": "https://www.papirar.com/#organization" },
      offers: {
        "@type": "Offer",
        price: "24.99",
        priceCurrency: "BRL",
        availability: "https://schema.org/InStock",
        url: "https://www.papirar.com/#premium",
      },
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: "4.9",
        ratingCount: "1250",
        bestRating: "5",
        worstRating: "1",
      },
    },
    {
      "@type": "FAQPage",
      "@id": "https://www.papirar.com/#faq",
      mainEntity: [
        {
          "@type": "Question",
          name: "Quais leis e códigos estão disponíveis no Papirar?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "O Papirar conta com as principais leis e códigos para concursos públicos e OAB, incluindo a Constituição Federal de 1988, Código Penal, Código de Processo Penal, Código Civil, Código de Processo Civil, CLT, Lei 8.112/90, Lei de Licitações (Lei 14.133/21), Lei de Improbidade Administrativa e muito mais, sempre atualizadas.",
          },
        },
        {
          "@type": "Question",
          name: "Como funcionam as explicações em áudio no Papirar?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Você pode ouvir o texto legal narrado e explicações com linguagem clara e didática direto no aplicativo. É ideal para transformar momentos ociosos (como trânsito ou caminhadas) em tempo produtivo de estudo.",
          },
        },
        {
          "@type": "Question",
          name: "Posso fazer marcações e anotações nos artigos de lei?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Sim! O Papirar permite destacar trechos em várias cores e adicionar anotações personalizadas por artigo ou dispositivo normativo. Todas as suas marcações ficam salvas e sincronizadas na sua conta.",
          },
        },
        {
          "@type": "Question",
          name: "O Papirar funciona offline?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Sim! Os assinantes do Papirar Premium podem baixar as leis completas para leitura offline com armazenamento criptografado e seguro no celular ou tablet.",
          },
        },
        {
          "@type": "Question",
          name: "Como funciona a assinatura do Papirar Premium?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "O Papirar Premium custa R$ 24,99 por mês, sem fidelidade ou carência. Você tem acesso a explicações em áudio com inteligência artificial, leitura offline e comparação de alterações legais, podendo cancelar a qualquer momento.",
          },
        },
      ],
    },
  ],
}

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <LandingPage />
    </>
  )
}
