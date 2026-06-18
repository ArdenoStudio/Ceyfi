export interface HourlyPoint {
  hour: string;
  responseTime: number;
  success: number;
  error: number;
}

export interface AgentMetric {
  key: string;
  label: string;
  description: string;
  status: "up" | "degraded" | "down";
  currentLatency: number | null;
  avgResponseTime: number;
  uptime: number;
  successCount: number;
  errorCount: number;
  series: HourlyPoint[];
}

export interface MetricsData {
  agents: AgentMetric[];
  phoenixConnected: boolean;
  generatedAt: string;
}
