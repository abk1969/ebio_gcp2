/**
 * Système de logging structuré pour l'application EBIOS RM
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: string;
  data?: any;
  userId?: string;
  sessionId?: string;
}

class Logger {
  private minLevel: LogLevel;
  private sessionId: string;
  private logs: LogEntry[] = [];
  private maxLogs: number = 1000;

  constructor(minLevel: LogLevel = LogLevel.INFO) {
    this.minLevel = minLevel;
    this.sessionId = this.generateSessionId();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.minLevel;
  }

  private formatMessage(level: LogLevel, message: string, context?: string): string {
    const levelName = LogLevel[level];
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` [${context}]` : '';
    return `${timestamp} ${levelName}${contextStr}: ${message}`;
  }

  private log(level: LogLevel, message: string, context?: string, data?: any): void {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      data,
      sessionId: this.sessionId
    };

    // Ajouter à la liste des logs
    this.logs.push(entry);
    
    // Limiter le nombre de logs en mémoire
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Log vers la console
    const formattedMessage = this.formatMessage(level, message, context);
    
    switch (level) {
      case LogLevel.DEBUG:
        console.debug(formattedMessage, data);
        break;
      case LogLevel.INFO:
        console.info(formattedMessage, data);
        break;
      case LogLevel.WARN:
        console.warn(formattedMessage, data);
        break;
      case LogLevel.ERROR:
        console.error(formattedMessage, data);
        break;
    }

    // En production, envoyer vers un service de logging externe
    if (process.env.NODE_ENV === 'production') {
      this.sendToExternalService(entry);
    }
  }

  private async sendToExternalService(entry: LogEntry): Promise<void> {
    try {
      // Ici, vous pourriez envoyer vers un service comme Sentry, LogRocket, etc.
      // Pour l'instant, on stocke juste en localStorage pour debug
      const existingLogs = localStorage.getItem('ebios_logs');
      const logs = existingLogs ? JSON.parse(existingLogs) : [];
      logs.push(entry);
      
      // Garder seulement les 100 derniers logs en localStorage
      if (logs.length > 100) {
        logs.splice(0, logs.length - 100);
      }
      
      localStorage.setItem('ebios_logs', JSON.stringify(logs));
    } catch (error) {
      console.error('Failed to send log to external service:', error);
    }
  }

  debug(message: string, context?: string, data?: any): void {
    this.log(LogLevel.DEBUG, message, context, data);
  }

  info(message: string, context?: string, data?: any): void {
    this.log(LogLevel.INFO, message, context, data);
  }

  warn(message: string, context?: string, data?: any): void {
    this.log(LogLevel.WARN, message, context, data);
  }

  error(message: string, context?: string, data?: any): void {
    this.log(LogLevel.ERROR, message, context, data);
  }

  // Méthodes utilitaires
  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  getLogsForLevel(level: LogLevel): LogEntry[] {
    return this.logs.filter(log => log.level === level);
  }

  clearLogs(): void {
    this.logs = [];
    localStorage.removeItem('ebios_logs');
  }

  setMinLevel(level: LogLevel): void {
    this.minLevel = level;
  }

  getSessionId(): string {
    return this.sessionId;
  }

  // Méthodes spécialisées pour EBIOS RM
  logAgentCall(stepId: number, success: boolean, duration: number, error?: string): void {
    this.info(
      `Agent call for step ${stepId} ${success ? 'succeeded' : 'failed'}`,
      'AGENT',
      { stepId, success, duration, error }
    );
  }

  logUserAction(action: string, details?: any): void {
    this.info(
      `User action: ${action}`,
      'USER',
      details
    );
  }

  logSecurityEvent(event: string, severity: 'low' | 'medium' | 'high', details?: any): void {
    const level = severity === 'high' ? LogLevel.ERROR : 
                  severity === 'medium' ? LogLevel.WARN : LogLevel.INFO;
    
    this.log(
      level,
      `Security event: ${event}`,
      'SECURITY',
      { severity, ...details }
    );
  }

  logPerformance(operation: string, duration: number, details?: any): void {
    const level = duration > 5000 ? LogLevel.WARN : LogLevel.DEBUG;
    this.log(
      level,
      `Performance: ${operation} took ${duration}ms`,
      'PERFORMANCE',
      { operation, duration, ...details }
    );
  }
}

// Instance singleton
const logger = new Logger(
  process.env.NODE_ENV === 'development' ? LogLevel.DEBUG : LogLevel.INFO
);

export default logger;
