// lib/neuralMemory.ts
// Warm-up Engine v3.0: Neural Pattern Memory (NPM)
// Maintains user behavior patterns for predictive prefetching

const VELOCITY_HISTORY_SIZE = 40;
const DWELL_HISTORY_SIZE = 20;
const DECAY_RATE = 0.01; // 1% per minute
const DWELL_THRESHOLD = 2.5; // seconds

export interface NeuralPattern {
  avgVelocity: number; // moving average of last 40 velocities
  avgDwell: number; // avg watch time per category
  categoryBias: Record<string, number>; // preference weight per category
  volatility: number; // variance of movement behavior (stdDeviation of last 20 velocities)
}

// In-memory storage (persists during app session)
const velocityHistory: number[] = [];
const dwellHistory: Map<string, number[]> = new Map(); // category -> [dwell times]
const categoryBias: Record<string, number> = {};
let lastDecayTime = Date.now();

/**
 * Warm-up Engine v3.0: Update user pattern with new velocity and dwell data
 */
export function updateUserPattern(
  velocity: number,
  dwell: number,
  category: string
): void {
  if (!category || typeof category !== 'string') return;

  // Update velocity history
  velocityHistory.push(Math.abs(velocity));
  if (velocityHistory.length > VELOCITY_HISTORY_SIZE) {
    velocityHistory.shift();
  }

  // Update dwell history per category
  if (!dwellHistory.has(category)) {
    dwellHistory.set(category, []);
  }
  const categoryDwells = dwellHistory.get(category)!;
  if (dwell > 0) {
    categoryDwells.push(dwell);
    if (categoryDwells.length > DWELL_HISTORY_SIZE) {
      categoryDwells.shift();
    }
  }

  // Update category bias (grows when dwell > 2.5s)
  if (dwell > DWELL_THRESHOLD) {
    const currentBias = categoryBias[category] || 0;
    categoryBias[category] = Math.min(currentBias + 0.05, 1.0); // Cap at 1.0
  }

  // Apply decay periodically
  const now = Date.now();
  if (now - lastDecayTime > 60000) {
    // Decay every minute
    applyDecay();
    lastDecayTime = now;
  }
}

/**
 * Warm-up Engine v3.0: Apply soft forgetting (1% decay per minute)
 */
function applyDecay(): void {
  // Decay velocity history (remove oldest 1%)
  if (velocityHistory.length > 0) {
    const removeCount = Math.max(1, Math.floor(velocityHistory.length * DECAY_RATE));
    velocityHistory.splice(0, removeCount);
  }

  // Decay category bias
  for (const category in categoryBias) {
    categoryBias[category] = Math.max(0, categoryBias[category] * (1 - DECAY_RATE));
    if (categoryBias[category] < 0.01) {
      delete categoryBias[category];
    }
  }

  // Decay dwell history (remove oldest entries per category)
  for (const [category, dwells] of dwellHistory.entries()) {
    const removeCount = Math.max(1, Math.floor(dwells.length * DECAY_RATE));
    dwells.splice(0, removeCount);
    if (dwells.length === 0) {
      dwellHistory.delete(category);
    }
  }
}

/**
 * Warm-up Engine v3.0: Compute volatility (stdDeviation of last 20 velocities)
 */
function computeVolatility(): number {
  if (velocityHistory.length < 2) return 0;

  const recent = velocityHistory.slice(-20);
  const mean = recent.reduce((a, b) => a + b, 0) / recent.length;
  const variance =
    recent.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / recent.length;
  return Math.sqrt(variance);
}

/**
 * Warm-up Engine v3.0: Get average velocity
 */
function getAvgVelocity(): number {
  if (velocityHistory.length === 0) return 0;
  return velocityHistory.reduce((a, b) => a + b, 0) / velocityHistory.length;
}

/**
 * Warm-up Engine v3.0: Get average dwell time for a category
 */
function getAvgDwell(category: string): number {
  const dwells = dwellHistory.get(category);
  if (!dwells || dwells.length === 0) return 0;
  return dwells.reduce((a, b) => a + b, 0) / dwells.length;
}

/**
 * Warm-up Engine v3.0: Get current neural pattern
 */
export function getNeuralPattern(): NeuralPattern {
  // Apply decay if needed
  const now = Date.now();
  if (now - lastDecayTime > 60000) {
    applyDecay();
    lastDecayTime = now;
  }

  return {
    avgVelocity: getAvgVelocity(),
    avgDwell: 0, // Will be computed per category when needed
    categoryBias: { ...categoryBias }, // Return copy
    volatility: computeVolatility(),
  };
}

/**
 * Warm-up Engine v3.0: Get average dwell for specific category
 */
export function getCategoryDwell(category: string): number {
  return getAvgDwell(category);
}

/**
 * Warm-up Engine v3.0: Reset pattern (for testing or user reset)
 */
export function resetNeuralPattern(): void {
  velocityHistory.length = 0;
  dwellHistory.clear();
  Object.keys(categoryBias).forEach((key) => delete categoryBias[key]);
  lastDecayTime = Date.now();
}

