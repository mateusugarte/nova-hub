import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  isToday,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import DayTasksDialog from '@/components/agenda/DayTasksDialog';

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

export default function Agenda() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isDayDialogOpen, setIsDayDialogOpen] = useState(false);

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
    setIsDayDialogOpen(true);
  };

  const days = getDaysInMonth();
  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  const selectedDayTasks = selectedDate ? getTasksForDay(selectedDate) : [];

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
                          "text-xs px-1.5 py-0.5 rounded truncate",
                          taskTypeColors[task.task_type],
                          task.status === 'completed' && "opacity-50 line-through"
                        )}
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

      {/* Day Tasks Dialog */}
      {selectedDate && (
        <DayTasksDialog
          open={isDayDialogOpen}
          onOpenChange={setIsDayDialogOpen}
          selectedDate={selectedDate}
          tasks={selectedDayTasks}
          onTasksChange={fetchTasks}
        />
      )}
    </div>
  );
}
