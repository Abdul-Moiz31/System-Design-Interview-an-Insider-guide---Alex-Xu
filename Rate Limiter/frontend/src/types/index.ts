import { ReactNode } from 'react';

export interface Algorithm {
  id: string;
  name: string;
  description: string;
  icon: ReactNode;
  color: string;
  usedBy: string[];
  pros: string[];
  cons: string[];
}

export interface RequestResult {
  id: string;
  timestamp: Date;
  success: boolean;
  remaining: number;
  limit: number;
  algorithm: string;
  responseTime: number;
  explanation?: string;
  currentCount?: number;
  retryAfter?: number;
  resetTime?: number;
}

export interface Stats {
  totalRequests: number;
  allowedRequests: number;
  blockedRequests: number;
  uniqueKeys: number;
  requestsByAlgorithm: Record<string, { total: number; allowed: number; blocked: number }>;
}

export interface SavedPerformance {
  algorithmId: string;
  algorithmName: string;
  timestamp: Date;
  totalRequests: number;
  allowedRequests: number;
  blockedRequests: number;
  successRate: number;
  requestCount: number; // Number of requests used for this test
}

