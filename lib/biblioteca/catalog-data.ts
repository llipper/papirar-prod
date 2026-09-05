export type BibliotecaCategory =
  | "Constitucional"
  | "Códigos"
  | "Estatutos"
  | "Leis"
  | "Direitos Humanos"
  | "Proteção de Dados"

export type BibliotecaReadingPresentation = "legislation" | "treaty"

export type BibliotecaBook = {
  id: string
  title: string
  acronym: string
  category: BibliotecaCategory
  updatedAt: string
  coverPath?: string
  lawId?: string
  version?: string
  scope?: string
  readingPresentation?: BibliotecaReadingPresentation
}

export const bibliotecaCategories: BibliotecaCategory[] = [
  "Constitucional",
  "Códigos",
  "Estatutos",
  "Leis",
  "Direitos Humanos",
  "Proteção de Dados",
]

const coverByBookId: Record<string, string> = {
  "1": "/capas/constituicao_federal.png",
  "2": "/capas/codigo_civil.png",
  "3": "/capas/codigo_processo_civil.png",
  "4": "/capas/direito_penal.png",
  "5": "/capas/direito_processual_penal.png",
  "6": "/capas/codigo_penal_militar.png",
  "7": "/capas/codigo_processual_penal_militar.png",
  "8": "/capas/codigo_transito_brasileiro.png",
  "9": "/capas/estatuto_crianca_adolescente.png",
  "10": "/capas/estatuto_desarmamento.png",
  "11": "/capas/estatuto_militares.png",
  "12": "/capas/estatuto_igualdade_racial.png",
  "13": "/capas/estatuto_pessoa_com_deficiencia.png",
  "14": "/capas/estatuto_idoso.png",
  "15": "/capas/Lei 8.112.png",
  "16": "/capas/Lei 9.784.png",
  "17": "/capas/Lei 14.133.png",
  "18": "/capas/Lei 8.429.png",
  "19": "/capas/Lei 12.527.png",
  "20": "/capas/Lei 12.846.png",
  "21": "/capas/Lei 13.709.png",
  "22": "/capas/Lei 7.210.png",
  "23": "/capas/Lei 8.072.png",
  "24": "/capas/Lei 9.455.png",
  "25": "/capas/Lei 9.613.png",
  "26": "/capas/lei_maria_penha.png",
  "27": "/capas/Lei 11.343.png",
  "28": "/capas/Lei 12.850.png",
  "29": "/capas/Lei 12.965.png",
  "30": "/capas/Lei 13.303.png",
  "31": "/capas/Lei 13.869.png",
  "32": "/capas/Convenção Americana de Direitos Humanos.png",
  "33": "/capas/Pacto Internacional dos Direitos Civis e Políticos.png",
  "34": "/capas/Pacto Internacional dos Direitos Econômicos, Sociais e Culturais.png",
  "35": "/capas/Convenção Contra a Tortura.png",
  "36": "/capas/Convenção sobre os Direitos das Pessoas com Deficiência.png",
}

// Incrementar quando uma capa for substituída mantendo o mesmo nome do arquivo.
const COVER_ASSET_VERSION = "2026-08-30-01"
const SUPABASE_STORAGE_BUCKET = "capas"
const SUPABASE_STORAGE_BASE = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "")

// O Storage não aceita acentos em chaves de objetos. O nome exibido no catálogo
// continua igual; somente o nome físico do arquivo é normalizado no bucket.
const storageCoverNameByLocalName: Record<string, string> = {
  "Convenção Americana de Direitos Humanos.png":
    "convencao_americana_direitos_humanos.png",
  "Convenção Contra a Tortura.png": "convencao_contra_tortura.png",
  "Convenção sobre os Direitos das Pessoas com Deficiência.png":
    "convencao_direitos_pessoas_deficiencia.png",
  "Pacto Internacional dos Direitos Civis e Políticos.png":
    "pacto_internacional_direitos_civis_politicos.png",
  "Pacto Internacional dos Direitos Econômicos, Sociais e Culturais.png":
    "pacto_internacional_direitos_economicos_sociais_culturais.png",
}

