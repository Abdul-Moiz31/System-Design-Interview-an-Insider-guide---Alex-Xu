import { useState, useCallback } from 'react';
import { UseCase } from '../types/use-cases';
import { RequestResult } from '../types';
import { API_BASE } from '../constants/algorithms';

export function useUseCaseRequest() {
  const [requests, setRequests] = useState<RequestResult[]>([]);

  const sendUseCaseRequest = useCallback(async (useCase: UseCase) => {
    const startTime = Date.now();
    try {
      const res = await fetch(`${API_BASE}${useCase.endpoint}`, {
        method: useCase.method,
        headers: { 'Content-Type': 'application/json' },
        body: useCase.method !== 'GET' ? JSON.stringify({}) : undefined
      });

      const data = await res.json();
      const endTime = Date.now();

      const result: RequestResult = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(),
        success: res.ok,
        remaining: parseInt(res.headers.get('X-RateLimit-Remaining') || '0'),
        limit: parseInt(res.headers.get('X-RateLimit-Limit') || '0'),
        algorithm: useCase.config.algorithm,
        responseTime: endTime - startTime,
        explanation: `Request to ${useCase.endpoint}: ${res.ok ? 'Allowed' : 'Blocked'}. ${useCase.realWorldExample}`,
        currentCount: undefined,
        retryAfter: res.headers.get('Retry-After') ? parseInt(res.headers.get('Retry-After')!) : undefined,
        resetTime: res.headers.get('X-RateLimit-Reset') ? parseInt(res.headers.get('X-RateLimit-Reset')!) : undefined
      };

      setRequests(prev => [result, ...prev].slice(0, 50));
      return result;
    } catch (error) {
      console.error('Request failed:', error);
      return null;
    }
  }, []);

  const clearRequests = () => {
    setRequests([]);
  };

  return {
    requests,
    sendUseCaseRequest,
    clearRequests
  };
}

