import { useState } from "react";
import { X, Ruler } from "lucide-react";

const SizeChartModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<number>(1);

  const tabs = [
    { id: 1, name: "Infantil", img: "/tabela-medidas-1.jpg" },
    { id: 2, name: "Feminina", img: "/tabela-medidas-2.jpg" },
    { id: 3, name: "Masculina", img: "/tabela-medidas-3.jpg" },
  ];

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="px-6 py-3 text-sm font-semibold transition-colors text-primary-foreground/80 hover:bg-primary-foreground/10 hover:text-primary-foreground flex items-center gap-2"
      >
        <Ruler className="h-4 w-4" />
        Tabela de Medidas
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-background rounded-xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-border bg-secondary/50">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Ruler className="h-5 w-5 text-primary" />
                Tabela de Medidas
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-full hover:bg-black/10 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-4">
              <div className="flex justify-center gap-2 mb-4">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                    }`}
                  >
                    {tab.name}
                  </button>
                ))}
              </div>
              
              <div className="relative w-full overflow-hidden rounded-lg border border-border bg-black/5 flex justify-center items-center">
                <img
                  src={tabs.find(t => t.id === activeTab)?.img}
                  alt="Tabela de Medidas"
                  className="max-h-[60vh] w-auto object-contain"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SizeChartModal;
