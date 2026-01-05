import { useState } from 'react';
import { Card, Rank, RANKS_ORDER } from '@/types/game';
import { PlayingCard } from '@/components/PlayingCard';
import { groupCardsByRank } from '@/hooks/useGameState';
import { cn } from '@/lib/utils';

interface PlayerHandProps {
  cards: Card[];
  selectedCards: Card[];
  onCardClick: (card: Card) => void;
  onSelectAllOfRank?: (rank: Rank) => void;
  onPlayCards?: (cards: Card[]) => void;
  disabled?: boolean;
  minimumRequired: number;
}

export function PlayerHand({ 
  cards, 
  selectedCards, 
  onCardClick,
  onSelectAllOfRank,
  onPlayCards,
  disabled,
  minimumRequired 
}: PlayerHandProps) {
  const [draggedCard, setDraggedCard] = useState<Card | null>(null);
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

  const handleDragStart = (card: Card) => (e: React.DragEvent) => {
    setDraggedCard(card);
    e.dataTransfer.setData('card', JSON.stringify(card));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggedCard(null);
  };

  const handleRankBadgeClick = (rank: Rank, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!disabled && onSelectAllOfRank) {
      onSelectAllOfRank(rank);
    }
  };

  return (
    <div className="w-full">
      <div className="flex flex-wrap justify-center gap-2 p-3 bg-card/80 rounded-xl backdrop-blur-sm border border-border/50">
        {/* Grouped cards by rank */}
        {sortedRanks.map((rank) => {
          const groupCards = grouped.get(rank) || [];
          const playable = canPlayGroup(groupCards);
          const allSelected = groupCards.every(c => selectedCards.some(sc => sc.id === c.id));
          
          return (
            <div key={rank} className="flex flex-col items-center gap-1">
              {/* Rank badge - clickable to select all */}
              <button
                onClick={(e) => handleRankBadgeClick(rank, e)}
                disabled={disabled}
                className={cn(
                  "text-[11px] font-semibold px-2 py-0.5 rounded-full transition-all",
                  "hover:scale-105 cursor-pointer",
                  playable 
                    ? "bg-primary/20 text-primary hover:bg-primary/30" 
                    : "bg-muted text-muted-foreground hover:bg-muted/80",
                  allSelected && "ring-2 ring-primary",
                  disabled && "cursor-not-allowed opacity-50"
                )}
              >
                {groupCards.length}× {rank}
              </button>
              
              {/* Cards in group - stacked */}
              <div className="flex" style={{ marginLeft: `${Math.max(0, (groupCards.length - 1) * 12)}px` }}>
                {groupCards.map((card, idx) => (
                  <div 
                    key={card.id}
                    style={{ 
                      marginLeft: idx > 0 ? '-12px' : '0',
                      zIndex: idx 
                    }}
                  >
                    <PlayingCard
                      suit={card.suit}
                      rank={card.rank}
                      size="sm"
                      selected={selectedCards.some(c => c.id === card.id)}
                      disabled={disabled}
                      draggable={!disabled}
                      onClick={() => onCardClick(card)}
                      onDragStart={handleDragStart(card)}
                      onDragEnd={handleDragEnd}
                    />
                  </div>
                ))}
              </div>
            </div>
          );
        })}
        
        {/* Jokers */}
        {jokers.length > 0 && (
          <div className="flex flex-col items-center gap-1">
            <div className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-primary/20 text-primary">
              {jokers.length}× ★
            </div>
            <div className="flex" style={{ marginLeft: `${Math.max(0, (jokers.length - 1) * 12)}px` }}>
              {jokers.map((card, idx) => (
                <div 
                  key={card.id}
                  style={{ 
                    marginLeft: idx > 0 ? '-12px' : '0',
                    zIndex: idx 
                  }}
                >
                  <PlayingCard
                    suit={card.suit}
                    rank="★"
                    isJoker
                    size="sm"
                    selected={selectedCards.some(c => c.id === card.id)}
                    disabled={disabled}
                    draggable={!disabled}
                    onClick={() => onCardClick(card)}
                    onDragStart={handleDragStart(card)}
                    onDragEnd={handleDragEnd}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
        
        {cards.length === 0 && (
          <div className="text-muted-foreground text-center py-4 text-sm">
            No cards in hand
          </div>
        )}
      </div>
    </div>
  );
}
