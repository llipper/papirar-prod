import type { Metadata } from "next"

import { LegalPage } from "@/components/legal/legal-page"

export const metadata: Metadata = {
  title: "Excluir conta e dados",
  description: "Saiba como solicitar a exclusão da sua conta e dos seus dados no Papirar.",
  alternates: { canonical: "/excluir-conta" },
}

export default function DeleteAccountPage() {
  return (
    <LegalPage
      eyebrow="Controle da sua conta"
      title="Solicitar exclusão da conta"
      description="Você pode solicitar a exclusão da sua conta Papirar e dos dados pessoais associados a ela a qualquer momento. A exclusão é irreversível."
      sections={[
        {
          title: "1. Como solicitar",
          paragraphs: [
            "Envie um e-mail para suporte@papirar.com usando o mesmo endereço de e-mail cadastrado no Papirar, com o assunto “Excluir minha conta”. Para proteger sua conta, poderemos pedir uma confirmação de identidade antes de concluir a solicitação.",
          ],
        },
        {
          title: "2. Dados excluídos",
          paragraphs: [
            "Após a confirmação, excluímos sua conta de autenticação, perfil, nome, e-mail, avatar, preferências, marcações, anotações, progresso de leitura e demais conteúdos vinculados à sua conta no Papirar.",
            "A exclusão impede o acesso à conta e não pode ser desfeita. Faça uma cópia das informações que desejar manter antes de solicitar a remoção.",
          ],
        },
        {
          title: "3. Assinaturas e registros necessários",
          paragraphs: [
            "Excluir a conta não cancela automaticamente uma assinatura. Antes de solicitar a exclusão, abra Assinatura no painel do Papirar e cancele a renovação. Assinaturas feitas pela Google Play também devem ser canceladas em Google Play > Pagamentos e assinaturas para evitar novas cobranças.",
            "Alguns registros podem ser preservados pelo período estritamente necessário para cumprir obrigações legais, fiscais, prevenir fraude, resolver disputas ou aplicar nossos termos. Esses registros não ficam disponíveis no aplicativo após a exclusão.",
          ],
        },
        {
          title: "4. Prazo",
          paragraphs: [
            "Concluímos solicitações verificadas em até 30 dias, salvo se houver obrigação legal ou motivo legítimo para retenção temporária de informações específicas.",
          ],
        },
      ]}
    />
  )
}
