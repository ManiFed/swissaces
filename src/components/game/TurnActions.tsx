import { Button } from '@/components/ui/button';
import { Play, HandMetal, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TurnActionsProps {
  isMyTurn: boolean;
  canPlay: boolean;
  selectedCount: number;
  minimumRequired: number;
  pileCount: number;
  onPlayCards: () => void;
  onAcceptPile: () => void;
  isProcessing?: boolean;
  mustGiveCardsForOverflow?: boolean;
  overflowPenaltyCount?: number;
  onGiveCardsForOverflow?: () => void;
}

export function TurnActions({
  isMyTurn,
  canPlay,
  selectedCount,
  minimumRequired,
  pileCount,
  onPlayCards,
  onAcceptPile,
  isProcessing,
  mustGiveCardsForOverflow,
  overflowPenaltyCount = 0,
  onGiveCardsForOverflow,
}: TurnActionsProps) {
  // Overflow penalty mode - player must give cards
  if (mustGiveCardsForOverflow && overflowPenaltyCount > 0) {
    const canGive = selectedCount === overflowPenaltyCount;
    
    return (
      <div className="flex flex-col gap-3 p-4 bg-destructive/10 rounded-xl border border-destructive/50">
        <div className="text-sm font-semibold text-center text-destructive">
          ⚠️ Pile Overflow Penalty
        </div>
        
        <div className="flex flex-wrap justify-center gap-3">
          <Button
            size="lg"
            variant="destructive"
            onClick={onGiveCardsForOverflow}
            disabled={!canGive || isProcessing}
            className={cn(
              "gap-2 min-w-[160px]",
              canGive && "animate-pulse"
            )}
          >
            <ArrowRight className="w-5 h-5" />
            Give {overflowPenaltyCount} Card{overflowPenaltyCount !== 1 ? 's' : ''}
          </Button>
        </div>
        
        <div className="text-xs text-destructive text-center">
          {selectedCount === 0 ? (
            `Select ${overflowPenaltyCount} card${overflowPenaltyCount !== 1 ? 's' : ''} to give to your opponent`
          ) : selectedCount < overflowPenaltyCount ? (
            `Select ${overflowPenaltyCount - selectedCount} more card${overflowPenaltyCount - selectedCount !== 1 ? 's' : ''}`
          ) : selectedCount > overflowPenaltyCount ? (
            `Too many selected! Only give ${overflowPenaltyCount}`
          ) : (
            'Ready to give cards'
          )}
        </div>
      </div>
    );
  }

  if (!isMyTurn) {
    return (
      <div className="flex items-center justify-center py-4 px-6 bg-card/80 rounded-xl border border-border/50">
        <div className="text-muted-foreground text-sm flex items-center gap-2">
          <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
          Waiting for other player...
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 p-4 bg-card/80 rounded-xl border border-border/50">
      <div className="text-sm font-semibold text-center text-primary">
        Your Turn
      </div>
      
      <div className="flex flex-wrap justify-center gap-3">
        {/* Play cards button */}
        <Button
          size="lg"
          onClick={onPlayCards}
          disabled={!canPlay || isProcessing}
          className={cn(
            "gap-2 min-w-[140px]",
            canPlay && "animate-pulse"
          )}
        >
          <Play className="w-5 h-5" />
          Play {selectedCount > 0 ? `${selectedCount} Card${selectedCount !== 1 ? 's' : ''}` : 'Cards'}
        </Button>
        
        {/* Accept pile button */}
        <Button
          variant="destructive"
          size="lg"
          onClick={onAcceptPile}
          disabled={pileCount === 0 || isProcessing}
          className="gap-2 min-w-[140px]"
        >
          <HandMetal className="w-5 h-5" />
          Take Pile ({pileCount})
        </Button>
      </div>
      
      {/* Helper text */}
      <div className="text-xs text-muted-foreground text-center">
        {selectedCount === 0 ? (
          `Select at least ${minimumRequired} card${minimumRequired !== 1 ? 's' : ''} of the same rank`
        ) : selectedCount < minimumRequired ? (
          `Need ${minimumRequired - selectedCount} more card${minimumRequired - selectedCount !== 1 ? 's' : ''}`
        ) : (
          'Ready to play!'
        )}
      </div>
    </div>
  );
}