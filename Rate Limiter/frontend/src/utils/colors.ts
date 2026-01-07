export const getColorClasses = (color: string) => {
  const colors: Record<string, { bg: string; text: string; border: string; glow: string }> = {
    violet: { 
      bg: 'bg-violet-500/10', 
      text: 'text-violet-400', 
      border: 'border-violet-500/20', 
      glow: 'glow-violet' 
    },
    cyan: { 
      bg: 'bg-cyan-500/10', 
      text: 'text-cyan-400', 
      border: 'border-cyan-500/20', 
      glow: 'glow-cyan' 
    },
    amber: { 
      bg: 'bg-amber-500/10', 
      text: 'text-amber-400', 
      border: 'border-amber-500/20', 
      glow: 'glow-amber' 
    },
    rose: { 
      bg: 'bg-rose-500/10', 
      text: 'text-rose-400', 
      border: 'border-rose-500/20', 
      glow: 'glow-rose' 
    },
    lime: { 
      bg: 'bg-lime-500/10', 
      text: 'text-lime-400', 
      border: 'border-lime-500/20', 
      glow: 'glow-lime' 
    }
  };
  return colors[color] || colors.violet;
};

