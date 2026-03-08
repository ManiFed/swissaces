import { useState } from 'react';
import { Card } from '@/types/game';
import { PlayingCard } from '@/components/PlayingCard';
import { cn } from '@/lib/utils';

interface CentralPileProps {
  pile: Card[];
  pileCount: number;
  minimumRequired: number;
  onDropCards?: (cards: Card[]) => void;
  isDropTarget?: boolean;
}

export function CentralPile({ 
  pile, 
  pileCount, 
  minimumRequired,
  onDropCards,
  isDropTarget = false
}: CentralPileProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const visibleCards = pile.slice(-4);

  const handleDragOver = (e: React.DragEvent) => {
    if (!isDropTarget) return;
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    if (!isDropTarget) return;
    e.preventDefault();
    setIsDragOver(false);
    
    try {
      const cardData = e.dataTransfer.getData('card');
      if (cardData) {
        const card = JSON.parse(cardData);
        onDropCards?.([card]);
      }
    } catch (err) {
      console.error('Failed to parse dropped card:', err);
    }
  };
  
  return (
    <div
      className={cn(
        'flex flex-col items-center gap-3 p-4 md:p-5 rounded-2xl transition-all',
        'bg-card/90 border border-border shadow-md',
        isDragOver && 'bg-primary/10 ring-2 ring-ring'
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="text-center">
        <div className="text-4xl md:text-5xl font-bold text-foreground font-serif">{pileCount}</div>
        <div className="text-xs text-muted-foreground uppercase tracking-wide">cards in pile</div>
      </div>

      <div
        className={cn(
          'px-4 py-1.5 rounded-full text-xs font-semibold',
          minimumRequired >= 3 ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'
        )}
      >
        Min: {minimumRequired}
      </div>

      <div className="relative h-24 w-20">
        {pileCount === 0 ? (
          <div
            className={cn(
              'w-16 h-[88px] border-2 border-dashed rounded-lg flex items-center justify-center mx-auto',
              isDragOver ? 'border-primary bg-primary/10' : 'border-border'
            )}
          >
            <span className="text-muted-foreground text-[10px]">{isDragOver ? 'Drop here' : 'Empty'}</span>
          </div>
        ) : (
          visibleCards.map((card, index) => (
            <div
              key={card.id}
              className="absolute left-1/2 -translate-x-1/2"
              style={{
                top: `${index * 3}px`,
                zIndex: index,
                transform: `translateX(-50%) rotate(${(index - 1.5) * 5}deg)`,
              }}
            >
              <PlayingCard suit={card.suit} rank={card.rank} isJoker={card.isJoker} size="sm" />
            </div>
          ))
        )}
      </div>

      {pileCount > 16 ? (
        <div className="text-xs font-semibold animate-timer-pulse flex items-center gap-1 bg-destructive text-destructive-foreground px-3 py-1 rounded-full">
          <span>Overflow (+{pileCount - 16})</span>
        </div>
      ) : pileCount >= 12 && (
        <div className="text-xs font-semibold animate-timer-pulse text-primary">Overflow at 16</div>
      )}
    </div>
  );
}
