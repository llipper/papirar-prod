import { LegalPage } from "@/components/legal/legal-page"

export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="Uso responsável"
      title="Termos de Uso"
      description="Ao criar uma conta ou usar o Papirar, você concorda com as regras abaixo para utilização segura e responsável da plataforma."
      sections={[
        {
          title: "1. Sobre o serviço",
          paragraphs: [
            "O Papirar oferece ferramentas de leitura, organização, áudio, marcação, anotação e acompanhamento de estudos jurídicos. O conteúdo exibido tem finalidade educacional e informativa e não substitui orientação profissional, consulta à fonte oficial ou aconselhamento jurídico.",
          ],
        },
        {
          title: "2. Conta e segurança",
          paragraphs: [
            "Você deve fornecer informações verdadeiras, manter sua senha em sigilo e comunicar qualquer uso não autorizado da conta. Cada conta é pessoal; não compartilhe credenciais nem tente acessar dados de outros usuários.",
          ],
        },
        {
          title: "3. Conteúdo do usuário",
          paragraphs: [
            "Você continua responsável pelas anotações e demais conteúdos que criar. O Papirar usa esse conteúdo apenas para disponibilizar as funcionalidades solicitadas, sincronizar sua conta e proteger o serviço.",
            "É proibido inserir conteúdo ilícito, malicioso, que viole direitos de terceiros ou que tente explorar, sobrecarregar ou contornar os controles de segurança da plataforma.",
          ],
        },
        {
          title: "4. Conteúdo jurídico",
          paragraphs: [
            "Leis e materiais jurídicos podem sofrer alterações, revogações, erros de publicação ou diferenças entre versões. Confirme sempre a redação vigente em fonte oficial antes de tomar decisões acadêmicas, profissionais ou jurídicas.",
          ],
        },
        {
          title: "5. Disponibilidade e alterações",
          paragraphs: [
            "Buscamos manter o serviço disponível e os dados protegidos, mas podem ocorrer manutenções, indisponibilidade de provedores, atualizações ou falhas técnicas. Podemos alterar, suspender ou descontinuar funcionalidades, comunicando mudanças relevantes quando possível.",
          ],
        },
        {
          title: "6. Encerramento",
          paragraphs: [
            "Você pode deixar de usar o serviço e solicitar a exclusão da conta. O Papirar poderá suspender ou encerrar contas que violem estes termos, a legislação ou a segurança de outros usuários.",
          ],
        },
        {
          title: "7. Contato e legislação",
          paragraphs: [
            "Para suporte, dúvidas ou solicitações relacionadas a estes Termos, entre em contato pelo endereço suporte@papirar.com. A Política de Privacidade integra estes Termos de Uso. Aplica-se a legislação brasileira.",
          ],
        },
      ]}
    />
  )
}
