import { motion } from 'framer-motion';
import { UseCase } from '../types/use-cases';

interface UseCaseSelectorProps {
  useCases: UseCase[];
  selectedUseCase: UseCase | null;
  onUseCaseSelect: (useCase: UseCase) => void;
}

export default function UseCaseSelector({
  useCases,
  selectedUseCase,
  onUseCaseSelect
}: UseCaseSelectorProps) {
  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; border: string; text: string }> = {
      rose: { bg: 'bg-rose-500/10', border: 'border-rose-500/30', text: 'text-rose-400' },
      cyan: { bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', text: 'text-cyan-400' },
      amber: { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400' },
      lime: { bg: 'bg-lime-500/10', border: 'border-lime-500/30', text: 'text-lime-400' },
      violet: { bg: 'bg-violet-500/10', border: 'border-violet-500/30', text: 'text-violet-400' }
    };
    return colors[color] || colors.cyan;
  };

  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6">
      <h2 className="text-lg font-semibold text-white mb-4">Real-World Use Cases</h2>
      <p className="text-xs text-gray-400 mb-4">
        Select a real-world scenario to see how rate limiting works in practice
      </p>
      
      <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
        {useCases.map((useCase) => {
          const colors = getColorClasses(useCase.color);
          const isSelected = selectedUseCase?.id === useCase.id;
          const windowSeconds = Math.floor(useCase.config.windowMs / 1000);
          const windowDisplay = windowSeconds < 60 
            ? `${windowSeconds}s` 
            : windowSeconds < 3600 
              ? `${Math.floor(windowSeconds / 60)}min`
              : `${Math.floor(windowSeconds / 3600)}hr`;

          return (
            <motion.button
              key={useCase.id}
              onClick={() => onUseCaseSelect(useCase)}
              className={`w-full p-4 rounded-lg text-left transition-all border ${
                isSelected 
                  ? `${colors.bg} ${colors.border} border-2` 
                  : 'bg-gray-800/30 border-gray-700 hover:border-gray-600'
              }`}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <div className="flex items-start gap-3">
                <div className="text-2xl flex-shrink-0">{useCase.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`font-semibold text-sm ${isSelected ? colors.text : 'text-white'}`}>
                      {useCase.name}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded bg-gray-700 text-gray-400">
                      {useCase.method}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mb-2">{useCase.description}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>{useCase.config.maxRequests} req</span>
                    <span>•</span>
                    <span>{windowDisplay}</span>
                    <span>•</span>
                    <span className="font-mono">{useCase.config.algorithm.replace(/_/g, ' ')}</span>
                  </div>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

