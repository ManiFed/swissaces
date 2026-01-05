import { GameState, PlayerState } from '@/types/game';
import { CentralPile } from './CentralPile';
import { OpponentPanel } from './OpponentPanel';
import { PlayerHand } from './PlayerHand';
import { SpecialCardPool } from './SpecialCardPool';
import { TurnActions } from './TurnActions';
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
  onPlayCards: () => void;
  onAcceptPile: () => void;
  onUseSpecialCard: (card: Card) => void;
}

export function GameBoard({
  gameState,
  myPlayer,
  selectedCards,
  isMyTurn,
  canPlaySelected,
  isProcessing,
  onCardClick,
  onPlayCards,
  onAcceptPile,
  onUseSpecialCard,
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
      <div className="min-h-screen felt-texture flex items-center justify-center">
        <div className="text-center p-8 bg-card/80 rounded-2xl backdrop-blur-sm max-w-md">
          <Trophy className={`w-20 h-20 mx-auto mb-4 ${isWinner ? 'text-primary' : 'text-muted-foreground'}`} />
          <h2 className="text-3xl font-serif mb-2 gold-text">
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
    <div className="min-h-screen felt-texture flex flex-col">
      {/* Top area - Opponents */}
      <div className="flex justify-center items-start gap-4 p-4">
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
      </div>

      {/* Middle area - Side opponents + Central pile */}
      <div className="flex-1 flex items-center justify-center gap-8 px-4">
        {/* Left opponent */}
        <div className="w-40">
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
        <div className="w-40">
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
      <div className="p-4 space-y-4">
        {/* Actions and special cards row */}
        <div className="flex flex-col md:flex-row gap-4 justify-center items-stretch">
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
          />
        </div>

        {/* Player's hand */}
        {myPlayer && (
          <PlayerHand
            cards={myPlayer.hand}
            selectedCards={selectedCards}
            onCardClick={onCardClick}
            disabled={!isMyTurn || isProcessing}
            minimumRequired={gameState.minimumRequired}
          />
        )}
      </div>
    </div>
  );
}