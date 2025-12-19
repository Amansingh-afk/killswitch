import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: React.ReactNode;
  icon?: LucideIcon;
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
  iconColor?: string;
  children?: React.ReactNode;
  className?: string;
}

const AnimatedLineGraph = ({ color = 'rgba(255, 255, 255, 0.3)', id }: { color?: string; id: string }) => {
  const gradientId = useMemo(() => `lineGradient-${id}`, [id]);
  return (
    <svg
      className="absolute inset-0 w-full h-full"
      viewBox="0 0 320 160"
      preserveAspectRatio="none"
      style={{ opacity: 0.4 }}
    >
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={color} stopOpacity="0" />
          <stop offset="50%" stopColor={color} stopOpacity="0.6" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d="M 0,120 Q 40,100 80,90 T 160,80 T 240,70 T 320,60"
        fill="none"
        strokeWidth="2"
        className="animate-pulse"
        style={{ stroke: `url(#${gradientId})` }}
      />
      <path
        d="M 0,140 Q 40,120 80,110 T 160,100 T 240,90 T 320,80"
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        opacity="0.3"
        strokeDasharray="5,5"
        className="animate-dash"
      />
    </svg>
  );
};

const AnimatedBarChart = ({ color = 'rgba(255, 255, 255, 0.3)' }: { color?: string }) => {
  const bars = [20, 60, 100, 140, 180, 220, 260, 300];
  return (
    <svg
      className="absolute inset-0 w-full h-full"
      viewBox="0 0 320 160"
      preserveAspectRatio="none"
      style={{ opacity: 0.3 }}
    >
      {bars.map((x, i) => {
        const height = 40 + Math.sin(i) * 20 + 30;
        const delay = i * 0.2;
        return (
          <rect
            key={i}
            x={x}
            y={160 - height}
            width="30"
            height={height}
            fill={color}
            className="animate-barGrow"
            style={{
              animationDelay: `${delay}s`,
            }}
          />
        );
      })}
    </svg>
  );
};

const AnimatedWavePattern = ({ color = 'rgba(255, 255, 255, 0.2)' }: { color?: string }) => (
  <svg
    className="absolute inset-0 w-full h-full"
    viewBox="0 0 320 160"
    preserveAspectRatio="none"
    style={{ opacity: 0.3 }}
  >
    <path
      d="M 0,80 Q 80,40 160,80 T 320,80"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeDasharray="10,5"
      className="animate-wave"
    />
    <path
      d="M 0,100 Q 80,60 160,100 T 320,100"
      fill="none"
      stroke={color}
      strokeWidth="1.5"
      strokeDasharray="8,4"
      className="animate-wave"
      style={{ animationDirection: 'reverse', animationDuration: '5s' }}
    />
  </svg>
);

const AnimatedDotsPattern = ({ color = 'rgba(255, 255, 255, 0.3)' }: { color?: string }) => (
  <div className="absolute inset-0" style={{ opacity: 0.2 }}>
    {Array.from({ length: 20 }).map((_, i) => {
      const x = (i % 5) * 20 + 10;
      const y = Math.floor(i / 5) * 20 + 10;
      const delay = i * 0.1;
      return (
        <div
          key={i}
          className="absolute rounded-full animate-dotPulse"
          style={{
            left: `${x}%`,
            top: `${y}%`,
            width: '4px',
            height: '4px',
            backgroundColor: color,
            animationDelay: `${delay}s`,
          }}
        />
      );
    })}
  </div>
);

const AnimatedGridPattern = ({ color = 'rgba(255, 255, 255, 0.1)', id }: { color?: string; id: string }) => {
  const patternId = useMemo(() => `grid-${id}`, [id]);
  return (
    <svg
      className="absolute inset-0 w-full h-full"
      viewBox="0 0 320 160"
      preserveAspectRatio="none"
      style={{ opacity: 0.2 }}
    >
      <defs>
        <pattern id={patternId} width="20" height="20" patternUnits="userSpaceOnUse">
          <path
            d="M 20 0 L 0 0 0 20"
            fill="none"
            stroke={color}
            strokeWidth="1"
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${patternId})`} />
    </svg>
  );
};

export function StatCard({
  title,
  value,
  icon: Icon,
  variant = 'primary',
  iconColor = 'text-white',
  children,
  className,
}: StatCardProps) {
  const cardId = useMemo(() => `stat-card-${Math.random().toString(36).substr(2, 9)}`, []);

  const variantStyles = useMemo(() => {
    const baseStyles = {
      patternColor: 'rgba(255, 255, 255, 0.4)',
    };

    const blackBase = 'oklch(0 0 0)';
    const darkGray = 'oklch(0.15 0 0)';
    
    switch (variant) {
      case 'primary':
        return {
          ...baseStyles,
          gradientStyle: {
            background: `linear-gradient(135deg, 
              ${blackBase} 0%,
              ${darkGray} 50%,
              ${blackBase} 100%)`,
          },
        };
      case 'success':
        return {
          ...baseStyles,
          gradientStyle: {
            background: `linear-gradient(135deg, 
              ${blackBase} 0%,
              ${darkGray} 50%,
              ${blackBase} 100%)`,
          },
        };
      case 'warning':
        return {
          ...baseStyles,
          gradientStyle: {
            background: `linear-gradient(135deg, 
              ${blackBase} 0%,
              ${darkGray} 50%,
              ${blackBase} 100%)`,
          },
        };
      case 'danger':
        return {
          ...baseStyles,
          gradientStyle: {
            background: `linear-gradient(135deg, 
              ${blackBase} 0%,
              ${darkGray} 50%,
              ${blackBase} 100%)`,
          },
        };
      case 'info':
        return {
          ...baseStyles,
          gradientStyle: {
            background: `linear-gradient(135deg, 
              ${blackBase} 0%,
              ${darkGray} 50%,
              ${blackBase} 100%)`,
          },
        };
      default:
        return {
          ...baseStyles,
          gradientStyle: {
            background: `linear-gradient(135deg, 
              ${blackBase} 0%,
              ${darkGray} 50%,
              ${blackBase} 100%)`,
          },
        };
    }
  }, [variant]);

  const patternColor = variantStyles.patternColor;

  return (
    <div className={cn(
      "relative flex w-full flex-col rounded-xl bg-card border border-border text-card-foreground shadow-md hover:shadow-lg transition-shadow",
      className
    )}>
      {/* Gradient Header with Animated Patterns */}
      <div
        className="relative mx-4 -mt-6 h-40 overflow-hidden rounded-xl bg-clip-border text-white shadow-lg"
        style={variantStyles.gradientStyle}
      >
        {/* Animated Background Patterns - Multiple layers for depth */}
        <AnimatedGridPattern color={patternColor} id={cardId} />
        <AnimatedLineGraph color={patternColor} id={cardId} />
        <AnimatedBarChart color={patternColor} />
        <AnimatedWavePattern color={patternColor} />
        <AnimatedDotsPattern color={patternColor} />
        
        {/* Icon with floating animation */}
        {Icon && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <Icon className={cn("h-16 w-16 opacity-30 animate-float", iconColor)} />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-6">
        <h5 className="mb-2 block text-xl font-semibold leading-snug tracking-normal text-card-foreground antialiased">
          {value}
        </h5>
        <p className="block text-base font-light leading-relaxed text-muted-foreground antialiased">
          {title}
        </p>
        {children && (
          <div className="mt-4">
            {children}
          </div>
        )}
      </div>
    </div>
  );
}
