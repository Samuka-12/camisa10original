import { useEffect, useMemo, useState } from "react";

const loadedImages = new Set<string>();
const retryDelays = [700, 1800];

function getOptimizedImageUrl(src: string, width: number): string {
  if (!src) return "";

  try {
    const url = new URL(src);
    const publicPrefix = "/storage/v1/object/public/";
    if (url.hostname.endsWith(".supabase.co") && url.pathname.startsWith(publicPrefix)) {
      url.pathname = url.pathname.replace(publicPrefix, "/storage/v1/render/image/public/");
      url.searchParams.set("width", String(width));
      url.searchParams.set("quality", "85");
      url.searchParams.set("resize", "contain");
      return url.toString();
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
  const [attempt, setAttempt] = useState(0);
  const [status, setStatus] = useState<"loading" | "loaded" | "error">(
    optimizedSrc && loadedImages.has(optimizedSrc) ? "loaded" : "loading",
  );

  useEffect(() => {
    setAttempt(0);
    setStatus(optimizedSrc && loadedImages.has(optimizedSrc) ? "loaded" : "loading");
  }, [optimizedSrc]);

  const handleError = () => {
    const delay = retryDelays[attempt];
    if (!optimizedSrc || delay === undefined) {
      setStatus("error");
      return;
    }

    window.setTimeout(() => {
      setAttempt((current) => current + 1);
      setStatus("loading");
    }, delay);
  };

  return (
    <>
      {status !== "loaded" && (
        <span
          aria-hidden="true"
          className={`absolute inset-0 bg-muted ${status === "loading" ? "animate-pulse" : ""}`}
        />
      )}
      {optimizedSrc && (
        <img
          key={`${optimizedSrc}-${attempt}`}
          src={optimizedSrc}
          alt={alt}
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : "auto"}
          decoding="async"
          width={width}
          height={height}
          sizes={sizes}
          className={`${className} transition-opacity duration-200 ${status === "loaded" ? "opacity-100" : "opacity-0"}`}
          onLoad={() => {
            loadedImages.add(optimizedSrc);
            setStatus("loaded");
          }}
          onError={handleError}
        />
      )}
    </>
  );
};

export default ProductImage;