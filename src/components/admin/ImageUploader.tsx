import { useState, useCallback } from "react";
import { UploadCloud, X, Loader2, Image as ImageIcon } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";


interface ImageUploaderProps {
  onUploadSuccess: (url: string) => void;
  currentImageUrl?: string;
  onRemoveImage?: () => void;
}

export const ImageUploader = ({
  onUploadSuccess,
  currentImageUrl,
  onRemoveImage,
}: ImageUploaderProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const uploadFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Por favor, envie apenas imagens.");
      return;
    }

    // Checking roughly 5MB limit or let it pass since user mentioned heavy images? User said 2000x2000px heavy images. Let's allow.
    setIsUploading(true);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { data, error } = await supabase.storage
        .from("product-images") // Name of the bucket
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (error) {
        throw error;
      }

      const { data: publicUrlData } = supabase.storage
        .from("product-images")
        .getPublicUrl(filePath);

      onUploadSuccess(publicUrlData.publicUrl);
    } catch (error: any) {
      toast.error(`Erro no upload: ${error.message || "Desconhecido"}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        uploadFile(e.dataTransfer.files[0]);
      }
    },
    []
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      uploadFile(e.target.files[0]);
    }
  };

  if (currentImageUrl) {
    return (
      <div className="relative rounded-2xl border-2 border-gray-200 overflow-hidden bg-gray-50 flex items-center justify-center p-2 group">
        <img
          src={currentImageUrl}
          alt="Preview"
          className="max-h-[300px] w-auto object-contain rounded-xl"
        />
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <button
            type="button"
            onClick={onRemoveImage}
            className="p-3 bg-white text-red-600 rounded-full hover:bg-red-50 transition-colors shadow-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative flex flex-col items-center justify-center w-full min-h-[250px] p-6 border-2 border-dashed rounded-2xl transition-colors cursor-pointer bg-gray-50/50 hover:bg-gray-50 ${
        dragActive ? "border-primary bg-primary/5" : "border-gray-300"
      }`}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <input
        type="file"
        id="image-upload"
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        onChange={handleChange}
        disabled={isUploading}
        accept="image/*"
      />
      
      {isUploading ? (
        <div className="flex flex-col items-center gap-3 text-primary">
          <Loader2 className="w-10 h-10 animate-spin" />
          <p className="font-medium">Enviando mockup...</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4 text-gray-500 pointer-events-none text-center">
          <div className="p-4 bg-white rounded-full shadow-sm">
            <UploadCloud className="w-8 h-8 text-primary" />
          </div>
          <div>
            <p className="font-semibold text-gray-700">Clique para upar ou arraste a imagem</p>
            <p className="text-sm mt-1 text-gray-500">Suporta JPG, PNG e WebP</p>
            <p className="text-xs mt-2 text-gray-400 max-w-[200px] leading-relaxed">
              Resoluções altas como 2000x2000px são ideais para melhor visualização
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
