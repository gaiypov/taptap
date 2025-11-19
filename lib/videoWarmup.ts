// lib/videoWarmup.ts — WARM-UP ENGINE v4.0: NEURAL + QoS + PREDICTIVE 2025
// ФИНАЛЬНАЯ ВЕРСИЯ — ГОТОВАЯ К МИЛЛИАРДУ ВИДЕО (ноябрь 2025)

import { appLogger } from '@/utils/logger';

const WARMUP_TTL = 30_000; // 30 секунд TTL
const COOLDOWN_TTL = 120_000; // 2 минуты cooldown
const FAILURE_THRESHOLD = 2; // После 2 ошибок → cooldown

const inFlight = new Map<string, Promise<void>>();
const lastWarmup = new Map<string, number>();
const failures = new Map<string, number>();
const cooldown = new Set<string>();

type QoS = 'high' | 'mid' | 'low';
type Intent = -1 | 0 | 1; // fly | neutral | stop

interface WarmupOptions {
  qos?: QoS;
  intent?: Intent;
  bsi?: number; // Behavioral Speed Index (0..1)
  fps?: number;
  stall?: number;
  neural?: {
    velocity: number;
    volatility: number;
    categoryBias?: Record<string, number>;
    avgDwell?: number;
  };
}

// === ОСНОВНОЙ ДВИЖОК ===
export async function warmup(url: string, options: WarmupOptions = {}): Promise<void> {
  if (!url) return;

  const now = Date.now();
  const last = lastWarmup.get(url) || 0;

  // TTL + cooldown
  if (now - last < WARMUP_TTL || cooldown.has(url)) return;

  // Уже в процессе
  if (inFlight.has(url)) return inFlight.get(url);

  const task = (async () => {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      const qos = calculateQoS(options);
      const method = qos === 'high' ? 'GET' : 'HEAD';

      await fetch(url, {
        method,
        signal: controller.signal,
        cache: 'force-cache',
        credentials: 'omit',
      });

      clearTimeout(timeout);
      failures.delete(url);
      cooldown.delete(url);
      lastWarmup.set(url, now);

      appLogger.debug('[Warmup] Success', { url: url.slice(0, 60) + '...', qos });
    } catch (error: any) {
      if (error.name === 'AbortError') return;

      const count = (failures.get(url) || 0) + 1;
      failures.set(url, count);

      if (count >= FAILURE_THRESHOLD) {
        cooldown.add(url);
        setTimeout(() => cooldown.delete(url), COOLDOWN_TTL);
      }

      appLogger.warn('[Warmup] Failed', { url: url.slice(0, 60) + '...', attempt: count });
    } finally {
      inFlight.delete(url);
    }
  })();

  inFlight.set(url, task);
  return task;
}

// === УМНЫЙ РАСЧЁТ QoS ===
function calculateQoS(options: WarmupOptions): QoS {
  const { fps = 60, stall = 0, bsi = 0.5 } = options;

  if (fps < 35 || stall > 80 || bsi < 0.3) return 'low';
  if (fps > 55 && stall < 30 && bsi > 0.7) return 'high';
  return 'mid';
}

// === УМНЫЙ РАСЧЁТ ЗАДЕРЖКИ ===
export function calculateDelay(options: WarmupOptions): number {
  const { intent = 0, bsi = 0.5, neural } = options;

  let delay = 0;

  // Intent
  if (intent === -1) delay = 40;     // fly through — мгновенно
  if (intent === 1) delay = 300;     // preparing to stop — подождать

  // BSI
  if (bsi < 0.3) delay += 250;
  else if (bsi < 0.7) delay += 120;

  // Neural volatility
  if (neural?.volatility && neural.volatility > 8) delay += 200;

  // Category bias
  if (neural?.categoryBias && Object.values(neural.categoryBias).some((b: number) => b > 0.7)) {
    delay += 80;
  }

  return Math.max(40, Math.min(450, delay));
}

// === УМНОЕ ПРЕФЕТЧ ОКНО ===
export function calculatePrefetchWindow(options: WarmupOptions): number {
  const { bsi = 0.5, intent = 0, neural } = options;

  if (intent === -1) return 3; // fly through — грузим всё
  if (bsi < 0.3) return 1;     // тормозит — только следующее
  if (neural?.volatility && neural.volatility > 10) return 1;

  return 2; // стандарт
}

// === УНИВЕРСАЛЬНЫЙ SCHEDULER ===
export function schedule(url: string, options: WarmupOptions = {}) {
  const delay = calculateDelay(options);

  setTimeout(() => {
    void warmup(url, options);
  }, delay);
}

// === ОЧИСТКА ===
export function clearFailed() {
  failures.clear();
  cooldown.clear();
}

// ============================================
// ОБРАТНАЯ СОВМЕСТИМОСТЬ (для существующего кода)
// ============================================

/**
 * @deprecated Используйте warmup() напрямую
 */
export async function warmupVideoUrl(
  url: string,
  timeoutMs: number = 4000,
  qosMode: QoS = 'mid',
  neuralPattern?: any
): Promise<void> {
  const options: WarmupOptions = {
    qos: qosMode,
    neural: neuralPattern ? {
      velocity: neuralPattern.avgVelocity || 0,
      volatility: neuralPattern.volatility || 0,
      categoryBias: neuralPattern.categoryBias || {},
      avgDwell: neuralPattern.avgDwell,
    } : undefined,
  };
  return warmup(url, options);
}

/**
 * @deprecated Используйте schedule() напрямую
 */
export function scheduleVideoWarmup(url: string, options: any = {}): void {
  const warmupOptions: WarmupOptions = {
    qos: options.qosMode,
    intent: options.intent === -1 ? -1 : options.intent === 1 ? 1 : 0,
    bsi: options.bsi,
    fps: options.fps,
    stall: options.stall,
    neural: options.neuralPattern ? {
      velocity: options.neuralPattern.avgVelocity || 0,
      volatility: options.neuralPattern.volatility || 0,
      categoryBias: options.neuralPattern.categoryBias || {},
      avgDwell: options.neuralPattern.avgDwell,
    } : undefined,
  };
  schedule(url, warmupOptions);
}

/**
 * @deprecated Используйте calculatePrefetchWindow() напрямую
 */
export function computePrefetchWindow(params: {
  bsi: number;
  directionHistory?: ('up' | 'down')[];
  intent: number;
  neuralPattern?: any;
  fps: number;
  stall: number;
  category?: string;
}): number {
  const options: WarmupOptions = {
    bsi: params.bsi,
    intent: params.intent === -1 ? -1 : params.intent === 1 ? 1 : 0,
    fps: params.fps,
    stall: params.stall,
    neural: params.neuralPattern ? {
      velocity: params.neuralPattern.avgVelocity || 0,
      volatility: params.neuralPattern.volatility || 0,
      categoryBias: params.neuralPattern.categoryBias || {},
      avgDwell: params.neuralPattern.avgDwell,
    } : undefined,
  };
  return calculatePrefetchWindow(options);
}

/**
 * @deprecated Больше не используется
 */
export function shouldUseReducedWindow(_url: string): boolean {
  return false; // Логика встроена в calculatePrefetchWindow
}
