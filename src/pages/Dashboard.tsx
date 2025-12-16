import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import MetricCard from '@/components/dashboard/MetricCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { HoverBorderGradient } from '@/components/ui/hover-border-gradient';
import { RealTimeAnalytics } from '@/components/ui/real-time-analytics';
import LoadingScreen from '@/components/ui/loading-screen';
import {
  CheckSquare,
  Calendar,
  Users,
  TrendingUp,
  Plus,
  Clock,
  DollarSign,
  Package,
  AlertCircle,
} from 'lucide-react';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays, subMonths, parseISO, isWithinInterval, startOfDay, isBefore, isAfter } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface DashboardStats {
  tasksToday: number;
  tasksCompletedToday: number;
  tasksCompletedWeek: number;
  tasksCompletedMonth: number;
  prospectsTotal: number;
  prospectsConverted: number;
  nextTask: { title: string; time: string } | null;
  weeklyPlanningDone: boolean;
  totalRecurrence: number;
  deliveryPendingCount: number;
  deliveryCompletedCount: number;
}

interface ChartData {
  day: string;
  completed: number;
}

interface Implementation {
  id: string;
  recurrence_value: number | null;
  recurrence_start_date: string | null;
  recurrence_end_date: string | null;
  status: string;
  delivery_completed: boolean;
  created_at: string;
}

