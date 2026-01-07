import { UseCase } from '../types/use-cases';
import { Building2, Shield, AlertTriangle, Info } from 'lucide-react';

interface UseCaseDetailsProps {
  useCase: UseCase | null;
}

export default function UseCaseDetails({ useCase }: UseCaseDetailsProps) {
  if (!useCase) {
    return (
      <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6">
        <div className="text-center text-gray-500">
          <Info className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Select a use case to see details</p>
        </div>
      </div>
    );
  }

  const windowSeconds = Math.floor(useCase.config.windowMs / 1000);
  const windowDisplay = windowSeconds < 60 
    ? `${windowSeconds} seconds` 
    : windowSeconds < 3600 
      ? `${Math.floor(windowSeconds / 60)} minutes`
      : `${Math.floor(windowSeconds / 3600)} hours`;

  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="text-3xl">{useCase.icon}</div>
        <div>
          <h2 className="text-xl font-semibold text-white">{useCase.name}</h2>
          <p className="text-sm text-gray-400">{useCase.endpoint}</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Rate Limit Info */}
        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
          <h3 className="text-sm font-semibold text-white mb-3">Rate Limit Configuration</h3>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-gray-500 text-xs mb-1">Max Requests</div>
              <div className="text-white font-mono text-lg">{useCase.config.maxRequests}</div>
            </div>
            <div>
              <div className="text-gray-500 text-xs mb-1">Time Window</div>
              <div className="text-white font-mono text-lg">{windowDisplay}</div>
            </div>
            <div>
              <div className="text-gray-500 text-xs mb-1">Algorithm</div>
              <div className="text-white font-mono text-xs">
                {useCase.config.algorithm.replace(/_/g, ' ')}
              </div>
            </div>
          </div>
        </div>

        {/* Real World Example */}
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
          <div className="flex items-start gap-2 mb-2">
            <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
            <h3 className="text-sm font-semibold text-blue-400">Real-World Scenario</h3>
          </div>
          <p className="text-xs text-gray-300 leading-relaxed">{useCase.realWorldExample}</p>
        </div>

        {/* Why This Limit */}
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
          <div className="flex items-start gap-2 mb-2">
            <Shield className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <h3 className="text-sm font-semibold text-amber-400">Why This Limit?</h3>
          </div>
          <p className="text-xs text-gray-300 leading-relaxed">{useCase.whyThisLimit}</p>
        </div>

        {/* What Happens When Blocked */}
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
          <div className="flex items-start gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <h3 className="text-sm font-semibold text-red-400">When Rate Limited</h3>
          </div>
          <p className="text-xs text-gray-300 leading-relaxed">{useCase.whatHappensWhenBlocked}</p>
        </div>

        {/* Companies Using */}
        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
          <div className="flex items-start gap-2 mb-2">
            <Building2 className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
            <h3 className="text-sm font-semibold text-gray-300">Used By</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {useCase.companiesUsing.map((company, i) => (
              <span
                key={i}
                className="text-xs px-2 py-1 rounded bg-gray-700/50 text-gray-300"
              >
                {company}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

