import React from 'react';
import { cn } from '@/lib/utils';

interface LoaderProps {
  text?: string;
  className?: string;
}

export function Loader({ text = 'Optimizing', className }: LoaderProps) {
  const letters = text.split('');

  return (
    <div className={cn('loader-wrapper', className)}>
      {letters.map((letter, index) => (
        <span key={index} className="loader-letter">
          {letter}
        </span>
      ))}
      <div className="loader"></div>
    </div>
  );
}

