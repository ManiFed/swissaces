import { GameState, PlayerState, Rank } from '@/types/game';
import { CentralPile } from './CentralPile';
import { OpponentPanel } from './OpponentPanel';
import { PlayerHand } from './PlayerHand';
import { SpecialCardPool } from './SpecialCardPool';
import { TurnActions } from './TurnActions';
import { TurnTimer } from './TurnTimer';
import { Card } from '@/types/game';
import { Button } from '@/components/ui/button';
import { Trophy, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface GameBoardProps {
  gameState: GameState;
  myPlayer: PlayerState | undefined;
  selectedCards: Card[];
  isMyTurn: boolean;
  canPlaySelected: boolean;
  isProcessing: boolean;
  onCardClick: (card: Card) => void;
  onSelectAllOfRank?: (rank: Rank) => void;
  onPlayCards: () => void;
  onAcceptPile: () => void;
  onUseSpecialCard: (card: Card) => void;
  onTimeout?: () => void;
  mustGiveCardsForOverflow?: boolean;
  overflowPenaltyCount?: number;
  onGiveCardsForOverflow?: (cards: Card[]) => void;
}

export function GameBoard({
  gameState,
  myPlayer,
  selectedCards,
  isMyTurn,
  canPlaySelected,
  isProcessing,
  onCardClick,
  onSelectAllOfRank,
  onPlayCards,
  onAcceptPile,
  onUseSpecialCard,
  onTimeout,
  mustGiveCardsForOverflow,
  overflowPenaltyCount,
  onGiveCardsForOverflow,
}: GameBoardProps) {
  const navigate = useNavigate();
  
  const opponents = gameState.players.filter(p => p.id !== myPlayer?.id);

  const getOpponentPosition = (index: number, total: number): 'top' | 'left' | 'right' => {
    if (total === 1) return 'top';
    if (total === 2) return index === 0 ? 'left' : 'right';
    if (index === 0) return 'left';
    if (index === 1) return 'top';
    return 'right';
  };

  const topOpponent = opponents.find((opponent, index) => getOpponentPosition(index, opponents.length) === 'top');
  const leftOpponent = opponents.find((opponent, index) => getOpponentPosition(index, opponents.length) === 'left');
  const rightOpponent = opponents.find((opponent, index) => getOpponentPosition(index, opponents.length) === 'right');

  // Game over screen
  if (gameState.status === 'completed') {
    const winner = gameState.players.find(p => p.id === gameState.winner);
    const isWinner = winner?.id === myPlayer?.id;

    return (
      <div className="h-[100dvh] felt-texture flex items-center justify-center overflow-hidden">
        <div className="text-center p-8 rounded-2xl backdrop-blur-sm max-w-md border border-border shadow-xl bg-card text-card-foreground">
          <Trophy className={`w-20 h-20 mx-auto mb-4 ${isWinner ? 'text-primary' : 'text-muted-foreground'}`} />
          <h2 className="text-3xl font-serif mb-2 text-foreground">
            {isWinner ? 'Victory!' : 'Game Over'}
          </h2>
          <p className="text-lg text-muted-foreground mb-6">
            {winner?.name} wins the game!
          </p>
          <Button onClick={() => navigate('/home')} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Return Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] felt-texture flex flex-col overflow-hidden">
      {/* Top area - Opponent and Timer */}
      <div className="px-2 md:px-3 pt-2 md:pt-3 pb-1 shrink-0">
        <div className="grid grid-cols-3 items-start gap-2">
          <div />
          <div className="flex justify-center">
            {topOpponent && (
              <OpponentPanel
                key={topOpponent.id}
                player={topOpponent}
                isCurrentTurn={topOpponent.isCurrentTurn}
                position="top"
              />
            )}
          </div>
          <div className="flex justify-end">
            {onTimeout && (
              <TurnTimer
                isActive={isMyTurn && !isProcessing}
                duration={30}
                onTimeout={onTimeout}
                turnNumber={gameState.turnNumber}
              />
            )}
          </div>
        </div>
      </div>

      {/* Middle area - Central Pile (always visible) */}
      <div className="flex-1 min-h-[200px] px-2 md:px-4 flex items-center justify-center gap-3 md:gap-6">
        <div className="w-28 md:w-36 shrink-0 flex justify-center">
          {leftOpponent && (
            <OpponentPanel
              key={leftOpponent.id}
              player={leftOpponent}
              isCurrentTurn={leftOpponent.isCurrentTurn}
              position="left"
            />
          )}
        </div>

        <div className="flex-shrink-0">
          <CentralPile
            pile={gameState.pile}
            pileCount={gameState.pileCount}
            minimumRequired={gameState.minimumRequired}
          />
        </div>

        <div className="w-28 md:w-36 shrink-0 flex justify-center">
          {rightOpponent && (
            <OpponentPanel
              key={rightOpponent.id}
              player={rightOpponent}
              isCurrentTurn={rightOpponent.isCurrentTurn}
              position="right"
            />
          )}
        </div>
      </div>

      {/* Bottom area - capped height, scrollable */}
      <div className="shrink-0 max-h-[40dvh] overflow-y-auto p-2 md:p-3 space-y-2 bg-card/95 backdrop-blur-sm border-t border-border">
        <div className="flex flex-col md:flex-row gap-2 md:gap-3 justify-center items-stretch">
          <SpecialCardPool
            poolCount={gameState.specialCardPool.length}
            playerSpecialCards={myPlayer?.specialCards || []}
            onUseSpecialCard={onUseSpecialCard}
            disabled={!isMyTurn || isProcessing}
          />

          <TurnActions
            isMyTurn={isMyTurn}
            canPlay={canPlaySelected}
            selectedCount={selectedCards.length}
            minimumRequired={gameState.minimumRequired}
            pileCount={gameState.pileCount}
            onPlayCards={onPlayCards}
            onAcceptPile={onAcceptPile}
            isProcessing={isProcessing}
            mustGiveCardsForOverflow={mustGiveCardsForOverflow}
            overflowPenaltyCount={overflowPenaltyCount}
            onGiveCardsForOverflow={onGiveCardsForOverflow ? () => onGiveCardsForOverflow(selectedCards) : undefined}
          />
        </div>

        {myPlayer && (
          <PlayerHand
            cards={myPlayer.hand}
            selectedCards={selectedCards}
            onCardClick={onCardClick}
            onSelectAllOfRank={onSelectAllOfRank}
            disabled={(!isMyTurn && !mustGiveCardsForOverflow) || isProcessing}
            minimumRequired={gameState.minimumRequired}
          />
        )}
      </div>
    </div>
  );
}
