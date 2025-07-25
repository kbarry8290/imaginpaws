import { Platform } from 'react-native';

// Ring buffer to store recent logs
class LogBuffer {
  private buffer: Array<{ level: string; message: string; timestamp: number }>;
  private maxSize: number;
  private currentIndex: number;

  constructor(size: number) {
    this.buffer = new Array(size);
    this.maxSize = size;
    this.currentIndex = 0;
  }

  add(level: string, message: string) {
    this.buffer[this.currentIndex] = {
      level,
      message,
      timestamp: Date.now(),
    };
    this.currentIndex = (this.currentIndex + 1) % this.maxSize;
  }

  getRecent(): string {
    const sortedLogs = [...this.buffer]
      .filter(Boolean)
      .sort((a, b) => a.timestamp - b.timestamp);
    
    return sortedLogs
      .map(log => `[${log.level}] ${new Date(log.timestamp).toISOString()}: ${log.message}`)
      .join('\n');
  }
}

// Create a singleton instance
const logBuffer = new LogBuffer(50);

// Original console methods
const originalConsole = {
  log: console.log,
  warn: console.warn,
  error: console.error,
};

// Override console methods
console.log = (...args: any[]) => {
  const message = args.map(arg => 
    typeof arg === 'string' ? arg : JSON.stringify(arg)
  ).join(' ');
  logBuffer.add('log', message);
  originalConsole.log.apply(console, args);
};

console.warn = (...args: any[]) => {
  const message = args.map(arg => 
    typeof arg === 'string' ? arg : JSON.stringify(arg)
  ).join(' ');
  logBuffer.add('warn', message);
  originalConsole.warn.apply(console, args);
};

console.error = (...args: any[]) => {
  const message = args.map(arg => 
    typeof arg === 'string' ? arg : JSON.stringify(arg)
  ).join(' ');
  logBuffer.add('error', message);
  originalConsole.error.apply(console, args);
};

export function getRecentLogs(): string {
  return logBuffer.getRecent();
}