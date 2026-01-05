import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { 
  Card, 
  Suit, 
  Rank, 
  PlayerState, 
  GameState, 
  PILE_OVERFLOW_LIMIT,
  RANKS_ORDER,
  isSpecialCard 
} from '@/types/game';

// Generate a unique card ID
const generateCardId = () => Math.random().toString(36).substring(2, 9);

// Create a standard deck (without jokers for now)
function createDeck(playerCount: number): Card[] {
  const suits: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
  const deck: Card[] = [];
  
  const ranksToUse: Rank[] = [...RANKS_ORDER];
  
  for (const suit of suits) {
    for (const rank of ranksToUse) {
      deck.push({
        id: generateCardId(),
        suit,
        rank,
      });
    }
  }
  
  // Add jokers (2 per deck)
  deck.push({ id: generateCardId(), suit: 'spades', rank: 'A', isJoker: true });
  deck.push({ id: generateCardId(), suit: 'hearts', rank: 'A', isJoker: true });
  
  return deck;
}

// Shuffle deck using Fisher-Yates
function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Deal cards to players
function dealCards(deck: Card[], playerCount: number): { hands: Card[][]; specialPool: Card[]; remainingDeck: Card[] } {
  const shuffled = shuffleDeck(deck);
  const hands: Card[][] = Array.from({ length: playerCount }, () => []);
  const specialPool: Card[] = [];
  const normalCards: Card[] = [];
  
  // Separate special cards for the pool
  for (const card of shuffled) {
    if (isSpecialCard(card)) {
      specialPool.push(card);
    } else {
      normalCards.push(card);
    }
  }
  
  // Deal normal cards evenly
  const cardsPerPlayer = Math.floor(normalCards.length / playerCount);
  for (let i = 0; i < playerCount; i++) {
    hands[i] = normalCards.slice(i * cardsPerPlayer, (i + 1) * cardsPerPlayer);
  }
  
  const remainingDeck = normalCards.slice(playerCount * cardsPerPlayer);
  
  return { hands, specialPool, remainingDeck };
}

// Group cards by rank for display
export function groupCardsByRank(cards: Card[]): Map<Rank, Card[]> {
  const groups = new Map<Rank, Card[]>();
  for (const card of cards) {
    if (!card.isJoker) {
      const existing = groups.get(card.rank) || [];
      existing.push(card);
      groups.set(card.rank, existing);
    }
  }
  return groups;
}

// Check if cards can be played (same rank, meets minimum)
export function canPlayCards(cards: Card[], minimumRequired: number, pileCount: number): boolean {
  if (cards.length === 0) return false;
  if (cards.length < minimumRequired) return false;
  
  // All cards must be same rank (jokers are wild)
  const nonJokers = cards.filter(c => !c.isJoker);
  if (nonJokers.length > 0) {
    const rank = nonJokers[0].rank;
    if (!nonJokers.every(c => c.rank === rank)) return false;
  }
  
  return true;
}

// Calculate new minimum after playing cards
export function calculateNewMinimum(cardsPlayed: number, currentMinimum: number): number {
  return cardsPlayed;
}