interface RecurrenceChartData {
  month: string;
  value: number;
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    tasksToday: 0,
    tasksCompletedToday: 0,
    tasksCompletedWeek: 0,
    tasksCompletedMonth: 0,
    prospectsTotal: 0,
    prospectsConverted: 0,
    nextTask: null,
    weeklyPlanningDone: false,
    totalRecurrence: 0,
    deliveryPendingCount: 0,
    deliveryCompletedCount: 0,
  });
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [recurrenceChartData, setRecurrenceChartData] = useState<RecurrenceChartData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  // Helper to check if recurrence is active for a given month
  const isRecurrenceActiveForMonth = (impl: Implementation, monthDate: Date) => {
    if (!impl.recurrence_value || impl.status !== 'active') return false;
    
    const monthStart = startOfMonth(monthDate);
    const monthEnd = endOfMonth(monthDate);
    
    const startDate = impl.recurrence_start_date 
      ? startOfDay(parseISO(impl.recurrence_start_date))
      : startOfDay(parseISO(impl.created_at));
    
    if (isAfter(startDate, monthEnd)) return false;
    
    if (impl.recurrence_end_date) {
      const endDate = startOfDay(parseISO(impl.recurrence_end_date));
      if (isBefore(endDate, monthStart)) return false;
    }
    
    return true;
  };

  const fetchDashboardData = async () => {
    if (!user) return;

    const today = new Date();
    const todayStr = format(today, 'yyyy-MM-dd');
    const weekStart = format(startOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd');
    const weekEnd = format(endOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd');
    const monthStart = format(startOfMonth(today), 'yyyy-MM-dd');
    const monthEnd = format(endOfMonth(today), 'yyyy-MM-dd');

    try {
      // Tasks today
      const { count: tasksToday } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('scheduled_date', todayStr);

      // Tasks completed today
      const { count: tasksCompletedToday } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('scheduled_date', todayStr)
        .eq('status', 'completed');

      // Tasks completed this week
      const { count: tasksCompletedWeek } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .gte('scheduled_date', weekStart)
        .lte('scheduled_date', weekEnd);

      // Tasks completed this month
      const { count: tasksCompletedMonth } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .gte('scheduled_date', monthStart)
        .lte('scheduled_date', monthEnd);

      // Prospects total (this month)
      const { count: prospectsTotal } = await supabase
        .from('prospects')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', monthStart);

      // Prospects converted
      const { count: prospectsConverted } = await supabase
        .from('prospects')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'converted');

      // Next pending task
      const { data: nextTaskData } = await supabase
        .from('tasks')
        .select('title, scheduled_time')
        .eq('user_id', user.id)
        .eq('scheduled_date', todayStr)
        .eq('status', 'pending')
        .order('scheduled_time', { ascending: true })
        .limit(1)
        .maybeSingle();

      // Weekly planning status
      const { data: weeklyPlanning } = await supabase
        .from('weekly_planning')
        .select('is_completed')
        .eq('user_id', user.id)
        .eq('week_start', weekStart)
        .maybeSingle();

      // Implementations for recurrence
      const { data: implementationsData } = await supabase
        .from('implementations')
        .select('id, recurrence_value, recurrence_start_date, recurrence_end_date, status, delivery_completed, created_at')
        .eq('user_id', user.id);

      const implementations = (implementationsData || []) as Implementation[];
      
      // Current month recurrence
      const totalRecurrence = implementations
        .filter(impl => isRecurrenceActiveForMonth(impl, today))
        .reduce((acc, i) => acc + (i.recurrence_value || 0), 0);

      // Delivery counts
      const deliveryPendingCount = implementations.filter(i => i.status === 'active' && !i.delivery_completed).length;
      const deliveryCompletedCount = implementations.filter(i => i.delivery_completed).length;

      // Recurrence chart data for last 6 months
      const recurrenceData: RecurrenceChartData[] = Array.from({ length: 6 }, (_, i) => {
        const month = subMonths(today, 5 - i);
        const expected = implementations
          .filter(impl => isRecurrenceActiveForMonth(impl, month))
          .reduce((acc, i) => acc + (i.recurrence_value || 0), 0);
        
        return {
          month: format(month, 'MMM', { locale: ptBR }),
          value: expected,
        };
      });

      setRecurrenceChartData(recurrenceData);

      // Chart data (last 7 days)
      const last7Days: ChartData[] = [];
      for (let i = 6; i >= 0; i--) {
        const date = subDays(today, i);
        const dateStr = format(date, 'yyyy-MM-dd');
        const { count } = await supabase
          .from('tasks')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('scheduled_date', dateStr)
          .eq('status', 'completed');

        last7Days.push({
          day: format(date, 'EEE', { locale: ptBR }),
          completed: count || 0,
        });
      }

      setStats({
        tasksToday: tasksToday || 0,
        tasksCompletedToday: tasksCompletedToday || 0,
        tasksCompletedWeek: tasksCompletedWeek || 0,
        tasksCompletedMonth: tasksCompletedMonth || 0,
        prospectsTotal: prospectsTotal || 0,
        prospectsConverted: prospectsConverted || 0,
        nextTask: nextTaskData
          ? { title: nextTaskData.title, time: nextTaskData.scheduled_time || '' }
          : null,
        weeklyPlanningDone: weeklyPlanning?.is_completed || false,
        totalRecurrence,
        deliveryPendingCount,
        deliveryCompletedCount,
      });

      setChartData(last7Days);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const conversionRate = stats.prospectsTotal > 0
    ? Math.round((stats.prospectsConverted / stats.prospectsTotal) * 100)
    : 0;

  // Convert chart data for RealTimeAnalytics component
  const analyticsData = chartData.map((item, index) => ({
    time: index,
    value: item.completed,
    label: item.day,
  }));

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Visão geral do seu dia
          </p>
        </div>
        <HoverBorderGradient
          onClick={() => navigate('/tarefas')}
          containerClassName="cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Nova Tarefa
          </span>
        </HoverBorderGradient>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-6">
        <MetricCard
          title="Tarefas Hoje"
          value={stats.tasksToday}
          subtitle={`${stats.tasksCompletedToday} concluídas`}
          icon={<CheckSquare className="w-6 h-6" />}
          onClick={() => navigate('/tarefas')}
        />
        <MetricCard
          title="Concluídas na Semana"
          value={stats.tasksCompletedWeek}
          icon={<Calendar className="w-6 h-6" />}
          onClick={() => navigate('/agenda')}
        />
        <MetricCard
          title="Prospecções (Mês)"
          value={stats.prospectsTotal}
          icon={<Users className="w-6 h-6" />}
          onClick={() => navigate('/prospeccao')}
        />
        <MetricCard
          title="Taxa de Conversão"
          value={`${conversionRate}%`}
          icon={<TrendingUp className="w-6 h-6" />}
          onClick={() => navigate('/prospeccao')}
        />
        <MetricCard
          title="Recorrência (Mês)"
          value={`R$ ${stats.totalRecurrence.toLocaleString('pt-BR')}`}
          icon={<DollarSign className="w-6 h-6" />}
          onClick={() => navigate('/implementacoes')}
        />
        <MetricCard
          title="Entregas Pendentes"
          value={stats.deliveryPendingCount}
          subtitle={`${stats.deliveryCompletedCount} concluídas`}
          icon={<Package className="w-6 h-6" />}
          onClick={() => navigate('/implementacoes')}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RealTimeAnalytics
          data={analyticsData}
          title="Tarefas Concluídas"
          subtitle="Últimos 7 dias"
          animated={true}
        />

        <Card className="bg-card/80 backdrop-blur-sm border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-display flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-primary" />
              Evolução da Recorrência
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={recurrenceChartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" tickFormatter={(v) => `R$${v}`} />
                  <Tooltip 
                    formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR')}`, 'Recorrência']}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      borderColor: 'hsl(var(--border))',
                      borderRadius: '0.5rem',
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--primary))' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="bg-card/80 backdrop-blur-sm border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-display flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Próxima Tarefa
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.nextTask ? (
              <div className="space-y-2">
                <p className="font-medium text-foreground">{stats.nextTask.title}</p>
                {stats.nextTask.time && (
                  <p className="text-sm text-muted-foreground">
                    {stats.nextTask.time.slice(0, 5)}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground">Nenhuma tarefa pendente</p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card/80 backdrop-blur-sm border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-display">
              Planejamento Semanal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  stats.weeklyPlanningDone
                    ? 'bg-success/10 text-success'
                    : 'bg-warning/10 text-warning'
                }`}
              >
                {stats.weeklyPlanningDone ? 'Concluído' : 'Pendente'}
              </span>
              <HoverBorderGradient
                onClick={() => navigate('/tarefas')}
                containerClassName="cursor-pointer"
                className="text-sm px-3 py-1.5"
              >
                {stats.weeklyPlanningDone ? 'Ver' : 'Iniciar'}
              </HoverBorderGradient>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/80 backdrop-blur-sm border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-display flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-warning" />
              Projetos para Entregar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-display">{stats.deliveryPendingCount}</p>
                <p className="text-sm text-muted-foreground">projetos ativos pendentes</p>
              </div>
              <HoverBorderGradient
                onClick={() => navigate('/implementacoes')}
                containerClassName="cursor-pointer"
                className="text-sm px-3 py-1.5"
              >
                Ver
              </HoverBorderGradient>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}