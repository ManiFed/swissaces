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
    <div className="flex flex-col gap-3 p-4 bg-white rounded-xl border border-gray-300 shadow-sm">
      {/* Pool display */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <PlayingCard faceDown size="xs" />
          {poolCount > 0 && (
            <div className="absolute -top-2 -right-2 w-5 h-5 bg-red-600 rounded-full flex items-center justify-center text-[10px] font-bold text-white">
              {poolCount}
            </div>
          )}
        </div>
        <div className="text-xs text-gray-600 font-medium">
          Special Pool
        </div>
      </div>
      
      {/* Player's special cards */}
      {playerSpecialCards.length > 0 && (
        <div className="border-t border-gray-200 pt-3">
          <div className="text-[10px] text-gray-500 mb-2 uppercase tracking-wide">Your Special Cards:</div>
          <div className="flex flex-wrap gap-2">
            {playerSpecialCards.map((card) => (
              <Button
                key={card.id}
                variant="outline"
                size="sm"
                disabled={disabled}
                onClick={() => onUseSpecialCard(card)}
                className="flex items-center gap-1.5 hover:border-red-500 hover:bg-red-50 text-gray-800 border-gray-300"
              >
                {card.isJoker ? (
                  <>
                    <Star className="w-3.5 h-3.5 text-amber-500" />
                    <span className="text-xs">Joker</span>
                  </>
                ) : card.rank === 'A' ? (
                  <>
                    <Zap className="w-3.5 h-3.5 text-red-600" />
                    <span className="text-xs">Ace</span>
                  </>
                ) : (
                  <>
                    <Crown className="w-3.5 h-3.5 text-red-600" />
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
