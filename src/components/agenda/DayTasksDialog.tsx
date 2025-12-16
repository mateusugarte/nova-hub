import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Clock, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface Task {
  id: string;
  title: string;
  description: string | null;
  task_type: string;
  status: string;
  scheduled_date: string;
  scheduled_time: string | null;
  meeting_link: string | null;
  contact_number: string | null;
  lead_source: string | null;
}

interface DayTasksDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: Date;
  tasks: Task[];
  onTasksChange: () => void;
}

const taskTypeColors: Record<string, string> = {
  meeting: 'bg-task-meeting text-white',
  content: 'bg-task-content text-white',
  prospecting: 'bg-task-prospecting text-white',
  steps: 'bg-task-steps text-white',
  other: 'bg-task-other text-white',
};

const taskTypeLabels: Record<string, string> = {
  meeting: 'Reunião',
  content: 'Conteúdo',
  prospecting: 'Prospecção',
  steps: 'Por Etapas',
  other: 'Outra',
};

type ViewMode = 'list' | 'form';

export default function DayTasksDialog({
  open,
  onOpenChange,
  selectedDate,
  tasks,
  onTasksChange,
}: DayTasksDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deleteTaskId, setDeleteTaskId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    task_type: 'other',
    scheduled_time: '',
    meeting_link: '',
    contact_number: '',
    lead_source: '',
  });

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      task_type: 'other',
      scheduled_time: '',
      meeting_link: '',
      contact_number: '',
      lead_source: '',
    });
    setEditingTask(null);
  };

  const handleOpenForm = (task?: Task) => {
    if (task) {
      setEditingTask(task);
      setFormData({
        title: task.title,
        description: task.description || '',
        task_type: task.task_type,
        scheduled_time: task.scheduled_time || '',
        meeting_link: task.meeting_link || '',
        contact_number: task.contact_number || '',
        lead_source: task.lead_source || '',
      });
    } else {
      resetForm();
    }
    setViewMode('form');
  };

  const handleBackToList = () => {
    setViewMode('list');
    resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);

    const taskData = {
      user_id: user.id,
      title: formData.title,
      description: formData.description || null,
      task_type: formData.task_type,
      scheduled_date: format(selectedDate, 'yyyy-MM-dd'),
      scheduled_time: formData.scheduled_time || null,
      meeting_link: formData.meeting_link || null,
      contact_number: formData.contact_number || null,
      lead_source: formData.lead_source || null,
    };

    let error;
    if (editingTask) {
      const result = await supabase
        .from('tasks')
        .update(taskData)
        .eq('id', editingTask.id);
      error = result.error;
    } else {
      const result = await supabase.from('tasks').insert(taskData);
      error = result.error;
    }

    setLoading(false);

    if (error) {
      toast({ title: 'Erro ao salvar tarefa', variant: 'destructive' });
    } else {
      toast({ title: `Tarefa ${editingTask ? 'atualizada' : 'criada'} com sucesso` });
      handleBackToList();
      onTasksChange();
    }
  };

  const handleToggleComplete = async (task: Task) => {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    const { error } = await supabase
      .from('tasks')
      .update({
        status: newStatus,
        completed_at: newStatus === 'completed' ? new Date().toISOString() : null,
      })
      .eq('id', task.id);

    if (error) {
      toast({ title: 'Erro ao atualizar tarefa', variant: 'destructive' });
    } else {
      onTasksChange();
    }
  };

  const handleDeleteTask = async () => {
    if (!deleteTaskId) return;

    const { error } = await supabase.from('tasks').delete().eq('id', deleteTaskId);

    if (error) {
      toast({ title: 'Erro ao excluir tarefa', variant: 'destructive' });
    } else {
      toast({ title: 'Tarefa excluída com sucesso' });
      onTasksChange();
    }
    setDeleteTaskId(null);
  };

  const handleClose = () => {
    setViewMode('list');
    resetForm();
    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            {viewMode === 'form' && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute left-4 top-4"
                onClick={handleBackToList}
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Voltar
              </Button>
            )}
            <DialogTitle className="font-display text-center pt-2">
              {viewMode === 'list'
                ? format(selectedDate, "dd 'de' MMMM, EEEE", { locale: ptBR })
                : editingTask
                ? 'Editar Tarefa'
                : 'Nova Tarefa'}
            </DialogTitle>
          </DialogHeader>

          {viewMode === 'list' ? (
            <div className="flex-1 overflow-auto space-y-4">
              {tasks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhuma tarefa para este dia
                </div>
              ) : (
                <div className="space-y-2">
                  {tasks.map((task) => (
                    <div
                      key={task.id}
                      className={cn(
                        "flex items-start gap-3 p-3 rounded-lg border transition-all hover:shadow-sm",
                        task.status === 'completed' && "bg-muted/50 opacity-70"
                      )}
                    >
                      <Checkbox
                        checked={task.status === 'completed'}
                        onCheckedChange={() => handleToggleComplete(task)}
                        className="mt-1"
                      />
                      <div className="flex-1 min-w-0">
                        <p
                          className={cn(
                            "font-medium",
                            task.status === 'completed' && "line-through"
                          )}
                        >
                          {task.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <Badge className={cn("text-xs", taskTypeColors[task.task_type])}>
                            {taskTypeLabels[task.task_type]}
                          </Badge>
                          {task.scheduled_time && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {task.scheduled_time.slice(0, 5)}
                            </span>
                          )}
                        </div>
                        {task.description && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {task.description}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleOpenForm(task)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setDeleteTaskId(task.id)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <Button
                className="w-full"
                onClick={() => handleOpenForm()}
              >
                <Plus className="w-4 h-4 mr-2" />
                Criar Tarefa
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex-1 overflow-auto space-y-4">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select
                  value={formData.task_type}
                  onValueChange={(value) =>
                    setFormData({ ...formData, task_type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="meeting">Reunião</SelectItem>
                    <SelectItem value="content">Criação de Conteúdo</SelectItem>
                    <SelectItem value="prospecting">Prospecção</SelectItem>
                    <SelectItem value="steps">Tarefa por Etapas</SelectItem>
                    <SelectItem value="other">Outra</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Título *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="Título da tarefa"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Horário</Label>
                <Input
                  type="time"
                  value={formData.scheduled_time}
                  onChange={(e) =>
                    setFormData({ ...formData, scheduled_time: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Detalhes da tarefa..."
                  rows={2}
                />
              </div>

              {formData.task_type === 'meeting' && (
                <div className="space-y-2">
                  <Label>Link da Reunião</Label>
                  <Input
                    value={formData.meeting_link}
                    onChange={(e) =>
                      setFormData({ ...formData, meeting_link: e.target.value })
                    }
                    placeholder="https://..."
                  />
                </div>
              )}

              {formData.task_type === 'prospecting' && (
                <>
                  <div className="space-y-2">
                    <Label>Número de Contato</Label>
                    <Input
                      value={formData.contact_number}
                      onChange={(e) =>
                        setFormData({ ...formData, contact_number: e.target.value })
                      }
                      placeholder="(00) 00000-0000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Origem do Lead</Label>
                    <Input
                      value={formData.lead_source}
                      onChange={(e) =>
                        setFormData({ ...formData, lead_source: e.target.value })
                      }
                      placeholder="Instagram, LinkedIn, etc."
                    />
                  </div>
                </>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Salvando...' : editingTask ? 'Salvar Alterações' : 'Criar Tarefa'}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTaskId} onOpenChange={() => setDeleteTaskId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTask} className="bg-destructive hover:bg-destructive/90">
              Deletar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
