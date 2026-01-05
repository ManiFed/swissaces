import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { 
  Card, 
  Suit, 
  Rank, 
  PlayerState, 
  GameState, 
  GameAction,
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
  
  // Determine which cards to remove based on player count
  // In Swiss Aces: remove some Aces/Kings based on player count
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
  // In Swiss Aces, playing X cards sets minimum to X for next player
  return cardsPlayed;
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

  // Initialize game
  const initializeGame = useCallback(() => {
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
    
    setGameState({
      id: gameId,
      status: 'in_progress',
      pile: [],
      pileCount: 0,
      minimumRequired: 1,
      specialCardPool: remainingSpecial,
      players: playerStates,
      currentPlayerIndex: 0,
      turnNumber: 1,
    });
  }, [gameId, players]);

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
      
      // Only allow selecting same rank
      if (prev.length > 0) {
        const firstCard = prev[0];
        if (!firstCard.isJoker && !card.isJoker && firstCard.rank !== card.rank) {
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

  // Play selected cards
  const playCards = useCallback(() => {
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
    
    setGameState(prev => {
      if (!prev) return prev;
      
      const newPlayers = [...prev.players];
      const currentIdx = prev.currentPlayerIndex;
      
      // Remove cards from player's hand
      const cardIds = selectedCards.map(c => c.id);
      newPlayers[currentIdx] = {
        ...newPlayers[currentIdx],
        hand: newPlayers[currentIdx].hand.filter(c => !cardIds.includes(c.id)),
        isCurrentTurn: false,
      };
      
      // Add to pile
      const newPile = [...prev.pile, ...selectedCards];
      const newPileCount = prev.pileCount + selectedCards.length;
      const newMinimum = calculateNewMinimum(selectedCards.length, prev.minimumRequired);
      
      // Check for pile overflow
      let finalPile = newPile;
      let finalPileCount = newPileCount;
      let penaltyPlayer = -1;
      
      if (newPileCount >= PILE_OVERFLOW_LIMIT) {
        // Next player takes the pile as penalty
        const nextIdx = (currentIdx + 1) % newPlayers.length;
        penaltyPlayer = nextIdx;
        newPlayers[nextIdx] = {
          ...newPlayers[nextIdx],
          hand: [...newPlayers[nextIdx].hand, ...newPile],
        };
        finalPile = [];
        finalPileCount = 0;
      }
      
      // Move to next player
      const nextPlayerIndex = (currentIdx + 1) % newPlayers.length;
      newPlayers[nextPlayerIndex] = {
        ...newPlayers[nextPlayerIndex],
        isCurrentTurn: true,
      };
      
      // Check for winner (player with no cards)
      const winner = newPlayers.find(p => p.hand.length === 0 && p.specialCards.length === 0);
      
      return {
        ...prev,
        pile: finalPile,
        pileCount: finalPileCount,
        minimumRequired: finalPileCount === 0 ? 1 : newMinimum,
        players: newPlayers,
        currentPlayerIndex: nextPlayerIndex,
        turnNumber: prev.turnNumber + 1,
        lastAction: {
          type: 'play_cards',
          playerId: newPlayers[currentIdx].id,
          cards: selectedCards,
          timestamp: Date.now(),
        },
        status: winner ? 'completed' : 'in_progress',
        winner: winner?.id,
      };
    });
    
    setSelectedCards([]);
    setIsProcessing(false);
  }, [gameState, isMyTurn, selectedCards, toast]);

  // Use special card (Ace clears pile, King resets minimum)
  const useSpecialCard = useCallback((card: Card) => {
    if (!gameState || !isMyTurn) return;
    
    setIsProcessing(true);
    
    setGameState(prev => {
      if (!prev) return prev;
      
      const newPlayers = [...prev.players];
      const currentIdx = prev.currentPlayerIndex;
      
      // Remove special card from player
      newPlayers[currentIdx] = {
        ...newPlayers[currentIdx],
        specialCards: newPlayers[currentIdx].specialCards.filter(c => c.id !== card.id),
        isCurrentTurn: false,
      };
      
      let newPile = prev.pile;
      let newPileCount = prev.pileCount;
      let newMinimum = prev.minimumRequired;
      
      // Apply special card effect
      if (card.rank === 'A' || card.isJoker) {
        // Ace or Joker clears the pile
        newPile = [];
        newPileCount = 0;
        newMinimum = 1;
      } else if (card.rank === 'K') {
        // King resets minimum to 1
        newMinimum = 1;
      }
      
      // Move to next player
      const nextPlayerIndex = (currentIdx + 1) % newPlayers.length;
      newPlayers[nextPlayerIndex] = {
        ...newPlayers[nextPlayerIndex],
        isCurrentTurn: true,
      };
      
      return {
        ...prev,
        pile: newPile,
        pileCount: newPileCount,
        minimumRequired: newMinimum,
        players: newPlayers,
        currentPlayerIndex: nextPlayerIndex,
        turnNumber: prev.turnNumber + 1,
        lastAction: {
          type: 'use_special',
          playerId: newPlayers[currentIdx].id,
          specialCard: card,
          timestamp: Date.now(),
        },
      };
    });
    
    setIsProcessing(false);
  }, [gameState, isMyTurn]);

  // Accept pile (take all cards as penalty)
  const acceptPile = useCallback(() => {
    if (!gameState || !isMyTurn) return;
    
    setIsProcessing(true);
    
    setGameState(prev => {
      if (!prev) return prev;
      
      const newPlayers = [...prev.players];
      const currentIdx = prev.currentPlayerIndex;
      
      // Add pile to player's hand
      newPlayers[currentIdx] = {
        ...newPlayers[currentIdx],
        hand: [...newPlayers[currentIdx].hand, ...prev.pile],
        isCurrentTurn: false,
      };
      
      // Draw a special card as consolation
      let newSpecialPool = [...prev.specialCardPool];
      if (newSpecialPool.length > 0) {
        const drawnCard = newSpecialPool.pop()!;
        newPlayers[currentIdx].specialCards.push(drawnCard);
      }
      
      // Move to next player
      const nextPlayerIndex = (currentIdx + 1) % newPlayers.length;
      newPlayers[nextPlayerIndex] = {
        ...newPlayers[nextPlayerIndex],
        isCurrentTurn: true,
      };
      
      return {
        ...prev,
        pile: [],
        pileCount: 0,
        minimumRequired: 1,
        specialCardPool: newSpecialPool,
        players: newPlayers,
        currentPlayerIndex: nextPlayerIndex,
        turnNumber: prev.turnNumber + 1,
        lastAction: {
          type: 'accept_pile',
          playerId: newPlayers[currentIdx].id,
          timestamp: Date.now(),
        },
      };
    });
    
    setSelectedCards([]);
    setIsProcessing(false);
  }, [gameState, isMyTurn]);

  // Bot turn logic
  useEffect(() => {
    if (!gameState || gameState.status !== 'in_progress') return;
    
    const current = gameState.players[gameState.currentPlayerIndex];
    if (!current.isBot) return;
    
    // Simulate bot thinking
    const timeout = setTimeout(() => {
      // Simple bot logic
      const grouped = groupCardsByRank(current.hand);
      
      // Find playable groups
      let bestPlay: Card[] | null = null;
      for (const [rank, cards] of grouped) {
        if (cards.length >= gameState.minimumRequired) {
          // Play minimum required
          bestPlay = cards.slice(0, gameState.minimumRequired);
          break;
        }
      }
      
      if (bestPlay) {
        // Bot plays cards
        setGameState(prev => {
          if (!prev) return prev;
          
          const newPlayers = [...prev.players];
          const currentIdx = prev.currentPlayerIndex;
          
          const cardIds = bestPlay!.map(c => c.id);
          newPlayers[currentIdx] = {
            ...newPlayers[currentIdx],
            hand: newPlayers[currentIdx].hand.filter(c => !cardIds.includes(c.id)),
            isCurrentTurn: false,
          };
          
          const newPile = [...prev.pile, ...bestPlay!];
          const newPileCount = prev.pileCount + bestPlay!.length;
          const newMinimum = calculateNewMinimum(bestPlay!.length, prev.minimumRequired);
          
          // Check for pile overflow
          let finalPile = newPile;
          let finalPileCount = newPileCount;
          
          if (newPileCount >= PILE_OVERFLOW_LIMIT) {
            const nextIdx = (currentIdx + 1) % newPlayers.length;
            newPlayers[nextIdx] = {
              ...newPlayers[nextIdx],
              hand: [...newPlayers[nextIdx].hand, ...newPile],
            };
            finalPile = [];
            finalPileCount = 0;
          }
          
          const nextPlayerIndex = (currentIdx + 1) % newPlayers.length;
          newPlayers[nextPlayerIndex] = {
            ...newPlayers[nextPlayerIndex],
            isCurrentTurn: true,
          };
          
          const winner = newPlayers.find(p => p.hand.length === 0 && p.specialCards.length === 0);
          
          return {
            ...prev,
            pile: finalPile,
            pileCount: finalPileCount,
            minimumRequired: finalPileCount === 0 ? 1 : newMinimum,
            players: newPlayers,
            currentPlayerIndex: nextPlayerIndex,
            turnNumber: prev.turnNumber + 1,
            lastAction: {
              type: 'play_cards',
              playerId: current.id,
              cards: bestPlay!,
              timestamp: Date.now(),
            },
            status: winner ? 'completed' : 'in_progress',
            winner: winner?.id,
          };
        });
      } else {
        // Bot can't play, accepts pile
        setGameState(prev => {
          if (!prev) return prev;
          
          const newPlayers = [...prev.players];
          const currentIdx = prev.currentPlayerIndex;
          
          newPlayers[currentIdx] = {
            ...newPlayers[currentIdx],
            hand: [...newPlayers[currentIdx].hand, ...prev.pile],
            isCurrentTurn: false,
          };
          
          let newSpecialPool = [...prev.specialCardPool];
          if (newSpecialPool.length > 0) {
            const drawnCard = newSpecialPool.pop()!;
            newPlayers[currentIdx].specialCards.push(drawnCard);
          }
          
          const nextPlayerIndex = (currentIdx + 1) % newPlayers.length;
          newPlayers[nextPlayerIndex] = {
            ...newPlayers[nextPlayerIndex],
            isCurrentTurn: true,
          };
          
          return {
            ...prev,
            pile: [],
            pileCount: 0,
            minimumRequired: 1,
            specialCardPool: newSpecialPool,
            players: newPlayers,
            currentPlayerIndex: nextPlayerIndex,
            turnNumber: prev.turnNumber + 1,
            lastAction: {
              type: 'accept_pile',
              playerId: current.id,
              timestamp: Date.now(),
            },
          };
        });
      }
    }, 1000 + Math.random() * 1000); // 1-2 second delay
    
    return () => clearTimeout(timeout);
  }, [gameState?.currentPlayerIndex, gameState?.status]);

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
    playCards,
    useSpecialCard,
    acceptPile,
    canPlaySelected: selectedCards.length > 0 && 
      canPlayCards(selectedCards, gameState?.minimumRequired || 1, gameState?.pileCount || 0),
  };
}
