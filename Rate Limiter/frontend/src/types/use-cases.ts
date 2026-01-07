export interface UseCase {
  id: string;
  name: string;
  description: string;
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  icon: string;
  color: string;
  realWorldExample: string;
  whyThisLimit: string;
  whatHappensWhenBlocked: string;
  companiesUsing: string[];
  config: {
    windowMs: number;
    maxRequests: number;
    algorithm: string;
  };
}

