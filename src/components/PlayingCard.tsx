import { cn } from '@/lib/utils';
import { useState } from 'react';

interface PlayingCardProps {
  suit?: 'hearts' | 'diamonds' | 'clubs' | 'spades';
  rank?: string;
  faceDown?: boolean;
  isJoker?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  selected?: boolean;
  disabled?: boolean;
  draggable?: boolean;
  onClick?: () => void;
  onDragStart?: (e: React.DragEvent) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  className?: string;
}

const suitSymbols = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠',
};

const suitColors = {
  hearts: 'text-red-600',
  diamonds: 'text-red-600',
  clubs: 'text-stone-900',
  spades: 'text-stone-900',
};

const sizes = {
  xs: { card: 'w-8 h-12', rank: 'text-[8px]', center: 'text-sm' },
  sm: { card: 'w-10 h-14', rank: 'text-[10px]', center: 'text-base' },
  md: { card: 'w-14 h-20', rank: 'text-xs', center: 'text-xl' },
  lg: { card: 'w-20 h-28', rank: 'text-sm', center: 'text-2xl' },
};

export function PlayingCard({ 
  suit = 'spades', 
  rank = 'A', 
  faceDown = false,
  isJoker = false,
  size = 'md',
  selected = false,
  disabled = false,
  draggable = false,
  onClick,
  onDragStart,
  onDragEnd,
  className 
}: PlayingCardProps) {
  const [isDragging, setIsDragging] = useState(false);
  const sizeConfig = sizes[size];

  const handleDragStart = (e: React.DragEvent) => {
    if (!draggable || disabled) return;
    setIsDragging(true);
    onDragStart?.(e);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    setIsDragging(false);
    onDragEnd?.(e);
  };

  if (faceDown) {
    return (
      <div 
        className={cn(
          'rounded-lg bg-primary/20 border-2 border-primary/40',
          'flex items-center justify-center flex-shrink-0',
          'shadow-card transition-all duration-200',
          sizeConfig.card,
          onClick && !disabled && 'cursor-pointer hover:scale-105',
          className
        )}
        onClick={!disabled ? onClick : undefined}
      >
        <div className="w-3/4 h-3/4 rounded border border-primary/30 bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
          <span className="font-serif text-primary/50 text-xs">♠♥</span>
        </div>
      </div>
    );
  }

  if (isJoker) {
    return (
      <div 
        className={cn(
          'rounded-lg bg-white border-2 transition-all duration-200 flex-shrink-0',
          'flex flex-col justify-center items-center',
          'shadow-card',
          sizeConfig.card,
          selected ? 'border-primary ring-2 ring-primary/50 -translate-y-2' : 'border-stone-300',
          onClick && !disabled && 'cursor-pointer hover:-translate-y-1',
          disabled && 'opacity-50 cursor-not-allowed',
          isDragging && 'opacity-50 scale-105',
          className
        )}
        draggable={draggable && !disabled}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onClick={!disabled ? onClick : undefined}
      >
        <span className={sizeConfig.center}>🃏</span>
        <span className={cn(sizeConfig.rank, 'font-bold text-primary')}>JOKER</span>
      </div>
    );
  }

  return (
    <div 
      className={cn(
        'rounded-lg bg-white border-2 transition-all duration-200 flex-shrink-0',
        'flex flex-col justify-between p-1',
        'shadow-card',
        sizeConfig.card,
        selected ? 'border-primary ring-2 ring-primary/50 -translate-y-2' : 'border-stone-300',
        onClick && !disabled && 'cursor-pointer hover:-translate-y-1',
        disabled && 'opacity-50 cursor-not-allowed',
        isDragging && 'opacity-50 scale-105',
        className
      )}
      draggable={draggable && !disabled}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={!disabled ? onClick : undefined}
    >
      {/* Top left corner */}
      <div className={cn('flex flex-col items-start leading-none', suitColors[suit])}>
        <span className={cn(sizeConfig.rank, 'font-bold')}>{rank}</span>
        <span className={sizeConfig.rank}>{suitSymbols[suit]}</span>
      </div>
      
      {/* Center suit */}
      <div className={cn('flex justify-center items-center', suitColors[suit])}>
        <span className={sizeConfig.center}>{suitSymbols[suit]}</span>
      </div>
      
      {/* Bottom right corner (rotated) */}
      <div className={cn('flex flex-col items-end leading-none rotate-180', suitColors[suit])}>
        <span className={cn(sizeConfig.rank, 'font-bold')}>{rank}</span>
        <span className={sizeConfig.rank}>{suitSymbols[suit]}</span>
      </div>
    </div>
  );
}
