import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Clipboard from 'expo-clipboard';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Debug flag - set to true to enable diagnostics
export const DEBUG_DIAGNOSTICS = true; // TODO: Change to env var or const

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  ts: number;
  level: LogLevel;
  tag: string;
  msg: string;
  data?: any;
  duration?: number;
}

export interface DeviceInfo {
  appVersion: string;
  buildNumber: string;
  platform: string;
  model: string;
  osVersion: string;
}

class DebugLogger {
  private buffer: LogEntry[] = [];
  private maxSize: number = 1000;
  private originalConsole: {
    log: typeof console.log;
    warn: typeof console.warn;
    error: typeof console.error;
  };

  constructor() {
    this.originalConsole = {
      log: console.log,
      warn: console.warn,
      error: console.error,
    };

    if (DEBUG_DIAGNOSTICS) {
      this.interceptConsole();
    }
  }

  private interceptConsole() {
    console.log = (...args) => {
      this.originalConsole.log(...args);
      this.log('info', 'CONSOLE', args.join(' '));
    };

    console.warn = (...args) => {
      this.originalConsole.warn(...args);
      this.log('warn', 'CONSOLE', args.join(' '));
    };

    console.error = (...args) => {
      this.originalConsole.error(...args);
      this.log('error', 'CONSOLE', args.join(' '));
    };
  }

  private redactSensitiveData(data: any): any {
    if (typeof data === 'string') {
      return this.redactString(data);
    }
    
    if (typeof data === 'object' && data !== null) {
      const redacted = { ...data };
      
      // Redact sensitive fields
      const sensitiveFields = ['access_token', 'refresh_token', 'code', 'password', 'email'];
      sensitiveFields.forEach(field => {
        if (redacted[field]) {
          redacted[field] = this.redactString(redacted[field]);
        }
      });
      
      // Recursively redact nested objects
      Object.keys(redacted).forEach(key => {
        if (typeof redacted[key] === 'object' && redacted[key] !== null) {
          redacted[key] = this.redactSensitiveData(redacted[key]);
        }
      });
      
      return redacted;
    }
    
    return data;
  }

  private redactString(str: string): string {
    if (str.length <= 8) {
      return '***';
    }
    
    // For emails, show first 4 and last 4 characters
    if (str.includes('@')) {
      const [local, domain] = str.split('@');
      const redactedLocal = local.length > 4 ? `${local.slice(0, 4)}***` : '***';
      const redactedDomain = domain.length > 4 ? `***${domain.slice(-4)}` : '***';
      return `${redactedLocal}@${redactedDomain}`;
    }
    
    // For tokens/codes, show first 4 and last 4 characters
    return `${str.slice(0, 4)}***${str.slice(-4)}`;
  }

  log(level: LogLevel, tag: string, msg: string, data?: any, duration?: number) {
    if (!DEBUG_DIAGNOSTICS) return;

    const entry: LogEntry = {
      ts: Date.now(),
      level,
      tag,
      msg,
      data: data ? this.redactSensitiveData(data) : undefined,
      duration,
    };

    this.buffer.push(entry);

    // Maintain ring buffer size
    if (this.buffer.length > this.maxSize) {
      this.buffer.shift();
    }
  }

  getAll(): LogEntry[] {
    return [...this.buffer];
  }

  clear() {
    this.buffer = [];
  }

  async flushToFile(): Promise<string> {
    if (!DEBUG_DIAGNOSTICS) return '';

    const deviceInfo = this.getDeviceInfo();
    const exportData = {
      deviceInfo,
      logs: this.buffer,
      exportedAt: new Date().toISOString(),
    };

    const fileName = `imaginpaws-debug-${Date.now()}.json`;
    const filePath = `${FileSystem.documentDirectory}${fileName}`;

    try {
      await FileSystem.writeAsStringAsync(filePath, JSON.stringify(exportData, null, 2));
      return filePath;
    } catch (error) {
      this.log('error', 'DEBUG_LOGGER', 'Failed to write debug log file', { error });
      throw error;
    }
  }

  async shareFile(): Promise<void> {
    if (!DEBUG_DIAGNOSTICS) return;

    try {
      const filePath = await this.flushToFile();
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(filePath, {
          mimeType: 'application/json',
          dialogTitle: 'Share Debug Logs',
        });
      } else {
        this.log('warn', 'DEBUG_LOGGER', 'Sharing not available on this device');
      }
    } catch (error) {
      this.log('error', 'DEBUG_LOGGER', 'Failed to share debug log file', { error });
      throw error;
    }
  }

  async copyToClipboard(): Promise<void> {
    if (!DEBUG_DIAGNOSTICS) return;

    try {
      const deviceInfo = this.getDeviceInfo();
      const exportData = {
        deviceInfo,
        logs: this.buffer,
        exportedAt: new Date().toISOString(),
      };

      const jsonString = JSON.stringify(exportData, null, 2);
      await Clipboard.setStringAsync(jsonString);
      
      this.log('info', 'DEBUG_LOGGER', 'Debug logs copied to clipboard');
    } catch (error) {
      this.log('error', 'DEBUG_LOGGER', 'Failed to copy debug logs to clipboard', { error });
      throw error;
    }
  }

  private getDeviceInfo(): DeviceInfo {
    return {
      appVersion: Constants.expoConfig?.version || 'unknown',
      buildNumber: Constants.expoConfig?.ios?.buildNumber || Constants.expoConfig?.android?.versionCode?.toString() || 'unknown',
      platform: Platform.OS,
      model: Platform.select({
        ios: Constants.deviceName || 'unknown',
        android: Constants.deviceName || 'unknown',
        default: 'unknown',
      }),
      osVersion: Platform.Version?.toString() || 'unknown',
    };
  }

  // Utility methods for timing
  time(): number {
    return Date.now();
  }

  duration(startTime: number): number {
    return Date.now() - startTime;
  }
}

// Global instance
export const debugLogger = new DebugLogger();

// Convenience functions
export const log = (level: LogLevel, tag: string, msg: string, data?: any, duration?: number) => {
  debugLogger.log(level, tag, msg, data, duration);
};

export const logInfo = (tag: string, msg: string, data?: any, duration?: number) => {
  debugLogger.log('info', tag, msg, data, duration);
};

export const logWarn = (tag: string, msg: string, data?: any, duration?: number) => {
  debugLogger.log('warn', tag, msg, data, duration);
};

export const logError = (tag: string, msg: string, data?: any, duration?: number) => {
  debugLogger.log('error', tag, msg, data, duration);
};

export const logDebug = (tag: string, msg: string, data?: any, duration?: number) => {
  debugLogger.log('debug', tag, msg, data, duration);
};

// Export the instance methods
export const getAll = () => debugLogger.getAll();
export const clear = () => debugLogger.clear();
export const flushToFile = () => debugLogger.flushToFile();
export const shareFile = () => debugLogger.shareFile();
export const copyToClipboard = () => debugLogger.copyToClipboard();
export const time = () => debugLogger.time();
export const duration = (startTime: number) => debugLogger.duration(startTime);
