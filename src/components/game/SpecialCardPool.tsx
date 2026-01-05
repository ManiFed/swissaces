import { Card } from '@/types/game';
import { PlayingCard } from '@/components/PlayingCard';
import { Button } from '@/components/ui/button';
import { Crown, Zap, Star } from 'lucide-react';

interface SpecialCardPoolProps {
  poolCount: number;
  playerSpecialCards: Card[];
  onUseSpecialCard: (card: Card) => void;
  disabled?: boolean;
}

export function SpecialCardPool({ 
  poolCount, 
  playerSpecialCards, 
  onUseSpecialCard,
  disabled 
}: SpecialCardPoolProps) {
  return (
    <div className="flex flex-col gap-3 p-4 bg-card/60 rounded-xl">
      {/* Pool display */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <PlayingCard faceDown size="sm" />
          {poolCount > 1 && (
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center text-xs font-bold text-primary-foreground">
              {poolCount}
            </div>
          )}
        </div>
        <div className="text-sm text-muted-foreground">
          Special Card Pool
        </div>
      </div>
      
      {/* Player's special cards */}
      {playerSpecialCards.length > 0 && (
        <div className="border-t border-border/50 pt-3">
          <div className="text-xs text-muted-foreground mb-2">Your Special Cards:</div>
          <div className="flex flex-wrap gap-2">
            {playerSpecialCards.map((card) => (
              <Button
                key={card.id}
                variant="outline"
                size="sm"
                disabled={disabled}
                onClick={() => onUseSpecialCard(card)}
                className="flex items-center gap-1.5 hover:border-primary"
              >
                {card.isJoker ? (
                  <>
                    <Star className="w-4 h-4 text-primary" />
                    <span>Joker</span>
                    <span className="text-xs text-muted-foreground">(Clear)</span>
                  </>
                ) : card.rank === 'A' ? (
                  <>
                    <Zap className="w-4 h-4 text-primary" />
                    <span>Ace</span>
                    <span className="text-xs text-muted-foreground">(Clear)</span>
                  </>
                ) : (
                  <>
                    <Crown className="w-4 h-4 text-primary" />
                    <span>King</span>
                    <span className="text-xs text-muted-foreground">(Reset Min)</span>
                  </>
                )}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}