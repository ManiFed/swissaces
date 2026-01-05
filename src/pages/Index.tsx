import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PlayingCard } from '@/components/PlayingCard';
import { Loader2, Users, Trophy, History, LogOut } from 'lucide-react';

export default function Index() {
  const navigate = useNavigate();
  const { user, loading, signOut } = useAuth();

  useEffect(() => {
    if (!user && !loading) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen felt-texture flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen felt-texture">
      {/* Header */}
      <header className="border-b border-border/30 bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">+</span>
            </div>
            <h1 className="text-2xl font-serif swiss-text">Swiss Aces</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {user.email}
            </span>
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Welcome Section */}
          <div className="text-center mb-12 animate-fade-in">
            <h2 className="text-3xl md:text-4xl font-serif mb-4 text-card-foreground">Welcome to Swiss Aces</h2>
            <p className="text-muted-foreground text-lg">
              The classic Swiss card game where timing and strategy determine victory
            </p>
          </div>

          {/* Decorative Cards */}
          <div className="flex justify-center gap-2 mb-12 animate-slide-up">
            <PlayingCard suit="spades" rank="A" size="md" className="transform -rotate-12" />
            <PlayingCard suit="hearts" rank="K" size="md" className="transform -rotate-6" />
            <PlayingCard suit="diamonds" rank="Q" size="md" />
            <PlayingCard suit="clubs" rank="J" size="md" className="transform rotate-6" />
            <PlayingCard faceDown size="md" className="transform rotate-12" />
          </div>

          {/* Action Cards */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <Card className="swiss-border bg-card backdrop-blur-sm hover:shadow-glow transition-shadow animate-slide-up" style={{ animationDelay: '0.1s' }}>
              <CardHeader>
                <CardTitle className="font-serif flex items-center gap-2 text-card-foreground">
                  <Users className="w-5 h-5 text-primary" />
                  Play Now
                </CardTitle>
                <CardDescription>
                  Start a new game or join an existing lobby
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full" size="lg" onClick={() => navigate('/lobby')}>
                  Create Private Game
                </Button>
                <Button variant="secondary" className="w-full" size="lg" onClick={() => navigate('/lobby')}>
                  Join Public Lobby
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-card backdrop-blur-sm border-border animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <CardHeader>
                <CardTitle className="font-serif flex items-center gap-2 text-card-foreground">
                  <Trophy className="w-5 h-5 text-primary" />
                  Your Stats
                </CardTitle>
                <CardDescription>
                  Track your performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-primary">0</p>
                    <p className="text-xs text-muted-foreground">Wins</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">0</p>
                    <p className="text-xs text-muted-foreground">Losses</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-muted-foreground">0</p>
                    <p className="text-xs text-muted-foreground">Played</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Match History */}
          <Card className="bg-card backdrop-blur-sm border-border animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <CardHeader>
              <CardTitle className="font-serif flex items-center gap-2 text-card-foreground">
                <History className="w-5 h-5 text-primary" />
                Recent Matches
              </CardTitle>
              <CardDescription>
                Your game history
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <p>No matches played yet</p>
                <p className="text-sm">Start a game to build your history!</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
