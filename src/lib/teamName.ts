/**
 * Deriva o nome do TIME a partir do nome do produto.
 *
 * O campo `team` do banco está inconsistente: vários produtos trazem
 * "Personalizado"/"Personalizados" ou até o time errado. Como o nome do
 * produto sempre contém o clube/seleção ("Camiseta - Barcelona 2012/13 - Home"),
 * usamos ele como fonte de verdade para o pequeno título acima do título.
 */

const GENERIC_TEAMS = new Set([
  "personalizado",
  "personalizados",
  "personalizada",
  "personalizadas",
  "time",
  "times",
  "outros",
  "outro",
  "geral",
  "diversos",
  "europeus",
  "brasileiros",
  "selecoes",
  "selecao",
  "retro",
  "retros",
  "camiseta",
  "camisetas",
  "",
]);

/** Palavras que descrevem a camiseta, não o time. */
const NOISE = [
  "home",
  "away",
  "third",
  "terceira",
  "terceiro",
  "titular",
  "alternativa",
  "alternativo",
  "reserva",
  "visitante",
  "goleiro",
  "retro",
  "edicao",
  "especial",
  "ornamental",
  "marmoreada",
  "manga",
  "longa",
  "curta",
  "branca",
  "branco",
  "preta",
  "preto",
  "azul",
  "vermelha",
  "vermelho",
  "verde",
  "amarela",
  "amarelo",
  "grena",
  "rosa",
  "cinza",
  "dourada",
  "tricolor",
  "marinho",
  "camiseta",
  "camisa",
];

/** Nomes curtos/comerciais -> nome oficial exibido. */
const ALIASES: Record<string, string> = {
  brasil: "Seleção Brasileira",
  "selecao brasileira": "Seleção Brasileira",
  argentina: "Seleção Argentina",
  espanha: "Seleção Espanhola",
  inglaterra: "Seleção Inglesa",
  franca: "Seleção Francesa",
  alemanha: "Seleção Alemã",
  italia: "Seleção Italiana",
  portugal: "Seleção Portuguesa",
  holanda: "Seleção Holandesa",
  nigeria: "Seleção da Nigéria",
  jamaica: "Seleção da Jamaica",
  palestina: "Seleção Palestina",
  suica: "Seleção Suíça",
  japao: "Seleção Japonesa",
  noruega: "Seleção Norueguesa",
  paraguai: "Seleção Paraguaia",
  "cabo verde": "Seleção Cabo Verde",
  psg: "Paris Saint-Germain",
  barcelona: "FC Barcelona",
  milan: "AC Milan",
  roma: "AS Roma",
  monaco: "AS Monaco",
  lyon: "Olympique Lyonnais",
  lille: "LOSC Lille",
  napoli: "SSC Napoli",
  parma: "Parma AC",
  tottenham: "Tottenham Hotspur",
  chelsea: "Chelsea FC",
  vasco: "Vasco da Gama",
  remo: "Clube do Remo",
  mirassol: "Mirassol FC",
  "sao paulo": "São Paulo",
  fluminese: "Fluminense",
  "inter de milao": "Inter de Milão",
  "atletico de madrid": "Atlético de Madrid",
  "manchester united": "Manchester United",
  "manchester city": "Manchester City",
  "corinthians sao jorge": "Corinthians",
};

const deaccent = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

/** Remove anos, temporadas e palavras descritivas de um trecho. */
function cleanSegment(segment: string): string {
  return segment
    .replace(/\b(19|20)\d{2}\s*[\/-]\s*\d{2,4}\b/g, " ")
    .replace(/\b\d{2}\s*\/\s*\d{2}\b/g, " ")
    .replace(/\b(19|20)\d{2}\b/g, " ")
    .split(/\s+/)
    .filter((w) => w && !NOISE.includes(deaccent(w.replace(/[^\p{L}]/gu, ""))))
    .join(" ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

/** Extrai o nome do time a partir do nome do produto. */
export function deriveTeamFromName(rawName?: string | null): string {
  const name = String(rawName ?? "").trim();
  if (!name) return "";

  const withoutPrefix = name.replace(/^\s*camisetas?\s*(de|do|da)?\s*[-–—]?\s*/i, " ");

  const segments = withoutPrefix
    .split(/[-–—]/)
    .map((s) => cleanSegment(s))
    .filter(Boolean);

  let candidate = segments[0] || cleanSegment(withoutPrefix);
  candidate = candidate.replace(/[,.;]+$/, "").trim();
  if (!candidate) return "";

  const alias = ALIASES[deaccent(candidate)];
  if (alias) return alias;

  const semSelecao = deaccent(candidate).replace(/^selecao\s+/, "");
  if (semSelecao !== deaccent(candidate) && ALIASES[semSelecao]) return ALIASES[semSelecao];

  return candidate;
}

/** True quando o `team` cadastrado é genérico e não representa um clube. */
export function isGenericTeam(team?: string | null): boolean {
  return GENERIC_TEAMS.has(deaccent(String(team ?? "")));
}

/**
 * Nome do time exibido acima do título do produto.
 * Prioriza o nome do produto (fonte confiável) e cai para o campo do banco.
 */
export function resolveTeamName(team?: string | null, productName?: string | null): string {
  const derived = deriveTeamFromName(productName);
  const current = String(team ?? "").trim();

  if (!derived) return isGenericTeam(current) ? "" : current;
  if (!current || isGenericTeam(current)) return derived;

  const a = deaccent(current);
  const b = deaccent(derived);
  if (a === b || a.includes(b) || b.includes(a)) return current;

  return derived;
}