// Smart bot logic
function getBotPlay(
  hand: Card[], 
  minimumRequired: number, 
  pileCount: number, 
  difficulty: 'easy' | 'medium' | 'hard',
  specialCards: Card[]
): { type: 'play'; cards: Card[] } | { type: 'special'; card: Card } | { type: 'pickup' } {
  const grouped = groupCardsByRank(hand);
  const jokers = hand.filter(c => c.isJoker);
  
  const groupedArray = Array.from(grouped.entries())
    .map(([rank, cards]) => ({ rank, cards, count: cards.length }))
    .sort((a, b) => a.count - b.count);
  
  const playableGroups = groupedArray.filter(g => g.count >= minimumRequired);
  
  if (difficulty === 'easy') {
    if (playableGroups.length > 0) {
      return { type: 'play', cards: playableGroups[0].cards.slice(0, minimumRequired) };
    }
    return { type: 'pickup' };
  }
  
  if (difficulty === 'medium') {
    if (playableGroups.length > 0) {
      const exactMatch = playableGroups.find(g => g.count === minimumRequired);
      if (exactMatch) {
        return { type: 'play', cards: exactMatch.cards };
      }
      return { type: 'play', cards: playableGroups[0].cards.slice(0, minimumRequired) };
    }
    
    if (pileCount >= 8 && specialCards.length > 0) {
      const king = specialCards.find(c => c.rank === 'K');
      if (king) return { type: 'special', card: king };
    }
    
    return { type: 'pickup' };
  }
  
  // Hard bot
  if (playableGroups.length === 0 && jokers.length > 0) {
    for (const group of groupedArray) {
      const needed = minimumRequired - group.count;
      if (needed > 0 && needed <= jokers.length) {
        const play = [...group.cards, ...jokers.slice(0, needed)];
        return { type: 'play', cards: play };
      }
    }
  }
  
  if (playableGroups.length > 0) {
    const cardsToOverflow = PILE_OVERFLOW_LIMIT - pileCount;
    const groupThatOverflows = playableGroups.find(g => g.count >= cardsToOverflow);
    if (groupThatOverflows && cardsToOverflow <= 4) {
      return { type: 'play', cards: groupThatOverflows.cards.slice(0, Math.max(minimumRequired, cardsToOverflow)) };
    }
    
    const bestGroup = playableGroups.reduce((best, curr) => {
      if (curr.count >= 3 && curr.count <= 4) return curr;
      if (best.count >= 3 && best.count <= 4) return best;
      return curr.count < best.count ? curr : best;
    });
    
    return { type: 'play', cards: bestGroup.cards };
  }
  
  if (specialCards.length > 0) {
    const king = specialCards.find(c => c.rank === 'K');
    if (king && minimumRequired >= 3) {
      return { type: 'special', card: king };
    }
    
    const ace = specialCards.find(c => c.rank === 'A' && !c.isJoker);
    if (ace && pileCount >= 6) {
      return { type: 'special', card: ace };
    }
    
    const jokerSpecial = specialCards.find(c => c.isJoker);
    if (jokerSpecial && pileCount >= 10) {
      return { type: 'special', card: jokerSpecial };
    }
  }
  
  return { type: 'pickup' };
}

interface UseGameStateProps {
  gameId: string;
  players: Array<{
    id: string;
    name: string;
    isBot: boolean;
    botDifficulty?: 'easy' | 'medium' | 'hard';
    seatPosition: number;
  }>;
}

