import { Game } from '@/hooks/useLobby';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Users, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface PublicGamesListProps {
  games: Game[];
  onJoinGame: (gameId: string) => Promise<boolean>;
  loading?: boolean;
}

export function PublicGamesList({ games, onJoinGame, loading }: PublicGamesListProps) {
  if (games.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p className="text-lg">No public games available</p>
        <p className="text-sm">Create one or wait for others to host</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {games.map((game) => {
        const playerCount = game.players?.length || 1;
        const spotsLeft = game.max_players - playerCount;

        return (
          <Card key={game.id} className="hover:border-primary transition-colors">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-primary">
                  <Users className="w-5 h-5" />
                  <span className="font-semibold">{playerCount}/{game.max_players}</span>
                </div>
                <div>
                  <p className="font-medium">{game.host?.username || 'Unknown'}'s Game</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Created {formatDistanceToNow(new Date(game.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
              <Button size="sm" onClick={() => onJoinGame(game.id)} disabled={loading || spotsLeft === 0}>
                {spotsLeft === 0 ? 'Full' : `Join (${spotsLeft} spot${spotsLeft !== 1 ? 's' : ''} left)`}
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
