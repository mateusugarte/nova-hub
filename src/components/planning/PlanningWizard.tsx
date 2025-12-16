import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { useToast } from '@/hooks/use-toast';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  CheckCircle2,
  Circle,
  Flag,
  SkipForward,
  Trash2,
  X,
} from 'lucide-react';
import { format, eachDayOfInterval, startOfWeek, endOfWeek } from 'date-fns';
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
}

interface PlanningWizardProps {
  weekStart: Date;
  weekEnd: Date;
  existingTasks: Task[];
  planningId: string | null;
  onClose: () => void;
  onComplete: () => void;
}

const taskTypeColors: Record<string, string> = {
  meeting: 'bg-task-meeting',
  content: 'bg-task-content',
  prospecting: 'bg-task-prospecting',
  steps: 'bg-task-steps',
  other: 'bg-task-other',
};

const taskTypeLabels: Record<string, string> = {
  meeting: 'Reunião',
  content: 'Conteúdo',
  prospecting: 'Prospecção',
  steps: 'Por Etapas',
  other: 'Outra',
};

export default function PlanningWizard({
  weekStart,
  weekEnd,
  existingTasks,
  planningId,
  onClose,
  onComplete,
}: PlanningWizardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentDayIndex, setCurrentDayIndex] = useState(0);
  const [tasks, setTasks] = useState<Task[]>(existingTasks);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    task_type: 'other',
    scheduled_time: '',
  });
  const [loading, setLoading] = useState(false);

  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });
  const currentDay = weekDays[currentDayIndex];
  const isLastDay = currentDayIndex === weekDays.length - 1;
  const isFirstDay = currentDayIndex === 0;

  const getTasksForDay = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return tasks.filter((task) => task.scheduled_date === dateStr);
  };

  const currentDayTasks = getTasksForDay(currentDay);

  const handlePrevDay = () => {
    if (!isFirstDay) {
      setCurrentDayIndex(currentDayIndex - 1);
      setIsAddingTask(false);
    }
  };

  const handleNextDay = () => {
    if (!isLastDay) {
      setCurrentDayIndex(currentDayIndex + 1);
      setIsAddingTask(false);
    }
  };

  const handleSkipDay = () => {
    if (!isLastDay) {
      setCurrentDayIndex(currentDayIndex + 1);
      setIsAddingTask(false);
      toast({ title: 'Dia pulado', description: 'Você pode voltar a qualquer momento' });
    }
  };

  const handleAddTask = async () => {
    if (!user || !formData.title.trim()) return;

    setLoading(true);

    const { data, error } = await supabase
      .from('tasks')
      .insert({
        user_id: user.id,
        title: formData.title,
        description: formData.description || null,
        task_type: formData.task_type,
        scheduled_date: format(currentDay, 'yyyy-MM-dd'),
        scheduled_time: formData.scheduled_time || null,
      })
      .select()
      .single();

    setLoading(false);

    if (error) {
      toast({ title: 'Erro ao criar tarefa', variant: 'destructive' });
    } else {
      toast({ title: 'Tarefa criada com sucesso' });
      setTasks([...tasks, data]);
      setFormData({ title: '', description: '', task_type: 'other', scheduled_time: '' });
      setIsAddingTask(false);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    const { error } = await supabase.from('tasks').delete().eq('id', taskId);

    if (error) {
      toast({ title: 'Erro ao excluir tarefa', variant: 'destructive' });
    } else {
      setTasks(tasks.filter((t) => t.id !== taskId));
      toast({ title: 'Tarefa excluída' });
    }
  };

  const handleFinishPlanning = async () => {
    if (!user || !planningId) return;

    const { error } = await supabase
      .from('weekly_planning')
      .update({ is_completed: true, completed_at: new Date().toISOString() })
      .eq('id', planningId);

    if (error) {
      toast({ title: 'Erro ao finalizar planejamento', variant: 'destructive' });
    } else {
      toast({ title: 'Planejamento semanal concluído!' });
      onComplete();
    }
  };

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col animate-fade-in">
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-display">Planejamento Semanal</h1>
              <p className="text-muted-foreground text-sm mt-1">
                Semana {format(weekStart, 'dd/MM')} - {format(weekEnd, 'dd/MM')}
              </p>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="border-b bg-muted/30">
        <div className="container max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {weekDays.map((day, index) => {
              const dayTasks = getTasksForDay(day);
              const isCompleted = index < currentDayIndex;
              const isCurrent = index === currentDayIndex;
              const hasTasks = dayTasks.length > 0;

              return (
                <div
                  key={index}
                  className={cn(
                    "flex flex-col items-center gap-1 cursor-pointer transition-all",
                    isCurrent && "scale-110"
                  )}
                  onClick={() => {
                    setCurrentDayIndex(index);
                    setIsAddingTask(false);
                  }}
                >
                  <div
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all",
                      isCurrent && "border-primary bg-primary text-primary-foreground",
                      isCompleted && hasTasks && "border-green-500 bg-green-500 text-white",
                      isCompleted && !hasTasks && "border-muted-foreground/30 bg-muted text-muted-foreground",
                      !isCurrent && !isCompleted && "border-muted-foreground/30"
                    )}
                  >
                    {isCompleted && hasTasks ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : index === weekDays.length - 1 ? (
                      <Flag className="w-4 h-4" />
                    ) : (
                      <span className="text-sm font-medium">{index + 1}</span>
                    )}
                  </div>
                  <span
                    className={cn(
                      "text-xs",
                      isCurrent ? "text-primary font-medium" : "text-muted-foreground"
                    )}
                  >
                    {format(day, 'EEE', { locale: ptBR })}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="container max-w-4xl mx-auto px-4 py-8">
          <Card className="border-2">
            <CardHeader className="text-center pb-2">
              <Badge variant="outline" className="w-fit mx-auto mb-2">
                Dia {currentDayIndex + 1} de {weekDays.length}
              </Badge>
              <CardTitle className="text-2xl font-display capitalize">
                {format(currentDay, "EEEE, dd 'de' MMMM", { locale: ptBR })}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {/* Tasks List */}
              {currentDayTasks.length > 0 && (
                <div className="space-y-3 mb-6">
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Tarefas planejadas ({currentDayTasks.length})
                  </h3>
                  {currentDayTasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:shadow-sm transition-all"
                    >
                      <div
                        className={cn("w-3 h-3 rounded-full", taskTypeColors[task.task_type])}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{task.title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge variant="outline" className="text-xs">
                            {taskTypeLabels[task.task_type]}
                          </Badge>
                          {task.scheduled_time && (
                            <span className="text-xs text-muted-foreground">
                              {task.scheduled_time.slice(0, 5)}
                            </span>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleDeleteTask(task.id)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Task Form */}
              {isAddingTask ? (
                <div className="space-y-4 p-4 rounded-lg border-2 border-dashed border-primary/50 bg-primary/5">
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
                      placeholder="Ex: Reunião com cliente"
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

                  <div className="flex gap-2">
                    <Button
                      onClick={handleAddTask}
                      disabled={loading || !formData.title.trim()}
                      className="flex-1"
                    >
                      {loading ? 'Salvando...' : 'Salvar Tarefa'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setIsAddingTask(false)}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  variant="outline"
                  className="w-full border-dashed"
                  onClick={() => setIsAddingTask(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Tarefa
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="border-t bg-card/50 backdrop-blur-sm">
        <div className="container max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={handlePrevDay}
              disabled={isFirstDay}
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Dia Anterior
            </Button>

            <div className="flex gap-2">
              {!isLastDay && (
                <Button variant="ghost" onClick={handleSkipDay}>
                  <SkipForward className="w-4 h-4 mr-2" />
                  Pular Dia
                </Button>
              )}
            </div>

            {isLastDay ? (
              <Button onClick={handleFinishPlanning} className="bg-green-600 hover:bg-green-700">
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Finalizar Planejamento
              </Button>
            ) : (
              <Button onClick={handleNextDay}>
                Próximo Dia
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
