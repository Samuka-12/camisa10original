import { useEffect, useMemo, useState } from "react";

const loadedImages = new Set<string>();

function getOptimizedImageUrl(src: string, width: number): string {
  if (!src) return "";

  if (src.startsWith("/") && /\.(jpe?g|png)$/i.test(src)) {
    return src.replace(/\.(jpe?g|png)$/i, ".webp");
  }

  try {
    const url = new URL(src);
    const publicPrefix = "/storage/v1/object/public/";
    if (url.hostname.endsWith(".supabase.co") && url.pathname.startsWith(publicPrefix)) {
      url.pathname = url.pathname.replace(publicPrefix, "/storage/v1/render/image/public/");
      url.searchParams.set("width", String(Math.min(Math.max(width, 160), 720)));
      url.searchParams.set("quality", "80");
      url.searchParams.set("resize", "contain");
      return url.toString();
    }

    if (url.protocol === "http:" || url.protocol === "https:") {
      const source = encodeURIComponent(src);
      const targetWidth = Math.min(Math.max(width, 160), 720);
      return `https://wsrv.nl/?url=${source}&w=${targetWidth}&output=webp&q=80&fit=contain`;
    }
  } catch {
    return src;
  }

  return src;
}

interface ProductImageProps {
  src?: string | null;
  alt: string;
  className?: string;
  priority?: boolean;
  width?: number;
  height?: number;
  sizes?: string;
}

const ProductImage = ({
  src,
  alt,
  className = "",
  priority = false,
  width = 512,
  height = 512,
  sizes,
}: ProductImageProps) => {
  const optimizedSrc = useMemo(() => getOptimizedImageUrl(src?.trim() || "", width), [src, width]);
  const [fallbackSrc, setFallbackSrc] = useState<string | null>(null);
  const renderedSrc = fallbackSrc || optimizedSrc;
  const [status, setStatus] = useState<"loading" | "loaded" | "error">(
    renderedSrc && loadedImages.has(renderedSrc) ? "loaded" : "loading",
  );

  useEffect(() => {
    setFallbackSrc(null);
    setStatus(optimizedSrc && loadedImages.has(optimizedSrc) ? "loaded" : "loading");
  }, [optimizedSrc]);

  const handleError = () => {
    if (fallbackSrc !== "/placeholder.svg") {
      setFallbackSrc("/placeholder.svg");
      setStatus("loading");
      return;
    }
    setStatus("error");
  };

  return (
    <>
      {status === "loading" && (
        <span
          aria-hidden="true"
          className="absolute inset-0 animate-pulse bg-muted"
        />
      )}
      {renderedSrc && (
        <img
          key={renderedSrc}
          src={renderedSrc}
          alt={alt}
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : "auto"}
          decoding="async"
          width={width}
          height={height}
          sizes={sizes}
          className={`${className} transition-opacity duration-200 ${status === "loaded" ? "opacity-100" : "opacity-0"}`}
          onLoad={() => {
            loadedImages.add(renderedSrc);
            setStatus("loaded");
          }}
          onError={handleError}
        />
      )}
    </>
  );
};

export default ProductImage;
