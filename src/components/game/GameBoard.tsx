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
  
  // Get opponents (players other than me)
  const opponents = gameState.players.filter(p => p.id !== myPlayer?.id);
  
  // Determine opponent positions based on count
  const getOpponentPosition = (index: number, total: number): 'top' | 'left' | 'right' => {
    if (total === 1) return 'top';
    if (total === 2) return index === 0 ? 'left' : 'right';
    if (index === 0) return 'left';
    if (index === 1) return 'top';
    return 'right';
  };

  // Check for game over
  if (gameState.status === 'completed') {
    const winner = gameState.players.find(p => p.id === gameState.winner);
    const isWinner = winner?.id === myPlayer?.id;
    
    return (
      <div className="h-screen felt-texture flex items-center justify-center overflow-hidden">
        <div className="text-center p-8 bg-card/90 rounded-2xl backdrop-blur-sm max-w-md border border-border shadow-xl">
          <Trophy className={`w-20 h-20 mx-auto mb-4 ${isWinner ? 'text-primary' : 'text-muted-foreground'}`} />
          <h2 className="text-3xl font-serif mb-2 swiss-text">
            {isWinner ? 'Victory!' : 'Game Over'}
          </h2>
          <p className="text-lg text-muted-foreground mb-6">
            {winner?.name} wins the game!
          </p>
          <Button onClick={() => navigate('/')} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Return Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen felt-texture flex flex-col overflow-hidden">
      {/* Top area - Opponents and Timer */}
      <div className="flex justify-center items-start gap-4 p-3 shrink-0">
        {opponents.map((opponent, index) => {
          const position = getOpponentPosition(index, opponents.length);
          if (position !== 'top') return null;
          return (
            <OpponentPanel
              key={opponent.id}
              player={opponent}
              isCurrentTurn={opponent.isCurrentTurn}
              position="top"
            />
          );
        })}
        
        {/* Turn timer */}
        {onTimeout && (
          <TurnTimer
            isActive={isMyTurn && !isProcessing}
            duration={30}
            onTimeout={onTimeout}
            turnNumber={gameState.turnNumber}
          />
        )}
      </div>

      {/* Middle area - Side opponents + Central pile */}
      <div className="flex-1 flex items-center justify-center gap-6 px-4 min-h-0">
        {/* Left opponent */}
        <div className="w-36 shrink-0">
          {opponents.map((opponent, index) => {
            const position = getOpponentPosition(index, opponents.length);
            if (position !== 'left') return null;
            return (
              <OpponentPanel
                key={opponent.id}
                player={opponent}
                isCurrentTurn={opponent.isCurrentTurn}
                position="left"
              />
            );
          })}
        </div>

        {/* Central pile */}
        <div className="flex-shrink-0">
          <CentralPile
            pile={gameState.pile}
            pileCount={gameState.pileCount}
            minimumRequired={gameState.minimumRequired}
          />
        </div>

        {/* Right opponent */}
        <div className="w-36 shrink-0">
          {opponents.map((opponent, index) => {
            const position = getOpponentPosition(index, opponents.length);
            if (position !== 'right') return null;
            return (
              <OpponentPanel
                key={opponent.id}
                player={opponent}
                isCurrentTurn={opponent.isCurrentTurn}
                position="right"
              />
            );
          })}
        </div>
      </div>

      {/* Bottom area - Player's stuff */}
      <div className="p-3 space-y-2 shrink-0 bg-gradient-to-t from-black/20 to-transparent">
        {/* Actions and special cards row */}
        <div className="flex flex-row gap-3 justify-center items-stretch">
          {/* Special card pool */}
          <SpecialCardPool
            poolCount={gameState.specialCardPool.length}
            playerSpecialCards={myPlayer?.specialCards || []}
            onUseSpecialCard={onUseSpecialCard}
            disabled={!isMyTurn || isProcessing}
          />
          
          {/* Turn actions */}
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

        {/* Player's hand */}
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
