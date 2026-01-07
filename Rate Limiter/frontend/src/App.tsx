import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause } from 'lucide-react';
import { algorithms } from './constants/algorithms';
import { Algorithm, SavedPerformance } from './types';
import { useRateLimiter } from './hooks/useRateLimiter';
import Header from './components/Header';
import AlgorithmSelector from './components/AlgorithmSelector';
import AlgorithmExplanation from './components/AlgorithmExplanation';
import RequestControls from './components/RequestControls';
import RequestLog from './components/RequestLog';
import Statistics from './components/Statistics';
import RequestInfo from './components/RequestInfo';
import UseCaseSelector from './components/UseCaseSelector';
import UseCaseDetails from './components/UseCaseDetails';
import ModeSwitcher from './components/ModeSwitcher';
import { useUseCases } from './hooks/useUseCases';
import { useUseCaseRequest } from './hooks/useUseCaseRequest';
import { UseCase } from './types/use-cases';

function App() {
  const [mode, setMode] = useState<'algorithms' | 'use-cases'>('use-cases');
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<Algorithm>(algorithms[0]);
  const [selectedUseCase, setSelectedUseCase] = useState<UseCase | null>(null);
  const [isAutoSending, setIsAutoSending] = useState(false);
  const [requestsPerSecond, setRequestsPerSecond] = useState(2);
  const [windowMs, setWindowMs] = useState(10000);
  const [maxRequests, setMaxRequests] = useState(5);
  const [showAlgorithmInfo, setShowAlgorithmInfo] = useState(false);
  const [showDetailedLogs, setShowDetailedLogs] = useState(true);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [savedPerformances, setSavedPerformances] = useState<SavedPerformance[]>([]);

  const { useCases } = useUseCases();
  const { requests: useCaseRequests, sendUseCaseRequest, clearRequests: clearUseCaseRequests } = useUseCaseRequest();

  const {
    requests: algorithmRequests,
    stats,
    isConnected,
    sendRequest,
    resetStats,
    clearRequests
  } = useRateLimiter(selectedAlgorithm.id, windowMs, maxRequests);

  // Use appropriate requests based on mode
  const requests = mode === 'use-cases' ? useCaseRequests : algorithmRequests;

  // Auto-send requests
  useEffect(() => {
    if (!isAutoSending) return;

    const interval = setInterval(() => {
      if (mode === 'use-cases' && selectedUseCase) {
        sendUseCaseRequest(selectedUseCase);
      } else {
        sendRequest();
      }
    }, 1000 / requestsPerSecond);

    return () => clearInterval(interval);
  }, [isAutoSending, requestsPerSecond, sendRequest, mode, selectedUseCase, sendUseCaseRequest]);

  const handleReset = async () => {
    await resetStats();
    setSelectedRequestId(null);
  };

  const handleSavePerformance = () => {
    // Use the requests array to calculate stats since /api/test doesn't update middleware stats
    // Backend returns algorithm ID (e.g., "TOKEN_BUCKET") in the response
    const requestsForCurrentAlgorithm = requests.filter(req => {
      // Backend returns algorithm ID, so match by ID
      // Also handle case where it might be the algorithm name
      const reqAlgo = String(req.algorithm || '').toUpperCase().trim();
      const selectedId = selectedAlgorithm.id.toUpperCase().trim();
      const selectedName = selectedAlgorithm.name.toUpperCase().trim();
      
      // Direct ID match (most common case)
      if (reqAlgo === selectedId) return true;
      
      // Name match (if backend returns name instead)
      if (reqAlgo === selectedName) return true;
      
      // Handle spaces/underscores variations
      const reqAlgoNormalized = reqAlgo.replace(/\s+/g, '_');
      const selectedNameNormalized = selectedName.replace(/\s+/g, '_');
      
      return reqAlgoNormalized === selectedId || selectedNameNormalized === selectedId;
    });

    if (requestsForCurrentAlgorithm.length === 0) return;

    const total = requestsForCurrentAlgorithm.length;
    const allowed = requestsForCurrentAlgorithm.filter(r => r.success).length;
    const blocked = total - allowed;
    const successRate = Math.round((allowed / total) * 100);

    const savedPerformance: SavedPerformance = {
      algorithmId: selectedAlgorithm.id,
      algorithmName: selectedAlgorithm.name,
      timestamp: new Date(),
      totalRequests: total,
      allowedRequests: allowed,
      blockedRequests: blocked,
      successRate,
      requestCount: total
    };

    // Remove existing saved performance for this algorithm if exists
    setSavedPerformances(prev => {
      const filtered = prev.filter(p => p.algorithmId !== selectedAlgorithm.id);
      return [...filtered, savedPerformance];
    });

    // Clear requests after saving performance to start fresh for next algorithm
    if (mode === 'use-cases') {
      clearUseCaseRequests();
    } else {
      clearRequests();
    }
    setSelectedRequestId(null);
  };

  const handleUseCaseRequest = async () => {
    if (selectedUseCase) {
      await sendUseCaseRequest(selectedUseCase);
    }
  };

  const handleRemoveSavedPerformance = (algorithmId: string) => {
    setSavedPerformances(prev => prev.filter(p => p.algorithmId !== algorithmId));
  };

  // Check if we can save performance based on actual requests made
  // We use the requests array since /api/test doesn't go through middleware stats
  // Backend returns algorithm ID (e.g., "TOKEN_BUCKET") in the response
  const requestsForCurrentAlgorithm = requests.filter(req => {
    // Backend returns algorithm ID, so match by ID
    // Also handle case where it might be the algorithm name
    const reqAlgo = String(req.algorithm || '').toUpperCase().trim();
    const selectedId = selectedAlgorithm.id.toUpperCase().trim();
    const selectedName = selectedAlgorithm.name.toUpperCase().trim();
    
    // Direct ID match (most common case)
    if (reqAlgo === selectedId) return true;
    
    // Name match (if backend returns name instead)
    if (reqAlgo === selectedName) return true;
    
    // Handle spaces/underscores variations
    const reqAlgoNormalized = reqAlgo.replace(/\s+/g, '_');
    const selectedNameNormalized = selectedName.replace(/\s+/g, '_');
    
    return reqAlgoNormalized === selectedId || selectedNameNormalized === selectedId;
  });
  
  const canSavePerformance = requestsForCurrentAlgorithm.length > 0;

  return (
    <div className="min-h-screen bg-gray-950">
      <Header isConnected={isConnected} />

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Mode Switcher */}
        <div className="mb-6">
          <ModeSwitcher mode={mode} onModeChange={setMode} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Sidebar */}
          <div className="lg:col-span-3 space-y-6">
            {mode === 'use-cases' ? (
              <>
                <UseCaseSelector
                  useCases={useCases}
                  selectedUseCase={selectedUseCase}
                  onUseCaseSelect={(uc) => {
                    setSelectedUseCase(uc);
                    setSelectedRequestId(null);
                    clearUseCaseRequests();
                  }}
                />
                {selectedUseCase && (
                  <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-4">
                      <motion.button
                        onClick={handleUseCaseRequest}
                        disabled={!isConnected}
                        className={`flex-1 px-4 py-2.5 rounded-lg font-medium flex items-center justify-center gap-2 transition-all ${
                          isConnected 
                            ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                            : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                        }`}
                        whileHover={isConnected ? { scale: 1.02 } : {}}
                        whileTap={isConnected ? { scale: 0.98 } : {}}
                      >
                        <span className="text-lg">{selectedUseCase.icon}</span>
                        Send Request
                      </motion.button>
                      <motion.button
                        onClick={() => setIsAutoSending(!isAutoSending)}
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
                    </div>
                    <div className="text-xs text-gray-400 space-y-1">
                      <div className="font-mono">
                        {selectedUseCase.method} {selectedUseCase.endpoint}
                      </div>
                      <div>
                        Limit: {selectedUseCase.config.maxRequests} requests per{' '}
                        {Math.floor(selectedUseCase.config.windowMs / 1000)}s
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                <AlgorithmSelector
              algorithms={algorithms}
              selectedAlgorithm={selectedAlgorithm}
              showAlgorithmInfo={showAlgorithmInfo}
              onAlgorithmSelect={(algo) => {
                setSelectedAlgorithm(algo);
                setSelectedRequestId(null);
              }}
              onToggleInfo={() => setShowAlgorithmInfo(!showAlgorithmInfo)}
            />

                <RequestControls
                  isConnected={isConnected}
                  isAutoSending={isAutoSending}
                  onSendRequest={sendRequest}
                  onToggleAutoSend={() => setIsAutoSending(!isAutoSending)}
                  onReset={handleReset}
                  onSavePerformance={handleSavePerformance}
                  canSavePerformance={canSavePerformance}
                  windowMs={windowMs}
                  maxRequests={maxRequests}
                  requestsPerSecond={requestsPerSecond}
                  onWindowMsChange={setWindowMs}
                  onMaxRequestsChange={setMaxRequests}
                  onRequestsPerSecondChange={setRequestsPerSecond}
                />
              </>
            )}
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-9 space-y-6">
            {mode === 'use-cases' ? (
              <>
                {/* Use Case Details */}
                <UseCaseDetails useCase={selectedUseCase} />

                {/* Statistics */}
                <Statistics
                  stats={stats}
                  selectedAlgorithmId={selectedUseCase?.config.algorithm || ''}
                  savedPerformances={savedPerformances}
                  onAlgorithmSelect={() => {}}
                  onRemoveSavedPerformance={handleRemoveSavedPerformance}
                />

                {/* Request Log */}
                <RequestLog
                  requests={requests}
                  showDetailedLogs={showDetailedLogs}
                  selectedRequestId={selectedRequestId}
                  onRequestClick={(id) => setSelectedRequestId(id || null)}
                  onToggleDetails={() => setShowDetailedLogs(!showDetailedLogs)}
                />
              </>
            ) : (
              <>
                {/* Statistics - Prominent at the top */}
                <Statistics
                  stats={stats}
                  selectedAlgorithmId={selectedAlgorithm.id}
                  savedPerformances={savedPerformances}
                  onAlgorithmSelect={(id) => {
                    const algo = algorithms.find(a => a.id === id);
                    if (algo) {
                      setSelectedAlgorithm(algo);
                      setSelectedRequestId(null);
                    }
                  }}
                  onRemoveSavedPerformance={handleRemoveSavedPerformance}
                />

                {/* Algorithm Explanation */}
                <AlgorithmExplanation algorithm={selectedAlgorithm} />

                {/* Request Info / Help */}
                <RequestInfo />

                {/* Request Log */}
                <RequestLog
                  requests={requests}
                  showDetailedLogs={showDetailedLogs}
                  selectedRequestId={selectedRequestId}
                  onRequestClick={(id) => setSelectedRequestId(id || null)}
                  onToggleDetails={() => setShowDetailedLogs(!showDetailedLogs)}
                />
              </>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 mt-12">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div>Rate Limiter System Design Implementation</div>
            <div className="font-mono">
              Window: {windowMs/1000}s • Max: {maxRequests} req
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
