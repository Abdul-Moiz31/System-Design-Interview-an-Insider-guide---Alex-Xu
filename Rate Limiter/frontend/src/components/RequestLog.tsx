import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, FileText, Lightbulb, Info, AlertCircle, ArrowRight, Zap } from 'lucide-react';
import { RequestResult } from '../types';
import { useEffect, useRef } from 'react';

interface RequestLogProps {
  requests: RequestResult[];
  showDetailedLogs: boolean;
  selectedRequestId: string | null;
  onRequestClick: (id: string) => void;
  onToggleDetails: () => void;
}

export default function RequestLog({
  requests,
  showDetailedLogs,
  selectedRequestId,
  onRequestClick,
  onToggleDetails
}: RequestLogProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const prevRequestsLength = useRef(requests.length);

  // Auto-scroll to top when new request is added
  useEffect(() => {
    if (requests.length > prevRequestsLength.current && containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
    prevRequestsLength.current = requests.length;
  }, [requests.length]);
  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-gray-400" />
          <h2 className="text-lg font-semibold text-white">Request Log</h2>
          <span className="text-sm text-gray-500">({requests.length})</span>
        </div>
        <button
          onClick={onToggleDetails}
          className="text-xs text-gray-400 hover:text-white transition-colors"
        >
          {showDetailedLogs ? 'Hide Details' : 'Show Details'}
        </button>
      </div>

      {/* Request Flow Explanation */}
      {requests.length > 0 && (
        <div className="mb-4 p-3 bg-gray-800/50 rounded-lg border border-gray-700">
          <div className="flex items-start gap-2">
            <Zap className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="text-xs font-medium text-white mb-1">Request Flow</div>
              <div className="text-xs text-gray-400 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">1.</span>
                  <span>Request sent to rate limiter</span>
                </div>
                <div className="flex items-center gap-2">
                  <ArrowRight className="w-3 h-3 text-gray-600" />
                  <span className="text-gray-500">2.</span>
                  <span>Algorithm checks current state (tokens/counts)</span>
                </div>
                <div className="flex items-center gap-2">
                  <ArrowRight className="w-3 h-3 text-gray-600" />
                  <span className="text-gray-500">3.</span>
                  <span>
                    {requests[0]?.success 
                      ? 'Request allowed → API processes it' 
                      : 'Request blocked → 429 error returned'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div ref={containerRef} className="h-96 overflow-y-auto pr-2">
        <AnimatePresence initial={false}>
          {requests.length === 0 ? (
            <div className="h-full flex items-center justify-center text-gray-500">
              <div className="text-center">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No requests yet</p>
                <p className="text-xs mt-1">Click "Send Request" to start</p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {requests.map((req) => (
                <motion.div
                  key={req.id}
                  initial={{ opacity: 0, y: -10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.98 }}
                  transition={{ duration: 0.2 }}
                  onClick={() => onRequestClick(selectedRequestId === req.id ? '' : req.id)}
                  className={`p-4 rounded-lg border cursor-pointer transition-all ${
                    req.success 
                      ? 'bg-green-500/5 border-green-500/20 hover:border-green-500/40' 
                      : 'bg-red-500/5 border-red-500/20 hover:border-red-500/40'
                  } ${selectedRequestId === req.id ? 'ring-2 ring-blue-500/50' : ''}`}
                >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {req.success ? (
                      <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <div className={`font-medium ${req.success ? 'text-green-400' : 'text-red-400'}`}>
                          {req.success ? '✓ Allowed' : '✗ Blocked'}
                        </div>
                        <div className={`text-xs px-2 py-0.5 rounded ${
                          req.success 
                            ? 'bg-green-500/20 text-green-400' 
                            : 'bg-red-500/20 text-red-400'
                        }`}>
                          {req.success ? 'PASSED' : 'RATE LIMITED'}
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 font-mono mt-0.5">
                        {req.timestamp.toLocaleTimeString()} • {req.algorithm}
                        {req.algorithm.includes('/api/') && (
                          <span className="ml-2 text-cyan-400">Real API Endpoint</span>
                        )}
                      </div>
                      {showDetailedLogs && req.explanation && (
                        <div className="mt-2 p-2 bg-gray-800/50 rounded text-xs text-gray-300 flex items-start gap-2">
                          <Lightbulb className="w-3 h-3 text-amber-400 mt-0.5 flex-shrink-0" />
                          <span className="flex-1 break-words leading-relaxed">{req.explanation}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm ml-4 flex-shrink-0">
                    <div className="text-right">
                      <div className="text-gray-500 text-xs mb-1">Remaining</div>
                      <div className="font-mono text-white text-lg">{req.remaining}</div>
                      <div className="text-gray-600 text-xs">/ {req.limit}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-gray-500 text-xs mb-1">Response</div>
                      <div className="font-mono text-white">{req.responseTime}ms</div>
                      <div className={`text-xs ${req.responseTime < 20 ? 'text-green-400' : req.responseTime < 50 ? 'text-amber-400' : 'text-red-400'}`}>
                        {req.responseTime < 20 ? 'Fast' : req.responseTime < 50 ? 'Normal' : 'Slow'}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Progress bar with labels */}
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-500">Quota Usage</span>
                    <span className="text-xs text-gray-400 font-mono">
                      {req.remaining}/{req.limit} remaining
                    </span>
                  </div>
                  <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(req.remaining / req.limit) * 100}%` }}
                      className={`h-full ${
                        req.remaining / req.limit > 0.5 
                          ? 'bg-green-500' 
                          : req.remaining / req.limit > 0.2 
                            ? 'bg-amber-500' 
                            : 'bg-red-500'
                      }`}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-gray-600">0</span>
                    <span className="text-xs text-gray-600">{req.limit}</span>
                  </div>
                </div>

                {selectedRequestId === req.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 pt-4 border-t border-gray-700 space-y-3"
                  >
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-gray-500 text-xs mb-1">Current Count</div>
                        <div className="font-mono text-white">{req.currentCount ?? 'N/A'}</div>
                      </div>
                      <div>
                        <div className="text-gray-500 text-xs mb-1">Reset Time</div>
                        <div className="font-mono text-white">
                          {req.resetTime ? new Date(req.resetTime * 1000).toLocaleTimeString() : 'N/A'}
                        </div>
                      </div>
                      {req.retryAfter && (
                        <div className="col-span-2">
                          <div className="text-gray-500 text-xs mb-1 flex items-center gap-2">
                            <AlertCircle className="w-3 h-3" />
                            Retry After
                          </div>
                          <div className="font-mono text-amber-400">{req.retryAfter} seconds</div>
                        </div>
                      )}
                    </div>
                    {req.explanation && (
                      <div className="bg-gray-800/50 rounded-lg p-3">
                        <div className="text-xs font-medium text-blue-400 mb-1 flex items-center gap-2">
                          <Info className="w-3 h-3" />
                          Explanation
                        </div>
                        <div className="text-xs text-gray-300 leading-relaxed">
                          {req.explanation}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

