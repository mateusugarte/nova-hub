import { useEffect, useState } from 'react';
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import MetricCard from '@/components/dashboard/MetricCard';
import {
  Plus,
  Package,
  CheckCircle2,
  MessageSquare,
  Phone,
  Instagram,
  Link2,
  Trash2,
  Edit,
  FileText,
  ChevronRight,
  DollarSign,
  Calendar,
  Search,
  Filter,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, parseISO, isWithinInterval, addMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Power, ChevronLeft, ChevronRight as ChevronRightIcon, CalendarDays } from 'lucide-react';

interface Implementation {
  id: string;
  client_phone: string;
  group_link: string | null;
  instagram: string | null;
  automation_type: string;
  implementation_value: number;
  recurrence_value: number | null;
  status: string;
  created_at: string;
}

interface Stage {
  id: string;
  implementation_id: string;
  name: string;
  order_index: number;
  is_completed: boolean;
  completed_at: string | null;
}

interface Feedback {
  id: string;
  implementation_id: string;
  content: string;
  created_at: string;
}

interface Attachment {
  id: string;
  implementation_id: string;
  file_name: string;
  file_url: string;
  file_type: string | null;
}

interface Billing {
  id: string;
  implementation_id: string;
  billing_date: string;
  amount: number;
  is_paid: boolean;
  paid_at: string | null;
  notes: string | null;
}

const defaultStages = [
  { name: 'Call de Alinhamento', order_index: 0 },
  { name: 'Call de Onboarding', order_index: 1 },
  { name: 'Contratações', order_index: 2 },
];

const automationTypes = [
  'WhatsApp Bot',
  'Instagram Bot',
  'CRM Integration',
  'Email Automation',
  'Landing Page',
  'Sales Funnel',
  'Outro',
];