function coverSource(localPath: string) {
  const localName = localPath.replace(/^\/capas\//, "")
  const storageName = storageCoverNameByLocalName[localName] ?? localName
  if (!SUPABASE_STORAGE_BASE) {
    return `${localPath}?v=${COVER_ASSET_VERSION}`
  }
  return `${SUPABASE_STORAGE_BASE}/storage/v1/object/public/${SUPABASE_STORAGE_BUCKET}/${encodeURIComponent(storageName)}?v=${COVER_ASSET_VERSION}`
}

export const bibliotecaBooks: BibliotecaBook[] = [
  [
    "1",
    "Constituição Federal de 1988",
    "CF/88",
    "Constitucional",
    "2024",
    "constituicao_federal",
    "2026-08-21",
    "preambulo",
  ],
  ["2", "Código Civil", "CC", "Códigos", "2024"],
  ["3", "Código de Processo Civil", "CPC", "Códigos", "2024"],
  [
    "4",
    "Código Penal",
    "CP",
    "Códigos",
    "2026",
    "codigo_penal",
    "2026-08-21",
    "parte_geral.titulo_1",
  ],
  [
    "5",
    "Código de Processo Penal",
    "CPP",
    "Códigos",
    "2026",
    "codigo_processo_penal",
    "2026-08-22",
    "livro_1.titulo_1",
  ],
  [
    "6",
    "Código Penal Militar",
    "CPM",
    "Códigos",
    "2026",
    "codigo_penal_militar",
    "2026-08-22",
    "codigo_penal_militar",
  ],
  [
    "7",
    "Código de Processo Penal Militar",
    "CPPM",
    "Códigos",
    "2026",
    "codigo_processo_penal_militar",
    "2026-08-22",
    "codigo_processo_penal_militar",
  ],
  ["8", "Código de Trânsito Brasileiro", "CTB", "Códigos", "2024"],
  [
    "9",
    "Estatuto da Criança e do Adolescente",
    "ECA",
    "Estatutos",
    "2026",
    "eca",
    "2026-08-26",
    "titulo_1",
  ],
  [
    "10",
    "Estatuto do Desarmamento",
    "Lei 10.826",
    "Estatutos",
    "2026",
    "estatuto_desarmamento",
    "2026-08-26",
    "capitulo_1",
  ],
  [
    "11",
    "Estatuto dos Militares",
    "Lei 6.880",
    "Estatutos",
    "2026",
    "estatuto_militares",
    "2026-08-26",
    "titulo_1.capitulo_1",
  ],
  [
    "12",
    "Estatuto da Igualdade Racial",
    "Lei 12.288",
    "Estatutos",
    "2026",
    "estatuto_igualdade_racial",
    "2026-08-26",
    "titulo_1",
  ],
  [
    "13",
    "Estatuto da Pessoa com Deficiência",
    "Lei 13.146",
    "Estatutos",
    "2026",
    "estatuto_pessoa_deficiencia",
    "2026-08-26",
    "parte_geral.titulo_1.capitulo_1",
  ],
  [
    "14",
    "Estatuto da Pessoa Idosa",
    "Lei 10.741",
    "Estatutos",
    "2026",
    "estatuto_idoso",
    "2026-08-26",
    "titulo_1",
  ],
  [
    "15",
    "Lei 8.112 - Servidores Públicos Federais",
    "Lei 8.112",
    "Leis",
    "2026",
    "lei_8112",
    "2026-08-27",
    "titulo_1",
  ],
  [
    "16",
    "Lei 9.784 - Processo Administrativo Federal",
    "Lei 9.784",
    "Leis",
    "2026",
    "lei_9784",
    "2026-08-28",
    "documento_completo",
  ],
  ["17", "Lei 14.133 - Licitações e Contratos", "Lei 14.133", "Leis", "2026", "lei_14133", "2026-08-29", "titulo_1"],
  ["18", "Lei 8.429 - Improbidade Administrativa", "Lei 8.429", "Leis", "2026", "lei_8429", "2026-08-28", "lei_8429"],
  ["19", "Lei 12.527 - Acesso à Informação", "LAI", "Leis", "2026", "lei_12527", "2011-11-18", "capitulo_6"],
  ["20", "Lei 12.846 - Anticorrupção", "Lei 12.846", "Leis", "2026", "lei_12846", "2026-08-28", "capitulo_1"],
  ["21", "Lei 13.709 - LGPD", "LGPD", "Proteção de Dados", "2026", "lei_13709", "2026-08-28", "capitulo_10"],
  ["22", "Lei 7.210 - Execução Penal", "LEP", "Leis", "2024", "lei_7210", "1984-07-11", "titulo_9"],
  ["23", "Lei 8.072 - Crimes Hediondos", "Lei 8.072", "Leis", "2024", "lei_8072", "1990-07-25", "documento_completo"],
  ["24", "Lei 9.455 - Tortura", "Lei 9.455", "Leis", "2024", "lei_9455", "1997-04-07", "documento_completo"],
  ["25", "Lei 9.613 - Lavagem de Dinheiro", "Lei 9.613", "Leis", "2024", "lei_9613", "1998-03-03", "documento_completo"],
  [
    "26",
    "Lei 11.340 - Maria da Penha",
    "Lei 11.340",
    "Leis",
    "2026",
    "lei_maria_penha",
    "2026-08-25",
    "titulo_1",
  ],
  [
    "27",
    "Lei 11.343 - Drogas",
    "Lei 11.343",
    "Leis",
    "2026",
    "lei_drogas",
    "2026-08-25",
    "titulo_1",
  ],
  ["28", "Lei 12.850 - Organizações Criminosas", "Lei 12.850", "Leis", "2024", "lei_12850", "2013-08-02", "documento_completo"],
  ["29", "Lei 12.965 - Marco Civil da Internet", "Lei 12.965", "Leis", "2024", "lei_12965", "2014-04-23", "documento_completo"],
  ["30", "Lei 13.303 - Estatais", "Lei 13.303", "Leis", "2024", "lei_13303", "2026-08-29", "titulo_1"],
  ["31", "Lei 13.869 - Abuso de Autoridade", "Lei 13.869", "Leis", "2024", "lei_13869", "2026-08-28", "promulgacao_partes_vetadas"],
  [
    "32",
    "Convenção Americana de Direitos Humanos",
    "CADH",
    "Direitos Humanos",
    "2026",
    "convencao_americana_direitos_humanos",
    "2026-08-27",
    "decreto_678",
    "treaty",
  ],
  [
    "33",
    "Pacto Internacional dos Direitos Civis e Políticos",
    "PIDCP",
    "Direitos Humanos",
    "2026",
    "pacto_internacional_direitos_civis_politicos",
    "2026-08-27",
    "decreto_592",
    "treaty",
  ],
  [
    "34",
    "Pacto Internacional dos Direitos Econômicos, Sociais e Culturais",
    "PIDESC",
    "Direitos Humanos",
    "2026",
    "pacto_internacional_direitos_economicos_sociais_culturais",
    "2026-08-27",
    "decreto_591",
    "treaty",
  ],
  [
    "35",
    "Convenção Contra a Tortura",
    "CCT",
    "Direitos Humanos",
    "2026",
    "convencao_contra_tortura",
    "2026-08-27",
    "decreto_40",
    "treaty",
  ],
  [
    "36",
    "Convenção sobre os Direitos das Pessoas com Deficiência",
    "CDPD",
    "Direitos Humanos",
    "2026",
    "convencao_direitos_pessoas_deficiencia",
    "2026-08-28",
    "decreto_6949",
    "treaty",
  ],
  [
    "37",
    "Declaração Universal dos Direitos Humanos",
    "DUDH",
    "Direitos Humanos",
    "2024",
    "declaracao_universal_direitos_humanos",
    "1948-12-10",
    "documento_completo",
    "treaty",
  ],
  [
    "38",
    "Livro de Teste — Estrutura Editorial",
    "TESTE",
    "Leis",
    "2026",
    "livro_teste",
    "2026-08-30",
    "documento_completo",
  ],
].map(
  ([
    id,
    title,
    acronym,
    category,
    updatedAt,
    lawId,
    version,
    scope,
    readingPresentation,
  ]) => ({
    id,
    title,
    acronym,
    category: category as BibliotecaCategory,
    updatedAt,
    coverPath: coverByBookId[id] ? coverSource(coverByBookId[id]) : undefined,
    lawId,
    version,
    scope,
    readingPresentation: readingPresentation as
      BibliotecaReadingPresentation | undefined,
  })
)
