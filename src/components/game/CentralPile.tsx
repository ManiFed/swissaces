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
        "flex flex-col items-center gap-2 p-4 rounded-xl transition-all",
        isDragOver && "bg-primary/20 ring-2 ring-primary"
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Pile count display */}
      <div className="text-center">
        <div className="text-4xl md:text-5xl font-bold gold-text font-serif">{pileCount}</div>
        <div className="text-xs text-muted-foreground">cards in pile</div>
      </div>
      
      {/* Minimum required indicator */}
      <div className={cn(
        "px-3 py-1 rounded-full text-xs font-medium",
        minimumRequired >= 3 ? "bg-destructive/20 text-destructive" : "bg-primary/20 text-primary"
      )}>
        Min: {minimumRequired}
      </div>
      
      {/* Visual pile representation */}
      <div className="relative h-24 w-16">
        {pileCount === 0 ? (
          <div className={cn(
            "w-14 h-20 border-2 border-dashed rounded-lg flex items-center justify-center",
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
              className="absolute"
              style={{
                left: `${index * 2}px`,
                top: `${index * 2}px`,
                zIndex: index,
                transform: `rotate(${(index - 1.5) * 4}deg)`,
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
      
      {/* Overflow warning */}
      {pileCount >= 12 && (
        <div className="text-destructive text-xs font-medium animate-pulse">
          ⚠️ Overflow at 16!
        </div>
      )}
    </div>
  );
}