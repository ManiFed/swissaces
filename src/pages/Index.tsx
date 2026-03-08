import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Users, Trophy, History, LogOut, Plus, Globe, Swords } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';

export default function Index() {
  const navigate = useNavigate();
  const { user, loading, signOut } = useAuth();
  const [stats, setStats] = useState({ wins: 0, losses: 0, played: 0 });
  const [username, setUsername] = useState('');

  useEffect(() => {
    if (!user && !loading) navigate('/auth');
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('username, wins, losses, games_played')
        .eq('id', user.id)
        .single();
      if (data) {
        setUsername(data.username);
        setStats({ wins: data.wins, losses: data.losses, played: data.games_played });
      }
    };
    fetchProfile();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  const winRate = stats.played > 0 ? Math.round((stats.wins / stats.played) * 100) : 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center shadow-sm">
              <span className="text-primary-foreground font-bold text-xl font-serif">♠</span>
            </div>
            <h1 className="text-xl font-serif text-foreground font-bold tracking-tight">Swiss Aces</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground hidden sm:block">{username || user.email}</span>
            <Button variant="ghost" size="sm" onClick={signOut} className="text-muted-foreground">
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="container mx-auto px-6 py-10">
        <div className="max-w-4xl mx-auto">
          {/* Welcome */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-10"
          >
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-2">
              Welcome back{username ? `, ${username}` : ''}
            </h2>
            <p className="text-muted-foreground text-lg">Ready for another round?</p>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10"
          >
            <button
              onClick={() => navigate('/lobby')}
              className="group flex items-center gap-4 p-5 rounded-2xl border border-primary/20 bg-primary/5 hover:bg-primary/10 hover:border-primary/40 transition-all duration-200 text-left"
            >
              <div className="w-12 h-12 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shrink-0 shadow-md shadow-primary/20 group-hover:shadow-lg group-hover:shadow-primary/30 transition-shadow">
                <Plus className="w-6 h-6" />
              </div>
              <div>
                <p className="font-semibold text-foreground">New Game</p>
                <p className="text-sm text-muted-foreground">Create a private game</p>
              </div>
            </button>

            <button
              onClick={() => navigate('/lobby')}
              className="group flex items-center gap-4 p-5 rounded-2xl border border-border hover:border-primary/30 hover:shadow-md transition-all duration-200 text-left"
            >
              <div className="w-12 h-12 rounded-xl bg-muted text-foreground flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
                <Globe className="w-6 h-6" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Public Lobby</p>
                <p className="text-sm text-muted-foreground">Join open games</p>
              </div>
            </button>

            <button
              onClick={() => navigate('/lobby')}
              className="group flex items-center gap-4 p-5 rounded-2xl border border-border hover:border-primary/30 hover:shadow-md transition-all duration-200 text-left"
            >
              <div className="w-12 h-12 rounded-xl bg-muted text-foreground flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
                <Swords className="w-6 h-6" />
              </div>
              <div>
                <p className="font-semibold text-foreground">vs Bots</p>
                <p className="text-sm text-muted-foreground">Practice mode</p>
              </div>
            </button>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="grid md:grid-cols-2 gap-6 mb-8"
          >
            <Card className="overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle className="font-serif flex items-center gap-2 text-lg">
                  <Trophy className="w-5 h-5 text-primary" />
                  Your Stats
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-primary font-serif">{stats.wins}</p>
                    <p className="text-xs text-muted-foreground mt-1">Wins</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-foreground font-serif">{stats.losses}</p>
                    <p className="text-xs text-muted-foreground mt-1">Losses</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-muted-foreground font-serif">{stats.played}</p>
                    <p className="text-xs text-muted-foreground mt-1">Played</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-primary font-serif">{winRate}%</p>
                    <p className="text-xs text-muted-foreground mt-1">Win Rate</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="font-serif flex items-center gap-2 text-lg">
                  <History className="w-5 h-5 text-primary" />
                  Recent Matches
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-6 text-muted-foreground">
                  <p className="text-sm">No matches played yet.</p>
                  <p className="text-xs mt-1">Start a game to build your history!</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
