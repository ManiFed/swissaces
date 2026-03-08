import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { PlayingCard } from '@/components/PlayingCard';
import { ArrowRight, Users, Zap, Shield, Sparkles } from 'lucide-react';
import { useEffect } from 'react';
import { motion } from 'framer-motion';

export default function Landing() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (user && !loading) navigate('/home');
  }, [user, loading, navigate]);

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center shadow-md">
              <span className="text-primary-foreground font-bold text-xl font-serif">♠</span>
            </div>
            <span className="text-xl font-serif text-foreground font-bold tracking-tight">Swiss Aces</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('/auth')}>Sign In</Button>
            <Button size="sm" onClick={() => navigate('/auth')} className="shadow-md">Get Started</Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-20 md:pt-44 md:pb-32">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-[10%] w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-[10%] w-96 h-96 bg-primary/3 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-6 relative">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-primary text-sm font-medium mb-8">
                <Sparkles className="w-4 h-4" />
                Now in open beta
              </div>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="text-5xl sm:text-6xl md:text-8xl font-serif font-bold text-foreground mb-6 leading-[0.95] tracking-tight"
            >
              Play the Classic
              <br />
              <span className="text-primary">Swiss Card Game</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.25 }}
              className="text-lg md:text-xl text-muted-foreground mb-10 max-w-lg mx-auto leading-relaxed"
            >
              Strategy, timing, and a bit of luck — challenge friends 
              or smart bots, all in your browser.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.35 }}
              className="flex flex-col sm:flex-row gap-4 justify-center mb-20"
            >
              <Button size="lg" className="gap-2 text-base px-8 h-12 shadow-lg shadow-primary/20" onClick={() => navigate('/auth')}>
                Play Now <ArrowRight className="w-5 h-5" />
              </Button>
              <Button variant="outline" size="lg" className="gap-2 text-base px-8 h-12" onClick={() => {
                document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
              }}>
                Learn More
              </Button>
            </motion.div>

            {/* Card fan — dramatic spread */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="flex justify-center items-end gap-0 perspective-[800px]"
            >
              <div className="transform -rotate-[25deg] -mr-4 translate-y-4 hover:-translate-y-2 transition-transform duration-300">
                <PlayingCard suit="spades" rank="A" size="lg" />
              </div>
              <div className="transform -rotate-[12deg] -mr-3 translate-y-1 hover:-translate-y-3 transition-transform duration-300 delay-75">
                <PlayingCard suit="hearts" rank="K" size="lg" />
              </div>
              <div className="transform hover:-translate-y-4 transition-transform duration-300 delay-100 z-10">
                <PlayingCard suit="diamonds" rank="Q" size="lg" />
              </div>
              <div className="transform rotate-[12deg] -ml-3 translate-y-1 hover:-translate-y-3 transition-transform duration-300 delay-75">
                <PlayingCard suit="clubs" rank="J" size="lg" />
              </div>
              <div className="transform rotate-[25deg] -ml-4 translate-y-4 hover:-translate-y-2 transition-transform duration-300">
                <PlayingCard faceDown size="lg" />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="relative py-24 md:py-32">
        <div className="absolute inset-0 bg-muted/40" />
        <div className="container mx-auto px-6 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-serif font-bold text-foreground mb-4">
              Why Swiss Aces?
            </h2>
            <p className="text-muted-foreground text-lg max-w-md mx-auto">
              Everything you need for the perfect game night, digitized.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              {
                icon: Users,
                title: 'Real-Time Multiplayer',
                description: 'Play with 2–4 players online. Create private games with invite codes or jump into public lobbies.',
                delay: 0,
              },
              {
                icon: Zap,
                title: 'Adaptive AI Bots',
                description: 'Practice against intelligent bots with three difficulty levels that adapt their strategy mid-game.',
                delay: 0.1,
              },
              {
                icon: Shield,
                title: 'Server-Side Fair Play',
                description: 'Every move is validated server-side. No cheating, no exploits — pure strategy wins.',
                delay: 0.2,
              },
            ].map((feature) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: feature.delay }}
                className="group bg-card border border-border rounded-2xl p-8 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300"
              >
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-5 group-hover:bg-primary/15 transition-colors">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-serif font-semibold text-foreground mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 md:py-32">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-serif font-bold text-foreground mb-4">
              Start playing in seconds
            </h2>
          </motion.div>

          <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-12 max-w-3xl mx-auto">
            {[
              { step: '1', label: 'Create an account' },
              { step: '2', label: 'Create or join a game' },
              { step: '3', label: 'Play and win!' },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.15 }}
                className="flex items-center gap-4"
              >
                <div className="w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-serif font-bold shrink-0 shadow-lg shadow-primary/20">
                  {item.step}
                </div>
                <span className="text-lg font-medium text-foreground">{item.label}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 md:py-32 relative">
        <div className="absolute inset-0 bg-primary" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20viewBox%3D%220%200%20100%20100%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cfilter%20id%3D%22noise%22%3E%3CfeTurbulence%20type%3D%22fractalNoise%22%20baseFrequency%3D%220.8%22%20numOctaves%3D%224%22%20stitchTiles%3D%22stitch%22%2F%3E%3C%2Ffilter%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20filter%3D%22url(%23noise)%22%2F%3E%3C%2Fsvg%3E')] opacity-5" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="container mx-auto px-6 text-center relative"
        >
          <h2 className="text-3xl md:text-5xl font-serif font-bold text-primary-foreground mb-4">
            Ready to deal?
          </h2>
          <p className="text-primary-foreground/80 text-lg mb-10 max-w-md mx-auto">
            Create a free account and start your first game in under a minute.
          </p>
          <Button
            size="lg"
            variant="secondary"
            className="gap-2 text-base px-10 h-13 text-primary font-semibold shadow-xl hover:shadow-2xl transition-shadow"
            onClick={() => navigate('/auth')}
          >
            Get Started Free <ArrowRight className="w-5 h-5" />
          </Button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-10">
        <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-primary rounded-md flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm font-serif">♠</span>
            </div>
            <span className="font-serif font-bold text-foreground">Swiss Aces</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2026 Swiss Aces. The classic Swiss card game, online.
          </p>
        </div>
      </footer>
    </div>
  );
}
