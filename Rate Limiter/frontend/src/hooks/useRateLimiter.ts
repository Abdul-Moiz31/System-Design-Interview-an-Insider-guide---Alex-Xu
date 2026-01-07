import { useState, useEffect, useCallback } from 'react';
import { RequestResult, Stats } from '../types';
import { API_BASE } from '../constants/algorithms';

export function useRateLimiter(
  selectedAlgorithmId: string,
  windowMs: number,
  maxRequests: number
) {
  const [requests, setRequests] = useState<RequestResult[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Check server connection
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const res = await fetch(`${API_BASE}/health`);
        setIsConnected(res.ok);
      } catch {
        setIsConnected(false);
      }
    };
    checkConnection();
    const interval = setInterval(checkConnection, 5000);
    return () => clearInterval(interval);
  }, []);

  // Fetch stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`${API_BASE}/stats`);
        if (res.ok) {
          setStats(await res.json());
        }
      } catch {
        // Ignore errors
      }
    };
    fetchStats();
    const interval = setInterval(fetchStats, 1000);
    return () => clearInterval(interval);
  }, []);

  // Send a request
  const sendRequest = useCallback(async () => {
    const startTime = Date.now();
    try {
      const res = await fetch(`${API_BASE}/api/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          algorithm: selectedAlgorithmId,
          windowMs,
          maxRequests,
          clientId: 'demo-user'
        })
      });

      const data = await res.json();
      const endTime = Date.now();

      const result: RequestResult = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(),
        success: res.ok,
        remaining: data.remaining ?? 0,
        limit: data.limit ?? maxRequests,
        algorithm: data.algorithm || selectedAlgorithmId,
        responseTime: endTime - startTime,
        explanation: data.explanation,
        currentCount: data.currentCount,
        retryAfter: data.retryAfter,
        resetTime: data.resetTime
      };

      setRequests(prev => [result, ...prev].slice(0, 50));
    } catch (error) {
      console.error('Request failed:', error);
    }
  }, [selectedAlgorithmId, windowMs, maxRequests]);

  // Reset stats
  const resetStats = async () => {
    try {
      await fetch(`${API_BASE}/stats/reset`, { method: 'POST' });
      setRequests([]);
    } catch {
      // Ignore errors
    }
  };

  // Clear requests (useful after saving performance)
  const clearRequests = () => {
    setRequests([]);
  };

  return {
    requests,
    stats,
    isConnected,
    sendRequest,
    resetStats,
    clearRequests
  };
}

