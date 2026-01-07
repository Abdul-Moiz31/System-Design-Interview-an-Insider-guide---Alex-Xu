import { Info } from 'lucide-react';
import { Algorithm } from '../types';
import { getColorClasses } from '../utils/colors';

interface AlgorithmExplanationProps {
  algorithm: Algorithm;
}

export default function AlgorithmExplanation({ algorithm }: AlgorithmExplanationProps) {
  const colorClasses = getColorClasses(algorithm.color);

  const getExplanation = (id: string) => {
    const explanations: Record<string, { steps: string[]; note?: string }> = {
      TOKEN_BUCKET: {
        steps: [
          'Checks if tokens are available in the bucket',
          'Refills tokens based on time elapsed (e.g., 1 token per second)',
          'Consumes a token if available, or blocks the request',
          'Allows bursts when multiple tokens are accumulated'
        ],
        note: 'Great for handling traffic spikes'
      },
      LEAKING_BUCKET: {
        steps: [
          'Adds your request to a queue (if space available)',
          'Processes requests from the queue at a fixed rate',
          'Blocks new requests if the queue is full',
          'Ensures smooth, constant output rate'
        ],
        note: 'Perfect for consistent processing'
      },
      FIXED_WINDOW: {
        steps: [
          'Identifies which time window the request belongs to',
          'Increments the counter for that window',
          'Checks if counter exceeds the limit',
          'Resets counter at window boundary'
        ],
        note: '⚠️ Edge case: At window boundaries, up to 2x the limit can pass!'
      },
      SLIDING_WINDOW_LOG: {
        steps: [
          'Records the exact timestamp of your request',
          'Removes timestamps outside the current window',
          'Counts remaining timestamps in the window',
          'Allows or blocks based on exact count'
        ],
        note: '✅ Most accurate - no edge cases, but uses more memory!'
      },
      SLIDING_WINDOW_COUNTER: {
        steps: [
          'Gets count from current window',
          'Gets count from previous window',
          'Calculates weighted average based on time position',
          'Estimates total requests in sliding window'
        ],
        note: '✅ Best balance - 99.997% accurate with minimal memory!'
      }
    };
    return explanations[id] || { steps: [], note: '' };
  };

  const { steps, note } = getExplanation(algorithm.id);

  return (
    <div className="bg-gray-900/50 border-l-4 border-blue-500/50 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <Info className={`w-4 h-4 ${colorClasses.text}`} />
        <h3 className="text-sm font-semibold text-white">How {algorithm.name} Works</h3>
      </div>
      <div className="text-xs text-gray-300 space-y-2">
        <p>When you send a request, the algorithm:</p>
        <ol className="list-decimal list-inside space-y-1 ml-2 text-gray-400">
          {steps.map((step, i) => (
            <li key={i}>{step}</li>
          ))}
        </ol>
        {note && (
          <p className={`mt-2 ${note.includes('✅') ? 'text-green-400' : note.includes('⚠️') ? 'text-amber-400' : 'text-gray-400'}`}>
            {note}
          </p>
        )}
      </div>
    </div>
  );
}

