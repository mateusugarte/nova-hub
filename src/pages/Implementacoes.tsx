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
  Upload,
  ChevronRight,
  X,
} from 'lucide-react';
import { format } from 'date-fns';
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
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedImpl, setSelectedImpl] = useState<Implementation | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [newFeedback, setNewFeedback] = useState('');
  const [newStageName, setNewStageName] = useState('');
  
  const [formData, setFormData] = useState({
    client_phone: '',
    group_link: '',
    instagram: '',
    automation_type: '',
    implementation_value: '',
    recurrence_value: '',
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

    // Fetch stages, feedbacks, and attachments for all implementations
    const implIds = (implData || []).map(i => i.id);
    
    if (implIds.length > 0) {
      const [stagesRes, feedbacksRes, attachmentsRes] = await Promise.all([
        supabase.from('implementation_stages').select('*').in('implementation_id', implIds).order('order_index'),
        supabase.from('implementation_feedbacks').select('*').in('implementation_id', implIds).order('created_at', { ascending: false }),
        supabase.from('implementation_attachments').select('*').in('implementation_id', implIds).order('created_at', { ascending: false }),
      ]);

      const stagesMap: Record<string, Stage[]> = {};
      const feedbacksMap: Record<string, Feedback[]> = {};
      const attachmentsMap: Record<string, Attachment[]> = {};

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

      setStages(stagesMap);
      setFeedbacks(feedbacksMap);
      setAttachments(attachmentsMap);
    }

    setLoading(false);
  };

  const handleCreate = async () => {
    if (!user || !formData.client_phone || !formData.automation_type) {
      toast({ title: 'Preencha os campos obrigatórios', variant: 'destructive' });
      return;
    }

    const { data: impl, error } = await supabase
      .from('implementations')
      .insert({
        user_id: user.id,
        client_phone: formData.client_phone,
        group_link: formData.group_link || null,
        instagram: formData.instagram || null,
        automation_type: formData.automation_type,
        implementation_value: parseFloat(formData.implementation_value) || 0,
        recurrence_value: formData.recurrence_value ? parseFloat(formData.recurrence_value) : null,
      })
      .select()
      .single();

    if (error) {
      toast({ title: 'Erro ao criar implementação', variant: 'destructive' });
      return;
    }

    // Create default stages
    const stagesToInsert = defaultStages.map(s => ({
      implementation_id: impl.id,
      name: s.name,
      order_index: s.order_index,
    }));

    await supabase.from('implementation_stages').insert(stagesToInsert);

    toast({ title: 'Implementação criada com sucesso' });
    setIsFormOpen(false);
    setFormData({
      client_phone: '',
      group_link: '',
      instagram: '',
      automation_type: '',
      implementation_value: '',
      recurrence_value: '',
    });
    fetchData();
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

  const openDetail = (impl: Implementation) => {
    setSelectedImpl(impl);
    setIsDetailOpen(true);
  };

  const activeCount = implementations.filter(i => i.status === 'active').length;
  const totalFeedbacks = Object.values(feedbacks).flat().length;
  const totalValue = implementations.reduce((acc, i) => acc + (i.implementation_value || 0), 0);

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
        <Button onClick={() => setIsFormOpen(true)} className="btn-scale">
          <Plus className="w-4 h-4 mr-2" />
          Nova Implementação
        </Button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total de Implementações"
          value={implementations.length}
          icon={<Package className="w-6 h-6" />}
        />
        <MetricCard
          title="Implementações Ativas"
          value={activeCount}
          icon={<CheckCircle2 className="w-6 h-6" />}
        />
        <MetricCard
          title="Feedbacks Registrados"
          value={totalFeedbacks}
          icon={<MessageSquare className="w-6 h-6" />}
        />
        <MetricCard
          title="Valor Total"
          value={`R$ ${totalValue.toLocaleString('pt-BR')}`}
          icon={<Package className="w-6 h-6" />}
        />
      </div>

      {/* Implementations List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {implementations.map((impl) => {
          const implStages = stages[impl.id] || [];
          const completedStages = implStages.filter(s => s.is_completed).length;
          const progress = implStages.length > 0 
            ? Math.round((completedStages / implStages.length) * 100) 
            : 0;

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
                  <Button
                    variant="ghost"
                    size="icon"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteId(impl.id);
                    }}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
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
                    {completedStages} de {implStages.length} etapas concluídas
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

        {implementations.length === 0 && (
          <Card className="col-span-full">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Package className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhuma implementação ainda</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => setIsFormOpen(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Criar primeira implementação
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Create Form Sheet */}
      <Sheet open={isFormOpen} onOpenChange={setIsFormOpen}>
        <SheetContent className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Nova Implementação</SheetTitle>
            <SheetDescription>
              Preencha os dados do cliente para criar uma nova implementação
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
            <Button onClick={handleCreate} className="w-full">
              Criar Implementação
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedImpl && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Phone className="w-5 h-5" />
                  {selectedImpl.client_phone}
                </DialogTitle>
                <DialogDescription className="flex items-center gap-4">
                  <Badge>{selectedImpl.automation_type}</Badge>
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

              <div className="space-y-6 mt-4">
                {/* Stages */}
                <div>
                  <h3 className="font-medium mb-3">Etapas</h3>
                  <div className="space-y-2">
                    {(stages[selectedImpl.id] || []).map((stage) => (
                      <div 
                        key={stage.id}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all",
                          stage.is_completed && "bg-green-500/10 border-green-500/30"
                        )}
                        onClick={() => handleToggleStage(stage)}
                      >
                        <div className={cn(
                          "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                          stage.is_completed ? "border-green-500 bg-green-500" : "border-muted-foreground"
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
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2 mt-3">
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
                </div>

                {/* Feedbacks */}
                <div>
                  <h3 className="font-medium mb-3">Feedbacks do Cliente</h3>
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
                      <p className="text-sm text-muted-foreground">Nenhum feedback ainda</p>
                    )}
                  </div>
                  <div className="flex gap-2 mt-3">
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
                </div>

                {/* Attachments */}
                <div>
                  <h3 className="font-medium mb-3">Anexos</h3>
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
                      <p className="text-sm text-muted-foreground">Nenhum anexo</p>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Funcionalidade de upload em breve
                  </p>
                </div>

                {/* Values */}
                <div className="flex items-center justify-between pt-4 border-t">
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
              Esta ação não pode ser desfeita. Todas as etapas, feedbacks e anexos serão removidos.
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
