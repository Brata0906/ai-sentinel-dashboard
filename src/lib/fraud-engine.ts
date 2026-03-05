import { Transaction, RiskFactor, City } from './types';
import { CITIES, DEVICE_TYPES, USER_IDS } from './cities';

let transactionCounter = 0;

const userHistory: Map<string, { lastLocation: City; devices: Set<string>; lastTimestamp: number }> = new Map();

function calculateRiskFactors(
  userId: string,
  amount: number,
  location: City,
  deviceType: string,
  timestamp: Date
): RiskFactor[] {
  const history = userHistory.get(userId);
  const hour = timestamp.getHours();

  const factors: RiskFactor[] = [
    {
      name: 'Unusual Amount',
      description: amount > 5000 ? `High amount: $${amount.toLocaleString()}` : amount < 2 ? `Micro-transaction: $${amount.toFixed(2)}` : 'Normal amount range',
      weight: 25,
      triggered: amount > 5000 || amount < 2,
      contribution: 0,
    },
    {
      name: 'Location Change',
      description: history && history.lastLocation.country !== location.country
        ? `Changed from ${history.lastLocation.country} to ${location.country}`
        : 'Consistent location',
      weight: 25,
      triggered: !!history && history.lastLocation.country !== location.country,
      contribution: 0,
    },
    {
      name: 'New Device',
      description: history && !history.devices.has(deviceType)
        ? `First time using ${deviceType}`
        : 'Known device',
      weight: 20,
      triggered: !!history && !history.devices.has(deviceType),
      contribution: 0,
    },
    {
      name: 'Unusual Time',
      description: hour >= 2 && hour <= 5 ? `Transaction at ${hour}:00 local time` : 'Normal hours',
      weight: 15,
      triggered: hour >= 2 && hour <= 5,
      contribution: 0,
    },
    {
      name: 'Rapid Frequency',
      description: history && (timestamp.getTime() - history.lastTimestamp) < 60000
        ? 'Multiple transactions within 60 seconds'
        : 'Normal frequency',
      weight: 15,
      triggered: !!history && (timestamp.getTime() - history.lastTimestamp) < 60000,
      contribution: 0,
    },
  ];

  // Calculate contributions
  const triggeredWeight = factors.filter(f => f.triggered).reduce((sum, f) => sum + f.weight, 0);
  factors.forEach(f => {
    if (f.triggered) {
      // Add some randomness to make it realistic
      const jitter = (Math.random() - 0.5) * 10;
      f.contribution = Math.min(f.weight, Math.max(0, f.weight + jitter));
    }
  });

  return factors;
}

export function generateTransaction(): Transaction {
  transactionCounter++;
  const userId = USER_IDS[Math.floor(Math.random() * USER_IDS.length)];
  
  // Weighted amount distribution - mostly normal, sometimes extreme
  let amount: number;
  const amountRoll = Math.random();
  if (amountRoll > 0.92) {
    amount = Math.round((5000 + Math.random() * 45000) * 100) / 100; // High
  } else if (amountRoll < 0.05) {
    amount = Math.round((0.01 + Math.random() * 1.99) * 100) / 100; // Micro
  } else {
    amount = Math.round((10 + Math.random() * 4990) * 100) / 100; // Normal
  }

  const location = CITIES[Math.floor(Math.random() * CITIES.length)];
  const deviceType = DEVICE_TYPES[Math.floor(Math.random() * DEVICE_TYPES.length)];
  const timestamp = new Date();

  const riskFactors = calculateRiskFactors(userId, amount, location, deviceType, timestamp);
  const riskScore = Math.min(100, Math.max(0, Math.round(
    riskFactors.reduce((sum, f) => sum + f.contribution, 0)
  )));

  const riskLevel = riskScore <= 30 ? 'safe' : riskScore <= 70 ? 'medium' : 'high';

  // Update user history
  const existing = userHistory.get(userId);
  if (existing) {
    existing.lastLocation = location;
    existing.devices.add(deviceType);
    existing.lastTimestamp = timestamp.getTime();
  } else {
    userHistory.set(userId, {
      lastLocation: location,
      devices: new Set([deviceType]),
      lastTimestamp: timestamp.getTime(),
    });
  }

  return {
    id: `TXN-${String(transactionCounter).padStart(6, '0')}`,
    userId,
    amount,
    location,
    deviceType,
    timestamp,
    riskScore,
    riskLevel,
    riskFactors,
    status: 'pending',
  };
}
