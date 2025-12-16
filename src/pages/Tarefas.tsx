import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
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
  CheckSquare,
  Clock,
  TrendingUp,
  Calendar,
  Plus,
  Play,
  Trash2,
  Edit,
} from 'lucide-react';
import MetricCard from '@/components/dashboard/MetricCard';
import PlanningWizard from '@/components/planning/PlanningWizard';
import {
  format,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  startOfMonth,
  endOfMonth,
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
}

interface WeeklyPlanning {
  id: string;
  week_start: string;
  week_end: string;
  is_completed: boolean;
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

export default function Tarefas() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [weeklyPlanning, setWeeklyPlanning] = useState<WeeklyPlanning | null>(null);
  const [selectedDay, setSelectedDay] = useState(0);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isPlanningWizardOpen, setIsPlanningWizardOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deleteTaskId, setDeleteTaskId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    task_type: 'other',
    scheduled_time: '',
  });
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalMonth: 0,
    completedMonth: 0,
    nextTask: null as Task | null,
  });

  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;

    const weekStartStr = format(weekStart, 'yyyy-MM-dd');
    const weekEndStr = format(weekEnd, 'yyyy-MM-dd');
    const monthStartStr = format(startOfMonth(today), 'yyyy-MM-dd');
    const monthEndStr = format(endOfMonth(today), 'yyyy-MM-dd');

    // Fetch weekly tasks
    const { data: tasksData } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .gte('scheduled_date', weekStartStr)
      .lte('scheduled_date', weekEndStr)
      .order('scheduled_time', { ascending: true });

    setTasks(tasksData || []);

    // Fetch weekly planning
    const { data: planningData } = await supabase
      .from('weekly_planning')
      .select('*')
      .eq('user_id', user.id)
      .eq('week_start', weekStartStr)
      .maybeSingle();

    setWeeklyPlanning(planningData);

    // Fetch stats
    const { count: totalMonth } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('scheduled_date', monthStartStr)
      .lte('scheduled_date', monthEndStr);

    const { count: completedMonth } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .gte('scheduled_date', monthStartStr)
      .lte('scheduled_date', monthEndStr);

    const { data: nextTaskData } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .gte('scheduled_date', format(today, 'yyyy-MM-dd'))
      .order('scheduled_date', { ascending: true })
      .order('scheduled_time', { ascending: true })
      .limit(1)
      .maybeSingle();

    setStats({
      totalMonth: totalMonth || 0,
      completedMonth: completedMonth || 0,
      nextTask: nextTaskData,
    });
  };

  const getTasksForDay = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return tasks.filter((task) => task.scheduled_date === dateStr);
  };

  const handleStartPlanning = async () => {
    if (!user) return;

    const weekStartStr = format(weekStart, 'yyyy-MM-dd');
    const weekEndStr = format(weekEnd, 'yyyy-MM-dd');

    if (!weeklyPlanning) {
      const { data } = await supabase
        .from('weekly_planning')
        .insert({
          user_id: user.id,
          week_start: weekStartStr,
          week_end: weekEndStr,
        })
        .select()
        .single();

      if (data) {
        setWeeklyPlanning(data);
      }
    }

    setIsPlanningWizardOpen(true);
  };

  const handlePlanningComplete = () => {
    setIsPlanningWizardOpen(false);
    fetchData();
  };

  const handleAddTask = (dayIndex: number) => {
    setSelectedDay(dayIndex);
    setEditingTask(null);
    setFormData({
      title: '',
      description: '',
      task_type: 'other',
      scheduled_time: '',
    });
    setIsFormOpen(true);
  };

  const handleEditTask = (task: Task, dayIndex: number) => {
    setSelectedDay(dayIndex);
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description || '',
      task_type: task.task_type,
      scheduled_time: task.scheduled_time || '',
    });
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);

    const selectedDate = weekDays[selectedDay];
    const taskData = {
      user_id: user.id,
      title: formData.title,
      description: formData.description || null,
      task_type: formData.task_type,
      scheduled_date: format(selectedDate, 'yyyy-MM-dd'),
      scheduled_time: formData.scheduled_time || null,
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
      setEditingTask(null);
      fetchData();
    }
  };

  const handleToggleTask = async (task: Task) => {
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
      fetchData();
    }
  };

  const handleDeleteTask = async () => {
    if (!deleteTaskId) return;

    const { error } = await supabase.from('tasks').delete().eq('id', deleteTaskId);

    if (error) {
      toast({ title: 'Erro ao excluir tarefa', variant: 'destructive' });
    } else {
      toast({ title: 'Tarefa excluída' });
      fetchData();
    }
    setDeleteTaskId(null);
  };

  const successRate = stats.totalMonth > 0
    ? Math.round((stats.completedMonth / stats.totalMonth) * 100)
    : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display text-foreground">Tarefas</h1>
          <p className="text-muted-foreground mt-1">
            Organize sua semana de trabalho
          </p>
        </div>
        <Button onClick={handleStartPlanning} className="btn-scale">
          <Play className="w-4 h-4 mr-2" />
          {weeklyPlanning?.is_completed
            ? 'Editar Planejamento'
            : 'Iniciar Planejamento'}
        </Button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard
          title="Tarefas do Mês"
          value={stats.totalMonth}
          icon={<CheckSquare className="w-6 h-6" />}
        />
        <MetricCard
          title="Concluídas"
          value={stats.completedMonth}
          icon={<TrendingUp className="w-6 h-6" />}
        />
        <MetricCard
          title="Taxa de Sucesso"
          value={`${successRate}%`}
          icon={<TrendingUp className="w-6 h-6" />}
        />
        <MetricCard
          title="Próxima Tarefa"
          value={stats.nextTask?.title || '-'}
          subtitle={
            stats.nextTask
              ? format(new Date(stats.nextTask.scheduled_date), 'dd/MM')
              : undefined
          }
          icon={<Clock className="w-6 h-6" />}
        />
      </div>

      {/* Planning Status */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-primary" />
              <span className="font-medium">
                Semana {format(weekStart, 'dd/MM')} - {format(weekEnd, 'dd/MM')}
              </span>
            </div>
            <Badge variant={weeklyPlanning?.is_completed ? 'default' : 'secondary'}>
              {weeklyPlanning?.is_completed ? 'Planejamento Concluído' : 'Pendente'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Weekly View */}
      <Tabs defaultValue="0" className="w-full">
        <TabsList className="w-full justify-start overflow-x-auto">
          {weekDays.map((day, index) => (
            <TabsTrigger
              key={index}
              value={index.toString()}
              className="flex-1 min-w-[100px]"
            >
              <div className="text-center">
                <div className="text-xs text-muted-foreground">
                  {format(day, 'EEE', { locale: ptBR })}
                </div>
                <div className="font-medium">{format(day, 'dd')}</div>
              </div>
            </TabsTrigger>
          ))}
        </TabsList>

        {weekDays.map((day, index) => {
          const dayTasks = getTasksForDay(day);
          return (
            <TabsContent key={index} value={index.toString()} className="mt-6">
              <Card>
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-display capitalize">
                      {format(day, "EEEE, dd 'de' MMMM", { locale: ptBR })}
                    </CardTitle>
                    <Button size="sm" onClick={() => handleAddTask(index)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Adicionar
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {dayTasks.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      Nenhuma tarefa para este dia
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {dayTasks.map((task) => (
                        <div
                          key={task.id}
                          className={cn(
                            "flex items-center gap-4 p-4 rounded-lg border transition-all",
                            task.status === 'completed'
                              ? "bg-muted/50 opacity-60"
                              : "bg-card hover:shadow-sm"
                          )}
                        >
                          <Checkbox
                            checked={task.status === 'completed'}
                            onCheckedChange={() => handleToggleTask(task)}
                          />
                          <div
                            className={cn(
                              "w-3 h-3 rounded-full",
                              taskTypeColors[task.task_type]
                            )}
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
                            <div className="flex items-center gap-2 mt-1">
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
                            onClick={() => handleEditTask(task, index)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteTaskId(task.id)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          );
        })}
      </Tabs>

      {/* Planning Wizard */}
      {isPlanningWizardOpen && (
        <PlanningWizard
          weekStart={weekStart}
          weekEnd={weekEnd}
          existingTasks={tasks}
          planningId={weeklyPlanning?.id || null}
          onClose={() => setIsPlanningWizardOpen(false)}
          onComplete={handlePlanningComplete}
        />
      )}

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
                value={format(weekDays[selectedDay], 'dd/MM/yyyy')}
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
              {loading ? 'Salvando...' : editingTask ? 'Salvar Alterações' : 'Criar Tarefa'}
            </Button>
          </form>
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation */}
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
    </div>
  );
}
