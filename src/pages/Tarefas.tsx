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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
  ListChecks,
  CheckCircle2,
} from 'lucide-react';
import MetricCard from '@/components/dashboard/MetricCard';
import PlanningWizard from '@/components/planning/PlanningWizard';
import WeekSelectorDialog from '@/components/planning/WeekSelectorDialog';
import {
  format,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  startOfMonth,
  endOfMonth,
  isToday,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Json } from '@/integrations/supabase/types';

interface TaskStep {
  id: string;
  title: string;
  completed: boolean;
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  task_type: string;
  status: string;
  scheduled_date: string;
  scheduled_time: string | null;
  steps: TaskStep[] | null;
}

interface WeeklyPlanning {
  id: string;
  week_start: string;
  week_end: string;
  is_completed: boolean;
}

const taskTypeColors: Record<string, string> = {
  meeting: 'bg-[hsl(342,75%,33%)]',
  content: 'bg-[hsl(142,76%,36%)]',
  prospecting: 'bg-[hsl(38,92%,50%)]',
  steps: 'bg-[hsl(262,83%,58%)]',
  other: 'bg-[hsl(0,0%,46%)]',
};

const taskTypeBadgeColors: Record<string, string> = {
  meeting: 'bg-[hsl(342,75%,33%)] text-white',
  content: 'bg-[hsl(142,76%,36%)] text-white',
  prospecting: 'bg-[hsl(38,92%,50%)] text-white',
  steps: 'bg-[hsl(262,83%,58%)] text-white',
  other: 'bg-[hsl(0,0%,46%)] text-white',
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
  const [isWeekSelectorOpen, setIsWeekSelectorOpen] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState<{ start: Date; end: Date } | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deleteTaskId, setDeleteTaskId] = useState<string | null>(null);
  const [selectedTaskForSteps, setSelectedTaskForSteps] = useState<Task | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    task_type: 'other',
    scheduled_time: '',
  });
  const [taskSteps, setTaskSteps] = useState<TaskStep[]>([]);
  const [newStepTitle, setNewStepTitle] = useState('');
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

  const parseSteps = (stepsJson: Json | null): TaskStep[] | null => {
    if (!stepsJson) return null;
    if (Array.isArray(stepsJson)) {
      return stepsJson.map((step: any) => ({
        id: step.id || crypto.randomUUID(),
        title: step.title || '',
        completed: step.completed || false,
      }));
    }
    return null;
  };

  const fetchData = async () => {
    if (!user) return;

    const weekStartStr = format(weekStart, 'yyyy-MM-dd');
    const weekEndStr = format(weekEnd, 'yyyy-MM-dd');
    const monthStartStr = format(startOfMonth(today), 'yyyy-MM-dd');
    const monthEndStr = format(endOfMonth(today), 'yyyy-MM-dd');

    const { data: tasksData } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .gte('scheduled_date', weekStartStr)
      .lte('scheduled_date', weekEndStr)
      .order('scheduled_time', { ascending: true });

    const parsedTasks = (tasksData || []).map(task => ({
      ...task,
      steps: parseSteps(task.steps),
    }));

    setTasks(parsedTasks);

    const { data: planningData } = await supabase
      .from('weekly_planning')
      .select('*')
      .eq('user_id', user.id)
      .eq('week_start', weekStartStr)
      .maybeSingle();

    setWeeklyPlanning(planningData);

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
      nextTask: nextTaskData ? { ...nextTaskData, steps: parseSteps(nextTaskData.steps) } : null,
    });
  };

  const getTasksForDay = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return tasks.filter((task) => task.scheduled_date === dateStr);
  };

  const handleStartPlanning = () => {
    setIsWeekSelectorOpen(true);
  };

  const handleWeekSelected = async (weekStartDate: Date, weekEndDate: Date) => {
    if (!user) return;

    const weekStartStr = format(weekStartDate, 'yyyy-MM-dd');
    const weekEndStr = format(weekEndDate, 'yyyy-MM-dd');

    // Check if planning already exists for this week
    const { data: existingPlanning } = await supabase
      .from('weekly_planning')
      .select('*')
      .eq('user_id', user.id)
      .eq('week_start', weekStartStr)
      .maybeSingle();

    if (!existingPlanning) {
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
    } else {
      setWeeklyPlanning(existingPlanning);
    }

    setSelectedWeek({ start: weekStartDate, end: weekEndDate });
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
    setTaskSteps([]);
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
    setTaskSteps(task.steps || []);
    setIsFormOpen(true);
  };

  const handleAddStep = () => {
    if (!newStepTitle.trim()) return;
    setTaskSteps([
      ...taskSteps,
      { id: crypto.randomUUID(), title: newStepTitle, completed: false }
    ]);
    setNewStepTitle('');
  };

  const handleRemoveStep = (stepId: string) => {
    setTaskSteps(taskSteps.filter(s => s.id !== stepId));
  };

  const handleToggleStepInForm = (stepId: string) => {
    setTaskSteps(taskSteps.map(s => 
      s.id === stepId ? { ...s, completed: !s.completed } : s
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);

    const selectedDate = weekDays[selectedDay];
    const stepsData = formData.task_type === 'steps' && taskSteps.length > 0 
      ? JSON.parse(JSON.stringify(taskSteps))
      : null;

    const taskData = {
      user_id: user.id,
      title: formData.title,
      description: formData.description || null,
      task_type: formData.task_type,
      scheduled_date: format(selectedDate, 'yyyy-MM-dd'),
      scheduled_time: formData.scheduled_time || null,
      steps: stepsData,
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
      setTaskSteps([]);
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

  const handleToggleTaskStep = async (task: Task, stepId: string) => {
    if (!task.steps) return;

    const updatedSteps = task.steps.map(s =>
      s.id === stepId ? { ...s, completed: !s.completed } : s
    );

    const allCompleted = updatedSteps.every(s => s.completed);

    const { error } = await supabase
      .from('tasks')
      .update({
        steps: JSON.parse(JSON.stringify(updatedSteps)),
        status: allCompleted ? 'completed' : 'pending',
        completed_at: allCompleted ? new Date().toISOString() : null,
      })
      .eq('id', task.id);

    if (error) {
      toast({ title: 'Erro ao atualizar etapa', variant: 'destructive' });
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

  const getCompletedStepsCount = (task: Task) => {
    if (!task.steps) return { completed: 0, total: 0 };
    return {
      completed: task.steps.filter(s => s.completed).length,
      total: task.steps.length,
    };
  };

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
              className={cn(
                "flex-1 min-w-[100px]",
                isToday(day) && "ring-2 ring-primary ring-offset-2 ring-offset-background"
              )}
            >
              <div className="text-center">
                <div className="text-xs text-muted-foreground">
                  {format(day, 'EEE', { locale: ptBR })}
                </div>
                <div className={cn("font-medium", isToday(day) && "text-primary")}>
                  {format(day, 'dd')}
                </div>
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
                    <CardTitle className={cn(
                      "text-lg font-display capitalize",
                      isToday(day) && "text-primary"
                    )}>
                      {format(day, "EEEE, dd 'de' MMMM", { locale: ptBR })}
                      {isToday(day) && <Badge className="ml-2">Hoje</Badge>}
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
                      {dayTasks.map((task) => {
                        const stepsCount = getCompletedStepsCount(task);
                        return (
                          <div
                            key={task.id}
                            className={cn(
                              "flex items-start gap-4 p-4 rounded-lg border transition-all",
                              task.status === 'completed'
                                ? "bg-muted/50 opacity-60"
                                : "bg-card hover:shadow-sm"
                            )}
                          >
                            {task.task_type !== 'steps' ? (
                              <Checkbox
                                checked={task.status === 'completed'}
                                onCheckedChange={() => handleToggleTask(task)}
                                className="mt-1"
                              />
                            ) : (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="shrink-0 mt-0"
                                onClick={() => setSelectedTaskForSteps(task)}
                              >
                                <ListChecks className="w-5 h-5 text-primary" />
                              </Button>
                            )}
                            <div
                              className={cn(
                                "w-3 h-3 rounded-full mt-1.5 shrink-0",
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
                              <div className="flex items-center gap-2 mt-1 flex-wrap">
                                <Badge className={taskTypeBadgeColors[task.task_type]}>
                                  {taskTypeLabels[task.task_type]}
                                </Badge>
                                {task.scheduled_time && (
                                  <span className="text-xs text-muted-foreground">
                                    {task.scheduled_time.slice(0, 5)}
                                  </span>
                                )}
                                {task.task_type === 'steps' && task.steps && (
                                  <span className="text-xs text-muted-foreground">
                                    {stepsCount.completed}/{stepsCount.total} etapas
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
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          );
        })}
      </Tabs>

      {/* Week Selector Dialog */}
      <WeekSelectorDialog
        open={isWeekSelectorOpen}
        onOpenChange={setIsWeekSelectorOpen}
        onSelectWeek={handleWeekSelected}
      />

      {/* Planning Wizard */}
      {isPlanningWizardOpen && selectedWeek && (
        <PlanningWizard
          weekStart={selectedWeek.start}
          weekEnd={selectedWeek.end}
          existingTasks={tasks}
          planningId={weeklyPlanning?.id || null}
          onClose={() => {
            setIsPlanningWizardOpen(false);
            setSelectedWeek(null);
          }}
          onComplete={handlePlanningComplete}
        />
      )}

      {/* Task Form Sheet */}
      <Sheet open={isFormOpen} onOpenChange={setIsFormOpen}>
        <SheetContent className="overflow-y-auto">
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
                  <SelectItem value="meeting">
                    <div className="flex items-center gap-2">
                      <div className={cn("w-3 h-3 rounded-full", taskTypeColors.meeting)} />
                      Reunião
                    </div>
                  </SelectItem>
                  <SelectItem value="content">
                    <div className="flex items-center gap-2">
                      <div className={cn("w-3 h-3 rounded-full", taskTypeColors.content)} />
                      Criação de Conteúdo
                    </div>
                  </SelectItem>
                  <SelectItem value="prospecting">
                    <div className="flex items-center gap-2">
                      <div className={cn("w-3 h-3 rounded-full", taskTypeColors.prospecting)} />
                      Prospecção
                    </div>
                  </SelectItem>
                  <SelectItem value="steps">
                    <div className="flex items-center gap-2">
                      <div className={cn("w-3 h-3 rounded-full", taskTypeColors.steps)} />
                      Tarefa por Etapas
                    </div>
                  </SelectItem>
                  <SelectItem value="other">
                    <div className="flex items-center gap-2">
                      <div className={cn("w-3 h-3 rounded-full", taskTypeColors.other)} />
                      Outra
                    </div>
                  </SelectItem>
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

            {/* Steps Section - Only for "steps" type */}
            {formData.task_type === 'steps' && (
              <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
                <Label className="font-medium">Etapas da Tarefa</Label>
                <div className="space-y-2">
                  {taskSteps.map((step) => (
                    <div key={step.id} className="flex items-center gap-2 p-2 bg-background rounded border">
                      <Checkbox
                        checked={step.completed}
                        onCheckedChange={() => handleToggleStepInForm(step.id)}
                      />
                      <span className={cn("flex-1", step.completed && "line-through text-muted-foreground")}>
                        {step.title}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveStep(step.id)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={newStepTitle}
                    onChange={(e) => setNewStepTitle(e.target.value)}
                    placeholder="Nova etapa..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddStep();
                      }
                    }}
                  />
                  <Button type="button" onClick={handleAddStep} disabled={!newStepTitle.trim()}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Salvando...' : editingTask ? 'Salvar Alterações' : 'Criar Tarefa'}
            </Button>
          </form>
        </SheetContent>
      </Sheet>

      {/* Steps Dialog */}
      <Dialog open={!!selectedTaskForSteps} onOpenChange={() => setSelectedTaskForSteps(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ListChecks className="w-5 h-5 text-primary" />
              {selectedTaskForSteps?.title}
            </DialogTitle>
          </DialogHeader>
          {selectedTaskForSteps?.steps && (
            <div className="space-y-2 mt-4">
              {selectedTaskForSteps.steps.map((step) => (
                <div
                  key={step.id}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all",
                    step.completed && "bg-success/10 border-success/30"
                  )}
                  onClick={() => handleToggleTaskStep(selectedTaskForSteps, step.id)}
                >
                  <div className={cn(
                    "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                    step.completed ? "border-success bg-success" : "border-muted-foreground"
                  )}>
                    {step.completed && <CheckCircle2 className="w-4 h-4 text-white" />}
                  </div>
                  <span className={cn(
                    "flex-1",
                    step.completed && "line-through text-muted-foreground"
                  )}>
                    {step.title}
                  </span>
                </div>
              ))}
              <p className="text-xs text-muted-foreground text-center mt-4">
                Clique em uma etapa para marcar/desmarcar
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>

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
