-- Create games table for lobby and game state
CREATE TABLE public.games (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  host_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  invite_code TEXT UNIQUE,
  is_public BOOLEAN NOT NULL DEFAULT false,
  max_players INTEGER NOT NULL DEFAULT 4 CHECK (max_players >= 2 AND max_players <= 4),
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'starting', 'in_progress', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create game_players table to track who's in each game
CREATE TABLE public.game_players (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id UUID NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  player_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  is_bot BOOLEAN NOT NULL DEFAULT false,
  bot_name TEXT,
  bot_difficulty TEXT CHECK (bot_difficulty IN ('easy', 'medium', 'hard')),
  seat_position INTEGER NOT NULL CHECK (seat_position >= 0 AND seat_position <= 3),
  is_ready BOOLEAN NOT NULL DEFAULT false,
  is_host BOOLEAN NOT NULL DEFAULT false,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(game_id, seat_position),
  UNIQUE(game_id, player_id)
);

-- Enable RLS
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_players ENABLE ROW LEVEL SECURITY;

-- Games policies
CREATE POLICY "Games are viewable by everyone"
  ON public.games FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create games"
  ON public.games FOR INSERT
  WITH CHECK (auth.uid() = host_id);

CREATE POLICY "Host can update their games"
  ON public.games FOR UPDATE
  USING (auth.uid() = host_id);

CREATE POLICY "Host can delete their games"
  ON public.games FOR DELETE
  USING (auth.uid() = host_id);

-- Game players policies
CREATE POLICY "Game players are viewable by everyone"
  ON public.game_players FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can join games"
  ON public.game_players FOR INSERT
  WITH CHECK (auth.uid() = player_id OR is_bot = true);

CREATE POLICY "Players can update their own status"
  ON public.game_players FOR UPDATE
  USING (auth.uid() = player_id OR EXISTS (
    SELECT 1 FROM public.games WHERE games.id = game_players.game_id AND games.host_id = auth.uid()
  ));

CREATE POLICY "Host can remove players or players can leave"
  ON public.game_players FOR DELETE
  USING (auth.uid() = player_id OR EXISTS (
    SELECT 1 FROM public.games WHERE games.id = game_players.game_id AND games.host_id = auth.uid()
  ));

-- Enable realtime for these tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.games;
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_players;

-- Function to generate unique invite codes
CREATE OR REPLACE FUNCTION public.generate_invite_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$;