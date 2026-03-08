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
  if (mustGiveCardsForOverflow && overflowPenaltyCount > 0) {
    const canGive = selectedCount === overflowPenaltyCount;

    return (
      <div className="flex-1 flex flex-col gap-3 p-4 bg-card rounded-xl border border-border shadow-sm min-w-[280px]">
        <div className="text-sm font-semibold text-center text-destructive">
          Pile Overflow Penalty
        </div>

        <div className="flex justify-center">
          <Button
            size="lg"
            variant="destructive"
            onClick={onGiveCardsForOverflow}
            disabled={!canGive || isProcessing}
            className={cn('gap-2 w-full sm:w-auto min-w-[190px]', canGive && 'animate-timer-pulse')}
          >
            <ArrowRight className="w-5 h-5" />
            Give {overflowPenaltyCount} Card{overflowPenaltyCount !== 1 ? 's' : ''}
          </Button>
        </div>

        <div className="text-xs text-muted-foreground text-center">
          {selectedCount === 0
            ? `Select ${overflowPenaltyCount} card${overflowPenaltyCount !== 1 ? 's' : ''}`
            : selectedCount < overflowPenaltyCount
              ? `Select ${overflowPenaltyCount - selectedCount} more`
              : selectedCount > overflowPenaltyCount
                ? `Too many selected (need exactly ${overflowPenaltyCount})`
                : 'Ready to give cards'}
        </div>
      </div>
    );
  }

  if (!isMyTurn) {
    return (
      <div className="flex-1 flex items-center justify-center py-4 px-6 bg-card rounded-xl border border-border shadow-sm min-w-[280px]">
        <div className="text-muted-foreground text-sm flex items-center gap-2">
          <div className="w-2 h-2 bg-primary rounded-full animate-timer-pulse" />
          Waiting for other player...
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col gap-3 p-4 bg-card rounded-xl border border-border shadow-sm min-w-[280px]">
      <div className="text-sm font-semibold text-center text-primary">
        Your Turn
      </div>

      <div className="flex flex-col sm:flex-row justify-center gap-3">
        <Button
          size="lg"
          onClick={onPlayCards}
          disabled={!canPlay || isProcessing}
          className={cn('gap-2 w-full sm:w-auto min-w-[150px]', canPlay && 'animate-timer-pulse')}
        >
          <Play className="w-5 h-5" />
          Play {selectedCount > 0 ? `${selectedCount}` : ''} {selectedCount !== 1 ? 'Cards' : 'Card'}
        </Button>

        <Button
          variant="destructive"
          size="lg"
          onClick={onAcceptPile}
          disabled={pileCount === 0 || isProcessing}
          className="gap-2 w-full sm:w-auto min-w-[150px]"
        >
          <HandMetal className="w-5 h-5" />
          Take Pile ({pileCount})
        </Button>
      </div>

      <div className="text-xs text-muted-foreground text-center">
        {selectedCount === 0
          ? `Select at least ${minimumRequired} card${minimumRequired !== 1 ? 's' : ''}`
          : selectedCount < minimumRequired
            ? `Need ${minimumRequired - selectedCount} more`
            : 'Ready to play!'}
      </div>
    </div>
  );
}