export default function Implementacoes() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [implementations, setImplementations] = useState<Implementation[]>([]);
  const [stages, setStages] = useState<Record<string, Stage[]>>({});
  const [feedbacks, setFeedbacks] = useState<Record<string, Feedback[]>>({});
  const [attachments, setAttachments] = useState<Record<string, Attachment[]>>({});
  const [billings, setBillings] = useState<Record<string, Billing[]>>({});
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedImpl, setSelectedImpl] = useState<Implementation | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [newFeedback, setNewFeedback] = useState('');
  const [newStageName, setNewStageName] = useState('');
  const [activeTab, setActiveTab] = useState('stages');
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<'all' | 'month' | 'custom'>('all');
  const [metricsMonth, setMetricsMonth] = useState(new Date());
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Billing form
  const [newBilling, setNewBilling] = useState({
    billing_date: format(new Date(), 'yyyy-MM-dd'),
    amount: '',
    notes: '',
  });
  
  const [formData, setFormData] = useState({
    client_phone: '',
    group_link: '',
    instagram: '',
    automation_type: '',
    implementation_value: '',
    recurrence_value: '',
    status: 'active',
  });

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    
    setLoading(true);
    
    const { data: implData, error } = await supabase
      .from('implementations')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      toast({ title: 'Erro ao carregar implementações', variant: 'destructive' });
      setLoading(false);
      return;
    }

    setImplementations(implData || []);

    const implIds = (implData || []).map(i => i.id);
    
    if (implIds.length > 0) {
      const [stagesRes, feedbacksRes, attachmentsRes, billingsRes] = await Promise.all([
        supabase.from('implementation_stages').select('*').in('implementation_id', implIds).order('order_index'),
        supabase.from('implementation_feedbacks').select('*').in('implementation_id', implIds).order('created_at', { ascending: false }),
        supabase.from('implementation_attachments').select('*').in('implementation_id', implIds).order('created_at', { ascending: false }),
        supabase.from('implementation_billings').select('*').in('implementation_id', implIds).order('billing_date', { ascending: false }),
      ]);

      const stagesMap: Record<string, Stage[]> = {};
      const feedbacksMap: Record<string, Feedback[]> = {};
      const attachmentsMap: Record<string, Attachment[]> = {};
      const billingsMap: Record<string, Billing[]> = {};

      (stagesRes.data || []).forEach(s => {
        if (!stagesMap[s.implementation_id]) stagesMap[s.implementation_id] = [];
        stagesMap[s.implementation_id].push(s);
      });

      (feedbacksRes.data || []).forEach(f => {
        if (!feedbacksMap[f.implementation_id]) feedbacksMap[f.implementation_id] = [];
        feedbacksMap[f.implementation_id].push(f);
      });

      (attachmentsRes.data || []).forEach(a => {
        if (!attachmentsMap[a.implementation_id]) attachmentsMap[a.implementation_id] = [];
        attachmentsMap[a.implementation_id].push(a);
      });

      (billingsRes.data || []).forEach(b => {
        if (!billingsMap[b.implementation_id]) billingsMap[b.implementation_id] = [];
        billingsMap[b.implementation_id].push(b);
      });

      setStages(stagesMap);
      setFeedbacks(feedbacksMap);
      setAttachments(attachmentsMap);
      setBillings(billingsMap);
    }

    setLoading(false);
  };

  const handleCreateOrUpdate = async () => {
    if (!user || !formData.client_phone || !formData.automation_type) {
      toast({ title: 'Preencha os campos obrigatórios', variant: 'destructive' });
      return;
    }

    const implPayload = {
      user_id: user.id,
      client_phone: formData.client_phone,
      group_link: formData.group_link || null,
      instagram: formData.instagram || null,
      automation_type: formData.automation_type,
      implementation_value: parseFloat(formData.implementation_value) || 0,
      recurrence_value: formData.recurrence_value ? parseFloat(formData.recurrence_value) : null,
      status: formData.status,
    };

    if (isEditMode && selectedImpl) {
      const { error } = await supabase
        .from('implementations')
        .update(implPayload)
        .eq('id', selectedImpl.id);

      if (error) {
        toast({ title: 'Erro ao atualizar implementação', variant: 'destructive' });
        return;
      }
      toast({ title: 'Implementação atualizada com sucesso' });
    } else {
      const { data: impl, error } = await supabase
        .from('implementations')
        .insert(implPayload)
        .select()
        .single();

      if (error) {
        toast({ title: 'Erro ao criar implementação', variant: 'destructive' });
        return;
      }

      const stagesToInsert = defaultStages.map(s => ({
        implementation_id: impl.id,
        name: s.name,
        order_index: s.order_index,
      }));

      await supabase.from('implementation_stages').insert(stagesToInsert);
      toast({ title: 'Implementação criada com sucesso' });
    }

    setIsFormOpen(false);
    setIsEditMode(false);
    resetForm();
    fetchData();
  };

  const resetForm = () => {
    setFormData({
      client_phone: '',
      group_link: '',
      instagram: '',
      automation_type: '',
      implementation_value: '',
      recurrence_value: '',
      status: 'active',
    });
  };

  const handleEdit = (impl: Implementation) => {
    setSelectedImpl(impl);
    setFormData({
      client_phone: impl.client_phone,
      group_link: impl.group_link || '',
      instagram: impl.instagram || '',
      automation_type: impl.automation_type,
      implementation_value: impl.implementation_value.toString(),
      recurrence_value: impl.recurrence_value?.toString() || '',
      status: impl.status,
    });
    setIsEditMode(true);
    setIsFormOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    const { error } = await supabase.from('implementations').delete().eq('id', deleteId);

    if (error) {
      toast({ title: 'Erro ao excluir implementação', variant: 'destructive' });
    } else {
      toast({ title: 'Implementação excluída' });
      fetchData();
    }
    setDeleteId(null);
  };

  const handleToggleStatus = async (impl: Implementation, e: React.MouseEvent) => {
    e.stopPropagation();
    const newStatus = impl.status === 'active' ? 'inactive' : 'active';
    const { error } = await supabase
      .from('implementations')
      .update({ status: newStatus })
      .eq('id', impl.id);

    if (error) {
      toast({ title: 'Erro ao atualizar status', variant: 'destructive' });
    } else {
      toast({ title: `Implementação ${newStatus === 'active' ? 'ativada' : 'desativada'}` });
      fetchData();
    }
  };

  const handleToggleStage = async (stage: Stage) => {
    const { error } = await supabase
      .from('implementation_stages')
      .update({
        is_completed: !stage.is_completed,
        completed_at: !stage.is_completed ? new Date().toISOString() : null,
      })
      .eq('id', stage.id);

    if (error) {
      toast({ title: 'Erro ao atualizar etapa', variant: 'destructive' });
    } else {
      fetchData();
    }
  };

  const handleAddStage = async () => {
    if (!selectedImpl || !newStageName.trim()) return;

    const currentStages = stages[selectedImpl.id] || [];
    const maxOrder = currentStages.length > 0 
      ? Math.max(...currentStages.map(s => s.order_index)) 
      : -1;

    const { error } = await supabase.from('implementation_stages').insert({
      implementation_id: selectedImpl.id,
      name: newStageName,
      order_index: maxOrder + 1,
    });

    if (error) {
      toast({ title: 'Erro ao criar etapa', variant: 'destructive' });
    } else {
      toast({ title: 'Etapa criada' });
      setNewStageName('');
      fetchData();
    }
  };

  const handleDeleteStage = async (stageId: string) => {
    const { error } = await supabase.from('implementation_stages').delete().eq('id', stageId);
    if (error) {
      toast({ title: 'Erro ao excluir etapa', variant: 'destructive' });
    } else {
      fetchData();
    }
  };

  const handleAddFeedback = async () => {
    if (!selectedImpl || !newFeedback.trim()) return;

    const { error } = await supabase.from('implementation_feedbacks').insert({
      implementation_id: selectedImpl.id,
      content: newFeedback,
    });

    if (error) {
      toast({ title: 'Erro ao adicionar feedback', variant: 'destructive' });
    } else {
      toast({ title: 'Feedback adicionado' });
      setNewFeedback('');
      fetchData();
    }
  };

  const handleAddBilling = async () => {
    if (!selectedImpl || !newBilling.amount) return;

    const { error } = await supabase.from('implementation_billings').insert({
      implementation_id: selectedImpl.id,
      billing_date: newBilling.billing_date,
      amount: parseFloat(newBilling.amount),
      notes: newBilling.notes || null,
    });

    if (error) {
      toast({ title: 'Erro ao adicionar cobrança', variant: 'destructive' });
    } else {
      toast({ title: 'Cobrança registrada' });
      setNewBilling({
        billing_date: format(new Date(), 'yyyy-MM-dd'),
        amount: '',
        notes: '',
      });
      fetchData();
    }
  };

  const handleToggleBillingPaid = async (billing: Billing) => {
    const { error } = await supabase
      .from('implementation_billings')
      .update({
        is_paid: !billing.is_paid,
        paid_at: !billing.is_paid ? new Date().toISOString() : null,
      })
      .eq('id', billing.id);

    if (error) {
      toast({ title: 'Erro ao atualizar cobrança', variant: 'destructive' });
    } else {
      fetchData();
    }
  };

  const handleDeleteBilling = async (billingId: string) => {
    const { error } = await supabase.from('implementation_billings').delete().eq('id', billingId);
    if (error) {
      toast({ title: 'Erro ao excluir cobrança', variant: 'destructive' });
    } else {
      fetchData();
    }
  };

  const openDetail = (impl: Implementation) => {
    setSelectedImpl(impl);
    setIsDetailOpen(true);
    setActiveTab('stages');
  };

  // Filter implementations
  const filteredImplementations = implementations.filter(impl => {
    // Search filter
    const matchesSearch = 
      impl.client_phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
      impl.automation_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (impl.instagram?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);

    if (!matchesSearch) return false;

    // Date filter
    if (dateFilter === 'month') {
      const implDate = parseISO(impl.created_at);
      const monthStart = startOfMonth(new Date());
      const monthEnd = endOfMonth(new Date());
      return isWithinInterval(implDate, { start: monthStart, end: monthEnd });
    }

    if (dateFilter === 'custom' && customStartDate && customEndDate) {
      const implDate = parseISO(impl.created_at);
      return isWithinInterval(implDate, { 
        start: parseISO(customStartDate), 
        end: parseISO(customEndDate) 
      });
    }

    return true;
  });

  // Calculate metrics
  const activeCount = filteredImplementations.filter(i => i.status === 'active').length;
  const totalValue = filteredImplementations.reduce((acc, i) => acc + (i.implementation_value || 0), 0);
  
  // Recurrence metrics based on selected month
  const metricsMonthStart = startOfMonth(metricsMonth);
  const metricsMonthEnd = endOfMonth(metricsMonth);
  
  const totalRecurrenceExpected = filteredImplementations
    .filter(i => i.status === 'active' && i.recurrence_value)
    .reduce((acc, i) => acc + (i.recurrence_value || 0), 0);

  const allBillings = Object.values(billings).flat();
  const monthBillings = allBillings.filter(b => {
    const billingDate = parseISO(b.billing_date);
    return isWithinInterval(billingDate, { start: metricsMonthStart, end: metricsMonthEnd });
  });
  
  const receivedRecurrence = monthBillings.filter(b => b.is_paid).reduce((acc, b) => acc + b.amount, 0);
  const pendingRecurrence = totalRecurrenceExpected - receivedRecurrence;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-pulse text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display text-foreground">Implementações</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie suas implementações e acompanhe o progresso
          </p>
        </div>
        <Button onClick={() => { setIsEditMode(false); resetForm(); setIsFormOpen(true); }} className="btn-scale">
          <Plus className="w-4 h-4 mr-2" />
          Nova Implementação
        </Button>
      </div>

      {/* Metrics */}
      <div className="space-y-4">
        {/* Month Selector for Metrics */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-primary" />
                <span className="font-medium">Métricas de Recorrência</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setMetricsMonth(subMonths(metricsMonth, 1))}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="min-w-[140px] text-center font-medium capitalize">
                  {format(metricsMonth, 'MMMM yyyy', { locale: ptBR })}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setMetricsMonth(addMonths(metricsMonth, 1))}
                >
                  <ChevronRightIcon className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setMetricsMonth(new Date())}
                  className="ml-2"
                >
                  Hoje
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          <MetricCard
            title="Total"
            value={filteredImplementations.length}
            icon={<Package className="w-5 h-5" />}
          />
          <MetricCard
            title="Ativas"
            value={activeCount}
            icon={<CheckCircle2 className="w-5 h-5" />}
          />
          <MetricCard
            title="Valor Total"
            value={`R$ ${totalValue.toLocaleString('pt-BR')}`}
            icon={<DollarSign className="w-5 h-5" />}
          />
          <MetricCard
            title="Recorrência Esperada"
            value={`R$ ${totalRecurrenceExpected.toLocaleString('pt-BR')}`}
            icon={<TrendingUp className="w-5 h-5" />}
          />
          <MetricCard
            title={`Recebido em ${format(metricsMonth, 'MMM', { locale: ptBR })}`}
            value={`R$ ${receivedRecurrence.toLocaleString('pt-BR')}`}
            icon={<CheckCircle2 className="w-5 h-5" />}
          />
          <MetricCard
            title={`Pendente em ${format(metricsMonth, 'MMM', { locale: ptBR })}`}
            value={`R$ ${Math.max(0, pendingRecurrence).toLocaleString('pt-BR')}`}
            icon={<AlertCircle className="w-5 h-5" />}
          />
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por telefone, tipo ou Instagram..."
                className="pl-10"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <Select value={dateFilter} onValueChange={(v: 'all' | 'month' | 'custom') => setDateFilter(v)}>
                <SelectTrigger className="w-[160px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filtrar data" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as datas</SelectItem>
                  <SelectItem value="month">Este mês</SelectItem>
                  <SelectItem value="custom">Período personalizado</SelectItem>
                </SelectContent>
              </Select>
              {dateFilter === 'custom' && (
                <>
                  <Input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="w-[150px]"
                  />
                  <Input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="w-[150px]"
                  />
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Implementations List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredImplementations.map((impl) => {
          const implStages = stages[impl.id] || [];
          const completedStages = implStages.filter(s => s.is_completed).length;
          const progress = implStages.length > 0 
            ? Math.round((completedStages / implStages.length) * 100) 
            : 0;
          const implBillings = billings[impl.id] || [];
          const paidBillings = implBillings.filter(b => b.is_paid).length;

          return (
            <Card 
              key={impl.id} 
              className="card-hover cursor-pointer group"
              onClick={() => openDetail(impl)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <Badge variant={impl.status === 'active' ? 'default' : 'secondary'}>
                      {impl.status === 'active' ? 'Ativo' : 'Inativo'}
                    </Badge>
                    <CardTitle className="text-lg font-display flex items-center gap-2">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      {impl.client_phone}
                    </CardTitle>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      title={impl.status === 'active' ? 'Desativar' : 'Ativar'}
                      onClick={(e) => handleToggleStatus(impl, e)}
                    >
                      <Power className={cn(
                        "w-4 h-4",
                        impl.status === 'active' ? 'text-success' : 'text-muted-foreground'
                      )} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(impl);
                      }}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteId(impl.id);
                      }}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <Badge variant="outline">{impl.automation_type}</Badge>
                  {impl.instagram && (
                    <span className="flex items-center gap-1">
                      <Instagram className="w-3 h-3" />
                      {impl.instagram}
                    </span>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Progresso</span>
                    <span className="font-medium">{progress}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {completedStages} de {implStages.length} etapas • {paidBillings} cobranças pagas
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t">
                  <div>
                    <p className="text-xs text-muted-foreground">Valor</p>
                    <p className="font-medium">R$ {impl.implementation_value.toLocaleString('pt-BR')}</p>
                  </div>
                  {impl.recurrence_value && (
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Recorrência</p>
                      <p className="font-medium">R$ {impl.recurrence_value.toLocaleString('pt-BR')}/mês</p>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end text-sm text-primary">
                  Ver detalhes
                  <ChevronRight className="w-4 h-4 ml-1" />
                </div>
              </CardContent>
            </Card>
          );
        })}

        {filteredImplementations.length === 0 && (
          <Card className="col-span-full">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Package className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhuma implementação encontrada</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => { setIsEditMode(false); resetForm(); setIsFormOpen(true); }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Criar primeira implementação
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Create/Edit Form Sheet */}
      <Sheet open={isFormOpen} onOpenChange={setIsFormOpen}>
        <SheetContent className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{isEditMode ? 'Editar Implementação' : 'Nova Implementação'}</SheetTitle>
            <SheetDescription>
              {isEditMode ? 'Atualize os dados da implementação' : 'Preencha os dados do cliente para criar uma nova implementação'}
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-4 mt-6">
            <div className="space-y-2">
              <Label>Número do Cliente *</Label>
              <Input
                value={formData.client_phone}
                onChange={(e) => setFormData({ ...formData, client_phone: e.target.value })}
                placeholder="(11) 99999-9999"
              />
            </div>
            <div className="space-y-2">
              <Label>Link do Grupo</Label>
              <Input
                value={formData.group_link}
                onChange={(e) => setFormData({ ...formData, group_link: e.target.value })}
                placeholder="https://chat.whatsapp.com/..."
              />
            </div>
            <div className="space-y-2">
              <Label>Instagram</Label>
              <Input
                value={formData.instagram}
                onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                placeholder="@usuario"
              />
            </div>
            <div className="space-y-2">
              <Label>Tipo de Automação *</Label>
              <Select
                value={formData.automation_type}
                onValueChange={(value) => setFormData({ ...formData, automation_type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {automationTypes.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Valor da Implementação *</Label>
              <Input
                type="number"
                value={formData.implementation_value}
                onChange={(e) => setFormData({ ...formData, implementation_value: e.target.value })}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label>Valor de Recorrência (opcional)</Label>
              <Input
                type="number"
                value={formData.recurrence_value}
                onChange={(e) => setFormData({ ...formData, recurrence_value: e.target.value })}
                placeholder="0.00"
              />
            </div>
            <Button onClick={handleCreateOrUpdate} className="w-full">
              {isEditMode ? 'Salvar Alterações' : 'Criar Implementação'}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedImpl && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <DialogTitle className="flex items-center gap-2">
                    <Phone className="w-5 h-5" />
                    {selectedImpl.client_phone}
                  </DialogTitle>
                  <Button variant="outline" size="sm" onClick={() => handleEdit(selectedImpl)}>
                    <Edit className="w-4 h-4 mr-2" />
                    Editar
                  </Button>
                </div>
                <DialogDescription className="flex items-center gap-4 flex-wrap">
                  <Badge>{selectedImpl.automation_type}</Badge>
                  <Badge variant={selectedImpl.status === 'active' ? 'default' : 'secondary'}>
                    {selectedImpl.status === 'active' ? 'Ativo' : 'Inativo'}
                  </Badge>
                  {selectedImpl.instagram && (
                    <span className="flex items-center gap-1">
                      <Instagram className="w-4 h-4" />
                      {selectedImpl.instagram}
                    </span>
                  )}
                  {selectedImpl.group_link && (
                    <a 
                      href={selectedImpl.group_link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-primary hover:underline"
                    >
                      <Link2 className="w-4 h-4" />
                      Grupo
                    </a>
                  )}
                </DialogDescription>
              </DialogHeader>

              <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="stages">Etapas</TabsTrigger>
                  <TabsTrigger value="billing">Cobranças</TabsTrigger>
                  <TabsTrigger value="feedbacks">Feedbacks</TabsTrigger>
                  <TabsTrigger value="attachments">Anexos</TabsTrigger>
                </TabsList>

                <TabsContent value="stages" className="space-y-4">
                  <div className="space-y-2">
                    {(stages[selectedImpl.id] || []).map((stage) => (
                      <div 
                        key={stage.id}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all group",
                          stage.is_completed && "bg-success/10 border-success/30"
                        )}
                        onClick={() => handleToggleStage(stage)}
                      >
                        <div className={cn(
                          "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                          stage.is_completed ? "border-success bg-success" : "border-muted-foreground"
                        )}>
                          {stage.is_completed && <CheckCircle2 className="w-4 h-4 text-white" />}
                        </div>
                        <span className={cn(
                          "flex-1",
                          stage.is_completed && "line-through text-muted-foreground"
                        )}>
                          {stage.name}
                        </span>
                        {stage.completed_at && (
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(stage.completed_at), 'dd/MM/yyyy', { locale: ptBR })}
                          </span>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="opacity-0 group-hover:opacity-100"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteStage(stage.id);
                          }}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={newStageName}
                      onChange={(e) => setNewStageName(e.target.value)}
                      placeholder="Nova etapa..."
                      className="flex-1"
                    />
                    <Button onClick={handleAddStage} disabled={!newStageName.trim()}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="billing" className="space-y-4">
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {(billings[selectedImpl.id] || []).map((billing) => (
                      <div 
                        key={billing.id}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-lg border transition-all group",
                          billing.is_paid && "bg-success/10 border-success/30"
                        )}
                      >
                        <Button
                          variant="ghost"
                          size="icon"
                          className="shrink-0"
                          onClick={() => handleToggleBillingPaid(billing)}
                        >
                          <div className={cn(
                            "w-6 h-6 rounded-full border-2 flex items-center justify-center",
                            billing.is_paid ? "border-success bg-success" : "border-muted-foreground"
                          )}>
                            {billing.is_paid && <CheckCircle2 className="w-4 h-4 text-white" />}
                          </div>
                        </Button>
                        <div className="flex-1">
                          <p className="font-medium">R$ {billing.amount.toLocaleString('pt-BR')}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(parseISO(billing.billing_date), 'dd/MM/yyyy', { locale: ptBR })}
                            {billing.notes && ` • ${billing.notes}`}
                          </p>
                        </div>
                        {billing.is_paid && billing.paid_at && (
                          <Badge variant="outline" className="text-success border-success">
                            Pago em {format(new Date(billing.paid_at), 'dd/MM', { locale: ptBR })}
                          </Badge>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="opacity-0 group-hover:opacity-100"
                          onClick={() => handleDeleteBilling(billing.id)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                    {(billings[selectedImpl.id] || []).length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">Nenhuma cobrança registrada</p>
                    )}
                  </div>
                  <div className="space-y-3 p-3 bg-muted/50 rounded-lg">
                    <Label className="text-sm font-medium">Nova Cobrança</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        type="date"
                        value={newBilling.billing_date}
                        onChange={(e) => setNewBilling({ ...newBilling, billing_date: e.target.value })}
                      />
                      <Input
                        type="number"
                        value={newBilling.amount}
                        onChange={(e) => setNewBilling({ ...newBilling, amount: e.target.value })}
                        placeholder="Valor"
                      />
                    </div>
                    <Input
                      value={newBilling.notes}
                      onChange={(e) => setNewBilling({ ...newBilling, notes: e.target.value })}
                      placeholder="Observação (opcional)"
                    />
                    <Button onClick={handleAddBilling} disabled={!newBilling.amount} className="w-full">
                      <Plus className="w-4 h-4 mr-2" />
                      Registrar Cobrança
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="feedbacks" className="space-y-4">
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {(feedbacks[selectedImpl.id] || []).map((feedback) => (
                      <div key={feedback.id} className="p-3 rounded-lg bg-muted/50 text-sm">
                        <p>{feedback.content}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(feedback.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                    ))}
                    {(feedbacks[selectedImpl.id] || []).length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">Nenhum feedback ainda</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Textarea
                      value={newFeedback}
                      onChange={(e) => setNewFeedback(e.target.value)}
                      placeholder="Adicionar feedback..."
                      className="flex-1"
                      rows={2}
                    />
                    <Button onClick={handleAddFeedback} disabled={!newFeedback.trim()}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="attachments" className="space-y-4">
                  <div className="space-y-2">
                    {(attachments[selectedImpl.id] || []).map((att) => (
                      <a 
                        key={att.id}
                        href={att.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-2 rounded-lg border hover:bg-muted/50 transition-colors"
                      >
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">{att.file_name}</span>
                      </a>
                    ))}
                    {(attachments[selectedImpl.id] || []).length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">Nenhum anexo</p>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Funcionalidade de upload em breve
                  </p>
                </TabsContent>
              </Tabs>

              {/* Values */}
              <div className="flex items-center justify-between pt-4 border-t mt-4">
                <div>
                  <p className="text-sm text-muted-foreground">Valor da Implementação</p>
                  <p className="text-xl font-display">
                    R$ {selectedImpl.implementation_value.toLocaleString('pt-BR')}
                  </p>
                </div>
                {selectedImpl.recurrence_value && (
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Recorrência Mensal</p>
                    <p className="text-xl font-display">
                      R$ {selectedImpl.recurrence_value.toLocaleString('pt-BR')}
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza que deseja deletar?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Todas as etapas, feedbacks, cobranças e anexos serão removidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              Deletar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
