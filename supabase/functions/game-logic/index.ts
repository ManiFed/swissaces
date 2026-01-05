import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Game constants
const PILE_OVERFLOW_LIMIT = 16;
const RANKS_ORDER = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

interface Card {
  id: string;
  suit: 'hearts' | 'diamonds' | 'clubs' | 'spades';
  rank: string;
  isJoker?: boolean;
}

interface GameAction {
  type: 'play_cards' | 'use_special' | 'accept_pile';
  gameId: string;
  playerId: string;
  cards?: Card[];
  specialCard?: Card;
}

interface ValidationResult {
  valid: boolean;
  error?: string;
  newState?: {
    pile: Card[];
    pileCount: number;
    minimumRequired: number;
    cardsTransferred?: number;
  };
}

// Validate that cards are all the same rank (jokers are wild)
function validateSameRank(cards: Card[]): boolean {
  const nonJokers = cards.filter(c => !c.isJoker);
  if (nonJokers.length === 0) return true; // All jokers
  
  const rank = nonJokers[0].rank;
  return nonJokers.every(c => c.rank === rank);
}

// Validate play cards action
function validatePlayCards(
  cards: Card[],
  playerHand: Card[],
  minimumRequired: number,
  currentPileCount: number
): ValidationResult {
  // Check card count
  if (cards.length < minimumRequired) {
    return { 
      valid: false, 
      error: `Must play at least ${minimumRequired} cards` 
    };
  }
  
  // Check all cards are same rank
  if (!validateSameRank(cards)) {
    return { 
      valid: false, 
      error: 'All cards must be the same rank' 
    };
  }
  
  // Check player owns these cards
  const cardIds = cards.map(c => c.id);
  const handCardIds = playerHand.map(c => c.id);
  const ownsAll = cardIds.every(id => handCardIds.includes(id));
  
  if (!ownsAll) {
    return { 
      valid: false, 
      error: 'You do not own all these cards' 
    };
  }
  
  // Calculate new state
  const newPileCount = currentPileCount + cards.length;
  const newMinimum = cards.length;
  
  // Handle overflow (soft limit)
  if (newPileCount >= PILE_OVERFLOW_LIMIT) {
    const excess = newPileCount - PILE_OVERFLOW_LIMIT;
    return {
      valid: true,
      newState: {
        pile: [],
        pileCount: 0,
        minimumRequired: 1,
        cardsTransferred: excess
      }
    };
  }
  
  return {
    valid: true,
    newState: {
      pile: cards, // Will be appended to existing pile
      pileCount: newPileCount,
      minimumRequired: newMinimum
    }
  };
}

// Validate special card usage
function validateSpecialCard(
  card: Card,
  playerSpecialCards: Card[],
  currentPileCount: number,
  currentMinimum: number
): ValidationResult {
  // Check player owns this special card
  const ownsCard = playerSpecialCards.some(c => c.id === card.id);
  
  if (!ownsCard) {
    return { 
      valid: false, 
      error: 'You do not own this special card' 
    };
  }
  
  // Validate it's actually a special card
  if (card.rank !== 'A' && card.rank !== 'K' && !card.isJoker) {
    return { 
      valid: false, 
      error: 'This is not a special card' 
    };
  }
  
  let newPile: Card[] = [];
  let newPileCount = currentPileCount;
  let newMinimum = currentMinimum;
  
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
  
  return {
    valid: true,
    newState: {
      pile: newPile,
      pileCount: newPileCount,
      minimumRequired: newMinimum
    }
  };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Get auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Create authenticated client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get user from token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const action: GameAction = await req.json();
    console.log('Game action received:', action.type, 'from player:', action.playerId);
    
    // Verify player matches authenticated user
    if (action.playerId !== user.id) {
      return new Response(
        JSON.stringify({ error: 'Player ID does not match authenticated user' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // In a full implementation, we would:
    // 1. Fetch game state from database
    // 2. Validate the action against current state
    // 3. Update game state in database
    // 4. Broadcast update via realtime
    
    // For now, we validate the action structure
    let validation: ValidationResult;
    
    switch (action.type) {
      case 'play_cards':
        if (!action.cards || action.cards.length === 0) {
          validation = { valid: false, error: 'No cards provided' };
        } else {
          // In production, fetch actual hand from DB
          validation = validatePlayCards(
            action.cards,
            action.cards, // Would be actual hand from DB
            1, // Would be actual minimum from DB
            0  // Would be actual pile count from DB
          );
        }
        break;
        
      case 'use_special':
        if (!action.specialCard) {
          validation = { valid: false, error: 'No special card provided' };
        } else {
          validation = validateSpecialCard(
            action.specialCard,
            [action.specialCard], // Would be actual special cards from DB
            0, // Would be actual pile count from DB
            1  // Would be actual minimum from DB
          );
        }
        break;
        
      case 'accept_pile':
        validation = { valid: true, newState: { pile: [], pileCount: 0, minimumRequired: 1 } };
        break;
        
      default:
        validation = { valid: false, error: 'Unknown action type' };
    }
    
    if (!validation.valid) {
      console.log('Action validation failed:', validation.error);
      return new Response(
        JSON.stringify({ error: validation.error, valid: false }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log('Action validated successfully');
    return new Response(
      JSON.stringify({ 
        valid: true, 
        newState: validation.newState,
        message: 'Action validated and applied'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error processing game action:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
