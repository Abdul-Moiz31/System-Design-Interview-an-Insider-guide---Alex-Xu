import { motion } from 'framer-motion';
import { Zap, Play, Pause, RotateCcw, Save } from 'lucide-react';

interface RequestControlsProps {
  isConnected: boolean;
  isAutoSending: boolean;
  onSendRequest: () => void;
  onToggleAutoSend: () => void;
  onReset: () => void;
  onSavePerformance: () => void;
  canSavePerformance: boolean;
  windowMs: number;
  maxRequests: number;
  requestsPerSecond: number;
  onWindowMsChange: (value: number) => void;
  onMaxRequestsChange: (value: number) => void;
  onRequestsPerSecondChange: (value: number) => void;
}

export default function RequestControls({
  isConnected,
  isAutoSending,
  onSendRequest,
  onToggleAutoSend,
  onReset,
  onSavePerformance,
  canSavePerformance,
  windowMs,
  maxRequests,
  requestsPerSecond,
  onWindowMsChange,
  onMaxRequestsChange,
  onRequestsPerSecondChange
}: RequestControlsProps) {
  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6">
      <h2 className="text-lg font-semibold text-white mb-4">Configuration</h2>
      
      <div className="space-y-4 mb-6">
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm text-gray-400">Window Size</label>
            <span className="text-sm font-mono text-white">{windowMs / 1000}s</span>
          </div>
          <input
            type="range"
            min="1000"
            max="60000"
            step="1000"
            value={windowMs}
            onChange={(e) => onWindowMsChange(parseInt(e.target.value))}
            className="w-full accent-blue-500"
          />
        </div>
        
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm text-gray-400">Max Requests</label>
            <span className="text-sm font-mono text-white">{maxRequests}</span>
          </div>
          <input
            type="range"
            min="1"
            max="20"
            value={maxRequests}
            onChange={(e) => onMaxRequestsChange(parseInt(e.target.value))}
            className="w-full accent-blue-500"
          />
        </div>
        
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm text-gray-400">Auto-send Rate</label>
            <span className="text-sm font-mono text-white">{requestsPerSecond}/sec</span>
          </div>
          <input
            type="range"
            min="1"
            max="10"
            value={requestsPerSecond}
            onChange={(e) => onRequestsPerSecondChange(parseInt(e.target.value))}
            className="w-full accent-blue-500"
          />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <motion.button
            onClick={onSendRequest}
            disabled={!isConnected}
            className={`flex-1 px-4 py-2.5 rounded-lg font-medium flex items-center justify-center gap-2 transition-all ${
              isConnected 
                ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                : 'bg-gray-700 text-gray-500 cursor-not-allowed'
            }`}
            whileHover={isConnected ? { scale: 1.02 } : {}}
            whileTap={isConnected ? { scale: 0.98 } : {}}
          >
            <Zap className="w-4 h-4" />
            Send Request
          </motion.button>
          
          <motion.button
            onClick={onToggleAutoSend}
            disabled={!isConnected}
            className={`px-4 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-all ${
              isAutoSending 
                ? 'bg-red-600/20 text-red-400 border border-red-500/30' 
                : isConnected
                  ? 'bg-gray-800 border border-gray-700 hover:border-gray-600 text-white'
                  : 'bg-gray-700 text-gray-500 cursor-not-allowed'
            }`}
            whileHover={isConnected ? { scale: 1.02 } : {}}
            whileTap={isConnected ? { scale: 0.98 } : {}}
          >
            {isAutoSending ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {isAutoSending ? 'Stop' : 'Auto'}
          </motion.button>
          
          <motion.button
            onClick={onReset}
            className="p-2.5 rounded-lg bg-gray-800 border border-gray-700 hover:border-gray-600 text-gray-400 hover:text-white transition-all"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <RotateCcw className="w-4 h-4" />
          </motion.button>
        </div>

        {/* Save Performance Button */}
        <motion.button
          onClick={onSavePerformance}
          disabled={!canSavePerformance || !isConnected}
          className={`w-full px-4 py-2.5 rounded-lg font-medium flex items-center justify-center gap-2 transition-all ${
            canSavePerformance && isConnected
              ? 'bg-green-600/20 text-green-400 border border-green-500/30 hover:bg-green-600/30 hover:border-green-500/50' 
              : 'bg-gray-700/50 text-gray-500 border border-gray-700 cursor-not-allowed'
          }`}
          whileHover={canSavePerformance && isConnected ? { scale: 1.02 } : {}}
          whileTap={canSavePerformance && isConnected ? { scale: 0.98 } : {}}
        >
          <Save className="w-4 h-4" />
          Save Performance
        </motion.button>
        {!canSavePerformance && (
          <p className="text-xs text-gray-500 text-center">
            Send at least 1 request to save performance
          </p>
        )}
      </div>
    </div>
  );
}

