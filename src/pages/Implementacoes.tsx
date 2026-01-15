import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
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
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
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
import LoadingScreen from '@/components/ui/loading-screen';
import {
  Plus,
  Package,
  CheckCircle2,
  Phone,
  Trash2,
  Edit,
  Search,
  DollarSign,
  Upload,
  Power,
  ChevronLeft,
  ChevronRight,
  PackageCheck,
  FileText,
  X,
  MessageSquare,
  Copy,
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, parseISO, isWithinInterval, addMonths, subMonths, isBefore, isAfter, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface Implementation {
  id: string;
  client_phone: string;
  group_link: string | null;
  instagram: string | null;
  automation_type: string;
  implementation_value: number;
  recurrence_value: number | null;
  recurrence_start_date: string | null;
  recurrence_end_date: string | null;
  status: string;
  delivery_completed: boolean;
  delivery_completed_at: string | null;
  created_at: string;
}

interface Stage {
  id: string;
  implementation_id: string;
  name: string;
  order_index: number;
  is_completed: boolean;
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
}

interface Billing {
  id: string;
  billing_date: string;
  amount: number;
  is_paid: boolean;
}

interface Prompt {
  id: string;
  implementation_id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [implementations, setImplementations] = useState<Implementation[]>([]);
  const [stages, setStages] = useState<Record<string, Stage[]>>({});
  const [feedbacks, setFeedbacks] = useState<Record<string, Feedback[]>>({});
  const [attachments, setAttachments] = useState<Record<string, Attachment[]>>({});
  const [billings, setBillings] = useState<Record<string, Billing[]>>({});
  const [prompts, setPrompts] = useState<Record<string, Prompt[]>>({});
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedImpl, setSelectedImpl] = useState<Implementation | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [newFeedback, setNewFeedback] = useState('');
  const [newStageName, setNewStageName] = useState('');
  const [activeTab, setActiveTab] = useState('stages');
  const [newPrompt, setNewPrompt] = useState({ title: '', content: '' });
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
  const [cancelRecurrenceOpen, setCancelRecurrenceOpen] = useState(false);
  const [cancelDate, setCancelDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  
  const [searchQuery, setSearchQuery] = useState('');
  const [metricsMonth, setMetricsMonth] = useState(new Date());
  const [showOnlyInactive, setShowOnlyInactive] = useState(false);
  const [showOnlyDeliveryPending, setShowOnlyDeliveryPending] = useState(false);

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
    recurrence_start_date: '',
    status: 'active',
  });

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    
    const { data: implData } = await supabase
      .from('implementations')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    setImplementations(implData || []);
    const implIds = (implData || []).map(i => i.id);
    
    if (implIds.length > 0) {
      const [stagesRes, feedbacksRes, attachmentsRes, billingsRes, promptsRes] = await Promise.all([
        supabase.from('implementation_stages').select('*').in('implementation_id', implIds).order('order_index'),
        supabase.from('implementation_feedbacks').select('*').in('implementation_id', implIds).order('created_at', { ascending: false }),
        supabase.from('implementation_attachments').select('*').in('implementation_id', implIds),
        supabase.from('implementation_billings').select('*').in('implementation_id', implIds).order('billing_date', { ascending: false }),
        supabase.from('implementation_prompts').select('*').in('implementation_id', implIds).order('created_at', { ascending: false }),
      ]);

      const stagesMap: Record<string, Stage[]> = {};
      const feedbacksMap: Record<string, Feedback[]> = {};
      const attachmentsMap: Record<string, Attachment[]> = {};
      const billingsMap: Record<string, Billing[]> = {};
      const promptsMap: Record<string, Prompt[]> = {};

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
      (promptsRes.data || []).forEach(p => {
        if (!promptsMap[p.implementation_id]) promptsMap[p.implementation_id] = [];
        promptsMap[p.implementation_id].push(p);
      });

      setStages(stagesMap);
      setFeedbacks(feedbacksMap);
      setAttachments(attachmentsMap);
      setBillings(billingsMap);
      setPrompts(promptsMap);
    }
    setLoading(false);
  };

  const handleCreateOrUpdate = async () => {
    if (!user || !formData.client_phone || !formData.automation_type) {
      toast({ title: 'Preencha os campos obrigatórios', variant: 'destructive' });
      return;
    }

    const payload = {
      user_id: user.id,
      client_phone: formData.client_phone,
      group_link: formData.group_link || null,
      instagram: formData.instagram || null,
      automation_type: formData.automation_type,
      implementation_value: parseFloat(formData.implementation_value) || 0,
      recurrence_value: formData.recurrence_value ? parseFloat(formData.recurrence_value) : null,
      recurrence_start_date: formData.recurrence_start_date || null,
      status: formData.status,
    };

    if (isEditMode && selectedImpl) {
      await supabase.from('implementations').update(payload).eq('id', selectedImpl.id);
      toast({ title: 'Implementação atualizada' });
    } else {
      const { data: impl } = await supabase.from('implementations').insert(payload).select().single();
      if (impl) {
        await supabase.from('implementation_stages').insert(
          defaultStages.map(s => ({ implementation_id: impl.id, name: s.name, order_index: s.order_index }))
        );
      }
      toast({ title: 'Implementação criada' });
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
      recurrence_start_date: '',
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
      recurrence_start_date: impl.recurrence_start_date || '',
      status: impl.status,
    });
    setIsEditMode(true);
    setIsFormOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await supabase.from('implementations').delete().eq('id', deleteId);
    toast({ title: 'Implementação excluída' });
    setDeleteId(null);
    fetchData();
  };

  const handleToggleStatus = async (impl: Implementation, e: React.MouseEvent) => {
    e.stopPropagation();
    const newStatus = impl.status === 'active' ? 'inactive' : 'active';
    await supabase.from('implementations').update({ status: newStatus }).eq('id', impl.id);
    toast({ title: `Implementação ${newStatus === 'active' ? 'ativada' : 'desativada'}` });
    fetchData();
  };

  const handleToggleDeliveryCompleted = async (impl: Implementation, e: React.MouseEvent) => {
    e.stopPropagation();
    await supabase.from('implementations').update({ 
      delivery_completed: !impl.delivery_completed,
      delivery_completed_at: !impl.delivery_completed ? new Date().toISOString() : null,
    }).eq('id', impl.id);
    toast({ title: impl.delivery_completed ? 'Entrega pendente' : 'Entrega concluída' });
    fetchData();
  };

  const handleCancelRecurrence = async () => {
    if (!selectedImpl) return;
    await supabase.from('implementations').update({ recurrence_end_date: cancelDate }).eq('id', selectedImpl.id);
    toast({ title: 'Recorrência cancelada' });
    setCancelRecurrenceOpen(false);
    fetchData();
  };

  const handleToggleStage = async (stage: Stage) => {
    await supabase.from('implementation_stages').update({
      is_completed: !stage.is_completed,
      completed_at: !stage.is_completed ? new Date().toISOString() : null,
    }).eq('id', stage.id);
    fetchData();
  };

  const handleAddStage = async () => {
    if (!selectedImpl || !newStageName.trim()) return;
    const currentStages = stages[selectedImpl.id] || [];
    const maxOrder = currentStages.length > 0 ? Math.max(...currentStages.map(s => s.order_index)) : -1;
    await supabase.from('implementation_stages').insert({
      implementation_id: selectedImpl.id,
      name: newStageName,
      order_index: maxOrder + 1,
    });
    setNewStageName('');
    fetchData();
  };

  const handleDeleteStage = async (stageId: string) => {
    await supabase.from('implementation_stages').delete().eq('id', stageId);
    fetchData();
  };

  const handleAddFeedback = async () => {
    if (!selectedImpl || !newFeedback.trim()) return;
    await supabase.from('implementation_feedbacks').insert({
      implementation_id: selectedImpl.id,
      content: newFeedback,
    });
    setNewFeedback('');
    fetchData();
  };

  const handleAddBilling = async () => {
    if (!selectedImpl || !newBilling.amount) return;
    await supabase.from('implementation_billings').insert({
      implementation_id: selectedImpl.id,
      billing_date: newBilling.billing_date,
      amount: parseFloat(newBilling.amount),
      notes: newBilling.notes || null,
    });
    setNewBilling({ billing_date: format(new Date(), 'yyyy-MM-dd'), amount: '', notes: '' });
    fetchData();
  };

  const handleToggleBillingPaid = async (billing: Billing) => {
    await supabase.from('implementation_billings').update({
      is_paid: !billing.is_paid,
      paid_at: !billing.is_paid ? new Date().toISOString() : null,
    }).eq('id', billing.id);
    fetchData();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedImpl || !user || !e.target.files?.[0]) return;
    const file = e.target.files[0];
    setUploading(true);
    try {
      const filePath = `${user.id}/${selectedImpl.id}/${Date.now()}.${file.name.split('.').pop()}`;
      await supabase.storage.from('implementation-documents').upload(filePath, file);
      const { data: { publicUrl } } = supabase.storage.from('implementation-documents').getPublicUrl(filePath);
      await supabase.from('implementation_attachments').insert({
        implementation_id: selectedImpl.id,
        file_name: file.name,
        file_url: publicUrl,
        file_type: file.type,
      });
      fetchData();
    } catch (error) {
      toast({ title: 'Erro no upload', variant: 'destructive' });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteAttachment = async (id: string) => {
    await supabase.from('implementation_attachments').delete().eq('id', id);
    fetchData();
  };

  const handleAddPrompt = async () => {
    if (!selectedImpl || !newPrompt.title.trim() || !newPrompt.content.trim()) return;
    await supabase.from('implementation_prompts').insert({
      implementation_id: selectedImpl.id,
      title: newPrompt.title,
      content: newPrompt.content,
    });
    setNewPrompt({ title: '', content: '' });
    fetchData();
  };

  const handleUpdatePrompt = async () => {
    if (!editingPrompt || !editingPrompt.title.trim() || !editingPrompt.content.trim()) return;
    await supabase.from('implementation_prompts').update({
      title: editingPrompt.title,
      content: editingPrompt.content,
    }).eq('id', editingPrompt.id);
    setEditingPrompt(null);
    fetchData();
  };

  const handleDeletePrompt = async (id: string) => {
    await supabase.from('implementation_prompts').delete().eq('id', id);
    fetchData();
  };

  const handleCopyPrompt = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({ title: 'Prompt copiado!' });
  };

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

  const filteredImplementations = implementations.filter(impl => {
    const matchesSearch = 
      impl.client_phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
      impl.automation_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (impl.instagram?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    if (!matchesSearch) return false;
    if (showOnlyInactive && impl.status === 'active') return false;
    if (showOnlyDeliveryPending && (impl.delivery_completed || impl.status !== 'active')) return false;
    return true;
  });

  const totalRecurrenceExpected = implementations
    .filter(impl => isRecurrenceActiveForMonth(impl, metricsMonth))
    .reduce((acc, i) => acc + (i.recurrence_value || 0), 0);
  
  const deliveryPendingCount = implementations.filter(i => i.status === 'active' && !i.delivery_completed).length;
  const deliveryCompletedCount = implementations.filter(i => i.delivery_completed).length;

  if (loading) return <LoadingScreen />;

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-2xl font-display text-foreground">Implementações</h1>
        <Button onClick={() => { setIsEditMode(false); resetForm(); setIsFormOpen(true); }} size="sm">
          <Plus className="w-4 h-4 mr-1" />
          Nova
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Total</span>
            </div>
            <p className="text-xl font-display mt-1">{implementations.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-success" />
              <span className="text-sm text-muted-foreground">Entregas</span>
            </div>
            <p className="text-xl font-display mt-1">{deliveryCompletedCount}/{deliveryPendingCount + deliveryCompletedCount}</p>
          </CardContent>
        </Card>
        <Card className="col-span-2">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-primary" />
                <span className="text-sm text-muted-foreground">Recorrência</span>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setMetricsMonth(subMonths(metricsMonth, 1))}>
                  <ChevronLeft className="w-3 h-3" />
                </Button>
                <span className="text-xs min-w-[80px] text-center capitalize">
                  {format(metricsMonth, 'MMM yy', { locale: ptBR })}
                </span>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setMetricsMonth(addMonths(metricsMonth, 1))}>
                  <ChevronRight className="w-3 h-3" />
                </Button>
              </div>
            </div>
            <p className="text-xl font-display mt-1">R$ {totalRecurrenceExpected.toLocaleString('pt-BR')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar..."
            className="pl-9"
          />
        </div>
        <div className="flex gap-3">
          <div className="flex items-center gap-2">
            <Switch id="inactive" checked={showOnlyInactive} onCheckedChange={(c) => { setShowOnlyInactive(c); if(c) setShowOnlyDeliveryPending(false); }} />
            <Label htmlFor="inactive" className="text-sm">Inativos</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch id="pending" checked={showOnlyDeliveryPending} onCheckedChange={(c) => { setShowOnlyDeliveryPending(c); if(c) setShowOnlyInactive(false); }} />
            <Label htmlFor="pending" className="text-sm">Pendentes</Label>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredImplementations.map((impl) => {
          const implStages = stages[impl.id] || [];
          const completedStages = implStages.filter(s => s.is_completed).length;
          const progress = implStages.length > 0 ? Math.round((completedStages / implStages.length) * 100) : 0;

          return (
            <Card 
              key={impl.id} 
              className="cursor-pointer hover:border-primary/40 transition-colors group"
              onClick={() => { setSelectedImpl(impl); setIsDetailOpen(true); setActiveTab('stages'); }}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex gap-1.5 flex-wrap">
                      <Badge variant={impl.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                        {impl.status === 'active' ? 'Ativo' : 'Inativo'}
                      </Badge>
                      {impl.delivery_completed && (
                        <Badge variant="outline" className="text-xs text-success border-success">Entregue</Badge>
                      )}
                    </div>
                    <p className="font-medium flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                      {impl.client_phone}
                    </p>
                    <p className="text-xs text-muted-foreground">{impl.automation_type}</p>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => handleToggleDeliveryCompleted(impl, e)}>
                      <PackageCheck className={cn("w-3.5 h-3.5", impl.delivery_completed ? 'text-success' : 'text-muted-foreground')} />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => handleToggleStatus(impl, e)}>
                      <Power className={cn("w-3.5 h-3.5", impl.status === 'active' ? 'text-success' : 'text-muted-foreground')} />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); handleEdit(impl); }}>
                      <Edit className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={(e) => { e.stopPropagation(); setDeleteId(impl.id); }}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{completedStages}/{implStages.length} etapas</span>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progress}%` }} />
                    </div>
                    <span>{progress}%</span>
                  </div>
                </div>
                {impl.recurrence_value && (
                  <p className="text-xs text-primary mt-2">
                    R$ {impl.recurrence_value.toLocaleString('pt-BR')}/mês
                    {impl.recurrence_end_date && <span className="text-destructive ml-1">(cancelada)</span>}
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredImplementations.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          Nenhuma implementação encontrada
        </div>
      )}

      {/* Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{isEditMode ? 'Editar' : 'Nova'} Implementação</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Telefone *</Label>
              <Input value={formData.client_phone} onChange={(e) => setFormData({ ...formData, client_phone: e.target.value })} placeholder="(00) 00000-0000" />
            </div>
            <div>
              <Label>Tipo *</Label>
              <Select value={formData.automation_type} onValueChange={(v) => setFormData({ ...formData, automation_type: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {automationTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Valor Impl.</Label>
                <Input type="number" value={formData.implementation_value} onChange={(e) => setFormData({ ...formData, implementation_value: e.target.value })} placeholder="0" />
              </div>
              <div>
                <Label>Recorrência</Label>
                <Input type="number" value={formData.recurrence_value} onChange={(e) => setFormData({ ...formData, recurrence_value: e.target.value })} placeholder="0" />
              </div>
            </div>
            {formData.recurrence_value && (
              <div>
                <Label>Início da cobrança</Label>
                <Input type="date" value={formData.recurrence_start_date} onChange={(e) => setFormData({ ...formData, recurrence_start_date: e.target.value })} />
              </div>
            )}
            <div>
              <Label>Instagram</Label>
              <Input value={formData.instagram} onChange={(e) => setFormData({ ...formData, instagram: e.target.value })} placeholder="@usuario" />
            </div>
            <div>
              <Label>Link do Grupo</Label>
              <Input value={formData.group_link} onChange={(e) => setFormData({ ...formData, group_link: e.target.value })} placeholder="https://..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFormOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreateOrUpdate}>{isEditMode ? 'Salvar' : 'Criar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Sheet */}
      <Sheet open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {selectedImpl && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  {selectedImpl.client_phone}
                </SheetTitle>
              </SheetHeader>

              <div className="mt-4 space-y-4">
                <div className="flex gap-2 flex-wrap">
                  <Badge variant={selectedImpl.status === 'active' ? 'default' : 'secondary'}>
                    {selectedImpl.status === 'active' ? 'Ativo' : 'Inativo'}
                  </Badge>
                  <Badge variant="outline">{selectedImpl.automation_type}</Badge>
                  {selectedImpl.delivery_completed && (
                    <Badge variant="outline" className="text-success border-success">Entregue</Badge>
                  )}
                </div>

                {selectedImpl.recurrence_value && (
                  <Card>
                    <CardContent className="p-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Recorrência</p>
                        <p className="font-medium">R$ {selectedImpl.recurrence_value.toLocaleString('pt-BR')}/mês</p>
                        {selectedImpl.recurrence_end_date && (
                          <p className="text-xs text-destructive">Cancelada em {format(parseISO(selectedImpl.recurrence_end_date), 'dd/MM/yyyy')}</p>
                        )}
                      </div>
                      {!selectedImpl.recurrence_end_date && (
                        <Button variant="outline" size="sm" onClick={() => setCancelRecurrenceOpen(true)}>
                          Cancelar
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                )}

                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="w-full grid grid-cols-5">
                    <TabsTrigger value="stages">Etapas</TabsTrigger>
                    <TabsTrigger value="prompts">Prompts</TabsTrigger>
                    <TabsTrigger value="feedbacks">Notas</TabsTrigger>
                    <TabsTrigger value="billings">Cobranças</TabsTrigger>
                    <TabsTrigger value="docs">Docs</TabsTrigger>
                  </TabsList>

                  <TabsContent value="stages" className="space-y-3 mt-4">
                    {(stages[selectedImpl.id] || []).map(stage => (
                      <div key={stage.id} className="flex items-center justify-between p-2 rounded border">
                        <div className="flex items-center gap-2">
                          <button onClick={() => handleToggleStage(stage)} className={cn(
                            "w-5 h-5 rounded border-2 flex items-center justify-center transition-colors",
                            stage.is_completed ? "bg-primary border-primary text-primary-foreground" : "border-muted-foreground"
                          )}>
                            {stage.is_completed && <CheckCircle2 className="w-3 h-3" />}
                          </button>
                          <span className={cn(stage.is_completed && "line-through text-muted-foreground")}>{stage.name}</span>
                        </div>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleDeleteStage(stage.id)}>
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                    <div className="flex gap-2">
                      <Input value={newStageName} onChange={(e) => setNewStageName(e.target.value)} placeholder="Nova etapa..." className="flex-1" />
                      <Button size="sm" onClick={handleAddStage}>Adicionar</Button>
                    </div>
                  </TabsContent>

                  <TabsContent value="prompts" className="space-y-3 mt-4">
                    {editingPrompt ? (
                      <div className="space-y-3 p-3 border rounded-lg">
                        <div>
                          <Label className="text-xs">Título</Label>
                          <Input 
                            value={editingPrompt.title} 
                            onChange={(e) => setEditingPrompt({ ...editingPrompt, title: e.target.value })} 
                            placeholder="Nome do prompt..."
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Conteúdo</Label>
                          <Textarea 
                            value={editingPrompt.content} 
                            onChange={(e) => setEditingPrompt({ ...editingPrompt, content: e.target.value })} 
                            placeholder="Conteúdo do prompt..." 
                            rows={6}
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" className="flex-1" onClick={() => setEditingPrompt(null)}>Cancelar</Button>
                          <Button size="sm" className="flex-1" onClick={handleUpdatePrompt}>Salvar</Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {(prompts[selectedImpl.id] || []).map(p => (
                          <div key={p.id} className="p-3 rounded border space-y-2">
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="font-medium text-sm">{p.title}</p>
                                <p className="text-xs text-muted-foreground">{format(parseISO(p.created_at), 'dd/MM/yy HH:mm')}</p>
                              </div>
                              <div className="flex gap-1">
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleCopyPrompt(p.content)}>
                                  <Copy className="w-3 h-3" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setEditingPrompt(p)}>
                                  <Edit className="w-3 h-3" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => handleDeletePrompt(p.id)}>
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                            <p className="text-sm whitespace-pre-wrap bg-muted/50 p-2 rounded text-muted-foreground">{p.content}</p>
                          </div>
                        ))}
                        <div className="space-y-2 pt-2 border-t">
                          <Input 
                            value={newPrompt.title} 
                            onChange={(e) => setNewPrompt({ ...newPrompt, title: e.target.value })} 
                            placeholder="Título do prompt..."
                          />
                          <Textarea 
                            value={newPrompt.content} 
                            onChange={(e) => setNewPrompt({ ...newPrompt, content: e.target.value })} 
                            placeholder="Conteúdo do prompt..." 
                            rows={4}
                          />
                          <Button size="sm" className="w-full" onClick={handleAddPrompt}>
                            <Plus className="w-4 h-4 mr-1" />
                            Adicionar Prompt
                          </Button>
                        </div>
                      </>
                    )}
                  </TabsContent>

                  <TabsContent value="feedbacks" className="space-y-3 mt-4">
                    {(feedbacks[selectedImpl.id] || []).map(f => (
                      <div key={f.id} className="p-2 rounded border text-sm">
                        <p className="text-xs text-muted-foreground mb-1">{format(parseISO(f.created_at), 'dd/MM/yy HH:mm')}</p>
                        <p>{f.content}</p>
                      </div>
                    ))}
                    <div className="flex gap-2">
                      <Textarea value={newFeedback} onChange={(e) => setNewFeedback(e.target.value)} placeholder="Adicionar nota..." className="flex-1" rows={2} />
                      <Button size="sm" onClick={handleAddFeedback}>Salvar</Button>
                    </div>
                  </TabsContent>

                  <TabsContent value="billings" className="space-y-3 mt-4">
                    {(billings[selectedImpl.id] || []).map(b => (
                      <div key={b.id} className="flex items-center justify-between p-2 rounded border">
                        <div>
                          <p className="text-sm font-medium">R$ {b.amount.toLocaleString('pt-BR')}</p>
                          <p className="text-xs text-muted-foreground">{format(parseISO(b.billing_date), 'dd/MM/yyyy')}</p>
                        </div>
                        <Button variant={b.is_paid ? "default" : "outline"} size="sm" onClick={() => handleToggleBillingPaid(b)}>
                          {b.is_paid ? 'Pago' : 'Pendente'}
                        </Button>
                      </div>
                    ))}
                    <div className="space-y-2 pt-2 border-t">
                      <div className="grid grid-cols-2 gap-2">
                        <Input type="date" value={newBilling.billing_date} onChange={(e) => setNewBilling({ ...newBilling, billing_date: e.target.value })} />
                        <Input type="number" value={newBilling.amount} onChange={(e) => setNewBilling({ ...newBilling, amount: e.target.value })} placeholder="Valor" />
                      </div>
                      <Button size="sm" className="w-full" onClick={handleAddBilling}>Registrar cobrança</Button>
                    </div>
                  </TabsContent>

                  <TabsContent value="docs" className="space-y-3 mt-4">
                    {(attachments[selectedImpl.id] || []).map(a => (
                      <div key={a.id} className="flex items-center justify-between p-2 rounded border">
                        <a href={a.file_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm hover:text-primary">
                          <FileText className="w-4 h-4" />
                          {a.file_name}
                        </a>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleDeleteAttachment(a.id)}>
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                    <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileUpload} />
                    <Button variant="outline" className="w-full" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                      <Upload className="w-4 h-4 mr-2" />
                      {uploading ? 'Enviando...' : 'Anexar documento'}
                    </Button>
                  </TabsContent>
                </Tabs>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Cancel Recurrence Dialog */}
      <Dialog open={cancelRecurrenceOpen} onOpenChange={setCancelRecurrenceOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Cancelar Recorrência</DialogTitle>
          </DialogHeader>
          <div>
            <Label>Data de cancelamento</Label>
            <Input type="date" value={cancelDate} onChange={(e) => setCancelDate(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelRecurrenceOpen(false)}>Voltar</Button>
            <Button variant="destructive" onClick={handleCancelRecurrence}>Cancelar Recorrência</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir implementação?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}