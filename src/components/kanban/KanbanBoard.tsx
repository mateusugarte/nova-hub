import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface KanbanColumn {
  id: string;
  title: string;
  color: string;
}

export interface KanbanCardData {
  id: string;
  status: string;
  [key: string]: any;
}

interface KanbanBoardProps<T extends KanbanCardData> {
  columns: KanbanColumn[];
  items: T[];
  onMoveCard: (cardId: string, newStatus: string) => void;
  onCardClick: (card: T) => void;
  renderCard: (card: T) => React.ReactNode;
}

export default function KanbanBoard<T extends KanbanCardData>({
  columns,
  items,
  onMoveCard,
  onCardClick,
  renderCard,
}: KanbanBoardProps<T>) {
  const [draggedCard, setDraggedCard] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, cardId: string) => {
    setDraggedCard(cardId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggedCard(null);
    setDragOverColumn(null);
  };

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    setDragOverColumn(columnId);
  };

  const handleDrop = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    if (draggedCard) {
      onMoveCard(draggedCard, columnId);
    }
    setDraggedCard(null);
    setDragOverColumn(null);
  };

  const getColumnItems = (columnId: string) => {
    return items.filter((item) => item.status === columnId);
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 min-h-[500px]">
      {columns.map((column) => {
        const columnItems = getColumnItems(column.id);
        const isDragOver = dragOverColumn === column.id;

        return (
          <div
            key={column.id}
            className={cn(
              'flex-shrink-0 w-72 bg-card/50 rounded-xl border border-border/50 backdrop-blur-sm transition-all duration-200',
              isDragOver && 'ring-2 ring-primary/50 border-primary/50'
            )}
            onDragOver={(e) => handleDragOver(e, column.id)}
            onDragLeave={() => setDragOverColumn(null)}
            onDrop={(e) => handleDrop(e, column.id)}
          >
            {/* Column Header */}
            <div
              className="p-3 border-b border-border/50 rounded-t-xl"
              style={{ backgroundColor: `${column.color}15` }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: column.color }}
                  />
                  <h3 className="font-medium text-sm">{column.title}</h3>
                </div>
                <span className="text-xs text-muted-foreground bg-background/50 px-2 py-0.5 rounded-full">
                  {columnItems.length}
                </span>
              </div>
            </div>

            {/* Column Content */}
            <div className="p-2 space-y-2 min-h-[400px]">
              <AnimatePresence>
                {columnItems.map((item) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    draggable
                    onDragStart={(e) => handleDragStart(e as any, item.id)}
                    onDragEnd={handleDragEnd}
                    onClick={() => onCardClick(item)}
                    className={cn(
                      'cursor-grab active:cursor-grabbing',
                      draggedCard === item.id && 'opacity-50'
                    )}
                  >
                    {renderCard(item)}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        );
      })}
    </div>
  );
}
