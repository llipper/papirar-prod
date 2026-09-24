<div align="center">

<img src="https://raw.githubusercontent.com/llipper/papirar-prod/main/public/logo__dark.svg" width="86" alt="Papirar" />

# Papirar

### Estudo jurídico, mais inteligente.

Uma plataforma digital para organizar a leitura da legislação, acompanhar o estudo e transformar a lei seca em uma experiência moderna, acessível e focada.

[![Website](https://img.shields.io/badge/papirar.com-000000?style=for-the-badge&logo=googlechrome&logoColor=white)](https://papirar.com)
[![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-000000?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Cloudflare](https://img.shields.io/badge/Cloudflare-Workers-000000?style=for-the-badge&logo=cloudflare&logoColor=white)](https://www.cloudflare.com/)

</div>

---

## Sobre o projeto

**Papirar** é uma plataforma de estudos jurídicos criada para tornar o contato com a legislação mais organizado, prático e contínuo.

O projeto reúne leitura estruturada da lei, recursos de estudo, acompanhamento de progresso e uma experiência pensada para estudantes de Direito, candidatos à OAB e concurseiros.

Este repositório contém a aplicação web e serviços que fazem parte da infraestrutura atual do produto.

> O Papirar é um produto em desenvolvimento contínuo. Recursos, arquitetura e integrações podem evoluir ao longo do projeto.

---

## Experiência do produto

O Papirar foi projetado em torno de uma ideia simples: **reduzir o atrito entre o estudante e a legislação**.

A plataforma trabalha com uma interface limpa e responsiva para oferecer:

- leitura organizada de legislação;
- navegação estruturada por conteúdos jurídicos;
- reprodução de conteúdo em áudio;
- marcações e anotações durante o estudo;
- acompanhamento de progresso;
- autenticação e gerenciamento de conta;
- experiência adaptada para desktop e dispositivos móveis;
- temas claro e escuro;
- recursos premium e fluxo de assinatura.

---

## Stack principal

<div align="center">

<img src="https://skillicons.dev/icons?i=ts,nextjs,react,tailwind,firebase,cloudflare,vercel,git,github&theme=dark" alt="Papirar technology stack" />

</div>

| Camada | Tecnologia |
| --- | --- |
| Frontend | Next.js 16 + React 19 |
| Linguagem | TypeScript |
| UI | Tailwind CSS 4 + shadcn/ui + Base UI |
| Autenticação | Firebase |
| API / Edge | Cloudflare Workers |
| Deploy web | Vercel |
| Gráficos | Recharts |
| Tema | next-themes |
| Qualidade | ESLint + Prettier + TypeScript |

---

## Arquitetura

```text
                           ┌─────────────────────┐
                           │       Usuário       │
                           └──────────┬──────────┘
                                      │
                                      ▼
                           ┌─────────────────────┐
                           │   Next.js / React   │
                           │     Web Client      │
                           └──────────┬──────────┘
                                      │
                    ┌─────────────────┼─────────────────┐
                    │                 │                 │
                    ▼                 ▼                 ▼
             ┌────────────┐   ┌──────────────┐   ┌──────────────┐
             │  Firebase  │   │  Next.js API │   │  Cloudflare  │
             │    Auth    │   │    Routes    │   │   Workers    │
             └────────────┘   └──────────────┘   └──────┬───────┘
                                                       │
                                          ┌────────────┼────────────┐
                                          │            │            │
                                          ▼            ▼            ▼
                                       Dados        Assets       Serviços
```

A aplicação mantém responsabilidades separadas entre interface, autenticação, rotas da aplicação e serviços executados na infraestrutura Cloudflare.

---

## Estrutura do repositório

```text
papirar-prod/
├── app/                    # Next.js App Router
│   ├── api/                # Rotas server-side da aplicação
│   ├── dashboard/          # Área autenticada
│   ├── login/              # Autenticação
│   ├── signup/             # Cadastro
│   ├── recuperar-senha/    # Recuperação de conta
│   ├── assinar/            # Fluxo de assinatura
│   ├── privacidade/        # Política de privacidade
│   └── termos/             # Termos de uso
│
├── components/             # Componentes reutilizáveis
├── hooks/                  # React hooks
├── lib/                    # Serviços, helpers e integrações
├── public/                 # Assets públicos e identidade visual
│
├── cloudflare-worker/
│   ├── src/                # Backend executado no Cloudflare Workers
│   └── migrations/         # Migrações da infraestrutura associada
│
├── next.config.ts
├── proxy.ts
├── tsconfig.json
└── package.json
```

---

## Desenvolvimento local

### Requisitos

- Node.js 20+
- npm
- credenciais válidas para os serviços utilizados pelo projeto

### Instalação

```bash
git clone https://github.com/llipper/papirar-prod.git
cd papirar-prod
npm install
```

Configure as variáveis de ambiente necessárias em um arquivo local apropriado, sem versionar credenciais ou segredos.

Depois execute:

```bash
npm run dev
```

A aplicação ficará disponível, por padrão, em:

```text
http://localhost:3000
```

---

## Scripts

```bash
npm run dev
```

Inicia o ambiente de desenvolvimento.

```bash
npm run build
```

Gera a build de produção.

```bash
npm run start
```

Executa a build de produção localmente.

```bash
npm run lint
```

Executa a análise estática com ESLint.

```bash
npm run typecheck
```

Valida os tipos TypeScript sem gerar arquivos.

```bash
npm run format
```

Formata os arquivos TypeScript e TSX com Prettier.

---

## Interface

A identidade do Papirar segue uma direção visual minimalista, com alto contraste, tipografia limpa e foco no conteúdo jurídico.

<div align="center">

<img src="https://raw.githubusercontent.com/llipper/papirar-prod/main/public/og-papirar.png" width="760" alt="Papirar" />

</div>

---

## Segurança

Segurança faz parte da arquitetura do produto e deve ser considerada em qualquer contribuição ou alteração.

Alguns princípios adotados no projeto incluem:

- autenticação centralizada;
- autorização validada no backend;
- separação entre código cliente e serviços privilegiados;
- proteção de credenciais por variáveis de ambiente/secrets;
- validação de entrada nas APIs;
- políticas de segurança HTTP;
- limitação de exposição de recursos privados;
- revisão contínua de dependências e infraestrutura.

**Nunca envie tokens, chaves privadas, credenciais, arquivos `.env` ou segredos para o repositório.**

Se uma vulnerabilidade for identificada, evite publicá-la diretamente em uma issue pública enquanto houver risco para usuários ou infraestrutura.

---

## Status

```text
PRODUCT       ███████████████████░  Em evolução
WEB           ████████████████████  Ativo
BACKEND       ███████████████████░  Em evolução
MOBILE        ████████████░░░░░░░░  Em desenvolvimento
CONTENT       █████████████████░░░  Expansão contínua
```

O Papirar é desenvolvido de forma incremental, com melhorias contínuas de produto, conteúdo, arquitetura, segurança e experiência do usuário.

---

## Roadmap

```text
Papirar
│
├── Legislação organizada
├── Áudio jurídico
├── Marcações e anotações
├── Progresso de estudo
│
├── Questões
├── Simulados
├── Materiais de estudo
├── Estatísticas
│
└── Evolução da experiência de aprendizagem
```

O roadmap representa a direção geral do produto e pode mudar conforme desenvolvimento e validação das funcionalidades.

---

## Contribuição

O desenvolvimento principal do Papirar é mantido pelo projeto. Antes de propor alterações significativas, abra uma discussão ou issue descrevendo claramente o problema e a solução proposta.

Ao contribuir:

1. mantenha o padrão existente do projeto;
2. execute `npm run lint`;
3. execute `npm run typecheck`;
4. teste a alteração antes de enviar;
5. não inclua dados sensíveis ou credenciais no commit.

---

## Autor

**Regy Felipe**  
Founder & Software Developer — Papirar

[![GitHub](https://img.shields.io/badge/GitHub-llipper-000000?style=flat-square&logo=github)](https://github.com/llipper)
[![Papirar](https://img.shields.io/badge/Web-papirar.com-000000?style=flat-square)](https://papirar.com)

---

## Licença e uso

Este repositório contém código e recursos associados ao produto **Papirar**.

A disponibilização pública do código-fonte no GitHub **não implica, por si só, autorização irrestrita para copiar, redistribuir, comercializar ou utilizar a identidade visual, marca, conteúdo ou partes proprietárias do produto**.

Consulte o responsável pelo projeto antes de reutilizar o código ou os ativos fora das permissões expressamente concedidas.

---

<div align="center">

### papirar

**Disciplina. Evolução. Resultados.**

[Website](https://papirar.com) · [Repository](https://github.com/llipper/papirar-prod) · [Developer](https://github.com/llipper)

</div>
