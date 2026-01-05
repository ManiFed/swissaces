import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface GamePlayer {
  id: string;
  game_id: string;
  player_id: string | null;
  is_bot: boolean;
  bot_name: string | null;
  bot_difficulty: string | null;
  seat_position: number;
  is_ready: boolean;
  is_host: boolean;
  joined_at: string;
  profile?: {
    username: string;
    avatar_url: string | null;
  };
}

export interface Game {
  id: string;
  host_id: string;
  invite_code: string | null;
  is_public: boolean;
  max_players: number;
  status: string;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  players?: GamePlayer[];
  host?: {
    username: string;
  };
}

const BOT_NAMES = ['CardShark', 'AceHunter', 'RoyalFlush', 'WildCard', 'LuckyDraw', 'PokerFace'];

export function useLobby() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [publicGames, setPublicGames] = useState<Game[]>([]);
  const [currentGame, setCurrentGame] = useState<Game | null>(null);
  const [players, setPlayers] = useState<GamePlayer[]>([]);
  const [loading, setLoading] = useState(false);

  // Generate a random invite code
  const generateInviteCode = (): string => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  // Fetch public games
  const fetchPublicGames = useCallback(async () => {
    const { data, error } = await supabase
      .from('games')
      .select(`
        *,
        host:profiles!games_host_id_fkey(username),
        players:game_players(*)
      `)
      .eq('is_public', true)
      .eq('status', 'waiting')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching public games:', error);
      return;
    }

    setPublicGames(data || []);
  }, []);

  // Create a new game
  const createGame = async (isPublic: boolean, maxPlayers: number): Promise<Game | null> => {
    if (!user) return null;
    setLoading(true);

    try {
      const inviteCode = isPublic ? null : generateInviteCode();

      const { data: game, error: gameError } = await supabase
        .from('games')
        .insert({
          host_id: user.id,
          is_public: isPublic,
          max_players: maxPlayers,
          invite_code: inviteCode,
        })
        .select()
        .single();

      if (gameError) throw gameError;

      // Add host as first player
      const { error: playerError } = await supabase
        .from('game_players')
        .insert({
          game_id: game.id,
          player_id: user.id,
          seat_position: 0,
          is_host: true,
          is_ready: true,
        });

      if (playerError) throw playerError;

      setCurrentGame(game);
      return game;
    } catch (error: any) {
      toast({
        title: 'Error creating game',
        description: error.message,
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Join a game by ID or invite code
  const joinGame = async (gameIdOrCode: string): Promise<boolean> => {
    if (!user) return false;
    setLoading(true);

    try {
      // Check if it's an invite code or game ID
      let game: Game | null = null;
      
      if (gameIdOrCode.length === 6) {
        const { data } = await supabase
          .from('games')
          .select('*')
          .eq('invite_code', gameIdOrCode.toUpperCase())
          .eq('status', 'waiting')
          .single();
        game = data;
      } else {
        const { data } = await supabase
          .from('games')
          .select('*')
          .eq('id', gameIdOrCode)
          .eq('status', 'waiting')
          .single();
        game = data;
      }

      if (!game) {
        toast({
          title: 'Game not found',
          description: 'The game may have already started or been cancelled.',
          variant: 'destructive',
        });
        return false;
      }

      // Get current players count
      const { data: existingPlayers } = await supabase
        .from('game_players')
        .select('*')
        .eq('game_id', game.id);

      const playerCount = existingPlayers?.length || 0;
      
      if (playerCount >= game.max_players) {
        toast({
          title: 'Game is full',
          description: 'This game has reached its maximum player count.',
          variant: 'destructive',
        });
        return false;
      }

      // Check if already in game
      const alreadyJoined = existingPlayers?.some(p => p.player_id === user.id);
      if (alreadyJoined) {
        setCurrentGame(game);
        return true;
      }

      // Find next available seat
      const takenSeats = existingPlayers?.map(p => p.seat_position) || [];
      let nextSeat = 0;
      while (takenSeats.includes(nextSeat)) nextSeat++;

      const { error: joinError } = await supabase
        .from('game_players')
        .insert({
          game_id: game.id,
          player_id: user.id,
          seat_position: nextSeat,
          is_host: false,
          is_ready: false,
        });

      if (joinError) throw joinError;

      setCurrentGame(game);
      return true;
    } catch (error: any) {
      toast({
        title: 'Error joining game',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Leave current game
  const leaveGame = async (): Promise<void> => {
    if (!user || !currentGame) return;

    try {
      // If host, cancel the game
      if (currentGame.host_id === user.id) {
        await supabase
          .from('games')
          .update({ status: 'cancelled' })
          .eq('id', currentGame.id);
      } else {
        await supabase
          .from('game_players')
          .delete()
          .eq('game_id', currentGame.id)
          .eq('player_id', user.id);
      }

      setCurrentGame(null);
      setPlayers([]);
    } catch (error: any) {
      toast({
        title: 'Error leaving game',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  // Toggle ready status
  const toggleReady = async (): Promise<void> => {
    if (!user || !currentGame) return;

    const currentPlayer = players.find(p => p.player_id === user.id);
    if (!currentPlayer) return;

    await supabase
      .from('game_players')
      .update({ is_ready: !currentPlayer.is_ready })
      .eq('game_id', currentGame.id)
      .eq('player_id', user.id);
  };

  // Add a bot to the game
  const addBot = async (difficulty: 'easy' | 'medium' | 'hard' = 'medium'): Promise<void> => {
    if (!user || !currentGame || currentGame.host_id !== user.id) return;

    const takenSeats = players.map(p => p.seat_position);
    let nextSeat = 0;
    while (takenSeats.includes(nextSeat)) nextSeat++;

    if (nextSeat >= currentGame.max_players) {
      toast({
        title: 'Game is full',
        description: 'Cannot add more players.',
        variant: 'destructive',
      });
      return;
    }

    // Pick a random bot name not already in use
    const usedNames = players.filter(p => p.is_bot).map(p => p.bot_name);
    const availableNames = BOT_NAMES.filter(n => !usedNames.includes(n));
    const botName = availableNames[Math.floor(Math.random() * availableNames.length)] || `Bot${nextSeat + 1}`;

    await supabase
      .from('game_players')
      .insert({
        game_id: currentGame.id,
        player_id: null,
        is_bot: true,
        bot_name: botName,
        bot_difficulty: difficulty,
        seat_position: nextSeat,
        is_ready: true,
        is_host: false,
      });
  };

  // Remove a bot from the game
  const removeBot = async (playerId: string): Promise<void> => {
    if (!user || !currentGame || currentGame.host_id !== user.id) return;

    await supabase
      .from('game_players')
      .delete()
      .eq('id', playerId)
      .eq('is_bot', true);
  };

  // Start the game
  const startGame = async (): Promise<boolean> => {
    if (!user || !currentGame || currentGame.host_id !== user.id) return false;

    // Check all players are ready
    const allReady = players.every(p => p.is_ready);
    if (!allReady) {
      toast({
        title: 'Not everyone is ready',
        description: 'Wait for all players to ready up.',
        variant: 'destructive',
      });
      return false;
    }

    if (players.length < 2) {
      toast({
        title: 'Not enough players',
        description: 'You need at least 2 players to start.',
        variant: 'destructive',
      });
      return false;
    }

    const { error } = await supabase
      .from('games')
      .update({ status: 'starting', started_at: new Date().toISOString() })
      .eq('id', currentGame.id);

    if (error) {
      toast({
        title: 'Error starting game',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    }

    return true;
  };

  // Fetch players for current game
  const fetchPlayers = useCallback(async (gameId: string) => {
    const { data, error } = await supabase
      .from('game_players')
      .select(`
        *,
        profile:profiles(username, avatar_url)
      `)
      .eq('game_id', gameId)
      .order('seat_position');

    if (!error && data) {
      setPlayers(data);
    }
  }, []);

  // Subscribe to game and player updates
  useEffect(() => {
    if (!currentGame) return;

    fetchPlayers(currentGame.id);

    const gameChannel = supabase
      .channel(`game-${currentGame.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'games',
          filter: `id=eq.${currentGame.id}`,
        },
        (payload) => {
          if (payload.eventType === 'UPDATE') {
            setCurrentGame(payload.new as Game);
          } else if (payload.eventType === 'DELETE') {
            setCurrentGame(null);
            setPlayers([]);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'game_players',
          filter: `game_id=eq.${currentGame.id}`,
        },
        () => {
          fetchPlayers(currentGame.id);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(gameChannel);
    };
  }, [currentGame?.id, fetchPlayers]);

  // Subscribe to public games list
  useEffect(() => {
    fetchPublicGames();

    const publicChannel = supabase
      .channel('public-games')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'games',
        },
        () => {
          fetchPublicGames();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(publicChannel);
    };
  }, [fetchPublicGames]);

  return {
    publicGames,
    currentGame,
    players,
    loading,
    createGame,
    joinGame,
    leaveGame,
    toggleReady,
    addBot,
    removeBot,
    startGame,
    setCurrentGame,
  };
}
