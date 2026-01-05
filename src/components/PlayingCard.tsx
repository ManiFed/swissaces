import { cn } from '@/lib/utils';

interface PlayingCardProps {
  suit?: 'hearts' | 'diamonds' | 'clubs' | 'spades';
  rank?: string;
  faceDown?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const suitSymbols = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠',
};

const suitColors = {
  hearts: 'text-suit-red',
  diamonds: 'text-suit-red',
  clubs: 'text-foreground',
  spades: 'text-foreground',
};

const sizes = {
  sm: 'w-10 h-14 text-xs',
  md: 'w-16 h-24 text-base',
  lg: 'w-24 h-36 text-xl',
};

export function PlayingCard({ 
  suit = 'spades', 
  rank = 'A', 
  faceDown = false, 
  size = 'md',
  className 
}: PlayingCardProps) {
  if (faceDown) {
    return (
      <div 
        className={cn(
          'rounded-lg bg-primary/20 border-2 border-primary/40',
          'flex items-center justify-center',
          'shadow-card',
          sizes[size],
          className
        )}
      >
        <div className="w-3/4 h-3/4 rounded border border-primary/30 bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
          <span className="font-serif text-primary/50 text-lg">♠♥</span>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={cn(
        'rounded-lg bg-foreground border border-border/50',
        'flex flex-col justify-between p-1.5',
        'shadow-card',
        sizes[size],
        className
      )}
    >
      <div className={cn('flex items-center gap-0.5', suitColors[suit])}>
        <span className="font-bold leading-none">{rank}</span>
        <span className="leading-none">{suitSymbols[suit]}</span>
      </div>
      <div className={cn('flex justify-center items-center flex-1', suitColors[suit])}>
        <span className="text-2xl">{suitSymbols[suit]}</span>
      </div>
      <div className={cn('flex items-center gap-0.5 rotate-180', suitColors[suit])}>
        <span className="font-bold leading-none">{rank}</span>
        <span className="leading-none">{suitSymbols[suit]}</span>
      </div>
    </div>
  );
}
