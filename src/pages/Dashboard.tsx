import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import LoadingScreen from '@/components/ui/loading-screen';
import {
  CheckSquare,
  Calendar,
  Users,
  Plus,
  DollarSign,
  Package,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, parseISO, startOfDay, isBefore, isAfter, subMonths, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface DashboardStats {
  tasksToday: number;
  tasksCompletedToday: number;
  tasksCompletedWeek: number;
  prospectsTotal: number;
  prospectsConverted: number;
  totalRecurrence: number;
  deliveryPendingCount: number;
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

interface ChartData {
  day: string;
  date: string;
  completed: number;
}

interface RecurrenceData {
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
    prospectsTotal: 0,
    prospectsConverted: 0,
    totalRecurrence: 0,
    deliveryPendingCount: 0,
  });
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [recurrenceData, setRecurrenceData] = useState<RecurrenceData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

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

    // Generate last 7 days dates
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(today, 6 - i);
      return format(date, 'yyyy-MM-dd');
    });

    try {
      // Batch all queries in parallel
      const [
        tasksToday,
        tasksCompletedToday,
        tasksCompletedWeek,
        prospectsTotal,
        prospectsConverted,
        implementationsData,
        tasksLast7Days,
      ] = await Promise.all([
        supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('scheduled_date', todayStr),
        supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('scheduled_date', todayStr).eq('status', 'completed'),
        supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'completed').gte('scheduled_date', weekStart).lte('scheduled_date', weekEnd),
        supabase.from('prospects').select('*', { count: 'exact', head: true }).eq('user_id', user.id).gte('created_at', monthStart),
        supabase.from('prospects').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'converted'),
        supabase.from('implementations').select('id, recurrence_value, recurrence_start_date, recurrence_end_date, status, delivery_completed, created_at').eq('user_id', user.id),
        supabase.from('tasks').select('scheduled_date').eq('user_id', user.id).eq('status', 'completed').gte('scheduled_date', last7Days[0]).lte('scheduled_date', last7Days[6]),
      ]);

      const implementations = (implementationsData.data || []) as Implementation[];
      
      // Current month recurrence
      const totalRecurrence = implementations
        .filter(impl => isRecurrenceActiveForMonth(impl, today))
        .reduce((acc, i) => acc + (i.recurrence_value || 0), 0);

      const deliveryPendingCount = implementations.filter(i => i.status === 'active' && !i.delivery_completed).length;

      // Process chart data - count tasks per day
      const tasksByDate: Record<string, number> = {};
      (tasksLast7Days.data || []).forEach(t => {
        tasksByDate[t.scheduled_date] = (tasksByDate[t.scheduled_date] || 0) + 1;
      });

      const chartDataProcessed: ChartData[] = last7Days.map(dateStr => {
        const date = parseISO(dateStr);
        return {
          day: format(date, 'EEE', { locale: ptBR }),
          date: dateStr,
          completed: tasksByDate[dateStr] || 0,
        };
      });

      // Recurrence evolution data (last 6 months)
      const recurrenceChartData: RecurrenceData[] = Array.from({ length: 6 }, (_, i) => {
        const month = subMonths(today, 5 - i);
        const expected = implementations
          .filter(impl => isRecurrenceActiveForMonth(impl, month))
          .reduce((acc, impl) => acc + (impl.recurrence_value || 0), 0);
        
        return {
          month: format(month, 'MMM', { locale: ptBR }),
          value: expected,
        };
      });

      setStats({
        tasksToday: tasksToday.count || 0,
        tasksCompletedToday: tasksCompletedToday.count || 0,
        tasksCompletedWeek: tasksCompletedWeek.count || 0,
        prospectsTotal: prospectsTotal.count || 0,
        prospectsConverted: prospectsConverted.count || 0,
        totalRecurrence,
        deliveryPendingCount,
      });

      setChartData(chartDataProcessed);
      setRecurrenceData(recurrenceChartData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const conversionRate = stats.prospectsTotal > 0
    ? Math.round((stats.prospectsConverted / stats.prospectsTotal) * 100)
    : 0;

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            {format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}
          </p>
        </div>
        <Button onClick={() => navigate('/tarefas')} size="sm">
          <Plus className="w-4 h-4 mr-1" />
          Nova Tarefa
        </Button>
      </div>

      {/* Main metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => navigate('/tarefas')}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <CheckSquare className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-display">{stats.tasksCompletedToday}/{stats.tasksToday}</p>
                <p className="text-xs text-muted-foreground">Tarefas hoje</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => navigate('/agenda')}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Calendar className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-display">{stats.tasksCompletedWeek}</p>
                <p className="text-xs text-muted-foreground">Concluídas semana</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => navigate('/prospeccao')}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-display">{stats.prospectsTotal}</p>
                <p className="text-xs text-muted-foreground">Prospecções ({conversionRate}%)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => navigate('/implementacoes')}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <DollarSign className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-display">R$ {stats.totalRecurrence.toLocaleString('pt-BR')}</p>
                <p className="text-xs text-muted-foreground">Recorrência mês</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-primary" />
              Tarefas Concluídas (7 dias)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="day" className="text-xs" tick={{ fontSize: 11 }} />
                  <YAxis className="text-xs" tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      borderColor: 'hsl(var(--border))',
                      borderRadius: '0.5rem',
                      fontSize: '12px',
                    }}
                    formatter={(value: number) => [value, 'Concluídas']}
                  />
                  <Bar dataKey="completed" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              Evolução da Recorrência
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={recurrenceData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" className="text-xs" tick={{ fontSize: 11 }} />
                  <YAxis className="text-xs" tick={{ fontSize: 11 }} tickFormatter={(v) => `R$${v}`} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      borderColor: 'hsl(var(--border))',
                      borderRadius: '0.5rem',
                      fontSize: '12px',
                    }}
                    formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR')}`, 'Recorrência']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--primary))', r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Package className="w-4 h-4 text-primary" />
              Entregas Pendentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-3xl font-display">{stats.deliveryPendingCount}</p>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate('/implementacoes')}
                className="text-muted-foreground hover:text-foreground"
              >
                Ver todas
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Ações Rápidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => navigate('/tarefas')}>
                Planejar semana
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigate('/prospeccao')}>
                Nova prospecção
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigate('/postagens')}>
                Criar conteúdo
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}