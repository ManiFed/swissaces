import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

export default function Game() {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
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

  return (
    <div className="min-h-screen felt-texture flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-serif gold-text mb-4">Game Starting...</h1>
        <p className="text-muted-foreground">Game ID: {gameId}</p>
        <p className="text-sm text-muted-foreground mt-4">
          Game interface coming in Phase 3
        </p>
      </div>
    </div>
  );
}
