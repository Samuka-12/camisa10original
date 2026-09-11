import { supabase } from "./supabase";

const PRODUCTS_CACHE_KEY = "c10_products_cache_v2";
const PRODUCTS_CACHE_TTL_MS = 60_000;
const PRODUCTS_REQUEST_TIMEOUT_MS = 7_000;
const PRODUCT_FIELDS = "id,nome,name,team,preco,price,category,imagem_url,image,images,description,sizes,videos,tipo";

type ProductRow = Record<string, any>;

let memoryProducts: ProductRow[] | null = null;
let memoryProductsAt = 0;
let productsRequest: Promise<ProductRow[]> | null = null;

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = window.setTimeout(() => {
      reject(new Error(`Catálogo indisponível após ${timeoutMs}ms`));
    }, timeoutMs);

    promise.then(
      (value) => {
        window.clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        window.clearTimeout(timer);
        reject(error);
      },
    );
  });
}

function readSessionCache(): ProductRow[] | null {
  try {
    const raw = sessionStorage.getItem(PRODUCTS_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { at: number; data: ProductRow[] };
    if (!parsed?.at || Date.now() - parsed.at > PRODUCTS_CACHE_TTL_MS || !Array.isArray(parsed.data)) return null;
    return parsed.data;
  } catch {
    return null;
  }
}

function writeSessionCache(data: ProductRow[]) {
  try {
    sessionStorage.setItem(PRODUCTS_CACHE_KEY, JSON.stringify({ at: Date.now(), data }));
  } catch {
    // Storage can be unavailable in private browsing; memory cache still works.
  }
}

export async function getCatalogProducts(): Promise<ProductRow[]> {
  if (memoryProducts && Date.now() - memoryProductsAt < PRODUCTS_CACHE_TTL_MS) return memoryProducts;

  const sessionData = readSessionCache();
  if (sessionData) {
    memoryProducts = sessionData;
    memoryProductsAt = Date.now();
    return sessionData;
  }

  if (!productsRequest) {
    productsRequest = withTimeout(supabase
      .from("produtos")
      .select(PRODUCT_FIELDS)
      .then(({ data, error }) => {
        if (error) throw error;
        const result = (data || []) as ProductRow[];
        memoryProducts = result;
        memoryProductsAt = Date.now();
        writeSessionCache(result);
        return result;
      })
      .finally(() => {
        productsRequest = null;
      }), PRODUCTS_REQUEST_TIMEOUT_MS);
  }

  return productsRequest;
}

export async function getProductById(id: string): Promise<ProductRow | null> {
  const products = await getCatalogProducts();
  const cached = products.find((product) => product.id === id);
  if (cached) return cached;

  const { data, error } = await supabase
    .from("produtos")
    .select(PRODUCT_FIELDS)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data as ProductRow | null;
}

export function invalidateCatalogCache() {
  memoryProducts = null;
  memoryProductsAt = 0;
  productsRequest = null;
  try {
    sessionStorage.removeItem(PRODUCTS_CACHE_KEY);
  } catch {
    // no-op
  }
}
