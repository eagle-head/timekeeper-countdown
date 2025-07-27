const LogLevel = Object.freeze({
  DEBUG: "DEBUG",
  INFO: "INFO",
  WARN: "WARN",
  ERROR: "ERROR",
  FATAL: "FATAL",
});

type LogLevel = (typeof LogLevel)[keyof typeof LogLevel];

const ErrorCategory = Object.freeze({
  VALIDATION: "VALIDATION",
  STATE: "STATE",
  INTERVAL: "INTERVAL",
  UI: "UI",
  SYSTEM: "SYSTEM",
  NETWORK: "NETWORK",
  PERFORMANCE: "PERFORMANCE",
});

type ErrorCategory = (typeof ErrorCategory)[keyof typeof ErrorCategory];

const ErrorSeverity = Object.freeze({
  LOW: "LOW",
  MEDIUM: "MEDIUM",
  HIGH: "HIGH",
  CRITICAL: "CRITICAL",
});

type ErrorSeverity = (typeof ErrorSeverity)[keyof typeof ErrorSeverity];

interface LogContext {
  category?: ErrorCategory;
  severity?: ErrorSeverity;
  errorCode?: string;
  stack?: string;
  metadata?: Record<string, unknown>;
  timestamp?: string;
}

function createTimerLogger(enabled: boolean = false) {
  // Validação defensiva do parâmetro enabled
  const safeEnabled = typeof enabled === "boolean" ? enabled : false;
  let currentEnabled = safeEnabled;
  
  const prefix = "[TIMER]";

  function getEmoji(level: LogLevel): string {
    try {
      switch (level) {
        case LogLevel.DEBUG:
          return "🔍";
        case LogLevel.INFO:
          return "📊";
        case LogLevel.WARN:
          return "⚠️";
        case LogLevel.ERROR:
          return "❌";
        case LogLevel.FATAL:
          return "💀";
        default:
          return "📝";
      }
    } catch {
      return "📝";
    }
  }

  function getCategoryEmoji(category?: ErrorCategory): string {
    if (!category) return "";
    
    try {
      switch (category) {
        case ErrorCategory.VALIDATION:
          return "🔒";
        case ErrorCategory.STATE:
          return "🔄";
        case ErrorCategory.INTERVAL:
          return "⏱️";
        case ErrorCategory.UI:
          return "🖥️";
        case ErrorCategory.SYSTEM:
          return "⚙️";
        case ErrorCategory.NETWORK:
          return "🌐";
        case ErrorCategory.PERFORMANCE:
          return "⚡";
        default:
          return "";
      }
    } catch {
      return "";
    }
  }

  function getSeverityColor(severity?: ErrorSeverity): string {
    if (!severity) return "";
    
    try {
      switch (severity) {
        case ErrorSeverity.LOW:
          return "\x1b[32m"; // Green
        case ErrorSeverity.MEDIUM:
          return "\x1b[33m"; // Yellow
        case ErrorSeverity.HIGH:
          return "\x1b[31m"; // Red
        case ErrorSeverity.CRITICAL:
          return "\x1b[41m\x1b[37m"; // Red background, white text
        default:
          return "";
      }
    } catch {
      return "";
    }
  }

  function formatLogEntry(
    level: LogLevel, 
    message: string, 
    context?: LogContext
  ): { formattedMessage: string; logData?: Record<string, unknown> } {
    try {
      const timestamp = context?.timestamp || new Date().toISOString();
      const levelEmoji = getEmoji(level);
      const categoryEmoji = getCategoryEmoji(context?.category);
      const severityColor = getSeverityColor(context?.severity);
      const resetColor = "\x1b[0m";
      
      let formattedMessage = `${levelEmoji} ${prefix}`;
      
      if (categoryEmoji) {
        formattedMessage += ` ${categoryEmoji}`;
      }
      
      if (context?.errorCode) {
        formattedMessage += ` [${context.errorCode}]`;
      }
      
      if (severityColor) {
        formattedMessage = `${severityColor}${formattedMessage} ${message}${resetColor}`;
      } else {
        formattedMessage += ` ${message}`;
      }

      const logData: Record<string, unknown> = {
        timestamp,
        level,
        ...(context?.category && { category: context.category }),
        ...(context?.severity && { severity: context.severity }),
        ...(context?.errorCode && { errorCode: context.errorCode }),
        ...(context?.stack && { stack: context.stack }),
        ...(context?.metadata && { metadata: context.metadata }),
      };

      return { 
        formattedMessage, 
        logData: Object.keys(logData).length > 2 ? logData : undefined 
      };
    } catch {
      return { 
        formattedMessage: `${getEmoji(level)} ${prefix} ${message}` 
      };
    }
  }

  function log(
    level: LogLevel,
    message: string,
    context?: LogContext | Record<string, unknown>
  ): void {
    if (!currentEnabled) return;

    try {
      if (!Object.values(LogLevel).includes(level)) {
        level = LogLevel.INFO;
      }
      
      if (typeof message !== "string") {
        message = String(message || "");
      }

      // Check if context is LogContext or legacy data format
      let logContext: LogContext | undefined;
      let legacyData: Record<string, unknown> | undefined;

      if (context) {
        if ('category' in context || 'severity' in context || 'errorCode' in context) {
          logContext = context as LogContext;
        } else {
          legacyData = context as Record<string, unknown>;
        }
      }

      const { formattedMessage, logData } = formatLogEntry(level, message, logContext);

      // Choose appropriate console method based on level
      const consoleMethod = level === LogLevel.ERROR || level === LogLevel.FATAL 
        ? console.error 
        : level === LogLevel.WARN 
        ? console.warn 
        : console.log;

      if (logData || legacyData) {
        consoleMethod(formattedMessage, logData || legacyData);
      } else {
        consoleMethod(formattedMessage);
      }
    } catch (error) {
      try {
        console.log(`[TIMER] Logging error: ${error}`);
      } catch {
        // Silent fallback
      }
    }
  }

  return {
    enable: () => {
      currentEnabled = true;
    },
    disable: () => {
      currentEnabled = false;
    },
    isEnabled: () => currentEnabled,

    debug: (message: string, context?: LogContext | Record<string, unknown>) => {
      log(LogLevel.DEBUG, message, context);
    },

    info: (message: string, context?: LogContext | Record<string, unknown>) => {
      log(LogLevel.INFO, message, context);
    },

    warn: (message: string, context?: LogContext | Record<string, unknown>) => {
      log(LogLevel.WARN, message, context);
    },

    error: (message: string, context?: LogContext | Record<string, unknown>) => {
      log(LogLevel.ERROR, message, context);
    },

    fatal: (message: string, context?: LogContext | Record<string, unknown>) => {
      log(LogLevel.FATAL, message, context);
    },

    // Enhanced error logging with automatic categorization
    logError: (
      message: string,
      error?: Error,
      category: ErrorCategory = ErrorCategory.SYSTEM,
      severity: ErrorSeverity = ErrorSeverity.MEDIUM,
      errorCode?: string
    ) => {
      const context: LogContext = {
        category,
        severity,
        errorCode,
        stack: error?.stack,
        metadata: {
          errorName: error?.name,
          errorMessage: error?.message,
        },
      };
      log(LogLevel.ERROR, message, context);
    },

    // Performance logging
    logPerformance: (
      operation: string,
      duration: number,
      threshold?: number,
      metadata?: Record<string, unknown>
    ) => {
      const isSlowOperation = threshold ? duration > threshold : false;
      const level = isSlowOperation ? LogLevel.WARN : LogLevel.INFO;
      const severity = isSlowOperation ? ErrorSeverity.MEDIUM : ErrorSeverity.LOW;
      
      const context: LogContext = {
        category: ErrorCategory.PERFORMANCE,
        severity,
        metadata: {
          operation,
          duration: `${duration}ms`,
          threshold: threshold ? `${threshold}ms` : undefined,
          ...metadata,
        },
      };
      
      log(level, `Operation ${operation} took ${duration}ms`, context);
    },

    // State transition logging
    logStateTransition: (
      from: string,
      to: string,
      metadata?: Record<string, unknown>
    ) => {
      const context: LogContext = {
        category: ErrorCategory.STATE,
        severity: ErrorSeverity.LOW,
        metadata: {
          fromState: from,
          toState: to,
          ...metadata,
        },
      };
      log(LogLevel.DEBUG, `State transition: ${from} → ${to}`, context);
    },

    // Validation error logging
    logValidationError: (
      message: string,
      field?: string,
      value?: unknown,
      errorCode?: string
    ) => {
      const context: LogContext = {
        category: ErrorCategory.VALIDATION,
        severity: ErrorSeverity.HIGH,
        errorCode,
        metadata: {
          field,
          value,
        },
      };
      log(LogLevel.ERROR, message, context);
    },

    // Legacy methods for backward compatibility
    stateChange: (
      from: string,
      to: string,
      context?: Record<string, unknown>
    ) => {
      const logContext: LogContext = {
        category: ErrorCategory.STATE,
        severity: ErrorSeverity.LOW,
        metadata: context,
      };
      log(LogLevel.DEBUG, `State transition: ${from} → ${to}`, logContext);
    },

    functionCall: (
      functionName: string,
      state: string,
      context?: Record<string, unknown>
    ) => {
      const logContext: LogContext = {
        category: ErrorCategory.SYSTEM,
        severity: ErrorSeverity.LOW,
        metadata: {
          currentState: state,
          ...context,
        },
      };
      log(LogLevel.DEBUG, `${functionName}() called`, logContext);
    },

    functionResult: (
      functionName: string,
      result: "success" | "ignored",
      reason?: string
    ) => {
      const level = result === "success" ? LogLevel.INFO : LogLevel.WARN;
      const severity = result === "success" ? ErrorSeverity.LOW : ErrorSeverity.MEDIUM;
      const message =
        result === "success"
          ? `${functionName}() completed successfully`
          : `${functionName}() ignored - ${reason}`;
      
      const logContext: LogContext = {
        category: ErrorCategory.SYSTEM,
        severity,
        metadata: { result, reason },
      };
      log(level, message, logContext);
    },

    intervalEvent: (
      action: "created" | "tick" | "cleared",
      context?: Record<string, unknown>
    ) => {
      const logContext: LogContext = {
        category: ErrorCategory.INTERVAL,
        severity: ErrorSeverity.LOW,
        metadata: context,
      };
      log(LogLevel.DEBUG, `Interval ${action}`, logContext);
    },

    uiUpdate: (minutes: string, seconds: string) => {
      const logContext: LogContext = {
        category: ErrorCategory.UI,
        severity: ErrorSeverity.LOW,
        metadata: { minutes, seconds },
      };
      log(LogLevel.DEBUG, `UI updated: ${minutes}:${seconds}`, logContext);
    },
  };
}

export { 
  createTimerLogger as TimerLogger, 
  LogLevel, 
  ErrorCategory, 
  ErrorSeverity,
  type LogContext 
};
