// lib/neuralMotion.ts
// Motion Engine 6.0: Neural Motion Memory (NMM)
// Maintains behavioral motion patterns for predictive animation

const VELOCITY_HISTORY_SIZE = 40;
const GYRO_HISTORY_SIZE = 40;
const PRESSURE_HISTORY_SIZE = 30;
const REVERSAL_SAMPLE_SIZE = 20;
const DECAY_RATE = 0.01; // 1% per minute

export interface MotionMemory {
  avgScrollVelocity: number;
  velocityVolatility: number;
  avgGyroTiltX: number;
  avgGyroTiltY: number;
  avgPressure: number;
  reversalRate: number;
  microJitterRate: number;
  longSwipeProbability: number; // 0..1
  stopProbability: number; // 0..1
}

export interface PredictiveVector {
  predictedDirection: 'up' | 'down' | 'none';
  predictedStrength: number; // 0–1
  predictedSwipeLength: number; // 0–1
}

export interface TouchIntent {
  intent: 'swipe' | 'stop' | 'hesitate' | 'neutral';
  confidence: number; // 0..1
}

export interface FusedMotion {
  nextAction: 'accelerate' | 'slowDown' | 'oscillate' | 'stable';
  predictedIntent: 'fly' | 'stop' | 'uncertain';
  animationBoost: number;
  stabilityWeight: number;
  predictedSwipeLength: number;
  predictedDirection: 'up' | 'down' | 'none';
}

// Singleton storage (globally shared)
const velocityHistory: number[] = [];
const gyroXHistory: number[] = [];
const gyroYHistory: number[] = [];
const pressureHistory: number[] = [];
const directionHistory: ('up' | 'down')[] = [];
let lastDecayTime = Date.now();

/**
 * Motion Engine 6.0: Update motion memory with new sensor data
 */
export function updateMotionMemory(params: {
  velocity: number;
  gyroX: number;
  gyroY: number;
  pressure: number;
}): void {
  const { velocity, gyroX, gyroY, pressure } = params;

  // Update velocity history
  velocityHistory.push(Math.abs(velocity));
  if (velocityHistory.length > VELOCITY_HISTORY_SIZE) {
    velocityHistory.shift();
  }

  // Update direction history
  const direction: 'up' | 'down' | 'none' = velocity > 0 ? 'down' : velocity < 0 ? 'up' : (directionHistory[directionHistory.length - 1] || 'none') as 'up' | 'down' | 'none';
  if (direction !== 'none') {
    directionHistory.push(direction);
    if (directionHistory.length > REVERSAL_SAMPLE_SIZE) {
      directionHistory.shift();
    }
  }

  // Update gyro history
  gyroXHistory.push(Math.abs(gyroX));
  gyroYHistory.push(Math.abs(gyroY));
  if (gyroXHistory.length > GYRO_HISTORY_SIZE) {
    gyroXHistory.shift();
    gyroYHistory.shift();
  }

  // Update pressure history
  if (pressure > 0) {
    pressureHistory.push(pressure);
    if (pressureHistory.length > PRESSURE_HISTORY_SIZE) {
      pressureHistory.shift();
    }
  }

  // Apply decay periodically
  const now = Date.now();
  if (now - lastDecayTime > 60000) {
    applyDecay();
    lastDecayTime = now;
  }
}

/**
 * Motion Engine 6.0: Apply soft forgetting (1% decay per minute)
 */
function applyDecay(): void {
  const removeCount = Math.max(1, Math.floor(velocityHistory.length * DECAY_RATE));
  velocityHistory.splice(0, removeCount);
  gyroXHistory.splice(0, removeCount);
  gyroYHistory.splice(0, removeCount);
  pressureHistory.splice(0, Math.max(1, Math.floor(pressureHistory.length * DECAY_RATE)));
  directionHistory.splice(0, Math.max(1, Math.floor(directionHistory.length * DECAY_RATE)));
}

/**
 * Motion Engine 6.0: Compute average velocity
 */
function getAvgVelocity(): number {
  if (velocityHistory.length === 0) return 0;
  return velocityHistory.reduce((a, b) => a + b, 0) / velocityHistory.length;
}

/**
 * Motion Engine 6.0: Compute velocity volatility (stdDeviation)
 */
function getVelocityVolatility(): number {
  if (velocityHistory.length < 2) return 0;
  const recent = velocityHistory.slice(-20);
  const mean = recent.reduce((a, b) => a + b, 0) / recent.length;
  const variance = recent.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / recent.length;
  return Math.sqrt(variance);
}

/**
 * Motion Engine 6.0: Compute average gyro tilt
 */
function getAvgGyroTiltX(): number {
  if (gyroXHistory.length === 0) return 0;
  return gyroXHistory.reduce((a, b) => a + b, 0) / gyroXHistory.length;
}

