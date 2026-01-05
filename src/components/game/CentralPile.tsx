import { Card } from '@/types/game';
import { PlayingCard } from '@/components/PlayingCard';
import { cn } from '@/lib/utils';

interface CentralPileProps {
  pile: Card[];
  pileCount: number;
  minimumRequired: number;
}

export function CentralPile({ pile, pileCount, minimumRequired }: CentralPileProps) {
  // Show last few cards on the pile
  const visibleCards = pile.slice(-4);
  
  return (
    <div className="flex flex-col items-center gap-4">
      {/* Pile count display */}
      <div className="text-center">
        <div className="text-6xl font-bold gold-text font-serif">{pileCount}</div>
        <div className="text-sm text-muted-foreground">cards in pile</div>
      </div>
      
      {/* Minimum required indicator */}
      <div className={cn(
        "px-4 py-2 rounded-full text-sm font-medium",
        minimumRequired >= 3 ? "bg-destructive/20 text-destructive" : "bg-primary/20 text-primary"
      )}>
        Minimum: {minimumRequired} card{minimumRequired !== 1 ? 's' : ''}
      </div>
      
      {/* Visual pile representation */}
      <div className="relative h-28 w-20">
        {pileCount === 0 ? (
          <div className="w-16 h-24 border-2 border-dashed border-muted-foreground/30 rounded-lg flex items-center justify-center">
            <span className="text-muted-foreground/50 text-xs">Empty</span>
          </div>
        ) : (
          visibleCards.map((card, index) => (
            <div
              key={card.id}
              className="absolute"
              style={{
                left: `${index * 3}px`,
                top: `${index * 2}px`,
                zIndex: index,
                transform: `rotate(${(index - 1.5) * 5}deg)`,
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
        <div className="text-destructive text-sm font-medium animate-pulse">
          ⚠️ Pile overflow at 16!
        </div>
      )}
    </div>
  );
}