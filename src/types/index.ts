export interface Protocol {
  id: string;
  name: string;
  description: string;
  metrics: ProtocolMetric[];
}

export interface ProtocolMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  timestamp: number;
}

export interface Strategy {
  id: string;
  name: string;
  description: string;
  recommendations: string[];
  generatedAt: number;
}