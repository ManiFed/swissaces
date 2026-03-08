import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useLobby } from '@/hooks/useLobby';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CreateGameDialog } from '@/components/lobby/CreateGameDialog';
import { JoinGameDialog } from '@/components/lobby/JoinGameDialog';
import { PublicGamesList } from '@/components/lobby/PublicGamesList';
import { WaitingRoom } from '@/components/lobby/WaitingRoom';
import { Loader2, Plus, Link, Globe, ArrowLeft } from 'lucide-react';

export default function Lobby() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const {
    publicGames, currentGame, players, loading,
    createGame, joinGame, leaveGame, toggleReady,
    addBot, removeBot, startGame,
  } = useLobby();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showJoinDialog, setShowJoinDialog] = useState(false);

  useEffect(() => {
    const code = searchParams.get('code');
    if (code && user && !currentGame) joinGame(code);
  }, [searchParams, user, currentGame]);

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (currentGame?.status === 'starting' || currentGame?.status === 'in_progress') {
      navigate(`/game/${currentGame.id}`);
    }
  }, [currentGame?.status, currentGame?.id, navigate]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (currentGame && currentGame.status === 'waiting') {
    return (
      <div className="min-h-screen bg-background py-8 px-4">
        <WaitingRoom
          game={currentGame}
          players={players}
          onLeave={leaveGame}
          onToggleReady={toggleReady}
          onAddBot={addBot}
          onRemoveBot={removeBot}
          onStartGame={startGame}
        />
      </div>
    );
  }

  const handleCreateGame = async (isPublic: boolean, maxPlayers: number) => {
    const game = await createGame(isPublic, maxPlayers);
    if (game) setShowCreateDialog(false);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <h1 className="text-2xl font-serif text-primary font-bold">Game Lobby</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Quick Actions */}
          <div className="grid md:grid-cols-2 gap-4 mb-8">
            <Card
              className="cursor-pointer hover:border-primary hover:shadow-lg transition-all"
              onClick={() => setShowCreateDialog(true)}
            >
              <CardHeader className="pb-2">
                <CardTitle className="font-serif flex items-center gap-2">
                  <Plus className="w-5 h-5 text-primary" />
                  Create Game
                </CardTitle>
                <CardDescription>Start a new game and invite friends or bots</CardDescription>
              </CardHeader>
            </Card>

            <Card
              className="cursor-pointer hover:border-primary hover:shadow-lg transition-all"
              onClick={() => setShowJoinDialog(true)}
            >
              <CardHeader className="pb-2">
                <CardTitle className="font-serif flex items-center gap-2">
                  <Link className="w-5 h-5 text-primary" />
                  Join with Code
                </CardTitle>
                <CardDescription>Enter an invite code to join a private game</CardDescription>
              </CardHeader>
            </Card>
          </div>

          {/* Public Games */}
          <Card>
            <CardHeader>
              <CardTitle className="font-serif flex items-center gap-2">
                <Globe className="w-5 h-5 text-primary" />
                Public Games
              </CardTitle>
              <CardDescription>Join an open game or wait for others to create one</CardDescription>
            </CardHeader>
            <CardContent>
              <PublicGamesList games={publicGames} onJoinGame={joinGame} loading={loading} />
            </CardContent>
          </Card>
        </div>
      </main>

      <CreateGameDialog open={showCreateDialog} onOpenChange={setShowCreateDialog} onCreateGame={handleCreateGame} loading={loading} />
      <JoinGameDialog open={showJoinDialog} onOpenChange={setShowJoinDialog} onJoinGame={joinGame} loading={loading} />
    </div>
  );
}
