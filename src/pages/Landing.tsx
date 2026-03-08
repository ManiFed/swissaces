import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { PlayingCard } from '@/components/PlayingCard';
import { ArrowRight, Users, Zap, Shield } from 'lucide-react';
import { useEffect } from 'react';

export default function Landing() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (user && !loading) navigate('/home');
  }, [user, loading, navigate]);

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">+</span>
            </div>
            <span className="text-xl font-serif text-primary font-bold">Swiss Aces</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => navigate('/auth')}>Sign In</Button>
            <Button onClick={() => navigate('/auth')}>Get Started</Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="container mx-auto px-4 py-20 md:py-32">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-serif font-bold text-foreground mb-6 leading-tight">
            The Classic Swiss<br />
            <span className="text-primary">Card Game</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-xl mx-auto">
            Play the beloved Swiss card game online with friends or challenge bots. 
            Strategy, timing, and a bit of luck — all in your browser.
          </p>
          <div className="flex gap-4 justify-center mb-16">
            <Button size="lg" className="gap-2 text-lg px-8" onClick={() => navigate('/auth')}>
              Play Now <ArrowRight className="w-5 h-5" />
            </Button>
          </div>

          {/* Card fan */}
          <div className="flex justify-center items-end gap-0 mb-4">
            <PlayingCard suit="spades" rank="A" size="lg" className="transform -rotate-[20deg] -mr-3" />
            <PlayingCard suit="hearts" rank="K" size="lg" className="transform -rotate-[10deg] -mr-2 translate-y-[-8px]" />
            <PlayingCard suit="diamonds" rank="Q" size="lg" className="translate-y-[-12px]" />
            <PlayingCard suit="clubs" rank="J" size="lg" className="transform rotate-[10deg] -ml-2 translate-y-[-8px]" />
            <PlayingCard faceDown size="lg" className="transform rotate-[20deg] -ml-3" />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-border bg-muted/30">
        <div className="container mx-auto px-4 py-20">
          <h2 className="text-3xl font-serif font-bold text-center text-foreground mb-12">Why Swiss Aces?</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center p-6">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-serif font-semibold text-foreground mb-2">Multiplayer</h3>
              <p className="text-muted-foreground text-sm">
                Play with 2–4 players online in real-time. Create private games or join public lobbies.
              </p>
            </div>
            <div className="text-center p-6">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-serif font-semibold text-foreground mb-2">Smart Bots</h3>
              <p className="text-muted-foreground text-sm">
                Practice against easy, medium, or hard bots that adapt their strategy to the game state.
              </p>
            </div>
            <div className="text-center p-6">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-serif font-semibold text-foreground mb-2">Fair Play</h3>
              <p className="text-muted-foreground text-sm">
                Server-side rule enforcement ensures no cheating. Every move is validated.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-3xl font-serif font-bold text-foreground mb-4">Ready to play?</h2>
        <p className="text-muted-foreground mb-8">Create a free account and start your first game in seconds.</p>
        <Button size="lg" className="gap-2 text-lg px-8" onClick={() => navigate('/auth')}>
          Get Started <ArrowRight className="w-5 h-5" />
        </Button>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          © 2026 Swiss Aces. The classic Swiss card game, online.
        </div>
      </footer>
    </div>
  );
}
