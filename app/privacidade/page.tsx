import { LegalPage } from "@/components/legal/legal-page"

export default function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="Transparência"
      title="Política de Privacidade"
      description="Este documento explica, em linguagem clara, como o Papirar trata os dados necessários para oferecer leitura, marcações, anotações e progresso de estudo."
      sections={[
        {
          title: "1. Quem somos",
          paragraphs: [
            "O Papirar é uma plataforma de estudo e leitura jurídica. A identificação completa da entidade responsável, seu CNPJ e o canal oficial do encarregado devem ser informados nesta página antes do lançamento público.",
          ],
        },
        {
          title: "2. Dados tratados",
          paragraphs: [
            "Tratamos dados de cadastro e autenticação, como nome, e-mail e identificadores técnicos da conta. Também armazenamos os dados que você escolhe criar no produto, como perfil, marcações, anotações e progresso de leitura.",
            "Podemos registrar informações técnicas mínimas de segurança e funcionamento, como eventos de autenticação, erros, dispositivo e endereço IP, conforme a configuração do provedor de infraestrutura.",
          ],
        },
        {
          title: "3. Finalidades e bases legais",
          paragraphs: [
            "Usamos esses dados para criar e proteger sua conta, sincronizar seu estudo entre dispositivos, salvar suas preferências, oferecer suporte e manter a segurança da plataforma. O tratamento é baseado na execução do serviço solicitado, no cumprimento de obrigações legais e no legítimo interesse de segurança e melhoria do produto, quando aplicável.",
          ],
        },
        {
          title: "4. Compartilhamento e armazenamento",
          paragraphs: [
            "Utilizamos provedores de infraestrutura, autenticação, banco de dados e armazenamento necessários para operar o Papirar. Esses fornecedores recebem apenas os dados necessários para executar seus serviços e devem aplicar medidas de segurança compatíveis com sua função.",
            "Não vendemos dados pessoais. Não compartilhamos o conteúdo das suas anotações ou marcações para publicidade comportamental.",
          ],
        },
        {
          title: "5. Segurança e retenção",
          paragraphs: [
            "Aplicamos controle de acesso por usuário, políticas de segurança no banco de dados, proteção de sessão e headers de segurança na aplicação. Nenhum serviço conectado à internet é absolutamente imune a riscos; por isso, mantenha sua senha única e não compartilhe seus tokens.",
            "Mantemos os dados enquanto a conta estiver ativa ou enquanto forem necessários para as finalidades descritas. Você pode solicitar exclusão da conta e dos dados, respeitadas as obrigações legais de retenção.",
          ],
        },
        {
          title: "6. Seus direitos",
          paragraphs: [
            "Nos termos da LGPD, você pode solicitar confirmação de tratamento, acesso, correção, atualização, portabilidade quando aplicável, eliminação, informação sobre compartilhamentos e revisão de decisões automatizadas, além de revogar consentimentos quando essa for a base legal.",
            "O canal oficial para exercer esses direitos deve ser informado nesta página antes da publicação definitiva.",
          ],
        },
        {
          title: "7. Alterações",
          paragraphs: [
            "Esta política pode ser atualizada para refletir mudanças no produto, na legislação ou nos provedores utilizados. A data da última atualização ficará sempre indicada no início do documento.",
          ],
        },
      ]}
    />
  )
}
