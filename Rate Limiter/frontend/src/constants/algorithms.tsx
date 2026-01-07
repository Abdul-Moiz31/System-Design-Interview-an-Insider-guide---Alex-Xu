import { Zap, Droplets, Clock, Activity, BarChart3 } from 'lucide-react';
import { Algorithm } from '../types';

export const algorithms: Algorithm[] = [
  {
    id: 'TOKEN_BUCKET',
    name: 'Token Bucket',
    description: 'Accumulates tokens over time, allowing burst traffic. Tokens refill at a constant rate.',
    icon: <Zap className="w-5 h-5" />,
    color: 'violet',
    usedBy: ['Amazon AWS', 'Stripe', 'Twitter'],
    pros: ['Allows bursts', 'Memory efficient', 'Simple to implement'],
    cons: ['Bursts might overwhelm servers', 'Two parameters to tune']
  },
  {
    id: 'LEAKING_BUCKET',
    name: 'Leaking Bucket',
    description: 'Processes requests at a constant rate, like water leaking from a bucket.',
    icon: <Droplets className="w-5 h-5" />,
    color: 'cyan',
    usedBy: ['Shopify', 'NGINX'],
    pros: ['Constant output rate', 'FIFO fairness', 'Smooth traffic'],
    cons: ['No burst allowance', 'May delay requests']
  },
  {
    id: 'FIXED_WINDOW',
    name: 'Fixed Window',
    description: 'Counts requests in fixed time windows. Simple but has edge case issues.',
    icon: <Clock className="w-5 h-5" />,
    color: 'amber',
    usedBy: ['Simple APIs', 'Internal services'],
    pros: ['Very simple', 'Memory efficient', 'Easy to understand'],
    cons: ['Edge case: 2x limit at boundaries']
  },
  {
    id: 'SLIDING_WINDOW_LOG',
    name: 'Sliding Window Log',
    description: 'Tracks every request timestamp for perfect accuracy. Best for security.',
    icon: <Activity className="w-5 h-5" />,
    color: 'rose',
    usedBy: ['Login limiting', 'Payment APIs'],
    pros: ['Perfect accuracy', 'No edge cases'],
    cons: ['High memory usage', 'Stores all timestamps']
  },
  {
    id: 'SLIDING_WINDOW_COUNTER',
    name: 'Sliding Window Counter',
    description: 'Hybrid approach with weighted averages. Best balance of accuracy and efficiency.',
    icon: <BarChart3 className="w-5 h-5" />,
    color: 'lime',
    usedBy: ['Cloudflare', 'High-traffic APIs'],
    pros: ['Memory efficient', '99.997% accurate'],
    cons: ['Approximation', 'Slightly complex']
  }
];

export const API_BASE = 'http://localhost:3001';

