/**
 * Smoothing Utility Functions
 * 
 * Algorithms for smoothing sensor data to reduce jitter
 * while maintaining responsiveness.
 */

/**
 * Simple Moving Average (SMA) Smoother
 * 
 * Maintains a buffer of recent values and returns their average.
 * Trade-off: Reduces jitter but introduces slight lag.
 */
export class MovingAverageSmoother {
  private buffer: number[] = [];
  private windowSize: number;
  
  constructor(windowSize: number = 5) {
    this.windowSize = windowSize;
  }
  
  /**
   * Add a new value and get the smoothed result
   * 
   * @param value - New sensor reading
   * @returns Smoothed value (average of last N readings)
   */
  addValue(value: number): number {
    // Add new value to buffer
    this.buffer.push(value);
    
    // Keep buffer size within window
    if (this.buffer.length > this.windowSize) {
      this.buffer.shift();
    }
    
    // Return average
    return this.getAverage();
  }
  
  /**
   * Get current smoothed value without adding new data
   */
  getCurrentValue(): number {
    return this.getAverage();
  }
  
  /**
   * Get the buffer for debugging
   */
  getBuffer(): number[] {
    return [...this.buffer];
  }
  
  /**
   * Reset the smoother
   */
  reset(): void {
    this.buffer = [];
  }
  
  /**
   * Change window size
   */
  setWindowSize(size: number): void {
    this.windowSize = size;
    // Trim buffer if needed
    if (this.buffer.length > size) {
      this.buffer = this.buffer.slice(-size);
    }
  }
  
  /**
   * Get current window size
   */
  getWindowSize(): number {
    return this.windowSize;
  }
  
  /**
   * Check if buffer is full
   */
  isBufferFull(): boolean {
    return this.buffer.length >= this.windowSize;
  }
  
  private getAverage(): number {
    if (this.buffer.length === 0) return 0;
    
    const sum = this.buffer.reduce((acc, val) => acc + val, 0);
    return sum / this.buffer.length;
  }
}

/**
 * Circular Moving Average for Angles
 * 
 * Special smoother that handles angle wraparound (0°/360°).
 * Uses circular mean to avoid averaging errors near North.
 * 
 * Example problem without circular mean:
 * - Angles: [359°, 1°, 2°]
 * - Regular average: (359 + 1 + 2) / 3 = 120.67° ❌ WRONG!
 * - Circular mean: ~0.67° ✓ CORRECT!
 */
export class CircularMovingAverageSmoother {
  private sinBuffer: number[] = [];
  private cosBuffer: number[] = [];
  private windowSize: number;
  
  constructor(windowSize: number = 5) {
    this.windowSize = windowSize;
  }
  
  /**
   * Add a new angle and get the smoothed result
   * 
   * @param angleDegrees - New angle in degrees (0-360)
   * @returns Smoothed angle in degrees (0-360)
   */
  addValue(angleDegrees: number): number {
    // Convert to radians
    const angleRadians = (angleDegrees * Math.PI) / 180;
    
    // Store as sin/cos components
    this.sinBuffer.push(Math.sin(angleRadians));
    this.cosBuffer.push(Math.cos(angleRadians));
    
    // Keep buffer size within window
    if (this.sinBuffer.length > this.windowSize) {
      this.sinBuffer.shift();
      this.cosBuffer.shift();
    }
    
    return this.getCircularMean();
  }
  
  /**
   * Get current smoothed angle without adding new data
   */
  getCurrentValue(): number {
    return this.getCircularMean();
  }
  
  /**
   * Reset the smoother
   */
  reset(): void {
    this.sinBuffer = [];
    this.cosBuffer = [];
  }
  
  /**
   * Change window size
   */
  setWindowSize(size: number): void {
    this.windowSize = size;
    if (this.sinBuffer.length > size) {
      this.sinBuffer = this.sinBuffer.slice(-size);
      this.cosBuffer = this.cosBuffer.slice(-size);
    }
  }
  
  /**
   * Get current window size
   */
  getWindowSize(): number {
    return this.windowSize;
  }
  
  /**
   * Check if buffer is full
   */
  isBufferFull(): boolean {
    return this.sinBuffer.length >= this.windowSize;
  }
  
  private getCircularMean(): number {
    if (this.sinBuffer.length === 0) return 0;
    
    // Average the sin and cos components
    const avgSin = this.sinBuffer.reduce((acc, val) => acc + val, 0) / this.sinBuffer.length;
    const avgCos = this.cosBuffer.reduce((acc, val) => acc + val, 0) / this.cosBuffer.length;
    
    // Convert back to angle
    let angleDegrees = (Math.atan2(avgSin, avgCos) * 180) / Math.PI;
    
    // Normalize to 0-360
    if (angleDegrees < 0) {
      angleDegrees += 360;
    }
    
    return angleDegrees;
  }
}

/**
 * Exponential Moving Average (EMA) Smoother
 * 
 * Gives more weight to recent values.
 * More responsive than SMA but still smooths jitter.
 * 
 * Alpha (smoothing factor):
 * - Higher alpha (0.5-1.0) = more responsive, less smooth
 * - Lower alpha (0.1-0.3) = less responsive, more smooth
 */
export class ExponentialSmoother {
  private currentValue: number | null = null;
  private alpha: number;
  
  constructor(alpha: number = 0.3) {
    this.alpha = alpha;
  }
  
  /**
   * Add a new value and get the smoothed result
   * 
   * @param value - New sensor reading
   * @returns Smoothed value
   */
  addValue(value: number): number {
    if (this.currentValue === null) {
      // First value, no smoothing needed
      this.currentValue = value;
    } else {
      // EMA formula: newValue = alpha * current + (1 - alpha) * previous
      this.currentValue = this.alpha * value + (1 - this.alpha) * this.currentValue;
    }
    
    return this.currentValue;
  }
  
  /**
   * Get current smoothed value
   */
  getCurrentValue(): number {
    return this.currentValue ?? 0;
  }
  
  /**
   * Reset the smoother
   */
  reset(): void {
    this.currentValue = null;
  }
  
  /**
   * Change alpha (smoothing factor)
   */
  setAlpha(alpha: number): void {
    this.alpha = Math.max(0, Math.min(1, alpha)); // Clamp to 0-1
  }
  
  /**
   * Get current alpha
   */
  getAlpha(): number {
    return this.alpha;
  }
}

/**
 * Helper: Create smoother based on configuration
 */
export const createAngleSmoother = (windowSize: number): CircularMovingAverageSmoother => {
  return new CircularMovingAverageSmoother(windowSize);
};
