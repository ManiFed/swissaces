import { Game, GamePlayer } from '@/hooks/useLobby';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { 
  Copy, 
  Check, 
  UserPlus, 
  Bot, 
  Crown, 
  X, 
  Play,
  ArrowLeft
} from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

interface WaitingRoomProps {
  game: Game;
  players: GamePlayer[];
  onLeave: () => void;
  onToggleReady: () => void;
  onAddBot: (difficulty: 'easy' | 'medium' | 'hard') => void;
  onRemoveBot: (playerId: string) => void;
  onStartGame: () => Promise<boolean>;
}

export function WaitingRoom({
  game,
  players,
  onLeave,
  onToggleReady,
  onAddBot,
  onRemoveBot,
  onStartGame,
}: WaitingRoomProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [starting, setStarting] = useState(false);

  const isHost = game.host_id === user?.id;
  const currentPlayer = players.find(p => p.player_id === user?.id);
  const allReady = players.every(p => p.is_ready);
  const canStart = isHost && allReady && players.length >= 2;

  const copyInviteCode = async () => {
    if (game.invite_code) {
      await navigator.clipboard.writeText(game.invite_code);
      setCopied(true);
      toast({ title: 'Invite code copied!' });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleStartGame = async () => {
    setStarting(true);
    await onStartGame();
    setStarting(false);
  };

  // Create player slots
  const slots = Array.from({ length: game.max_players }, (_, i) => {
    return players.find(p => p.seat_position === i) || null;
  });

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" onClick={onLeave} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Leave Game
        </Button>

        {game.invite_code && (
          <Button
            variant="outline"
            onClick={copyInviteCode}
            className="gap-2 font-mono text-lg tracking-wider"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {game.invite_code}
          </Button>
        )}
      </div>

      {/* Title */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-serif mb-2">
          {game.is_public ? 'Public Game' : 'Private Game'}
        </h2>
        <p className="text-muted-foreground">
          Waiting for {game.max_players} players...
        </p>
      </div>

      {/* Player Slots */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        {slots.map((player, index) => (
          <Card
            key={index}
            className={`bg-card/60 border-2 transition-all ${
              player 
                ? player.is_ready 
                  ? 'border-green-500/50 bg-green-500/5' 
                  : 'border-primary/30'
                : 'border-dashed border-muted-foreground/30'
            }`}
          >
            <CardContent className="p-4">
              {player ? (
                <div className="flex items-center gap-3">
                  <Avatar className="w-12 h-12">
                    <AvatarFallback className={player.is_bot ? 'bg-secondary' : 'bg-primary/20'}>
                      {player.is_bot ? (
                        <Bot className="w-6 h-6" />
                      ) : (
                        player.profile?.username?.[0]?.toUpperCase() || '?'
                      )}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">
                        {player.is_bot ? player.bot_name : player.profile?.username || 'Player'}
                      </span>
                      {player.is_host && (
                        <Crown className="w-4 h-4 text-primary shrink-0" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      {player.is_bot && (
                        <Badge variant="secondary" className="text-xs">
                          {player.bot_difficulty}
                        </Badge>
                      )}
                      <Badge 
                        variant={player.is_ready ? 'default' : 'outline'}
                        className={player.is_ready ? 'bg-green-600' : ''}
                      >
                        {player.is_ready ? 'Ready' : 'Not Ready'}
                      </Badge>
                    </div>
                  </div>

                  {isHost && player.is_bot && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onRemoveBot(player.id)}
                      className="shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center h-12 text-muted-foreground">
                  <UserPlus className="w-5 h-5 mr-2" />
                  Empty Slot
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3">
        {/* Add Bot Button (host only) */}
        {isHost && players.length < game.max_players && (
          <div className="flex gap-2 justify-center">
            <Button variant="outline" onClick={() => onAddBot('easy')} className="gap-2">
              <Bot className="w-4 h-4" /> Add Easy Bot
            </Button>
            <Button variant="outline" onClick={() => onAddBot('medium')} className="gap-2">
              <Bot className="w-4 h-4" /> Add Medium Bot
            </Button>
            <Button variant="outline" onClick={() => onAddBot('hard')} className="gap-2">
              <Bot className="w-4 h-4" /> Add Hard Bot
            </Button>
          </div>
        )}

        {/* Ready / Start Buttons */}
        <div className="flex gap-3 justify-center">
          {!isHost && (
            <Button
              size="lg"
              variant={currentPlayer?.is_ready ? 'secondary' : 'default'}
              onClick={onToggleReady}
              className="min-w-[150px]"
            >
              {currentPlayer?.is_ready ? 'Not Ready' : 'Ready Up'}
            </Button>
          )}

          {isHost && (
            <Button
              size="lg"
              onClick={handleStartGame}
              disabled={!canStart || starting}
              className="min-w-[150px] gap-2"
            >
              <Play className="w-5 h-5" />
              {starting ? 'Starting...' : 'Start Game'}
            </Button>
          )}
        </div>

        {isHost && !allReady && players.length >= 2 && (
          <p className="text-center text-sm text-muted-foreground">
            Waiting for all players to ready up...
          </p>
        )}
        {isHost && players.length < 2 && (
          <p className="text-center text-sm text-muted-foreground">
            Need at least 2 players to start
          </p>
        )}
      </div>
    </div>
  );
}
