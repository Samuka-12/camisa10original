import { useRef, useEffect } from "react";
import { useScroll, useMotionValueEvent } from "framer-motion";
import Header from "@/components/Header";
import CategoryBar from "@/components/CategoryBar";
import ProductSection from "@/components/ProductSection";
import Footer from "@/components/Footer";
import { selecoes, retro, europeus, brasileirao } from "@/data/products";
import videoBanner from "@/assets/watermark-removed.mp4";

const Index = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    if (videoRef.current && videoRef.current.duration) {
      // Ajusta o tempo do vídeo conforme o progresso do scroll
      videoRef.current.currentTime = latest * videoRef.current.duration;
    }
  });

  useEffect(() => {
    // Garante que o vídeo carregue os metadados para sabermos a duração
    if (videoRef.current) {
      videoRef.current.load();
    }
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <CategoryBar />

      {/* Hero banner com efeito de Scroll Scrubbing */}
      <section ref={containerRef} className="relative h-[180vh] -mt-1">
        <div className="sticky top-0 h-[450px] md:h-[600px] w-full overflow-hidden">
          <video
            ref={videoRef}
            src={videoBanner}
            muted
            playsInline
            className="w-full h-full object-cover brightness-[1.1] contrast-[1.05]"
            style={{ imageRendering: 'auto' }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          <div className="absolute inset-0 flex flex-col items-center justify-end pb-10 md:pb-14 text-center px-4">
            <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-3 text-white drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)]">
              Vista a camisa do seu time
            </h2>
            <p className="text-white/90 text-lg md:text-xl max-w-2xl mx-auto drop-shadow-md font-medium">
              Coleção exclusiva de camisetas originais, retrô e lançamentos. Frete grátis acima de R$ 300.
            </p>
          </div>
        </div>
      </section>

      {selecoes.length > 0 && (
        <ProductSection
          title="Seleções"
          products={selecoes.map((p) => ({ ...p, id: p.id }))}
          id="seleções"
        />
      )}
      {retro.length > 0 && (
        <>
          <div className="border-t border-border" />
          <ProductSection
            title="Históricas, edição: Série A Italiana"
            products={retro.map((p) => ({ ...p, id: p.id }))}
            id="retrô"
          />
        </>
      )}
      {europeus.length > 0 && (
        <>
          <div className="border-t border-border" />
          <ProductSection
            title="Europeus"
            products={europeus.map((p) => ({ ...p, id: p.id }))}
            id="europeus"
          />
        </>
      )}
      {brasileirao.length > 0 && (
        <>
          <div className="border-t border-border" />
          <ProductSection
            title="Brasileirão"
            products={brasileirao.map((p) => ({ ...p, id: p.id }))}
            id="brasileirão"
          />
        </>
      )}
      <Footer />
    </div>
  );
};

export default Index;
