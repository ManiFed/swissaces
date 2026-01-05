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

// Smart bot logic - returns best play or null if should pick up
function getBotPlay(
  hand: Card[], 
  minimumRequired: number, 
  pileCount: number, 
  difficulty: 'easy' | 'medium' | 'hard',
  specialCards: Card[]
): { type: 'play'; cards: Card[] } | { type: 'special'; card: Card } | { type: 'pickup' } {
  const grouped = groupCardsByRank(hand);
  const jokers = hand.filter(c => c.isJoker);
  
  // Convert to array and sort by count (ascending for strategic play)
  const groupedArray = Array.from(grouped.entries())
    .map(([rank, cards]) => ({ rank, cards, count: cards.length }))
    .sort((a, b) => a.count - b.count);
  
  // Find all playable groups
  const playableGroups = groupedArray.filter(g => g.count >= minimumRequired);
  
  // Easy bot: just plays first available
  if (difficulty === 'easy') {
    if (playableGroups.length > 0) {
      return { type: 'play', cards: playableGroups[0].cards.slice(0, minimumRequired) };
    }
    return { type: 'pickup' };
  }
  
  // Medium bot: tries to avoid picking up, uses special cards sometimes
  if (difficulty === 'medium') {
    if (playableGroups.length > 0) {
      // Play the group with exactly the minimum if possible (save extras)
      const exactMatch = playableGroups.find(g => g.count === minimumRequired);
      if (exactMatch) {
        return { type: 'play', cards: exactMatch.cards };
      }
      return { type: 'play', cards: playableGroups[0].cards.slice(0, minimumRequired) };
    }
    
    // Use special card if pile is large
    if (pileCount >= 8 && specialCards.length > 0) {
      const king = specialCards.find(c => c.rank === 'K');
      if (king) return { type: 'special', card: king };
    }
    
    return { type: 'pickup' };
  }
  
  // Hard bot: strategic play, avoids pickup at all costs
  // Strategy: 
  // 1. Try to use jokers as wildcards to meet minimum
  // 2. Consider using special cards strategically
  // 3. Play cards that set difficult minimums for opponent
  // 4. Only pick up as absolute last resort
  
  // First, check if we can play with jokers as wildcards
  if (playableGroups.length === 0 && jokers.length > 0) {
    // Find groups that could become playable with jokers
    for (const group of groupedArray) {
      const needed = minimumRequired - group.count;
      if (needed > 0 && needed <= jokers.length) {
        // Can make this playable with jokers!
        const play = [...group.cards, ...jokers.slice(0, needed)];
        return { type: 'play', cards: play };
      }
    }
  }
  
  if (playableGroups.length > 0) {
    // Strategic: play group that sets hardest minimum for opponent
    // But also consider keeping larger groups for later
    
    // If pile is getting close to overflow, play more cards to push it over
    const cardsToOverflow = PILE_OVERFLOW_LIMIT - pileCount;
    const groupThatOverflows = playableGroups.find(g => g.count >= cardsToOverflow);
    if (groupThatOverflows && cardsToOverflow <= 4) {
      // Play enough to overflow!
      return { type: 'play', cards: groupThatOverflows.cards.slice(0, Math.max(minimumRequired, cardsToOverflow)) };
    }
    
    // Otherwise, play the smallest valid group but consider setting high minimum
    // Prefer playing more cards if it sets a difficult minimum
    const bestGroup = playableGroups.reduce((best, curr) => {
      // Prefer groups of 3-4 as they set difficult minimums
      if (curr.count >= 3 && curr.count <= 4) return curr;
      if (best.count >= 3 && best.count <= 4) return best;
      return curr.count < best.count ? curr : best;
    });
    
    return { type: 'play', cards: bestGroup.cards };
  }
  
  // No playable groups - consider special cards
  // Hard bot uses specials strategically to avoid pickup
  if (specialCards.length > 0) {
    // Use King to reset minimum
    const king = specialCards.find(c => c.rank === 'K');
    if (king && minimumRequired >= 3) {
      return { type: 'special', card: king };
    }
    
    // Use Ace to clear pile if it's large
    const ace = specialCards.find(c => c.rank === 'A' && !c.isJoker);
    if (ace && pileCount >= 6) {
      return { type: 'special', card: ace };
    }
    
    // Use joker special to clear if desperate
    const jokerSpecial = specialCards.find(c => c.isJoker);
    if (jokerSpecial && pileCount >= 10) {
      return { type: 'special', card: jokerSpecial };
    }
  }
  
  // Absolutely last resort: pickup
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
      
      // Only allow selecting same rank (jokers are wild)
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

  // Handle pile overflow - returns cards to give to previous player
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
    if (newPileCount < PILE_OVERFLOW_LIMIT) {
      return { 
        finalPile: newPile, 
        finalPileCount: newPileCount, 
        updatedPlayers: players,
        cardsTransferred: 0
      };
    }
    
    // Soft overflow: excess cards go to the PREVIOUS player (who caused the overflow)
    const excessCount = newPileCount - PILE_OVERFLOW_LIMIT;
    const prevPlayerIdx = (currentPlayerIdx - 1 + players.length) % players.length;
    
    // Current player (next player) gets to give cards from their hand to prev player
    // Actually, the player who PLAYED the cards that caused overflow gives cards
    // The NEXT player gets to choose cards from their hand to give back
    
    // For simplicity: the pile resets, and the next player can give `excessCount` cards
    // to the player who overflowed
    // Since this is the current player's turn ending, they caused the overflow
    // Next player gets to give them `excessCount` cards from next player's hand
    
    // Actually let's implement it simpler:
    // If pile overflows by X, the player who caused overflow receives X random cards from pile
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
      
      // Handle pile overflow with soft limit
      const { finalPile, finalPileCount, updatedPlayers, cardsTransferred } = handlePileOverflow(
        newPileCount,
        newPile,
        newPlayers,
        currentIdx
      );
      
      // Move to next player
      const nextPlayerIndex = (currentIdx + 1) % updatedPlayers.length;
      updatedPlayers[nextPlayerIndex] = {
        ...updatedPlayers[nextPlayerIndex],
        isCurrentTurn: true,
      };
      
      // Check for winner (player with no cards)
      const winner = updatedPlayers.find(p => p.hand.length === 0 && p.specialCards.length === 0);
      
      return {
        ...prev,
        pile: finalPile,
        pileCount: finalPileCount,
        minimumRequired: finalPileCount === 0 ? 1 : newMinimum,
        players: updatedPlayers,
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

  // Bot turn logic with improved AI
  useEffect(() => {
    if (!gameState || gameState.status !== 'in_progress') return;
    
    const current = gameState.players[gameState.currentPlayerIndex];
    if (!current.isBot) return;
    
    // Simulate bot thinking (harder bots think longer)
    const thinkTime = current.botDifficulty === 'hard' ? 1500 : 
                      current.botDifficulty === 'medium' ? 1000 : 600;
    
    const timeout = setTimeout(() => {
      const botAction = getBotPlay(
        current.hand,
        gameState.minimumRequired,
        gameState.pileCount,
        current.botDifficulty || 'easy',
        current.specialCards
      );
      
      if (botAction.type === 'play') {
        const cardsToPlay = botAction.cards;
        
        setGameState(prev => {
          if (!prev) return prev;
          
          const newPlayers = [...prev.players];
          const currentIdx = prev.currentPlayerIndex;
          
          const cardIds = cardsToPlay.map(c => c.id);
          newPlayers[currentIdx] = {
            ...newPlayers[currentIdx],
            hand: newPlayers[currentIdx].hand.filter(c => !cardIds.includes(c.id)),
            isCurrentTurn: false,
          };
          
          const newPile = [...prev.pile, ...cardsToPlay];
          const newPileCount = prev.pileCount + cardsToPlay.length;
          const newMinimum = calculateNewMinimum(cardsToPlay.length, prev.minimumRequired);
          
          // Handle pile overflow with soft limit
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
          
          return {
            ...prev,
            pile: finalPile,
            pileCount: finalPileCount,
            minimumRequired: finalPileCount === 0 ? 1 : newMinimum,
            players: updatedPlayers,
            currentPlayerIndex: nextPlayerIndex,
            turnNumber: prev.turnNumber + 1,
            lastAction: {
              type: 'play_cards',
              playerId: current.id,
              cards: cardsToPlay,
              timestamp: Date.now(),
            },
            status: winner ? 'completed' : 'in_progress',
            winner: winner?.id,
          };
        });
      } else if (botAction.type === 'special') {
        const specialCard = botAction.card;
        
        setGameState(prev => {
          if (!prev) return prev;
          
          const newPlayers = [...prev.players];
          const currentIdx = prev.currentPlayerIndex;
          
          newPlayers[currentIdx] = {
            ...newPlayers[currentIdx],
            specialCards: newPlayers[currentIdx].specialCards.filter(c => c.id !== specialCard.id),
            isCurrentTurn: false,
          };
          
          let newPile = prev.pile;
          let newPileCount = prev.pileCount;
          let newMinimum = prev.minimumRequired;
          
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
              playerId: current.id,
              specialCard: specialCard,
              timestamp: Date.now(),
            },
          };
        });
      } else {
        // Bot picks up pile (last resort)
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
    }, thinkTime + Math.random() * 500);
    
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
