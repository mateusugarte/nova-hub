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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import {
  Users,
  Plus,
  Phone,
  Instagram,
  Calendar,
  XCircle,
  CheckCircle,
  Clock,
  TrendingUp,
  Search,
} from 'lucide-react';
import MetricCard from '@/components/dashboard/MetricCard';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface Prospect {
  id: string;
  phone_number: string | null;
  instagram_link: string | null;
  profile_summary: string | null;
  contact_summary: string | null;
  approach_description: string | null;
  prospecting_method: string[] | null;
  status: string;
  needs_follow_up: boolean;
  has_meeting_scheduled: boolean;
  meeting_date: string | null;
  was_rejected: boolean;
  rejection_reason: string | null;
  objections: string | null;
  created_at: string;
}

const statusColors: Record<string, string> = {
  follow_up: 'bg-warning text-warning-foreground',
  scheduled: 'bg-info text-info-foreground',
  rejected: 'bg-destructive text-destructive-foreground',
  converted: 'bg-success text-success-foreground',
};

const statusLabels: Record<string, string> = {
  follow_up: 'Follow-up',
  scheduled: 'Agendado',
  rejected: 'Rejeitado',
  converted: 'Convertido',
};

export default function Prospeccao() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedProspect, setSelectedProspect] = useState<Prospect | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [formData, setFormData] = useState({
    phone_number: '',
    instagram_link: '',
    profile_summary: '',
    contact_summary: '',
    approach_description: '',
    prospecting_method: [] as string[],
    needs_follow_up: false,
    has_meeting_scheduled: false,
    was_rejected: false,
    rejection_reason: '',
    objections: '',
  });
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    followUp: 0,
    scheduled: 0,
    rejected: 0,
    converted: 0,
  });

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;

    const today = new Date();
    const monthStart = format(startOfMonth(today), 'yyyy-MM-dd');

    const { data } = await supabase
      .from('prospects')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    setProspects(data || []);

    // Stats
    const { count: total } = await supabase
      .from('prospects')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', monthStart);

    const { count: followUp } = await supabase
      .from('prospects')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'follow_up');

    const { count: scheduled } = await supabase
      .from('prospects')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'scheduled');

    const { count: rejected } = await supabase
      .from('prospects')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'rejected');

    const { count: converted } = await supabase
      .from('prospects')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'converted');

    setStats({
      total: total || 0,
      followUp: followUp || 0,
      scheduled: scheduled || 0,
      rejected: rejected || 0,
      converted: converted || 0,
    });
  };

  const handleMethodChange = (method: string, checked: boolean) => {
    if (checked) {
      setFormData({
        ...formData,
        prospecting_method: [...formData.prospecting_method, method],
      });
    } else {
      setFormData({
        ...formData,
        prospecting_method: formData.prospecting_method.filter((m) => m !== method),
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);

    let status = 'follow_up';
    if (formData.has_meeting_scheduled) status = 'scheduled';
    if (formData.was_rejected) status = 'rejected';

    const { error } = await supabase.from('prospects').insert({
      user_id: user.id,
      phone_number: formData.phone_number || null,
      instagram_link: formData.instagram_link || null,
      profile_summary: formData.profile_summary || null,
      contact_summary: formData.contact_summary || null,
      approach_description: formData.approach_description || null,
      prospecting_method: formData.prospecting_method.length > 0 ? formData.prospecting_method : null,
      status,
      needs_follow_up: formData.needs_follow_up,
      has_meeting_scheduled: formData.has_meeting_scheduled,
      was_rejected: formData.was_rejected,
      rejection_reason: formData.rejection_reason || null,
      objections: formData.objections || null,
    });

    setLoading(false);

    if (error) {
      toast({ title: 'Erro ao salvar prospecção', variant: 'destructive' });
    } else {
      toast({ title: 'Prospecção registrada com sucesso' });
      setIsFormOpen(false);
      setFormData({
        phone_number: '',
        instagram_link: '',
        profile_summary: '',
        contact_summary: '',
        approach_description: '',
        prospecting_method: [],
        needs_follow_up: false,
        has_meeting_scheduled: false,
        was_rejected: false,
        rejection_reason: '',
        objections: '',
      });
      fetchData();
    }
  };

  const handleUpdateStatus = async (prospect: Prospect, newStatus: string) => {
    const { error } = await supabase
      .from('prospects')
      .update({ status: newStatus })
      .eq('id', prospect.id);

    if (error) {
      toast({ title: 'Erro ao atualizar status', variant: 'destructive' });
    } else {
      toast({ title: 'Status atualizado' });
      setIsDetailOpen(false);
      fetchData();
    }
  };

  const filteredProspects = prospects.filter((prospect) => {
    const matchesSearch =
      (prospect.phone_number?.includes(searchTerm) || false) ||
      (prospect.instagram_link?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      (prospect.profile_summary?.toLowerCase().includes(searchTerm.toLowerCase()) || false);

    if (filterStatus === 'all') return matchesSearch;
    return matchesSearch && prospect.status === filterStatus;
  });

  const conversionRate = stats.total > 0
    ? Math.round((stats.converted / stats.total) * 100)
    : 0;

  const rejectionRate = stats.total > 0
    ? Math.round((stats.rejected / stats.total) * 100)
    : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display text-foreground">Prospecção</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie seus leads e follow-ups
          </p>
        </div>
        <Button onClick={() => setIsFormOpen(true)} className="btn-scale">
          <Plus className="w-4 h-4 mr-2" />
          Iniciar Prospecção
        </Button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <MetricCard
          title="Total (Mês)"
          value={stats.total}
          icon={<Users className="w-5 h-5" />}
        />
        <MetricCard
          title="Follow-up"
          value={stats.followUp}
          icon={<Clock className="w-5 h-5" />}
        />
        <MetricCard
          title="Agendados"
          value={stats.scheduled}
          icon={<Calendar className="w-5 h-5" />}
        />
        <MetricCard
          title="Rejeitados"
          value={stats.rejected}
          icon={<XCircle className="w-5 h-5" />}
        />
        <MetricCard
          title="Taxa Conversão"
          value={`${conversionRate}%`}
          icon={<TrendingUp className="w-5 h-5" />}
        />
        <MetricCard
          title="Taxa Rejeição"
          value={`${rejectionRate}%`}
          icon={<TrendingUp className="w-5 h-5" />}
        />
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por telefone, Instagram ou resumo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Tabs value={filterStatus} onValueChange={setFilterStatus}>
              <TabsList>
                <TabsTrigger value="all">Todos</TabsTrigger>
                <TabsTrigger value="follow_up">Follow-up</TabsTrigger>
                <TabsTrigger value="scheduled">Agendados</TabsTrigger>
                <TabsTrigger value="rejected">Rejeitados</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardContent>
      </Card>

      {/* Prospects List */}
      {filteredProspects.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Nenhum lead encontrado. Comece uma nova prospecção!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredProspects.map((prospect) => (
            <Card
              key={prospect.id}
              className="cursor-pointer card-hover"
              onClick={() => {
                setSelectedProspect(prospect);
                setIsDetailOpen(true);
              }}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    {prospect.instagram_link ? (
                      <Instagram className="w-6 h-6 text-primary" />
                    ) : (
                      <Phone className="w-6 h-6 text-primary" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {prospect.phone_number && (
                        <span className="font-medium">{prospect.phone_number}</span>
                      )}
                      {prospect.instagram_link && (
                        <a
                          href={prospect.instagram_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline text-sm"
                          onClick={(e) => e.stopPropagation()}
                        >
                          @{prospect.instagram_link.split('/').pop()}
                        </a>
                      )}
                    </div>
                    {prospect.profile_summary && (
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {prospect.profile_summary}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <Badge className={cn('text-xs', statusColors[prospect.status])}>
                        {statusLabels[prospect.status]}
                      </Badge>
                      {prospect.prospecting_method?.map((method) => (
                        <Badge key={method} variant="outline" className="text-xs capitalize">
                          {method.replace('_', ' ')}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(prospect.created_at), 'dd/MM/yyyy')}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Prospect Form Sheet */}
      <Sheet open={isFormOpen} onOpenChange={setIsFormOpen}>
        <SheetContent className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="font-display">Nova Prospecção</SheetTitle>
          </SheetHeader>
          <form onSubmit={handleSubmit} className="space-y-6 mt-6">
            <div className="space-y-2">
              <Label>Telefone</Label>
              <Input
                value={formData.phone_number}
                onChange={(e) =>
                  setFormData({ ...formData, phone_number: e.target.value })
                }
                placeholder="(00) 00000-0000"
              />
            </div>

            <div className="space-y-2">
              <Label>Link do Instagram</Label>
              <Input
                value={formData.instagram_link}
                onChange={(e) =>
                  setFormData({ ...formData, instagram_link: e.target.value })
                }
                placeholder="https://instagram.com/..."
              />
            </div>

            <div className="space-y-2">
              <Label>Método de Prospecção</Label>
              <div className="space-y-2">
                {['cold_call', 'instagram', 'door_to_door'].map((method) => (
                  <div key={method} className="flex items-center gap-2">
                    <Checkbox
                      id={method}
                      checked={formData.prospecting_method.includes(method)}
                      onCheckedChange={(checked) =>
                        handleMethodChange(method, checked as boolean)
                      }
                    />
                    <Label htmlFor={method} className="capitalize cursor-pointer">
                      {method.replace('_', ' ')}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Resumo do Perfil</Label>
              <Textarea
                value={formData.profile_summary}
                onChange={(e) =>
                  setFormData({ ...formData, profile_summary: e.target.value })
                }
                placeholder="Informações sobre o lead..."
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Resumo do Contato</Label>
              <Textarea
                value={formData.contact_summary}
                onChange={(e) =>
                  setFormData({ ...formData, contact_summary: e.target.value })
                }
                placeholder="Como foi a abordagem..."
                rows={2}
              />
            </div>

            <div className="space-y-4 border-t pt-4">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="needs_follow_up"
                  checked={formData.needs_follow_up}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, needs_follow_up: checked as boolean })
                  }
                />
                <Label htmlFor="needs_follow_up" className="cursor-pointer">
                  Precisa de follow-up?
                </Label>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="has_meeting"
                  checked={formData.has_meeting_scheduled}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, has_meeting_scheduled: checked as boolean })
                  }
                />
                <Label htmlFor="has_meeting" className="cursor-pointer">
                  Agendou reunião?
                </Label>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="was_rejected"
                  checked={formData.was_rejected}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, was_rejected: checked as boolean })
                  }
                />
                <Label htmlFor="was_rejected" className="cursor-pointer">
                  Rejeitou?
                </Label>
              </div>

              {formData.was_rejected && (
                <>
                  <div className="space-y-2">
                    <Label>Motivo da Rejeição</Label>
                    <Input
                      value={formData.rejection_reason}
                      onChange={(e) =>
                        setFormData({ ...formData, rejection_reason: e.target.value })
                      }
                      placeholder="Por que rejeitou?"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Objeções</Label>
                    <Textarea
                      value={formData.objections}
                      onChange={(e) =>
                        setFormData({ ...formData, objections: e.target.value })
                      }
                      placeholder="Quais foram as objeções?"
                      rows={2}
                    />
                  </div>
                </>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Salvando...' : 'Registrar Prospecção'}
            </Button>
          </form>
        </SheetContent>
      </Sheet>

      {/* Prospect Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display">Detalhes do Lead</DialogTitle>
          </DialogHeader>
          {selectedProspect && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge className={cn(statusColors[selectedProspect.status])}>
                  {statusLabels[selectedProspect.status]}
                </Badge>
                {selectedProspect.prospecting_method?.map((method) => (
                  <Badge key={method} variant="outline" className="capitalize">
                    {method.replace('_', ' ')}
                  </Badge>
                ))}
              </div>

              {selectedProspect.phone_number && (
                <div>
                  <Label className="text-muted-foreground">Telefone</Label>
                  <p className="font-medium">{selectedProspect.phone_number}</p>
                </div>
              )}

              {selectedProspect.instagram_link && (
                <div>
                  <Label className="text-muted-foreground">Instagram</Label>
                  <a
                    href={selectedProspect.instagram_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline block"
                  >
                    {selectedProspect.instagram_link}
                  </a>
                </div>
              )}

              {selectedProspect.profile_summary && (
                <div>
                  <Label className="text-muted-foreground">Resumo do Perfil</Label>
                  <p>{selectedProspect.profile_summary}</p>
                </div>
              )}

              {selectedProspect.contact_summary && (
                <div>
                  <Label className="text-muted-foreground">Resumo do Contato</Label>
                  <p>{selectedProspect.contact_summary}</p>
                </div>
              )}

              {selectedProspect.was_rejected && (
                <div className="bg-destructive/10 p-3 rounded-lg">
                  <Label className="text-destructive">Motivo da Rejeição</Label>
                  <p className="text-sm">{selectedProspect.rejection_reason || 'Não informado'}</p>
                  {selectedProspect.objections && (
                    <>
                      <Label className="text-destructive mt-2 block">Objeções</Label>
                      <p className="text-sm">{selectedProspect.objections}</p>
                    </>
                  )}
                </div>
              )}

              <div className="flex gap-2 pt-4 border-t">
                {selectedProspect.status !== 'scheduled' && (
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => handleUpdateStatus(selectedProspect, 'scheduled')}
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Agendar
                  </Button>
                )}
                {selectedProspect.status !== 'converted' && (
                  <Button
                    variant="default"
                    className="flex-1"
                    onClick={() => handleUpdateStatus(selectedProspect, 'converted')}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Converter
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
