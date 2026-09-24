import { LandingPage } from "@/components/landing/landing-page"
import { headers } from "next/headers"

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://www.papirar.com/#organization",
      name: "Papirar",
      url: "https://www.papirar.com",
      logo: "https://www.papirar.com/logo__dark.svg",
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
            text: "O Papirar organiza leis e códigos para concursos públicos e OAB, incluindo a Constituição Federal de 1988, Código Penal, Código de Processo Penal, Código Penal Militar, ECA, Lei Maria da Penha, Lei de Drogas, Lei 8.112/90, Lei de Licitações (Lei 14.133/21), LGPD e outros materiais. Confira sempre a redação vigente em fonte oficial.",
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
          name: "Como funciona a leitura offline no Web?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Depois de carregar uma lei online, o Web pode reutilizar uma cópia local do texto neste navegador. Isso não é um download permanente nem armazenamento criptografado; a disponibilidade depende do cache do navegador. Áudios e recursos sincronizados precisam de conexão.",
          },
        },
        {
          "@type": "Question",
          name: "Como funciona a assinatura do Papirar Premium?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "O Papirar Premium custa R$ 24,99 por mês. Novas contas elegíveis podem ativar 3 dias grátis sem cartão e sem cobrança automática; o teste termina e a conta volta ao plano grátis, a menos que a pessoa escolha assinar.",
          },
        },
      ],
    },
  ],
}

export default async function Page() {
  const nonce = (await headers()).get("x-nonce") ?? undefined

  return (
    <>
      <script
        type="application/ld+json"
        nonce={nonce}
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }}
      />
      <LandingPage />
    </>
  )
}