function getAvgGyroTiltY(): number {
  if (gyroYHistory.length === 0) return 0;
  return gyroYHistory.reduce((a, b) => a + b, 0) / gyroYHistory.length;
}

/**
 * Motion Engine 6.0: Compute average pressure
 */
function getAvgPressure(): number {
  if (pressureHistory.length === 0) return 0;
  return pressureHistory.reduce((a, b) => a + b, 0) / pressureHistory.length;
}

/**
 * Motion Engine 6.0: Compute reversal rate
 */
function getReversalRate(): number {
  if (directionHistory.length < 2) return 0;
  let reversals = 0;
  for (let i = 1; i < directionHistory.length; i++) {
    if (directionHistory[i] !== directionHistory[i - 1]) {
      reversals++;
    }
  }
  return reversals / (directionHistory.length - 1);
}

/**
 * Motion Engine 6.0: Compute micro-jitter rate
 */
function getMicroJitterRate(): number {
  if (velocityHistory.length === 0) return 0;
  const recent = velocityHistory.slice(-20);
  const jitterCount = recent.filter(v => v >= 0.2 && v <= 2.0).length;
  return jitterCount / recent.length;
}

/**
 * Motion Engine 6.0: Compute long swipe probability
 */
function getLongSwipeProbability(avgVelocity: number, volatility: number): number {
  if (avgVelocity > 12 && volatility < 6) {
    return 0.8 + Math.min((avgVelocity - 12) / 20, 0.2); // 0.8–1.0
  }
  if (volatility > 12) {
    return 0.1 + Math.min((volatility - 12) / 40, 0.2); // 0.1–0.3
  }
  return 0.5; // neutral
}

/**
 * Motion Engine 6.0: Compute stop probability
 */
function getStopProbability(avgPressure: number, avgGyroTilt: number, reversalRate: number): number {
  if (avgPressure < 0.2 && avgGyroTilt < 0.2) {
    return 0.7 + (0.2 - avgPressure) * 1.5; // 0.7+
  }
  if (reversalRate > 0.4) {
    return 0.6 + (reversalRate - 0.4) * 0.5; // 0.6+
  }
  return 0.3; // neutral
}

/**
 * Motion Engine 6.0: Get current motion memory
 */
export function getMotionMemory(): MotionMemory {
  // Apply decay if needed
  const now = Date.now();
  if (now - lastDecayTime > 60000) {
    applyDecay();
    lastDecayTime = now;
  }

  const avgVelocity = getAvgVelocity();
  const volatility = getVelocityVolatility();
  const avgGyroX = getAvgGyroTiltX();
  const avgGyroY = getAvgGyroTiltY();
  const avgPressure = getAvgPressure();
  const reversalRate = getReversalRate();
  const microJitterRate = getMicroJitterRate();
  const avgGyroTilt = (avgGyroX + avgGyroY) / 2;

  return {
    avgScrollVelocity: avgVelocity,
    velocityVolatility: volatility,
    avgGyroTiltX: avgGyroX,
    avgGyroTiltY: avgGyroY,
    avgPressure,
    reversalRate,
    microJitterRate,
    longSwipeProbability: getLongSwipeProbability(avgVelocity, volatility),
    stopProbability: getStopProbability(avgPressure, avgGyroTilt, reversalRate),
  };
}

/**
 * Motion Engine 6.0: Predictive Motion Vector Engine (PMVE)
 */
export function computePredictiveVector(params: {
  currentVelocity: number;
  gyroX: number;
  gyroY: number;
  inertia: number;
  motionMemory: MotionMemory;
}): PredictiveVector {
  const { currentVelocity, gyroX, gyroY, motionMemory } = params;

  // Determine predicted direction
  let predictedDirection: 'up' | 'down' | 'none' = 'none';
  const velocitySign = Math.sign(currentVelocity);
  const gyroSign = Math.sign(gyroX + gyroY);
  if (velocitySign !== 0) {
    predictedDirection = velocitySign > 0 ? 'down' : 'up';
  } else if (gyroSign !== 0) {
    predictedDirection = gyroSign > 0 ? 'down' : 'up';
  }

  // Determine predicted swipe length
  let predictedSwipeLength = 0.5; // neutral
  if (motionMemory.longSwipeProbability > 0.7) {
    predictedSwipeLength = 0.8 + (motionMemory.longSwipeProbability - 0.7) * 0.67; // 0.8–1.0
  } else {
    predictedSwipeLength = motionMemory.longSwipeProbability * 0.7; // 0–0.7
  }

  // Determine predicted strength
  let predictedStrength = 0.5; // neutral
  if (motionMemory.stopProbability > 0.7) {
    predictedStrength = 0;
  } else {
    const pressureFactor = Math.min(motionMemory.avgPressure, 1.0);
    const volatilityFactor = Math.max(0, 1 - motionMemory.velocityVolatility / 20);
    predictedStrength = (pressureFactor + volatilityFactor) / 2;
  }

  return {
    predictedDirection,
    predictedStrength,
    predictedSwipeLength,
  };
}

