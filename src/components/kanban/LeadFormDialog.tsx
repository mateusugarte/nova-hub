import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2 } from 'lucide-react';

interface LeadFormData {
  phone_number: string;
  instagram_link: string;
  email: string;
  nome_lead: string;
  faturamento: string;
  principal_dor: string;
  nicho: string;
  nome_dono: string;
  socios: string[];
  meeting_date: string;
  notes: string;
}

interface LeadFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: Partial<LeadFormData>;
  onSubmit: (data: LeadFormData) => void;
  onDelete?: () => void;
  title: string;
  isEditing?: boolean;
  loading?: boolean;
}

export default function LeadFormDialog({
  open,
  onOpenChange,
  initialData,
  onSubmit,
  onDelete,
  title,
  isEditing = false,
  loading = false,
}: LeadFormDialogProps) {
  const [formData, setFormData] = useState<LeadFormData>({
    phone_number: '',
    instagram_link: '',
    email: '',
    nome_lead: '',
    faturamento: '',
    principal_dor: '',
    nicho: '',
    nome_dono: '',
    socios: [],
    meeting_date: '',
    notes: '',
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        phone_number: initialData.phone_number || '',
        instagram_link: initialData.instagram_link || '',
        email: initialData.email || '',
        nome_lead: initialData.nome_lead || '',
        faturamento: initialData.faturamento || '',
        principal_dor: initialData.principal_dor || '',
        nicho: initialData.nicho || '',
        nome_dono: initialData.nome_dono || '',
        socios: initialData.socios || [],
        meeting_date: initialData.meeting_date || '',
        notes: initialData.notes || '',
      });
    } else {
      setFormData({
        phone_number: '',
        instagram_link: '',
        email: '',
        nome_lead: '',
        faturamento: '',
        principal_dor: '',
        nicho: '',
        nome_dono: '',
        socios: [],
        meeting_date: '',
        notes: '',
      });
    }
  }, [initialData, open]);

  const handleAddSocio = () => {
    setFormData({ ...formData, socios: [...formData.socios, ''] });
  };

  const handleRemoveSocio = (index: number) => {
    const newSocios = formData.socios.filter((_, i) => i !== index);
    setFormData({ ...formData, socios: newSocios });
  };

  const handleSocioChange = (index: number, value: string) => {
    const newSocios = [...formData.socios];
    newSocios[index] = value;
    setFormData({ ...formData, socios: newSocios });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">{title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Telefone</Label>
              <Input
                value={formData.phone_number}
                onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                placeholder="(00) 00000-0000"
              />
            </div>
            <div className="space-y-2">
              <Label>Instagram</Label>
              <Input
                value={formData.instagram_link}
                onChange={(e) => setFormData({ ...formData, instagram_link: e.target.value })}
                placeholder="@usuario"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@exemplo.com"
              />
            </div>
            <div className="space-y-2">
              <Label>Nome do Lead</Label>
              <Input
                value={formData.nome_lead}
                onChange={(e) => setFormData({ ...formData, nome_lead: e.target.value })}
                placeholder="Nome da empresa/lead"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nome do Dono</Label>
              <Input
                value={formData.nome_dono}
                onChange={(e) => setFormData({ ...formData, nome_dono: e.target.value })}
                placeholder="Nome do proprietário"
              />
            </div>
            <div className="space-y-2">
              <Label>Nicho</Label>
              <Input
                value={formData.nicho}
                onChange={(e) => setFormData({ ...formData, nicho: e.target.value })}
                placeholder="Ex: E-commerce, Saúde..."
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Faturamento</Label>
              <Input
                value={formData.faturamento}
                onChange={(e) => setFormData({ ...formData, faturamento: e.target.value })}
                placeholder="Ex: 50k, 100k..."
              />
            </div>
            <div className="space-y-2">
              <Label>Data da Reunião</Label>
              <Input
                type="datetime-local"
                value={formData.meeting_date}
                onChange={(e) => setFormData({ ...formData, meeting_date: e.target.value })}
              />
            </div>
          </div>

          {/* Sócios */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Sócios</Label>
              <Button type="button" variant="ghost" size="sm" onClick={handleAddSocio}>
                <Plus className="w-4 h-4 mr-1" />
                Adicionar
              </Button>
            </div>
            {formData.socios.map((socio, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={socio}
                  onChange={(e) => handleSocioChange(index, e.target.value)}
                  placeholder={`Nome do sócio ${index + 1}`}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveSocio(index)}
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <Label>Principal Dor</Label>
            <Textarea
              value={formData.principal_dor}
              onChange={(e) => setFormData({ ...formData, principal_dor: e.target.value })}
              placeholder="Qual a principal dificuldade do lead?"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label>Anotações</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Observações gerais..."
              rows={2}
            />
          </div>

          <DialogFooter className="gap-2">
            {isEditing && onDelete && (
              <Button type="button" variant="destructive" onClick={onDelete} disabled={loading}>
                <Trash2 className="w-4 h-4 mr-2" />
                Excluir
              </Button>
            )}
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : isEditing ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
