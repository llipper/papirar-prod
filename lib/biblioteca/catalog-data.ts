export type BibliotecaCategory =
  | "Constitucional"
  | "Códigos"
  | "Estatutos"
  | "Leis"
  | "Direitos Humanos"
  | "Proteção de Dados"

export type BibliotecaBook = {
  id: string
  title: string
  acronym: string
  category: BibliotecaCategory
  updatedAt: string
  lawId?: string
  version?: string
  scope?: string
}

export const bibliotecaCategories: BibliotecaCategory[] = [
  "Constitucional",
  "Códigos",
  "Estatutos",
  "Leis",
  "Direitos Humanos",
  "Proteção de Dados",
]

export const bibliotecaBooks: BibliotecaBook[] = [
  ["1", "Constituição Federal de 1988", "CF/88", "Constitucional", "2024", "constituicao_federal", "2026-08-21", "preambulo"],
  ["2", "Código Civil", "CC", "Códigos", "2024"],
  ["3", "Código de Processo Civil", "CPC", "Códigos", "2024"],
  ["4", "Código Penal", "CP", "Códigos", "2026", "codigo_penal", "2026-08-21", "parte_geral.titulo_1"],
  ["5", "Código de Processo Penal", "CPP", "Códigos", "2026", "codigo_processo_penal", "2026-08-22", "livro_1.titulo_1"],
  ["6", "Código Penal Militar", "CPM", "Códigos", "2026", "codigo_penal_militar", "2026-08-22", "codigo_penal_militar"],
  ["7", "Código de Processo Penal Militar", "CPPM", "Códigos", "2026", "codigo_processo_penal_militar", "2026-08-22", "codigo_processo_penal_militar"],
  ["8", "Código de Trânsito Brasileiro", "CTB", "Códigos", "2024"],
  ["9", "Estatuto da Criança e do Adolescente", "ECA", "Estatutos", "2024"],
  ["10", "Estatuto do Desarmamento", "Lei 10.826", "Estatutos", "2024"],
  ["11", "Estatuto dos Militares", "Lei 6.880", "Estatutos", "2024"],
  ["12", "Estatuto da Igualdade Racial", "Lei 12.288", "Estatutos", "2024"],
  ["13", "Estatuto da Pessoa com Deficiência", "Lei 13.146", "Estatutos", "2024"],
  ["14", "Estatuto do Idoso", "Lei 10.741", "Estatutos", "2024"],
  ["15", "Lei 8.112 - Servidores Públicos Federais", "Lei 8.112", "Leis", "2026"],
  ["16", "Lei 9.784 - Processo Administrativo Federal", "Lei 9.784", "Leis", "2026"],
  ["17", "Lei 14.133 - Licitações e Contratos", "Lei 14.133", "Leis", "2026"],
  ["18", "Lei 8.429 - Improbidade Administrativa", "Lei 8.429", "Leis", "2026"],
  ["19", "Lei 12.527 - Acesso à Informação", "LAI", "Leis", "2026"],
  ["20", "Lei 12.846 - Anticorrupção", "Lei 12.846", "Leis", "2026"],
  ["21", "Lei 13.709 - LGPD", "LGPD", "Proteção de Dados", "2026"],
  ["22", "Lei 7.210 - Execução Penal", "LEP", "Leis", "2024"],
  ["23", "Lei 8.072 - Crimes Hediondos", "Lei 8.072", "Leis", "2024"],
  ["24", "Lei 9.455 - Tortura", "Lei 9.455", "Leis", "2024"],
  ["25", "Lei 9.613 - Lavagem de Dinheiro", "Lei 9.613", "Leis", "2024"],
  ["26", "Lei 11.340 - Maria da Penha", "Lei 11.340", "Leis", "2024"],
  ["27", "Lei 11.343 - Drogas", "Lei 11.343", "Leis", "2024"],
  ["28", "Lei 12.850 - Organizações Criminosas", "Lei 12.850", "Leis", "2024"],
  ["29", "Lei 12.965 - Marco Civil da Internet", "Lei 12.965", "Leis", "2024"],
  ["30", "Lei 13.303 - Estatais", "Lei 13.303", "Leis", "2024"],
  ["31", "Lei 13.869 - Abuso de Autoridade", "Lei 13.869", "Leis", "2024"],
  ["32", "Convenção Americana de Direitos Humanos", "CADH", "Direitos Humanos", "2026"],
  ["33", "Pacto Internacional dos Direitos Civis e Políticos", "PIDCP", "Direitos Humanos", "2026"],
  ["34", "Pacto Internacional dos Direitos Econômicos, Sociais e Culturais", "PIDESC", "Direitos Humanos", "2026"],
  ["35", "Convenção Contra a Tortura", "CCT", "Direitos Humanos", "2026"],
  ["36", "Convenção sobre os Direitos das Pessoas com Deficiência", "CDPD", "Direitos Humanos", "2026"],
  ["37", "Declaração Universal dos Direitos Humanos", "DUDH", "Direitos Humanos", "2024"],
].map(([id, title, acronym, category, updatedAt, lawId, version, scope]) => ({
  id,
  title,
  acronym,
  category: category as BibliotecaCategory,
  updatedAt,
  lawId,
  version,
  scope,
}))
