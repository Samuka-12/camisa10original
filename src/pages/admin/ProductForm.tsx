import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import imageCompression from 'browser-image-compression';

const productSchema = z.object({
  name: z.string().min(1, "O nome é obrigatório"),
  team: z.string().min(1, "O time/seleção é obrigatório"),
  price: z.coerce.number().min(0.01, "Preço deve ser maior que zero"),
  category: z.string().min(1, "A categoria é obrigatória"),
  description: z.string().min(1, "A descrição técnica é obrigatória"),
});

type ProductFormValues = z.infer<typeof productSchema>;

const ProductForm = () => {
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>("");

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      team: "",
      price: 0,
      category: "",
      description: "",
    },
  });

  const onSubmit = async (data: ProductFormValues) => {
    console.log("Dados do form:", data);
    setIsSaving(true);
    try {
      const { error } = await supabase.from("produtos").insert({
        nome: data.name,
        team: data.team,
        preco: data.price,
        category: data.category,
        description: data.description,
        image: imageUrl,
      });

      if (error) throw error;

      toast.success("Camisa salva com sucesso no catálogo!");
      navigate("/admin");
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar a camisa. Tente novamente.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-12">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate("/admin")}
          className="p-2 bg-white border border-gray-200 rounded-full hover:bg-gray-50 transition-colors shadow-sm"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 font-heading">Nova Camisa</h1>
          <p className="text-gray-500 mt-1">Adicione um novo manto ao seu estoque</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
                <h2 className="text-lg font-semibold text-gray-900 border-b border-gray-100 pb-4">
                  Informações Básicas
                </h2>

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome da Camisa</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Argentina 2026/27 Home" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="team"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Time / Seleção</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Seleção Argentina" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Categoria</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Retro, Lançamento..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preço (R$)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="0.00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
                <h2 className="text-lg font-semibold text-gray-900 border-b border-gray-100 pb-4">
                  Detalhes Técnicos
                </h2>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Detalhes sobre o tecido, patch, jogador..."
                          className="min-h-[120px] resize-y"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6 sticky top-6">
                <h2 className="text-lg font-semibold text-gray-900 border-b border-gray-100 pb-4">
                  Imagem Mockup (Upload)
                </h2>

                <ImageUploader
                  currentImageUrl={imageUrl}
                  onUploadSuccess={setImageUrl}
                  onRemoveImage={() => setImageUrl("")}
                />

                <Button
                  type="submit"
                  disabled={isSaving}
                  className="w-full h-12 text-base font-semibold shadow-md hover:shadow-lg transition-all"
                >
                  {isSaving ? (
                    <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Salvando...</>
                  ) : (
                    <><Save className="w-5 h-5 mr-2" /> Publicar Camisa</>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default ProductForm;