export function useGameState({ gameId, players }: UseGameStateProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [selectedCards, setSelectedCards] = useState<Card[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const isMultiplayer = players.filter(p => !p.isBot).length > 1;
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Initialize game
  const initializeGame = useCallback(async () => {
    if (players.length < 2) return;
    
    const deck = createDeck(players.length);
    const { hands, specialPool } = dealCards(deck, players.length);
    
    const playerStates: PlayerState[] = players.map((p, index) => ({
      id: p.id,
      name: p.name,
      isBot: p.isBot,
      botDifficulty: p.botDifficulty,
      hand: hands[index] || [],
      specialCards: [],
      isCurrentTurn: index === 0,
      seatPosition: p.seatPosition,
    }));
    
    // Give each player one special card to start
    const shuffledSpecial = shuffleDeck(specialPool);
    for (let i = 0; i < playerStates.length && i < shuffledSpecial.length; i++) {
      playerStates[i].specialCards.push(shuffledSpecial[i]);
    }
    
    const remainingSpecial = shuffledSpecial.slice(playerStates.length);
    
    const newGameState: GameState = {
      id: gameId,
      status: 'in_progress',
      pile: [],
      pileCount: 0,
      minimumRequired: 1,
      specialCardPool: remainingSpecial,
      players: playerStates,
      currentPlayerIndex: 0,
      turnNumber: 1,
    };
    
    setGameState(newGameState);
    
    // For multiplayer, save initial state to database
    if (isMultiplayer) {
      try {
        await supabase.from('game_states').upsert({
          game_id: gameId,
          pile: JSON.parse(JSON.stringify(newGameState.pile)),
          pile_count: newGameState.pileCount,
          minimum_required: newGameState.minimumRequired,
          special_card_pool: JSON.parse(JSON.stringify(newGameState.specialCardPool)),
          players_state: JSON.parse(JSON.stringify(newGameState.players)),
          current_player_index: newGameState.currentPlayerIndex,
          turn_number: newGameState.turnNumber,
          turn_started_at: new Date().toISOString(),
          status: newGameState.status,
        }, { onConflict: 'game_id' });
      } catch (error) {
        console.error('Error saving initial game state:', error);
      }
    }
  }, [gameId, players, isMultiplayer]);

  // Get current player
  const currentPlayer = gameState?.players[gameState.currentPlayerIndex];
  const isMyTurn = currentPlayer?.id === user?.id;
  const myPlayer = gameState?.players.find(p => p.id === user?.id);

  // Toggle card selection
  const toggleCardSelection = (card: Card) => {
    if (!isMyTurn || isProcessing) return;
    
    setSelectedCards(prev => {
      const isSelected = prev.some(c => c.id === card.id);
      if (isSelected) {
        return prev.filter(c => c.id !== card.id);
      }
      
      if (prev.length > 0) {
        const firstNonJoker = prev.find(c => !c.isJoker);
        const cardIsJoker = card.isJoker;
        
        if (firstNonJoker && !cardIsJoker && firstNonJoker.rank !== card.rank) {
          toast({
            title: "Invalid selection",
            description: "All cards must be the same rank",
            variant: "destructive"
          });
          return prev;
        }
      }
      
      return [...prev, card];
    });
  };

  // Select all cards of a specific rank
  const selectAllOfRank = useCallback((rank: Rank) => {
    if (!isMyTurn || isProcessing || !myPlayer) return;
    
    const cardsOfRank = myPlayer.hand.filter(c => c.rank === rank && !c.isJoker);
    
    // Check if all are already selected
    const allSelected = cardsOfRank.every(c => selectedCards.some(sc => sc.id === c.id));
    
    if (allSelected) {
      // Deselect all of this rank
      setSelectedCards(prev => prev.filter(c => c.rank !== rank || c.isJoker));
    } else {
      // Select all of this rank (replace current selection)
      setSelectedCards(cardsOfRank);
    }
  }, [isMyTurn, isProcessing, myPlayer, selectedCards]);

  // Handle pile overflow
  const handlePileOverflow = (
    newPileCount: number, 
    newPile: Card[], 
    players: PlayerState[], 
    currentPlayerIdx: number
  ): { 
    finalPile: Card[]; 
    finalPileCount: number; 
    updatedPlayers: PlayerState[];
    cardsTransferred: number;
  } => {
    if (newPileCount <= PILE_OVERFLOW_LIMIT) {
      return { 
        finalPile: newPile, 
        finalPileCount: newPileCount, 
        updatedPlayers: players,
        cardsTransferred: 0
      };
    }
    
    // Soft overflow: the player who caused overflow receives penalty cards
    const excessCount = newPileCount - PILE_OVERFLOW_LIMIT;
    
    // The pile resets, and the current player receives X cards from pile
    const updatedPlayers = [...players];
    const cardsToGive = newPile.slice(-excessCount);
    
    updatedPlayers[currentPlayerIdx] = {
      ...updatedPlayers[currentPlayerIdx],
      hand: [...updatedPlayers[currentPlayerIdx].hand, ...cardsToGive],
    };
    
    return {
      finalPile: [],
      finalPileCount: 0,
      updatedPlayers,
      cardsTransferred: excessCount
    };
  };

  // Sync game state to database
  const syncGameState = useCallback(async (state: GameState) => {
    if (!isMultiplayer) return;
    
    try {
      await supabase.from('game_states').update({
        pile: JSON.parse(JSON.stringify(state.pile)),
        pile_count: state.pileCount,
        minimum_required: state.minimumRequired,
        special_card_pool: JSON.parse(JSON.stringify(state.specialCardPool)),
        players_state: JSON.parse(JSON.stringify(state.players)),
        current_player_index: state.currentPlayerIndex,
        turn_number: state.turnNumber,
        last_action: state.lastAction ? JSON.parse(JSON.stringify(state.lastAction)) : null,
        turn_started_at: new Date().toISOString(),
        status: state.status,
        winner_id: state.winner,
      }).eq('game_id', gameId);
    } catch (error) {
      console.error('Error syncing game state:', error);
    }
  }, [gameId, isMultiplayer]);

  // Play selected cards
  const playCards = useCallback(async () => {
    if (!gameState || !isMyTurn || selectedCards.length === 0) return;
    
    if (!canPlayCards(selectedCards, gameState.minimumRequired, gameState.pileCount)) {
      toast({
        title: "Invalid play",
        description: `You must play at least ${gameState.minimumRequired} cards of the same rank`,
        variant: "destructive"
      });
      return;
    }
    
    setIsProcessing(true);
    
    const newPlayers = [...gameState.players];
    const currentIdx = gameState.currentPlayerIndex;
    
    const cardIds = selectedCards.map(c => c.id);
    newPlayers[currentIdx] = {
      ...newPlayers[currentIdx],
      hand: newPlayers[currentIdx].hand.filter(c => !cardIds.includes(c.id)),
      isCurrentTurn: false,
    };
    
    const newPile = [...gameState.pile, ...selectedCards];
    const newPileCount = gameState.pileCount + selectedCards.length;
    const newMinimum = calculateNewMinimum(selectedCards.length, gameState.minimumRequired);
    
    const { finalPile, finalPileCount, updatedPlayers, cardsTransferred } = handlePileOverflow(
      newPileCount,
      newPile,
      newPlayers,
      currentIdx
    );
    
    if (cardsTransferred > 0) {
      toast({
        title: "Pile Overflow!",
        description: `You receive ${cardsTransferred} card${cardsTransferred > 1 ? 's' : ''} as penalty`,
        variant: "destructive"
      });
    }
    
    const nextPlayerIndex = (currentIdx + 1) % updatedPlayers.length;
    updatedPlayers[nextPlayerIndex] = {
      ...updatedPlayers[nextPlayerIndex],
      isCurrentTurn: true,
    };
    
    const winner = updatedPlayers.find(p => p.hand.length === 0 && p.specialCards.length === 0);
    
    const newState: GameState = {
      ...gameState,
      pile: finalPile,
      pileCount: finalPileCount,
      minimumRequired: finalPileCount === 0 ? 1 : newMinimum,
      players: updatedPlayers,
      currentPlayerIndex: nextPlayerIndex,
      turnNumber: gameState.turnNumber + 1,
      lastAction: {
        type: 'play_cards',
        playerId: newPlayers[currentIdx].id,
        cards: selectedCards,
        timestamp: Date.now(),
      },
      status: winner ? 'completed' : 'in_progress',
      winner: winner?.id,
    };
    
    setGameState(newState);
    await syncGameState(newState);
    
    setSelectedCards([]);
    setIsProcessing(false);
  }, [gameState, isMyTurn, selectedCards, toast, syncGameState]);

  // Use special card
  const useSpecialCard = useCallback(async (card: Card) => {
    if (!gameState || !isMyTurn) return;
    
    setIsProcessing(true);
    
    const newPlayers = [...gameState.players];
    const currentIdx = gameState.currentPlayerIndex;
    
    newPlayers[currentIdx] = {
      ...newPlayers[currentIdx],
      specialCards: newPlayers[currentIdx].specialCards.filter(c => c.id !== card.id),
      isCurrentTurn: false,
    };
    
    let newPile = gameState.pile;
    let newPileCount = gameState.pileCount;
    let newMinimum = gameState.minimumRequired;
    
    if (card.rank === 'A' || card.isJoker) {
      newPile = [];
      newPileCount = 0;
      newMinimum = 1;
    } else if (card.rank === 'K') {
      newMinimum = 1;
    }
    
    const nextPlayerIndex = (currentIdx + 1) % newPlayers.length;
    newPlayers[nextPlayerIndex] = {
      ...newPlayers[nextPlayerIndex],
      isCurrentTurn: true,
    };
    
    const newState: GameState = {
      ...gameState,
      pile: newPile,
      pileCount: newPileCount,
      minimumRequired: newMinimum,
      players: newPlayers,
      currentPlayerIndex: nextPlayerIndex,
      turnNumber: gameState.turnNumber + 1,
      lastAction: {
        type: 'use_special',
        playerId: newPlayers[currentIdx].id,
        specialCard: card,
        timestamp: Date.now(),
      },
    };
    
    setGameState(newState);
    await syncGameState(newState);
    
    setIsProcessing(false);
  }, [gameState, isMyTurn, syncGameState]);

  // Accept pile
  const acceptPile = useCallback(async () => {
    if (!gameState || !isMyTurn) return;
    
    setIsProcessing(true);
    
    const newPlayers = [...gameState.players];
    const currentIdx = gameState.currentPlayerIndex;
    
    newPlayers[currentIdx] = {
      ...newPlayers[currentIdx],
      hand: [...newPlayers[currentIdx].hand, ...gameState.pile],
      isCurrentTurn: false,
    };
    
    let newSpecialPool = [...gameState.specialCardPool];
    if (newSpecialPool.length > 0) {
      const drawnCard = newSpecialPool.pop()!;
      newPlayers[currentIdx].specialCards.push(drawnCard);
    }
    
    const nextPlayerIndex = (currentIdx + 1) % newPlayers.length;
    newPlayers[nextPlayerIndex] = {
      ...newPlayers[nextPlayerIndex],
      isCurrentTurn: true,
    };
    
    const newState: GameState = {
      ...gameState,
      pile: [],
      pileCount: 0,
      minimumRequired: 1,
      specialCardPool: newSpecialPool,
      players: newPlayers,
      currentPlayerIndex: nextPlayerIndex,
      turnNumber: gameState.turnNumber + 1,
      lastAction: {
        type: 'accept_pile',
        playerId: newPlayers[currentIdx].id,
        timestamp: Date.now(),
      },
    };
    
    setGameState(newState);
    await syncGameState(newState);
    
    setSelectedCards([]);
    setIsProcessing(false);
  }, [gameState, isMyTurn, syncGameState]);

  // Handle timeout - auto accept pile or play if possible
  const handleTimeout = useCallback(() => {
    if (!gameState || !isMyTurn || isProcessing) return;
    
    toast({
      title: "Time's up!",
      description: "You took too long - taking the pile",
      variant: "destructive"
    });
    
    acceptPile();
  }, [gameState, isMyTurn, isProcessing, toast, acceptPile]);

  // Subscribe to realtime updates for multiplayer
  useEffect(() => {
    if (!isMultiplayer || !gameId) return;
    
    const channel = supabase
      .channel(`game-${gameId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'game_states',
          filter: `game_id=eq.${gameId}`,
        },
        (payload) => {
          const data = payload.new as any;
          
          // Don't update if we just made this change
          if (data.turn_number === gameState?.turnNumber) return;
          
          setGameState({
            id: gameId,
            status: data.status,
            pile: data.pile || [],
            pileCount: data.pile_count,
            minimumRequired: data.minimum_required,
            specialCardPool: data.special_card_pool || [],
            players: data.players_state || [],
            currentPlayerIndex: data.current_player_index,
            turnNumber: data.turn_number,
            lastAction: data.last_action,
            winner: data.winner_id,
          });
        }
      )
      .subscribe();
    
    channelRef.current = channel;
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [gameId, isMultiplayer, gameState?.turnNumber]);

  // Bot turn logic
  useEffect(() => {
    if (!gameState || gameState.status !== 'in_progress') return;
    
    const current = gameState.players[gameState.currentPlayerIndex];
    if (!current.isBot) return;
    
    const thinkTime = current.botDifficulty === 'hard' ? 1500 : 
                      current.botDifficulty === 'medium' ? 1000 : 600;
    
    const timeout = setTimeout(async () => {
      const botAction = getBotPlay(
        current.hand,
        gameState.minimumRequired,
        gameState.pileCount,
        current.botDifficulty || 'easy',
        current.specialCards
      );
      
      if (botAction.type === 'play') {
        const cardsToPlay = botAction.cards;
        
        const newPlayers = [...gameState.players];
        const currentIdx = gameState.currentPlayerIndex;
        
        const cardIds = cardsToPlay.map(c => c.id);
        newPlayers[currentIdx] = {
          ...newPlayers[currentIdx],
          hand: newPlayers[currentIdx].hand.filter(c => !cardIds.includes(c.id)),
          isCurrentTurn: false,
        };
        
        const newPile = [...gameState.pile, ...cardsToPlay];
        const newPileCount = gameState.pileCount + cardsToPlay.length;
        const newMinimum = calculateNewMinimum(cardsToPlay.length, gameState.minimumRequired);
        
        const { finalPile, finalPileCount, updatedPlayers } = handlePileOverflow(
          newPileCount,
          newPile,
          newPlayers,
          currentIdx
        );
        
        const nextPlayerIndex = (currentIdx + 1) % updatedPlayers.length;
        updatedPlayers[nextPlayerIndex] = {
          ...updatedPlayers[nextPlayerIndex],
          isCurrentTurn: true,
        };
        
        const winner = updatedPlayers.find(p => p.hand.length === 0 && p.specialCards.length === 0);
        
        const newState: GameState = {
          ...gameState,
          pile: finalPile,
          pileCount: finalPileCount,
          minimumRequired: finalPileCount === 0 ? 1 : newMinimum,
          players: updatedPlayers,
          currentPlayerIndex: nextPlayerIndex,
          turnNumber: gameState.turnNumber + 1,
          lastAction: {
            type: 'play_cards',
            playerId: current.id,
            cards: cardsToPlay,
            timestamp: Date.now(),
          },
          status: winner ? 'completed' : 'in_progress',
          winner: winner?.id,
        };
        
        setGameState(newState);
        await syncGameState(newState);
      } else if (botAction.type === 'special') {
        const specialCard = botAction.card;
        
        const newPlayers = [...gameState.players];
        const currentIdx = gameState.currentPlayerIndex;
        
        newPlayers[currentIdx] = {
          ...newPlayers[currentIdx],
          specialCards: newPlayers[currentIdx].specialCards.filter(c => c.id !== specialCard.id),
          isCurrentTurn: false,
        };
        
        let newPile = gameState.pile;
        let newPileCount = gameState.pileCount;
        let newMinimum = gameState.minimumRequired;
        
        if (specialCard.rank === 'A' || specialCard.isJoker) {
          newPile = [];
          newPileCount = 0;
          newMinimum = 1;
        } else if (specialCard.rank === 'K') {
          newMinimum = 1;
        }
        
        const nextPlayerIndex = (currentIdx + 1) % newPlayers.length;
        newPlayers[nextPlayerIndex] = {
          ...newPlayers[nextPlayerIndex],
          isCurrentTurn: true,
        };
        
        const newState: GameState = {
          ...gameState,
          pile: newPile,
          pileCount: newPileCount,
          minimumRequired: newMinimum,
          players: newPlayers,
          currentPlayerIndex: nextPlayerIndex,
          turnNumber: gameState.turnNumber + 1,
          lastAction: {
            type: 'use_special',
            playerId: current.id,
            specialCard: specialCard,
            timestamp: Date.now(),
          },
        };
        
        setGameState(newState);
        await syncGameState(newState);
      } else {
        // Bot picks up pile
        const newPlayers = [...gameState.players];
        const currentIdx = gameState.currentPlayerIndex;
        
        newPlayers[currentIdx] = {
          ...newPlayers[currentIdx],
          hand: [...newPlayers[currentIdx].hand, ...gameState.pile],
          isCurrentTurn: false,
        };
        
        let newSpecialPool = [...gameState.specialCardPool];
        if (newSpecialPool.length > 0) {
          const drawnCard = newSpecialPool.pop()!;
          newPlayers[currentIdx].specialCards.push(drawnCard);
        }
        
        const nextPlayerIndex = (currentIdx + 1) % newPlayers.length;
        newPlayers[nextPlayerIndex] = {
          ...newPlayers[nextPlayerIndex],
          isCurrentTurn: true,
        };
        
        const newState: GameState = {
          ...gameState,
          pile: [],
          pileCount: 0,
          minimumRequired: 1,
          specialCardPool: newSpecialPool,
          players: newPlayers,
          currentPlayerIndex: nextPlayerIndex,
          turnNumber: gameState.turnNumber + 1,
          lastAction: {
            type: 'accept_pile',
            playerId: current.id,
            timestamp: Date.now(),
          },
        };
        
        setGameState(newState);
        await syncGameState(newState);
      }
    }, thinkTime + Math.random() * 500);
    
    return () => clearTimeout(timeout);
  }, [gameState?.currentPlayerIndex, gameState?.status, syncGameState]);

  // Initialize on mount
  useEffect(() => {
    if (players.length >= 2 && !gameState) {
      initializeGame();
    }
  }, [players, initializeGame, gameState]);

  return {
    gameState,
    selectedCards,
    isMyTurn,
    myPlayer,
    currentPlayer,
    isProcessing,
    toggleCardSelection,
    selectAllOfRank,
    playCards,
    useSpecialCard,
    acceptPile,
    handleTimeout,
    canPlaySelected: selectedCards.length > 0 && 
      canPlayCards(selectedCards, gameState?.minimumRequired || 1, gameState?.pileCount || 0),
  };
}
