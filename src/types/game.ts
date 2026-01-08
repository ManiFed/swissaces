export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
export type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A';

export interface Card {
  id: string;
  suit: Suit;
  rank: Rank;
  isJoker?: boolean;
}

export interface PlayerState {
  id: string;
  name: string;
  isBot: boolean;
  botDifficulty?: 'easy' | 'medium' | 'hard';
  hand: Card[];
  specialCards: Card[]; // Aces, Kings, Jokers drawn from special pool
  isCurrentTurn: boolean;
  seatPosition: number;
  avatar?: string;
}

export interface GameState {
  id: string;
  status: 'waiting' | 'in_progress' | 'completed';
  pile: Card[];
  pileCount: number;
  minimumRequired: number; // Current minimum cards needed to play
  specialCardPool: Card[]; // Face-down pool of special cards
  players: PlayerState[];
  currentPlayerIndex: number;
  turnNumber: number;
  lastAction?: GameAction;
  winner?: string;
  // Overflow penalty state
  pendingOverflow?: {
    penaltyCount: number;
    fromPlayerId: string; // Player who caused overflow
    toPlayerId: string; // Player who must give cards
  };
}

export interface GameAction {
  type: 'play_cards' | 'use_special' | 'accept_pile' | 'pass';
  playerId: string;
  cards?: Card[];
  specialCard?: Card;
  timestamp: number;
}

// Swiss Aces specific rules
export const PILE_OVERFLOW_LIMIT = 16;
export const RANKS_ORDER: Rank[] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

export function getRankValue(rank: Rank): number {
  return RANKS_ORDER.indexOf(rank) + 2;
}

export function isSpecialCard(card: Card): boolean {
  return card.rank === 'A' || card.rank === 'K' || card.isJoker === true;
}
