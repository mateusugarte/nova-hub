import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Plus, Pencil, Trash2, Save, X, Brain } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Thought {
  id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

const Pensamentos = () => {
  const { user } = useAuth();
  const [thoughts, setThoughts] = useState<Thought[]>([]);
  const [isWriting, setIsWriting] = useState(false);
  const [editingThought, setEditingThought] = useState<Thought | null>(null);
  const [content, setContent] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchThoughts();
    }
  }, [user]);

  const fetchThoughts = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("thoughts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Erro ao carregar pensamentos");
    } else {
      setThoughts(data || []);
    }
    setIsLoading(false);
  };

  const handleStartWriting = () => {
    setIsWriting(true);
    setContent("");
    setEditingThought(null);
  };

  const handleEdit = (thought: Thought) => {
    setEditingThought(thought);
    setContent(thought.content);
    setIsWriting(true);
  };

  const handleCancel = () => {
    setIsWriting(false);
    setContent("");
    setEditingThought(null);
  };

  const handleSave = async () => {
    if (!content.trim()) {
      toast.error("Escreva algo antes de salvar");
      return;
    }

    if (editingThought) {
      const { error } = await supabase
        .from("thoughts")
        .update({ content })
        .eq("id", editingThought.id);

      if (error) {
        toast.error("Erro ao atualizar pensamento");
      } else {
        toast.success("Pensamento atualizado!");
        fetchThoughts();
        handleCancel();
      }
    } else {
      const { error } = await supabase.from("thoughts").insert({
        user_id: user?.id,
        content,
      });

      if (error) {
        toast.error("Erro ao salvar pensamento");
      } else {
        toast.success("Pensamento salvo!");
        fetchThoughts();
        handleCancel();
      }
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    const { error } = await supabase
      .from("thoughts")
      .delete()
      .eq("id", deleteId);

    if (error) {
      toast.error("Erro ao excluir pensamento");
    } else {
      toast.success("Pensamento excluído!");
      fetchThoughts();
    }
    setDeleteId(null);
  };

  if (isWriting) {
    return (
      <div className="min-h-[calc(100vh-8rem)] flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-foreground">
            {editingThought ? "Editando pensamento" : "Novo pensamento"}
          </h2>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleCancel}>
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              Salvar
            </Button>
          </div>
        </div>
        <div className="flex-1 flex flex-col">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Escreva o que passa na sua mente..."
            className="flex-1 min-h-[60vh] resize-none text-lg leading-relaxed p-6 bg-background border-border focus:ring-2 focus:ring-primary/20"
            autoFocus
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Brain className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">Pensamentos</h1>
            <p className="text-muted-foreground">
              Um espaço para registrar suas ideias e reflexões
            </p>
          </div>
        </div>
        <Button onClick={handleStartWriting}>
          <Plus className="h-4 w-4 mr-2" />
          Escrever
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : thoughts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Brain className="h-16 w-16 text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">
            Nenhum pensamento registrado
          </h3>
          <p className="text-muted-foreground mb-4">
            Comece a escrever suas ideias e reflexões
          </p>
          <Button onClick={handleStartWriting}>
            <Plus className="h-4 w-4 mr-2" />
            Escrever primeiro pensamento
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {thoughts.map((thought) => (
            <div
              key={thought.id}
              className="p-6 rounded-lg border border-border bg-card hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <span className="text-sm text-muted-foreground">
                  {format(new Date(thought.created_at), "EEEE, d 'de' MMMM 'de' yyyy 'às' HH:mm", {
                    locale: ptBR,
                  })}
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(thought)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDeleteId(thought.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
              <p className="text-foreground whitespace-pre-wrap leading-relaxed">
                {thought.content}
              </p>
            </div>
          ))}
        </div>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Pensamentos;
