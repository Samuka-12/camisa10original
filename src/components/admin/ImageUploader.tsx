import { useState, useCallback } from "react";
import { UploadCloud, X, Loader2, Image as ImageIcon, Video as VideoIcon } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface ImageUploaderProps {
  onUploadSuccess?: (url: string) => void;
  currentImageUrl?: string;
  onRemoveImage?: () => void;
  value?: string;
  onChange?: (url: string) => void;
  accept?: string;
  allowVideo?: boolean;
}

export const ImageUploader = ({
  onUploadSuccess,
  currentImageUrl,
  onRemoveImage,
  value,
  onChange,
  accept,
  allowVideo = true,
}: ImageUploaderProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const displayUrl = currentImageUrl || value || "";

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
    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");

    if (!isImage && !isVideo) {
      toast.error("Por favor, envie um arquivo de imagem ou vídeo válido.");
      return;
    }

    setIsUploading(true);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error } = await supabase.storage
        .from("camisetas")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (error) {
        throw error;
      }

      const { data: publicUrlData } = supabase.storage
        .from("camisetas")
        .getPublicUrl(filePath);

      const publicUrl = publicUrlData.publicUrl;

      if (typeof onUploadSuccess === "function") {
        onUploadSuccess(publicUrl);
      }
      if (typeof onChange === "function") {
        onChange(publicUrl);
      }

      toast.success("Upload realizado com sucesso!");
    } catch (error: any) {
      console.error("[ImageUploader] Upload error:", error);
      toast.error(`Erro no upload: ${error?.message || "Ocorreu uma falha ao enviar o arquivo."}`);
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

  const handleRemove = () => {
    if (typeof onRemoveImage === "function") {
      onRemoveImage();
    }
    if (typeof onChange === "function") {
      onChange("");
    }
  };

  const isVideoUrl = (url: string) => {
    return url.match(/\.(mp4|webm|ogg|mov)(\?.*)?$/i) !== null;
  };

  if (displayUrl) {
    return (
      <div className="relative rounded-2xl border-2 border-gray-200 overflow-hidden bg-gray-900 flex items-center justify-center p-2 group min-h-[160px]">
        {isVideoUrl(displayUrl) ? (
          <video
            src={displayUrl}
            controls
            className="max-h-[300px] w-auto object-contain rounded-xl"
          />
        ) : (
          <img
            src={displayUrl}
            alt="Preview"
            className="max-h-[300px] w-auto object-contain rounded-xl"
          />
        )}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <button
            type="button"
            onClick={handleRemove}
            className="p-3 bg-red-600 hover:bg-red-700 text-white rounded-full transition-colors shadow-lg flex items-center gap-1 text-xs font-bold"
          >
            <X className="w-5 h-5" /> Remover
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative flex flex-col items-center justify-center w-full min-h-[180px] p-6 border-2 border-dashed rounded-2xl transition-colors cursor-pointer bg-slate-900/40 hover:bg-slate-900/60 ${
        dragActive ? "border-purple-500 bg-purple-500/10" : "border-slate-700"
      }`}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <input
        type="file"
        id="image-upload"
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10"
        onChange={handleChange}
        disabled={isUploading}
        accept={accept || (allowVideo ? "image/*,video/*" : "image/*")}
      />

      {isUploading ? (
        <div className="flex flex-col items-center gap-3 text-purple-400">
          <Loader2 className="w-10 h-10 animate-spin" />
          <p className="font-medium text-sm">Enviando arquivo...</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 text-gray-400 pointer-events-none text-center">
          <div className="p-3 bg-purple-600/20 rounded-full shadow-sm">
            <UploadCloud className="w-8 h-8 text-purple-400" />
          </div>
          <div>
            <p className="font-semibold text-white text-sm">Clique para enviar ou arraste foto/vídeo</p>
            <p className="text-xs mt-1 text-gray-400">Suporta JPG, PNG, WebP, MP4, WebM</p>
          </div>
        </div>
      )}
    </div>
  );
};
