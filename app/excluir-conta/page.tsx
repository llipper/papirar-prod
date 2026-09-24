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
      title="Excluir sua conta"
      description="Você pode excluir sua conta Papirar em Configuração, após confirmar sua identidade. A exclusão é permanente."
      sections={[
        {
          title: "1. Como solicitar",
          paragraphs: [
            "No painel do Papirar, abra Configuração > Excluir conta. Confirme sua senha ou entre novamente com Google e digite EXCLUIR. A identidade é revalidada antes que a solicitação seja processada. Você também pode pedir ajuda pelo endereço suporte@papirar.com.",
          ],
        },
        {
          title: "2. Dados excluídos",
          paragraphs: [
            "Após a confirmação, removemos a conta de autenticação Firebase e os dados da aplicação vinculados a ela, incluindo perfil, avatar, marcações, anotações, progresso, uso e registros de assinatura armazenados no Papirar. Arquivos de avatar são removidos do armazenamento do Papirar.",
            "A exclusão impede o acesso à conta e não pode ser desfeita. Faça uma cópia das informações que desejar manter antes de continuar. Dados que já estejam no cache do seu navegador podem exigir limpeza local do navegador.",
          ],
        },
        {
          title: "3. Assinaturas e registros necessários",
          paragraphs: [
            "Cancele sua assinatura e aguarde o fim do período vigente antes de excluir a conta. Assinaturas do Mercado Pago devem ser canceladas no painel Papirar; assinaturas da Google Play em Google Play > Pagamentos e assinaturas. O sistema bloqueia a exclusão enquanto detectar um período ativo. A exclusão da conta não apaga o histórico mantido pelo provedor de pagamento.",
            "Provedores de pagamento e outros prestadores podem reter registros sujeitos às próprias obrigações legais e políticas. Esses registros não ficam disponíveis no Papirar após a exclusão.",
          ],
        },
        {
          title: "4. Prazo",
          paragraphs: [
            "A exclusão dos dados do Papirar e da conta de autenticação ocorre durante o fluxo confirmado na aplicação. Se uma etapa técnica falhar, a tela informa que a exclusão não foi concluída para que você possa tentar novamente ou falar com o suporte.",
          ],
        },
      ]}
    />
  )
}
