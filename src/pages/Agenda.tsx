import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
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
import { useToast } from '@/hooks/use-toast';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Video,
  FileText,
  Users,
  MoreHorizontal,
  Trash2,
  Edit,
} from 'lucide-react';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  isToday,
} from 'date-fns';
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

export default function Agenda() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    task_type: 'other',
    scheduled_time: '',
    meeting_link: '',
    contact_number: '',
    lead_source: '',
  });
  const [loading, setLoading] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  useEffect(() => {
    if (user) {
      fetchTasks();
    }
  }, [user, currentDate]);

  const fetchTasks = async () => {
    if (!user) return;

    const monthStart = format(startOfMonth(currentDate), 'yyyy-MM-dd');
    const monthEnd = format(endOfMonth(currentDate), 'yyyy-MM-dd');

    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .gte('scheduled_date', monthStart)
      .lte('scheduled_date', monthEnd)
      .order('scheduled_time', { ascending: true });

    if (error) {
      console.error('Error fetching tasks:', error);
    } else {
      setTasks(data || []);
    }
  };

  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const handleToday = () => setCurrentDate(new Date());

  const getDaysInMonth = () => {
    const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  };

  const getTasksForDay = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return tasks.filter((task) => task.scheduled_date === dateStr);
  };

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    setEditingTask(null);
    setFormData({
      title: '',
      description: '',
      task_type: 'other',
      scheduled_time: '',
      meeting_link: '',
      contact_number: '',
      lead_source: '',
    });
    setIsFormOpen(true);
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsDetailOpen(true);
  };

  const handleEditTask = () => {
    if (!selectedTask) return;
    setEditingTask(selectedTask);
    setSelectedDate(new Date(selectedTask.scheduled_date));
    setFormData({
      title: selectedTask.title,
      description: selectedTask.description || '',
      task_type: selectedTask.task_type,
      scheduled_time: selectedTask.scheduled_time || '',
      meeting_link: selectedTask.meeting_link || '',
      contact_number: selectedTask.contact_number || '',
      lead_source: selectedTask.lead_source || '',
    });
    setIsDetailOpen(false);
    setIsFormOpen(true);
  };

  const handleDeleteTask = async () => {
    if (!selectedTask) return;

    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', selectedTask.id);

    if (error) {
      toast({ title: 'Erro ao excluir tarefa', variant: 'destructive' });
    } else {
      toast({ title: 'Tarefa excluída com sucesso' });
      setIsDetailOpen(false);
      fetchTasks();
    }
  };

  const handleToggleComplete = async () => {
    if (!selectedTask) return;

    const newStatus = selectedTask.status === 'completed' ? 'pending' : 'completed';
    const { error } = await supabase
      .from('tasks')
      .update({
        status: newStatus,
        completed_at: newStatus === 'completed' ? new Date().toISOString() : null,
      })
      .eq('id', selectedTask.id);

    if (error) {
      toast({ title: 'Erro ao atualizar tarefa', variant: 'destructive' });
    } else {
      toast({ title: `Tarefa ${newStatus === 'completed' ? 'concluída' : 'reaberta'}` });
      setIsDetailOpen(false);
      fetchTasks();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedDate) return;

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
      setIsFormOpen(false);
      fetchTasks();
    }
  };

  const days = getDaysInMonth();
  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display text-foreground">Agenda</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie seus eventos e tarefas
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-display capitalize">
              {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handlePrevMonth}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={handleToday}>
                Hoje
              </Button>
              <Button variant="outline" size="sm" onClick={handleNextMonth}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1">
            {weekDays.map((day) => (
              <div
                key={day}
                className="text-center text-sm font-medium text-muted-foreground py-2"
              >
                {day}
              </div>
            ))}
            {days.map((day) => {
              const dayTasks = getTasksForDay(day);
              const isCurrentMonth = isSameMonth(day, currentDate);
              const isCurrentDay = isToday(day);

              return (
                <div
                  key={day.toISOString()}
                  className={cn(
                    "min-h-24 p-1 border border-border rounded-lg cursor-pointer transition-colors hover:bg-muted/50",
                    !isCurrentMonth && "opacity-40",
                    isCurrentDay && "bg-primary/5 border-primary"
                  )}
                  onClick={() => handleDayClick(day)}
                >
                  <div
                    className={cn(
                      "text-sm font-medium mb-1",
                      isCurrentDay && "text-primary"
                    )}
                  >
                    {format(day, 'd')}
                  </div>
                  <div className="space-y-1">
                    {dayTasks.slice(0, 3).map((task) => (
                      <div
                        key={task.id}
                        className={cn(
                          "text-xs px-1.5 py-0.5 rounded truncate cursor-pointer",
                          taskTypeColors[task.task_type],
                          task.status === 'completed' && "opacity-50 line-through"
                        )}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTaskClick(task);
                        }}
                      >
                        {task.title}
                      </div>
                    ))}
                    {dayTasks.length > 3 && (
                      <div className="text-xs text-muted-foreground px-1">
                        +{dayTasks.length - 3} mais
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Task Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">{selectedTask?.title}</DialogTitle>
          </DialogHeader>
          {selectedTask && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge className={taskTypeColors[selectedTask.task_type]}>
                  {taskTypeLabels[selectedTask.task_type]}
                </Badge>
                <Badge variant={selectedTask.status === 'completed' ? 'default' : 'secondary'}>
                  {selectedTask.status === 'completed' ? 'Concluída' : 'Pendente'}
                </Badge>
              </div>

              {selectedTask.description && (
                <p className="text-muted-foreground">{selectedTask.description}</p>
              )}

              <div className="space-y-2 text-sm">
                <p>
                  <span className="font-medium">Data:</span>{' '}
                  {format(new Date(selectedTask.scheduled_date), "dd 'de' MMMM", {
                    locale: ptBR,
                  })}
                </p>
                {selectedTask.scheduled_time && (
                  <p>
                    <span className="font-medium">Horário:</span>{' '}
                    {selectedTask.scheduled_time.slice(0, 5)}
                  </p>
                )}
                {selectedTask.meeting_link && (
                  <p>
                    <span className="font-medium">Link:</span>{' '}
                    <a
                      href={selectedTask.meeting_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      Acessar reunião
                    </a>
                  </p>
                )}
                {selectedTask.contact_number && (
                  <p>
                    <span className="font-medium">Contato:</span>{' '}
                    {selectedTask.contact_number}
                  </p>
                )}
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleToggleComplete}
                >
                  <Checkbox
                    checked={selectedTask.status === 'completed'}
                    className="mr-2"
                  />
                  {selectedTask.status === 'completed' ? 'Reabrir' : 'Concluir'}
                </Button>
                <Button variant="outline" size="icon" onClick={handleEditTask}>
                  <Edit className="w-4 h-4" />
                </Button>
                <Button variant="destructive" size="icon" onClick={handleDeleteTask}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Task Form Sheet */}
      <Sheet open={isFormOpen} onOpenChange={setIsFormOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle className="font-display">
              {editingTask ? 'Editar Tarefa' : 'Nova Tarefa'}
            </SheetTitle>
          </SheetHeader>
          <form onSubmit={handleSubmit} className="space-y-6 mt-6">
            <div className="space-y-2">
              <Label>Data</Label>
              <Input
                value={selectedDate ? format(selectedDate, 'dd/MM/yyyy') : ''}
                disabled
              />
            </div>

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

            {formData.task_type === 'meeting' && (
              <>
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
                  <Label>Canal de Origem</Label>
                  <Select
                    value={formData.lead_source}
                    onValueChange={(value) =>
                      setFormData({ ...formData, lead_source: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="instagram">Instagram</SelectItem>
                      <SelectItem value="cold_call">Cold Call</SelectItem>
                      <SelectItem value="indication">Indicação</SelectItem>
                      <SelectItem value="website">Site</SelectItem>
                      <SelectItem value="other">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Detalhes da tarefa..."
                rows={3}
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Salvando...' : editingTask ? 'Atualizar' : 'Criar Tarefa'}
            </Button>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
