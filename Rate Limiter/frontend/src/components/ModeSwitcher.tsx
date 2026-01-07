import { Code, Globe } from 'lucide-react';

interface ModeSwitcherProps {
  mode: 'algorithms' | 'use-cases';
  onModeChange: (mode: 'algorithms' | 'use-cases') => void;
}

export default function ModeSwitcher({ mode, onModeChange }: ModeSwitcherProps) {
  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-1 flex gap-1">
      <button
        onClick={() => onModeChange('algorithms')}
        className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2 ${
          mode === 'algorithms'
            ? 'bg-blue-600 text-white'
            : 'text-gray-400 hover:text-white'
        }`}
      >
        <Code className="w-4 h-4" />
        Algorithm Testing
      </button>
      <button
        onClick={() => onModeChange('use-cases')}
        className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2 ${
          mode === 'use-cases'
            ? 'bg-blue-600 text-white'
            : 'text-gray-400 hover:text-white'
        }`}
      >
        <Globe className="w-4 h-4" />
        Real-World Use Cases
      </button>
    </div>
  );
}

