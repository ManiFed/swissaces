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
    <div className="flex flex-col gap-3 p-4 bg-card/80 rounded-xl border border-border/50">
      {/* Pool display */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <PlayingCard faceDown size="xs" />
          {poolCount > 0 && (
            <div className="absolute -top-2 -right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center text-[10px] font-bold text-primary-foreground">
              {poolCount}
            </div>
          )}
        </div>
        <div className="text-xs text-muted-foreground font-medium">
          Special Pool
        </div>
      </div>
      
      {/* Player's special cards */}
      {playerSpecialCards.length > 0 && (
        <div className="border-t border-border/50 pt-3">
          <div className="text-[10px] text-muted-foreground mb-2 uppercase tracking-wide">Your Special Cards:</div>
          <div className="flex flex-wrap gap-2">
            {playerSpecialCards.map((card) => (
              <Button
                key={card.id}
                variant="outline"
                size="sm"
                disabled={disabled}
                onClick={() => onUseSpecialCard(card)}
                className="flex items-center gap-1.5 hover:border-primary hover:bg-primary/5 text-foreground"
              >
                {card.isJoker ? (
                  <>
                    <Star className="w-3.5 h-3.5 text-primary" />
                    <span className="text-xs">Joker</span>
                  </>
                ) : card.rank === 'A' ? (
                  <>
                    <Zap className="w-3.5 h-3.5 text-primary" />
                    <span className="text-xs">Ace</span>
                  </>
                ) : (
                  <>
                    <Crown className="w-3.5 h-3.5 text-primary" />
                    <span className="text-xs">King</span>
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
