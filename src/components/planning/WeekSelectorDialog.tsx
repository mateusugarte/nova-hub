import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks, isSameWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface WeekSelectorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectWeek: (weekStart: Date, weekEnd: Date) => void;
}

export default function WeekSelectorDialog({
  open,
  onOpenChange,
  onSelectWeek,
}: WeekSelectorDialogProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });

  const handlePreviousWeek = () => {
    setSelectedDate(subWeeks(selectedDate, 1));
  };

  const handleNextWeek = () => {
    setSelectedDate(addWeeks(selectedDate, 1));
  };

  const handleConfirm = () => {
    onSelectWeek(weekStart, weekEnd);
    onOpenChange(false);
  };

  const isCurrentWeek = isSameWeek(selectedDate, new Date(), { weekStartsOn: 1 });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display">
            <CalendarDays className="w-5 h-5 text-primary" />
            Selecionar Semana
          </DialogTitle>
          <DialogDescription>
            Escolha a semana que deseja planejar
          </DialogDescription>
        </DialogHeader>

        <motion.div 
          className="space-y-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Week Navigation */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border/50">
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePreviousWeek}
              className="hover:bg-primary/10"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Semana selecionada</p>
              <p className="font-display text-lg">
                {format(weekStart, 'dd MMM', { locale: ptBR })} - {format(weekEnd, 'dd MMM', { locale: ptBR })}
              </p>
              {isCurrentWeek && (
                <span className="text-xs text-primary font-medium">Semana atual</span>
              )}
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={handleNextWeek}
              className="hover:bg-primary/10"
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>

          {/* Calendar */}
          <div className="flex justify-center">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              locale={ptBR}
              className={cn("p-3 pointer-events-auto rounded-lg border border-border/50")}
              modifiers={{
                selectedWeek: (date) => 
                  date >= weekStart && date <= weekEnd
              }}
              modifiersStyles={{
                selectedWeek: {
                  backgroundColor: 'hsl(var(--primary) / 0.15)',
                  borderRadius: '0',
                }
              }}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              className="flex-1 btn-scale"
              onClick={handleConfirm}
            >
              Iniciar Planejamento
            </Button>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
