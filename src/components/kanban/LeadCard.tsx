import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Phone, Instagram, Calendar, Building2, User } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface LeadCardProps {
  phone_number?: string | null;
  instagram_link?: string | null;
  nome_dono?: string | null;
  nicho?: string | null;
  faturamento?: string | null;
  meeting_date?: string | null;
  created_at: string;
}

export default function LeadCard({
  phone_number,
  instagram_link,
  nome_dono,
  nicho,
  faturamento,
  meeting_date,
  created_at,
}: LeadCardProps) {
  const displayName = nome_dono || (instagram_link ? `@${instagram_link.split('/').pop()}` : phone_number || 'Lead');

  return (
    <Card className="bg-card hover:bg-card/80 transition-colors border-border/50 hover:border-primary/30 shadow-sm">
      <CardContent className="p-3 space-y-2">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <User className="w-4 h-4 text-primary" />
            </div>
            <span className="font-medium text-sm truncate">{displayName}</span>
          </div>
        </div>

        {/* Contact Info */}
        <div className="flex flex-wrap gap-1.5">
          {phone_number && (
            <Badge variant="outline" className="text-xs gap-1 px-1.5 py-0">
              <Phone className="w-3 h-3" />
              {phone_number}
            </Badge>
          )}
          {instagram_link && (
            <Badge variant="outline" className="text-xs gap-1 px-1.5 py-0">
              <Instagram className="w-3 h-3" />
              @{instagram_link.split('/').pop()?.slice(0, 10)}
            </Badge>
          )}
        </div>

        {/* Additional Info */}
        {(nicho || faturamento) && (
          <div className="flex flex-wrap gap-1.5">
            {nicho && (
              <Badge variant="secondary" className="text-xs gap-1 px-1.5 py-0">
                <Building2 className="w-3 h-3" />
                {nicho}
              </Badge>
            )}
            {faturamento && (
              <Badge variant="secondary" className="text-xs gap-1 px-1.5 py-0">
                R$ {faturamento}
              </Badge>
            )}
          </div>
        )}

        {/* Meeting Date */}
        {meeting_date && (
          <div className="flex items-center gap-1 text-xs text-primary">
            <Calendar className="w-3 h-3" />
            Reunião: {format(new Date(meeting_date), "dd/MM 'às' HH:mm", { locale: ptBR })}
          </div>
        )}

        {/* Footer */}
        <div className="text-xs text-muted-foreground pt-1 border-t border-border/30">
          {format(new Date(created_at), 'dd/MM/yyyy', { locale: ptBR })}
        </div>
      </CardContent>
    </Card>
  );
}
