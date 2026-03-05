export interface Transaction {
  id: string;
  userId: string;
  amount: number;
  location: City;
  deviceType: string;
  timestamp: Date;
  riskScore: number;
  riskLevel: 'safe' | 'medium' | 'high';
  riskFactors: RiskFactor[];
  status: 'pending' | 'confirmed_fraud' | 'cleared';
}

export interface RiskFactor {
  name: string;
  description: string;
  weight: number;
  triggered: boolean;
  contribution: number;
}

export interface City {
  name: string;
  country: string;
  lat: number;
  lng: number;
}

export interface KPIData {
  totalTransactions: number;
  flaggedCount: number;
  fraudPercentage: number;
  averageRiskScore: number;
}
