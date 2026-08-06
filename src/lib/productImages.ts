/**
 * Fonte única de verdade para os campos de imagem dos produtos.
 *
 * O banco (tabela `produtos`) guarda a imagem principal em DUAS colunas por
 * compatibilidade histórica (`imagem_url` e `image`) e a galeria em `images`
 * (texto JSON). Além disso, versões antigas do admin embutiam a galeria dentro
 * da descrição via `<!-- GALLERY:{...} -->`.
 *
 * Todas as páginas (vitrine, categoria, página de compra, checkout) devem usar
 * estes helpers para ler imagens, evitando divergência entre telas.
 */

export const GALLERY_META_REGEX = /<!-- GALLERY:([\s\S]*?) -->/;

/** Converte `images` / `videos` (string JSON, array ou null) em array de strings. */
export function parseMediaList(raw: unknown): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.filter(Boolean) as string[];
  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (!trimmed) return [];
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) return parsed.filter(Boolean) as string[];
      if (typeof parsed === "string" && parsed) return [parsed];
    } catch (_) {
      return [trimmed];
    }
  }
  return [];
}

/** Lê a meta `<!-- GALLERY:{...} -->` embutida na descrição (fallback legado). */
export function parseGalleryMeta(description?: string | null): {
  images: string[];
  videos: string[];
  sizes?: string[];
} {
  const match = (description || "").match(GALLERY_META_REGEX);
  if (!match || !match[1]) return { images: [], videos: [] };
  try {
    const meta = JSON.parse(match[1]);
    return {
      images: Array.isArray(meta.images) ? meta.images.filter(Boolean) : [],
      videos: Array.isArray(meta.videos) ? meta.videos.filter(Boolean) : [],
      sizes: Array.isArray(meta.sizes) ? meta.sizes : undefined,
    };
  } catch (_) {
    return { images: [], videos: [] };
  }
}

/** Remove a meta de galeria da descrição exibida ao cliente. */
export function cleanDescription(description?: string | null): string {
  return (description || "").replace(/<!-- GALLERY:[\s\S]*? -->/g, "").trim();
}

/** Imagem principal de um registro do banco (mesma regra em todas as páginas). */
export function getMainImage(row: any): string {
  if (!row) return "";
  const direct = row.imagem_url || row.image || "";
  if (direct) return direct;
  const gallery = parseMediaList(row.images);
  if (gallery.length > 0) return gallery[0];
  return parseGalleryMeta(row.description).images[0] || "";
}

/** Galeria completa (imagem principal sempre em primeiro lugar, sem duplicatas). */
export function getGalleryImages(row: any): string[] {
  if (!row) return [];
  let imgs = parseMediaList(row.images);
  if (imgs.length <= 1) {
    const meta = parseGalleryMeta(row.description).images;
    if (meta.length > imgs.length) imgs = meta;
  }
  const main = row.imagem_url || row.image || "";
  if (main) imgs = [main, ...imgs.filter((i) => i !== main)];
  return Array.from(new Set(imgs.filter(Boolean)));
}

/** Vídeos do produto (coluna `videos` ou meta de galeria). */
export function getGalleryVideos(row: any): string[] {
  if (!row) return [];
  const vids = parseMediaList(row.videos);
  if (vids.length > 0) return vids;
  return parseGalleryMeta(row.description).videos;
}

const STORE_CONFIG_ID = "00000000-0000-0000-0000-000000000000";

/** Registros que NÃO são produtos de vitrine (config da loja e links dinâmicos). */
export function isVitrineRow(row: any): boolean {
  if (!row) return false;
  if (row.id === "store_config" || row.id === STORE_CONFIG_ID) return false;
  if (row.nome === "store_config" || row.tipo === "config") return false;
  if (row.tipo === "dinamico" || row.category === "dinamico" || row.team === "Link Dinâmico") return false;
  return true;
}

/**
 * Converte um registro do banco no formato usado pelos componentes de UI.
 * Usado por vitrine, categoria e página de compra para garantir os MESMOS campos.
 */
export function normalizeDbProduct(row: any, categoryOverride?: string) {
  const priceNum = parseFloat(String(row.preco ?? 0)) || 0;
  const category = categoryOverride
    ? [categoryOverride]
    : Array.isArray(row.category)
      ? row.category
      : [row.category || "europeus"];

  return {
    id: row.id,
    name: row.nome || row.name || "",
    team: row.team || "Time",
    price: `R$ ${priceNum.toFixed(2).replace(".", ",")}`,
    priceNum,
    image: getMainImage(row),
    images: getGalleryImages(row),
    videos: getGalleryVideos(row),
    sizes: parseMediaList(row.sizes).length > 0 ? parseMediaList(row.sizes) : ["P", "M", "G", "GG", "XGG"],
    category,
    description: cleanDescription(row.description) || "Sem descrição cadastrada.",
  };
}

/** Junta produtos do banco com o catálogo estático, sem duplicar IDs (banco vence). */
export function mergePreferDb<A extends { id?: string }, B extends { id?: string }>(
  dbList: A[],
  staticList: B[],
): Array<A | B> {
  const dbIds = new Set(dbList.map((p) => p.id).filter(Boolean));
  return [...dbList, ...staticList.filter((p) => !p.id || !dbIds.has(p.id))] as Array<A | B>;
}
