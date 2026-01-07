import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Plus, Search, Users } from 'lucide-react';
import MetricCard from '@/components/dashboard/MetricCard';
import KanbanBoard, { KanbanColumn } from '@/components/kanban/KanbanBoard';
import LeadCard from '@/components/kanban/LeadCard';
import LeadFormDialog from '@/components/kanban/LeadFormDialog';

interface InboundLead {
  id: string;
  phone_number: string | null;
  instagram_link: string | null;
  email: string | null;
  nome_lead: string | null;
  faturamento: string | null;
  principal_dor: string | null;
  nicho: string | null;
  nome_dono: string | null;
  socios: string[] | null;
  meeting_date: string | null;
  status: string;
  notes: string | null;
  source: string | null;
  created_at: string;
}

const KANBAN_COLUMNS: KanbanColumn[] = [
  { id: 'form_filled', title: 'Preencheu Formulário', color: '#8B5CF6' },
  { id: 'contacted', title: 'Respondeu Contato', color: '#6B7280' },
  { id: 'qualified', title: 'Lead Qualificado', color: '#10B981' },
  { id: 'disqualified', title: 'Lead Desqualificado', color: '#EF4444' },
  { id: 'meeting_scheduled', title: 'Agendou Reunião', color: '#3B82F6' },
  { id: 'sale_made', title: 'Venda Feita', color: '#F59E0B' },
];

export default function LeadsInbound() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [leads, setLeads] = useState<InboundLead[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<InboundLead | null>(null);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    formFilled: 0,
    contacted: 0,
    qualified: 0,
    disqualified: 0,
    meetingScheduled: 0,
    saleMade: 0,
  });

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('inbound_leads')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    const mappedData = (data || []).map((lead) => ({
      ...lead,
      socios: lead.socios as string[] | null,
    }));

    setLeads(mappedData);

    // Calculate stats
    const total = mappedData.length;
    const formFilled = mappedData.filter((l) => l.status === 'form_filled').length;
    const contacted = mappedData.filter((l) => l.status === 'contacted').length;
    const qualified = mappedData.filter((l) => l.status === 'qualified').length;
    const disqualified = mappedData.filter((l) => l.status === 'disqualified').length;
    const meetingScheduled = mappedData.filter((l) => l.status === 'meeting_scheduled').length;
    const saleMade = mappedData.filter((l) => l.status === 'sale_made').length;

    setStats({ total, formFilled, contacted, qualified, disqualified, meetingScheduled, saleMade });
  };

  const handleMoveCard = async (cardId: string, newStatus: string) => {
    const { error } = await supabase
      .from('inbound_leads')
      .update({ status: newStatus })
      .eq('id', cardId);

    if (error) {
      toast({ title: 'Erro ao mover card', variant: 'destructive' });
    } else {
      fetchData();
    }
  };

  const handleCardClick = (lead: InboundLead) => {
    setSelectedLead(lead);
    setIsFormOpen(true);
  };

  const handleSubmit = async (formData: any) => {
    if (!user) return;
    setLoading(true);

    const dataToSave = {
      phone_number: formData.phone_number || null,
      instagram_link: formData.instagram_link || null,
      email: formData.email || null,
      nome_lead: formData.nome_lead || null,
      faturamento: formData.faturamento || null,
      principal_dor: formData.principal_dor || null,
      nicho: formData.nicho || null,
      nome_dono: formData.nome_dono || null,
      socios: formData.socios.length > 0 ? formData.socios : null,
      meeting_date: formData.meeting_date || null,
      notes: formData.notes || null,
    };

    if (selectedLead) {
      const { error } = await supabase
        .from('inbound_leads')
        .update(dataToSave)
        .eq('id', selectedLead.id);

      if (error) {
        toast({ title: 'Erro ao atualizar', variant: 'destructive' });
      } else {
        toast({ title: 'Lead atualizado!' });
        setIsFormOpen(false);
        setSelectedLead(null);
        fetchData();
      }
    } else {
      const { error } = await supabase.from('inbound_leads').insert({
        ...dataToSave,
        user_id: user.id,
        status: 'form_filled',
      });

      if (error) {
        toast({ title: 'Erro ao criar lead', variant: 'destructive' });
      } else {
        toast({ title: 'Lead criado!' });
        setIsFormOpen(false);
        fetchData();
      }
    }

    setLoading(false);
  };

  const handleDelete = async () => {
    if (!selectedLead) return;
    setLoading(true);

    const { error } = await supabase
      .from('inbound_leads')
      .delete()
      .eq('id', selectedLead.id);

    if (error) {
      toast({ title: 'Erro ao excluir', variant: 'destructive' });
    } else {
      toast({ title: 'Lead excluído!' });
      setIsFormOpen(false);
      setSelectedLead(null);
      fetchData();
    }

    setLoading(false);
  };

  const filteredLeads = leads.filter((lead) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      lead.phone_number?.includes(search) ||
      lead.instagram_link?.toLowerCase().includes(search) ||
      lead.nome_dono?.toLowerCase().includes(search) ||
      lead.nicho?.toLowerCase().includes(search) ||
      lead.nome_lead?.toLowerCase().includes(search) ||
      lead.email?.toLowerCase().includes(search)
    );
  });

  const conversionRate = stats.total > 0 ? Math.round((stats.saleMade / stats.total) * 100) : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display text-foreground">Leads Inbound</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie leads que vieram por formulários e marketing
          </p>
        </div>
        <Button
          onClick={() => {
            setSelectedLead(null);
            setIsFormOpen(true);
          }}
          className="btn-scale"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Lead
        </Button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <MetricCard title="Total" value={stats.total} icon={<Users className="w-5 h-5" />} />
        <MetricCard title="Formulário" value={stats.formFilled} />
        <MetricCard title="Respondeu" value={stats.contacted} />
        <MetricCard title="Qualificado" value={stats.qualified} />
        <MetricCard title="Desqualificado" value={stats.disqualified} />
        <MetricCard title="Reuniões" value={stats.meetingScheduled} />
        <MetricCard title="Conversão" value={`${conversionRate}%`} />
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por telefone, email, nome ou nicho..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Kanban Board */}
      <KanbanBoard
        columns={KANBAN_COLUMNS}
        items={filteredLeads}
        onMoveCard={handleMoveCard}
        onCardClick={handleCardClick}
        renderCard={(lead) => (
          <LeadCard
            phone_number={lead.phone_number}
            instagram_link={lead.instagram_link}
            nome_dono={lead.nome_dono || lead.nome_lead}
            nicho={lead.nicho}
            faturamento={lead.faturamento}
            meeting_date={lead.meeting_date}
            created_at={lead.created_at}
          />
        )}
      />

      {/* Form Dialog */}
      <LeadFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        title={selectedLead ? 'Editar Lead' : 'Novo Lead'}
        isEditing={!!selectedLead}
        initialData={
          selectedLead
            ? {
                phone_number: selectedLead.phone_number || '',
                instagram_link: selectedLead.instagram_link || '',
                email: selectedLead.email || '',
                nome_lead: selectedLead.nome_lead || '',
                faturamento: selectedLead.faturamento || '',
                principal_dor: selectedLead.principal_dor || '',
                nicho: selectedLead.nicho || '',
                nome_dono: selectedLead.nome_dono || '',
                socios: selectedLead.socios || [],
                meeting_date: selectedLead.meeting_date
                  ? selectedLead.meeting_date.slice(0, 16)
                  : '',
                notes: selectedLead.notes || '',
              }
            : undefined
        }
        onSubmit={handleSubmit}
        onDelete={handleDelete}
        loading={loading}
      />
    </div>
  );
}
