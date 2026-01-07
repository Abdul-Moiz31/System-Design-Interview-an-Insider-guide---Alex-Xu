import { TrendingUp, BarChart3, X, Award } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Stats, SavedPerformance } from '../types';
import { algorithms } from '../constants/algorithms';
import { getColorClasses } from '../utils/colors';

interface StatisticsProps {
  stats: Stats | null;
  selectedAlgorithmId: string;
  savedPerformances: SavedPerformance[];
  onAlgorithmSelect: (id: string) => void;
  onRemoveSavedPerformance: (algorithmId: string) => void;
}

export default function Statistics({ 
  stats, 
  selectedAlgorithmId, 
  savedPerformances,
  onAlgorithmSelect,
  onRemoveSavedPerformance 
}: StatisticsProps) {
  // Always show the component, even if stats are null
  const displayStats = stats || {
    totalRequests: 0,
    allowedRequests: 0,
    blockedRequests: 0,
    uniqueKeys: 0,
    requestsByAlgorithm: {}
  };

  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-400" />
          <h2 className="text-lg font-semibold text-white">Overall Statistics</h2>
        </div>
        {!stats && (
          <span className="text-xs text-gray-500 animate-pulse">Loading...</span>
        )}
        {stats && displayStats.totalRequests > 0 && (
          <span className="text-xs text-green-400 font-medium">
            {displayStats.totalRequests} request{displayStats.totalRequests !== 1 ? 's' : ''} processed
          </span>
        )}
      </div>

      {/* Overall Stats - Always Visible */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-gray-800/80 to-gray-800/40 rounded-lg p-5 border border-gray-700 hover:border-blue-500/50 transition-all shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs text-gray-400 font-medium uppercase tracking-wide">Total</div>
            <TrendingUp className="w-4 h-4 text-gray-500" />
          </div>
          <div className="text-4xl font-bold text-white font-mono mb-1">
            {displayStats.totalRequests}
          </div>
          <div className="text-xs text-gray-500">Requests</div>
        </div>
        <div className="bg-gradient-to-br from-green-500/10 to-green-500/5 rounded-lg p-5 border border-green-500/30 hover:border-green-500/50 transition-all shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs text-green-400 font-medium uppercase tracking-wide">Allowed</div>
            <div className="w-2 h-2 rounded-full bg-green-400"></div>
          </div>
          <div className="text-4xl font-bold text-green-400 font-mono mb-1">
            {displayStats.allowedRequests}
          </div>
          <div className="text-xs text-gray-500">
            {displayStats.totalRequests > 0 
              ? `${Math.round((displayStats.allowedRequests / displayStats.totalRequests) * 100)}% of total`
              : 'No requests'}
          </div>
        </div>
        <div className="bg-gradient-to-br from-red-500/10 to-red-500/5 rounded-lg p-5 border border-red-500/30 hover:border-red-500/50 transition-all shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs text-red-400 font-medium uppercase tracking-wide">Blocked</div>
            <div className="w-2 h-2 rounded-full bg-red-400"></div>
          </div>
          <div className="text-4xl font-bold text-red-400 font-mono mb-1">
            {displayStats.blockedRequests}
          </div>
          <div className="text-xs text-gray-500">
            {displayStats.totalRequests > 0 
              ? `${Math.round((displayStats.blockedRequests / displayStats.totalRequests) * 100)}% of total`
              : 'No requests'}
          </div>
        </div>
        <div className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 rounded-lg p-5 border border-blue-500/30 hover:border-blue-500/50 transition-all shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs text-blue-400 font-medium uppercase tracking-wide">Success</div>
            <div className="w-2 h-2 rounded-full bg-blue-400"></div>
          </div>
          <div className="text-4xl font-bold text-blue-400 font-mono mb-1">
            {displayStats.totalRequests 
              ? Math.round((displayStats.allowedRequests / displayStats.totalRequests) * 100) 
              : 0}%
          </div>
          <div className="text-xs text-gray-500">Success Rate</div>
        </div>
      </div>

      {/* Algorithm Performance */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-gray-400" />
            <h3 className="text-sm font-semibold text-gray-300">Algorithm Performance</h3>
          </div>
          {displayStats.totalRequests === 0 && (
            <span className="text-xs text-gray-500">No requests yet - send requests to see performance</span>
          )}
        </div>
        
        {displayStats.totalRequests === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No algorithm statistics available</p>
            <p className="text-xs mt-1">Start sending requests to see performance metrics</p>
          </div>
        ) : (
          <div className="space-y-3">
            {algorithms.map((algo) => {
              const algoStats = displayStats.requestsByAlgorithm[algo.id];
              const colors = getColorClasses(algo.color);
              const total = algoStats?.total ?? 0;
              const allowed = algoStats?.allowed ?? 0;
              const blocked = algoStats?.blocked ?? 0;
              const successRate = total ? Math.round((allowed / total) * 100) : 0;
              const isSelected = selectedAlgorithmId === algo.id;

              if (total === 0) return null;

            return (
              <motion.div
                key={algo.id}
                onClick={() => onAlgorithmSelect(algo.id)}
                className={`p-4 rounded-lg border cursor-pointer transition-all ${
                  isSelected 
                    ? `${colors.border} border-2 bg-gray-800/50` 
                    : 'border-gray-700 bg-gray-800/30 hover:border-gray-600'
                }`}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={colors.text}>{algo.icon}</div>
                    <div>
                      <div className={`font-medium ${isSelected ? colors.text : 'text-white'}`}>
                        {algo.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {total} total • {allowed} allowed • {blocked} blocked
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold font-mono text-white">{successRate}%</div>
                    <div className="text-xs text-gray-500">success</div>
                  </div>
                </div>
                
                {/* Progress bars */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="text-xs text-gray-500 w-16">Allowed</div>
                    <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${successRate}%` }}
                        className="h-full bg-green-500"
                      />
                    </div>
                    <div className="text-xs text-gray-400 w-12 text-right">{allowed}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-xs text-gray-500 w-16">Blocked</div>
                    <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${100 - successRate}%` }}
                        className="h-full bg-red-500"
                      />
                    </div>
                    <div className="text-xs text-gray-400 w-12 text-right">{blocked}</div>
                  </div>
                </div>
              </motion.div>
            );
          })}
          </div>
        )}
      </div>

      {/* Insights */}
      {displayStats.totalRequests > 10 && (
        <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <div className="text-sm font-medium text-blue-400 mb-2">Insights</div>
          <div className="text-xs text-gray-400 space-y-1">
            {(() => {
              const blockRate = displayStats.totalRequests 
                ? Math.round((displayStats.blockedRequests / displayStats.totalRequests) * 100) 
                : 0;
              
              if (blockRate > 30) {
                return 'High block rate detected. Consider adjusting rate limits or algorithm selection.';
              }
              if (blockRate === 0 && displayStats.totalRequests > 5) {
                return 'All requests are being allowed. Rate limits may be too permissive.';
              }
              return 'Rate limiting is working as expected.';
            })()}
          </div>
        </div>
      )}

      {/* Saved Performance Comparison */}
      {savedPerformances.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-semibold text-gray-300">Saved Performance Comparison</h3>
            </div>
            <span className="text-xs text-gray-500">
              {savedPerformances.length} algorithm{savedPerformances.length !== 1 ? 's' : ''} saved
            </span>
          </div>

          {/* Comparison Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-2 text-gray-400 font-semibold">Algorithm</th>
                  <th className="text-right py-2 text-gray-400 font-semibold">Requests</th>
                  <th className="text-right py-2 text-gray-400 font-semibold">Allowed</th>
                  <th className="text-right py-2 text-gray-400 font-semibold">Blocked</th>
                  <th className="text-right py-2 text-gray-400 font-semibold">Success Rate</th>
                  <th className="text-right py-2 text-gray-400 font-semibold">Time</th>
                  <th className="text-center py-2 text-gray-400 font-semibold"></th>
                </tr>
              </thead>
              <tbody>
                {savedPerformances.map((perf, index) => {
                  const algo = algorithms.find(a => a.id === perf.algorithmId);
                  const colors = getColorClasses(algo?.color || 'violet');
                  
                  return (
                    <motion.tr
                      key={`${perf.algorithmId}-${perf.timestamp.getTime()}`}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="border-b border-gray-800/50 hover:bg-gray-800/30"
                    >
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <div className={colors.text}>{algo?.icon}</div>
                          <span className="font-medium text-white">{perf.algorithmName}</span>
                        </div>
                      </td>
                      <td className="text-right py-3 font-mono text-white">{perf.requestCount}</td>
                      <td className="text-right py-3 font-mono text-green-400">{perf.allowedRequests}</td>
                      <td className="text-right py-3 font-mono text-red-400">{perf.blockedRequests}</td>
                      <td className="text-right py-3">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 h-2 bg-gray-700 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${perf.successRate}%` }}
                              className="h-full bg-green-500"
                            />
                          </div>
                          <span className="font-mono text-white w-12 text-right">{perf.successRate}%</span>
                        </div>
                      </td>
                      <td className="text-right py-3 text-gray-400 text-xs">
                        {perf.timestamp.toLocaleTimeString()}
                      </td>
                      <td className="text-center py-3">
                        <motion.button
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemoveSavedPerformance(perf.algorithmId);
                          }}
                          className="p-1 rounded hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <X className="w-4 h-4" />
                        </motion.button>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Best Performer */}
          {savedPerformances.length > 1 && (
            <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
              <div className="text-xs font-medium text-amber-400 mb-1">Best Performer</div>
              <div className="text-xs text-gray-300">
                {(() => {
                  const best = savedPerformances.reduce((prev, current) => 
                    current.successRate > prev.successRate ? current : prev
                  );
                  return `${best.algorithmName} with ${best.successRate}% success rate`;
                })()}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

