import { cn } from '@/lib/utils';

interface PlayingCardProps {
  suit?: 'hearts' | 'diamonds' | 'clubs' | 'spades';
  rank?: string;
  faceDown?: boolean;
  isJoker?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  selected?: boolean;
  disabled?: boolean;
  onClick?: () => void;
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
  xs: 'w-8 h-12 text-[10px]',
  sm: 'w-10 h-14 text-xs',
  md: 'w-16 h-24 text-base',
  lg: 'w-24 h-36 text-xl',
};

export function PlayingCard({ 
  suit = 'spades', 
  rank = 'A', 
  faceDown = false,
  isJoker = false,
  size = 'md',
  selected = false,
  disabled = false,
  onClick,
  className 
}: PlayingCardProps) {
  if (faceDown) {
    return (
      <div 
        className={cn(
          'rounded-lg bg-primary/20 border-2 border-primary/40',
          'flex items-center justify-center',
          'shadow-card transition-all duration-200',
          sizes[size],
          onClick && !disabled && 'cursor-pointer hover:scale-105',
          className
        )}
        onClick={!disabled ? onClick : undefined}
      >
        <div className="w-3/4 h-3/4 rounded border border-primary/30 bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
          <span className="font-serif text-primary/50 text-lg">♠♥</span>
        </div>
      </div>
    );
  }

  if (isJoker) {
    return (
      <div 
        className={cn(
          'rounded-lg bg-foreground border-2 transition-all duration-200',
          'flex flex-col justify-center items-center p-1.5',
          'shadow-card',
          sizes[size],
          selected ? 'border-primary ring-2 ring-primary/50 -translate-y-2' : 'border-border/50',
          onClick && !disabled && 'cursor-pointer hover:-translate-y-1',
          disabled && 'opacity-50 cursor-not-allowed',
          className
        )}
        onClick={!disabled ? onClick : undefined}
      >
        <span className="text-2xl">🃏</span>
        <span className="text-xs font-bold text-primary">JOKER</span>
      </div>
    );
  }

  return (
    <div 
      className={cn(
        'rounded-lg bg-foreground border-2 transition-all duration-200',
        'flex flex-col justify-between p-1.5',
        'shadow-card',
        sizes[size],
        selected ? 'border-primary ring-2 ring-primary/50 -translate-y-2' : 'border-border/50',
        onClick && !disabled && 'cursor-pointer hover:-translate-y-1',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      onClick={!disabled ? onClick : undefined}
    >
      <div className={cn('flex items-center gap-0.5', suitColors[suit])}>
        <span className="font-bold leading-none">{rank}</span>
        <span className="leading-none">{suitSymbols[suit]}</span>
      </div>
      <div className={cn('flex justify-center items-center flex-1', suitColors[suit])}>
        <span className={cn(
          size === 'xs' && 'text-lg',
          size === 'sm' && 'text-xl',
          size === 'md' && 'text-2xl',
          size === 'lg' && 'text-4xl',
        )}>{suitSymbols[suit]}</span>
      </div>
      <div className={cn('flex items-center gap-0.5 rotate-180', suitColors[suit])}>
        <span className="font-bold leading-none">{rank}</span>
        <span className="leading-none">{suitSymbols[suit]}</span>
      </div>
    </div>
  );
}
