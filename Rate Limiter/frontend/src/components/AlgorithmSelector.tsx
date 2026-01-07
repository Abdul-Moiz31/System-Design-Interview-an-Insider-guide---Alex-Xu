import { motion } from 'framer-motion';
import { ChevronDown, Info, CheckCircle, XCircle } from 'lucide-react';
import { Algorithm } from '../types';
import { getColorClasses } from '../utils/colors';

interface AlgorithmSelectorProps {
  algorithms: Algorithm[];
  selectedAlgorithm: Algorithm;
  showAlgorithmInfo: boolean;
  onAlgorithmSelect: (algo: Algorithm) => void;
  onToggleInfo: () => void;
}

export default function AlgorithmSelector({
  algorithms,
  selectedAlgorithm,
  showAlgorithmInfo,
  onAlgorithmSelect,
  onToggleInfo
}: AlgorithmSelectorProps) {
  const colorClasses = getColorClasses(selectedAlgorithm.color);

  return (
    <div className="space-y-4">
      <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
        <h2 className="text-sm font-semibold text-gray-300 mb-3">Select Algorithm</h2>
        
        <div className="space-y-2">
          {algorithms.map((algo) => {
            const colors = getColorClasses(algo.color);
            const isSelected = selectedAlgorithm.id === algo.id;
            
            return (
              <motion.button
                key={algo.id}
                onClick={() => onAlgorithmSelect(algo)}
                className={`w-full p-3 rounded-lg text-left transition-all ${
                  isSelected 
                    ? `${colors.bg} ${colors.border} border-2` 
                    : 'bg-gray-800/30 border border-gray-700 hover:border-gray-600'
                }`}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <div className="flex items-center gap-3">
                  <div className={colors.text}>{algo.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className={`font-medium text-sm ${isSelected ? colors.text : 'text-white'}`}>
                      {algo.name}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5 truncate">
                      {algo.usedBy.slice(0, 2).join(', ')}
                    </div>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Algorithm Details */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-lg overflow-hidden">
        <button 
          onClick={onToggleInfo}
          className="w-full p-4 text-left flex items-center justify-between hover:bg-gray-800/30 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Info className={`w-4 h-4 ${colorClasses.text}`} />
            <span className="text-sm font-medium text-white">Details</span>
          </div>
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showAlgorithmInfo ? 'rotate-180' : ''}`} />
        </button>
        
        {showAlgorithmInfo && (
          <div className="px-4 pb-4 space-y-3">
            <p className="text-xs text-gray-400 leading-relaxed">{selectedAlgorithm.description}</p>
            
            <div>
              <div className="text-xs font-medium text-green-400 mb-1.5 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                Pros
              </div>
              <ul className="text-xs text-gray-400 space-y-1">
                {selectedAlgorithm.pros.map((pro, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-green-400 mt-0.5">•</span>
                    <span>{pro}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <div className="text-xs font-medium text-red-400 mb-1.5 flex items-center gap-1">
                <XCircle className="w-3 h-3" />
                Cons
              </div>
              <ul className="text-xs text-gray-400 space-y-1">
                {selectedAlgorithm.cons.map((con, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-red-400 mt-0.5">•</span>
                    <span>{con}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

