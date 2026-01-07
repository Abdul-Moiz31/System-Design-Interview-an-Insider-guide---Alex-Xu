import { HelpCircle, CheckCircle, XCircle, Clock, TrendingUp, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function RequestInfo() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-blue-400" />
          <span className="text-sm font-semibold text-white">Understanding Requests</span>
        </div>
        <span className="text-xs text-gray-500">{isOpen ? 'Hide' : 'Show'}</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mt-4 space-y-4 overflow-hidden"
          >
            {/* What is a Request? */}
            <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
              <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                What is a Request?
              </h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Each request simulates a real API call to your server. When you click "Send Request", 
                the rate limiter checks if you've exceeded the limit. If allowed, the request proceeds. 
                If blocked, you get a 429 error.
              </p>
            </div>

            {/* Request Status */}
            <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
              <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400" />
                Request Status Explained
              </h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-sm font-medium text-green-400 mb-1">Allowed (Green)</div>
                    <p className="text-xs text-gray-400">
                      The request passed the rate limit check. Your API would process this request normally.
                      The rate limiter has tokens/quota available.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-sm font-medium text-red-400 mb-1">Blocked (Red)</div>
                    <p className="text-xs text-gray-400">
                      The request exceeded the rate limit. Your API would return a 429 error.
                      The rate limiter has no tokens/quota left. You must wait before sending more.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Request Metrics */}
            <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
              <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-400" />
                Understanding Metrics
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex items-start gap-2">
                  <span className="text-gray-500 font-mono w-20">Remaining</span>
                  <span className="text-gray-400">
                    How many requests you can still send before hitting the limit. 
                    Example: "3/5" means 3 requests left out of 5 allowed.
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-gray-500 font-mono w-20">Time</span>
                  <span className="text-gray-400">
                    How long the request took to process (response time). 
                    Lower is better. Typically 10-50ms for rate limiting checks.
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-gray-500 font-mono w-20">Progress Bar</span>
                  <span className="text-gray-400">
                    Visual indicator of remaining quota. Green = healthy, Red = near limit.
                  </span>
                </div>
              </div>
            </div>

            {/* Algorithm Behavior */}
            <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
              <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                <Clock className="w-4 h-4 text-cyan-400" />
                How to Read Algorithm Behavior
              </h3>
              <div className="text-xs text-gray-400 space-y-2">
                <p>
                  <strong className="text-white">Token Bucket:</strong> Watch tokens decrease with each request. 
                  Tokens refill over time, allowing bursts.
                </p>
                <p>
                  <strong className="text-white">Fixed Window:</strong> Requests reset at window boundaries. 
                  Watch for the edge case where 2x limit can pass!
                </p>
                <p>
                  <strong className="text-white">Sliding Window:</strong> More accurate - counts requests 
                  in a rolling window. No edge cases.
                </p>
              </div>
            </div>

            {/* Tips */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
              <div className="text-xs font-medium text-blue-400 mb-1">💡 Pro Tips</div>
              <ul className="text-xs text-gray-400 space-y-1 list-disc list-inside">
                <li>Click on any request to see detailed information</li>
                <li>Use "Auto Send" to test rate limiting under load</li>
                <li>Compare algorithms by saving performance after each test</li>
                <li>Watch the "Remaining" count decrease as you send requests</li>
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

