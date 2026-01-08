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
  
  // Show last few cards on the pile
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
        "flex flex-col items-center gap-3 p-6 rounded-2xl transition-all bg-black/20",
        isDragOver && "bg-primary/20 ring-2 ring-primary"
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Pile count display */}
      <div className="text-center">
        <div className="text-5xl md:text-6xl font-bold swiss-text font-serif">{pileCount}</div>
        <div className="text-xs text-muted-foreground uppercase tracking-wide">cards in pile</div>
      </div>
      
      {/* Minimum required indicator */}
      <div className={cn(
        "px-4 py-1.5 rounded-full text-xs font-semibold border",
        minimumRequired >= 3 
          ? "bg-destructive/10 text-destructive border-destructive/30" 
          : "bg-primary/10 text-primary border-primary/30"
      )}>
        Min: {minimumRequired}
      </div>
      
      {/* Visual pile representation */}
      <div className="relative h-24 w-20">
        {pileCount === 0 ? (
          <div className={cn(
            "w-16 h-[88px] border-2 border-dashed rounded-lg flex items-center justify-center mx-auto",
            isDragOver ? "border-primary bg-primary/10" : "border-muted-foreground/30"
          )}>
            <span className="text-muted-foreground/50 text-[10px]">
              {isDragOver ? 'Drop here' : 'Empty'}
            </span>
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
              <PlayingCard
                suit={card.suit}
                rank={card.rank}
                isJoker={card.isJoker}
                size="sm"
              />
            </div>
          ))
        )}
      </div>
      
      {/* Overflow warning/status */}
      {pileCount > 16 ? (
        <div className="text-destructive text-xs font-semibold animate-pulse flex items-center gap-1 bg-destructive/10 px-3 py-1 rounded-full">
          <span>🔥</span>
          <span>OVERFLOW! (+{pileCount - 16})</span>
        </div>
      ) : pileCount >= 12 && (
        <div className="text-destructive text-xs font-semibold animate-pulse flex items-center gap-1">
          <span>⚠️</span>
          <span>Overflow at 16!</span>
        </div>
      )}
    </div>
  );
}