/**
 * Motion Engine 6.0: Neural Touch Intent Engine (NTI)
 */
export function computeTouchIntent(params: {
  pressure: number;
  pressureHistory: number[];
  gyroX: number;
  gyroY: number;
  gyroHistory: number[];
  microJitterRate: number;
}): TouchIntent {
  const { pressure, pressureHistory, gyroX, gyroY, gyroHistory, microJitterRate } = params;

  const avgPressure = pressureHistory.length > 0
    ? pressureHistory.reduce((a, b) => a + b, 0) / pressureHistory.length
    : pressure;
  const prevPressure = pressureHistory.length > 1
    ? pressureHistory[pressureHistory.length - 2]
    : pressure;

  const avgGyro = gyroHistory.length > 0
    ? gyroHistory.reduce((a, b) => a + b, 0) / gyroHistory.length
    : Math.abs(gyroX) + Math.abs(gyroY);
  const currentGyro = Math.abs(gyroX) + Math.abs(gyroY);
  const prevGyro = gyroHistory.length > 1
    ? gyroHistory[gyroHistory.length - 2]
    : currentGyro;

  const pressureRising = pressure > prevPressure && pressure > avgPressure * 0.8;
  const pressureDropping = pressure < prevPressure && pressure < avgPressure * 1.2;
  const gyroRising = currentGyro > prevGyro && currentGyro > avgGyro * 0.8;
  const gyroStable = Math.abs(currentGyro - prevGyro) < 0.1;

  let intent: 'swipe' | 'stop' | 'hesitate' | 'neutral' = 'neutral';
  let confidence = 0.5;

  // If pressure rising AND gyro tilt rising → intentSwipeFurther
  if (pressureRising && gyroRising) {
    intent = 'swipe';
    confidence = 0.8 + Math.min((pressure - prevPressure) * 2, 0.2);
  }
  // If pressure dropping AND gyro tilt stable → intentStop
  else if (pressureDropping && gyroStable) {
    intent = 'stop';
    confidence = 0.7 + Math.min((prevPressure - pressure) * 2, 0.3);
  }
  // If microJitterRate > 0.35 → intentChangeMind
  else if (microJitterRate > 0.35) {
    intent = 'hesitate';
    confidence = 0.6 + (microJitterRate - 0.35) * 0.8;
  }

  return { intent, confidence: Math.min(1, confidence) };
}

/**
 * Motion Engine 6.0: Multi-Signal Fusion Engine 6.0 (MSF)
 */
export function computeFusedMotion(params: {
  predictiveVector: PredictiveVector;
  motionMemory: MotionMemory;
  touchIntent: TouchIntent;
  scrollVelocity: number;
  gyroX: number;
  gyroY: number;
  inertia: number;
  pressure: number;
}): FusedMotion {
  const {
    predictiveVector,
    motionMemory,
    touchIntent,
  } = params;

  let nextAction: 'accelerate' | 'slowDown' | 'oscillate' | 'stable' = 'stable';
  let predictedIntent: 'fly' | 'stop' | 'uncertain' = 'uncertain';
  let animationBoost = 1.0;
  let stabilityWeight = 1.0;

  // If predictedSwipeLength > 0.8 AND intent=swipe → nextAction=accelerate
  if (predictiveVector.predictedSwipeLength > 0.8 && touchIntent.intent === 'swipe') {
    nextAction = 'accelerate';
    predictedIntent = 'fly';
    animationBoost = 1.3;
  }
  // If stopProbability > 0.6 OR intent=stop → nextAction=slowDown
  else if (motionMemory.stopProbability > 0.6 || touchIntent.intent === 'stop') {
    nextAction = 'slowDown';
    predictedIntent = 'stop';
    animationBoost = 0.8;
  }
  // If volatility > 10 → nextAction=oscillate
  else if (motionMemory.velocityVolatility > 10) {
    nextAction = 'oscillate';
    predictedIntent = 'uncertain';
    animationBoost = 1.0;
  }

  // stabilityWeight = inverse volatility 0..1
  stabilityWeight = Math.max(0, Math.min(1, 1 - motionMemory.velocityVolatility / 20));

  return {
    nextAction,
    predictedIntent,
    animationBoost,
    stabilityWeight,
    predictedSwipeLength: predictiveVector.predictedSwipeLength,
    predictedDirection: predictiveVector.predictedDirection,
  };
}

/**
 * Motion Engine 6.0: Reset motion memory (for testing or user reset)
 */
export function resetMotionMemory(): void {
  velocityHistory.length = 0;
  gyroXHistory.length = 0;
  gyroYHistory.length = 0;
  pressureHistory.length = 0;
  directionHistory.length = 0;
  lastDecayTime = Date.now();
}

