-- Create game_states table to store real-time game state
CREATE TABLE public.game_states (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id UUID NOT NULL UNIQUE REFERENCES public.games(id) ON DELETE CASCADE,
  pile JSONB NOT NULL DEFAULT '[]',
  pile_count INTEGER NOT NULL DEFAULT 0,
  minimum_required INTEGER NOT NULL DEFAULT 1,
  special_card_pool JSONB NOT NULL DEFAULT '[]',
  players_state JSONB NOT NULL DEFAULT '[]',
  current_player_index INTEGER NOT NULL DEFAULT 0,
  turn_number INTEGER NOT NULL DEFAULT 1,
  last_action JSONB,
  turn_started_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'in_progress',
  winner_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.game_states ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Game states are viewable by players"
ON public.game_states
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM game_players gp
    WHERE gp.game_id = game_states.game_id
    AND (gp.player_id = auth.uid() OR gp.is_bot = true)
  )
);

CREATE POLICY "Game states can be updated by players"
ON public.game_states
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM game_players gp
    WHERE gp.game_id = game_states.game_id
    AND gp.player_id = auth.uid()
  )
);

CREATE POLICY "Game states can be inserted by host"
ON public.game_states
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM games g
    WHERE g.id = game_states.game_id
    AND g.host_id = auth.uid()
  )
);

-- Trigger for updated_at
CREATE TRIGGER update_game_states_updated_at
BEFORE UPDATE ON public.game_states
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for game_states
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_states;