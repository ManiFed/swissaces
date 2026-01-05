import { Card, Rank, RANKS_ORDER } from '@/types/game';
import { PlayingCard } from '@/components/PlayingCard';
import { groupCardsByRank } from '@/hooks/useGameState';
import { cn } from '@/lib/utils';

interface PlayerHandProps {
  cards: Card[];
  selectedCards: Card[];
  onCardClick: (card: Card) => void;
  disabled?: boolean;
  minimumRequired: number;
}

export function PlayerHand({ 
  cards, 
  selectedCards, 
  onCardClick, 
  disabled,
  minimumRequired 
}: PlayerHandProps) {
  const grouped = groupCardsByRank(cards);
  const jokers = cards.filter(c => c.isJoker);
  
  // Sort ranks for display
  const sortedRanks = Array.from(grouped.keys()).sort(
    (a, b) => RANKS_ORDER.indexOf(a) - RANKS_ORDER.indexOf(b)
  );

  // Check which groups can be played
  const canPlayGroup = (groupCards: Card[]): boolean => {
    return groupCards.length >= minimumRequired;
  };

  return (
    <div className="w-full">
      <div className="flex flex-wrap justify-center gap-1 md:gap-2 p-4 bg-card/40 rounded-xl backdrop-blur-sm">
        {/* Grouped cards by rank */}
        {sortedRanks.map((rank) => {
          const groupCards = grouped.get(rank) || [];
          const playable = canPlayGroup(groupCards);
          
          return (
            <div key={rank} className="flex flex-col items-center gap-1">
              {/* Rank indicator */}
              <div className={cn(
                "text-xs font-medium px-2 py-0.5 rounded",
                playable ? "bg-primary/20 text-primary" : "bg-muted/50 text-muted-foreground"
              )}>
                {groupCards.length}x {rank}
              </div>
              
              {/* Cards in group */}
              <div className="flex -space-x-6 md:-space-x-4">
                {groupCards.map((card) => (
                  <PlayingCard
                    key={card.id}
                    suit={card.suit}
                    rank={card.rank}
                    size="md"
                    selected={selectedCards.some(c => c.id === card.id)}
                    disabled={disabled}
                    onClick={() => onCardClick(card)}
                  />
                ))}
              </div>
            </div>
          );
        })}
        
        {/* Jokers */}
        {jokers.length > 0 && (
          <div className="flex flex-col items-center gap-1">
            <div className="text-xs font-medium px-2 py-0.5 rounded bg-primary/20 text-primary">
              Joker
            </div>
            <div className="flex -space-x-4">
              {jokers.map((card) => (
                <PlayingCard
                  key={card.id}
                  suit={card.suit}
                  rank="★"
                  isJoker
                  size="md"
                  selected={selectedCards.some(c => c.id === card.id)}
                  disabled={disabled}
                  onClick={() => onCardClick(card)}
                />
              ))}
            </div>
          </div>
        )}
        
        {cards.length === 0 && (
          <div className="text-muted-foreground text-center py-8">
            No cards in hand
          </div>
        )}
      </div>
    </div>
  );
}