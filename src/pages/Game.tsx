import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useGameState } from '@/hooks/useGameState';
import { GameBoard } from '@/components/game/GameBoard';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

interface GamePlayerData {
  id: string;
  player_id: string | null;
  is_bot: boolean;
  bot_name: string | null;
  bot_difficulty: string | null;
  seat_position: number;
  profile?: {
    username: string;
  };
}

export default function Game() {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [players, setPlayers] = useState<Array<{
    id: string;
    name: string;
    isBot: boolean;
    botDifficulty?: 'easy' | 'medium' | 'hard';
    seatPosition: number;
  }>>([]);
  const [loadingPlayers, setLoadingPlayers] = useState(true);

  // Fetch players for this game
  useEffect(() => {
    if (!gameId) return;

    const fetchPlayers = async () => {
      const { data, error } = await supabase
        .from('game_players')
        .select(`
          *,
          profile:profiles(username)
        `)
        .eq('game_id', gameId)
        .order('seat_position');

      if (error) {
        console.error('Error fetching players:', error);
        navigate('/lobby');
        return;
      }

      const formattedPlayers = (data as GamePlayerData[]).map(p => ({
        id: p.is_bot ? p.id : (p.player_id || p.id),
        name: p.is_bot ? (p.bot_name || 'Bot') : (p.profile?.username || 'Player'),
        isBot: p.is_bot,
        botDifficulty: p.bot_difficulty as 'easy' | 'medium' | 'hard' | undefined,
        seatPosition: p.seat_position,
      }));

      setPlayers(formattedPlayers);
      setLoadingPlayers(false);
    };

    fetchPlayers();
  }, [gameId, navigate]);

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  // Initialize game state
  const {
    gameState,
    selectedCards,
    isMyTurn,
    myPlayer,
    isProcessing,
    toggleCardSelection,
    playCards,
    useSpecialCard,
    acceptPile,
    canPlaySelected,
  } = useGameState({
    gameId: gameId || '',
    players,
  });

  if (authLoading || loadingPlayers) {
    return (
      <div className="min-h-screen felt-texture flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!gameState) {
    return (
      <div className="min-h-screen felt-texture flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Setting up the game...</p>
        </div>
      </div>
    );
  }

  return (
    <GameBoard
      gameState={gameState}
      myPlayer={myPlayer}
      selectedCards={selectedCards}
      isMyTurn={isMyTurn}
      canPlaySelected={canPlaySelected}
      isProcessing={isProcessing}
      onCardClick={toggleCardSelection}
      onPlayCards={playCards}
      onAcceptPile={acceptPile}
      onUseSpecialCard={useSpecialCard}
    />
  );
}