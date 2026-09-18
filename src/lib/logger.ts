type LogLevel = "debug" | "info" | "warn" | "error";
type LogFields = Record<string, unknown>;

const secretKeyPattern = /authorization|cookie|password|secret|token|database_url/i;

function redact(fields: LogFields): LogFields {
  return Object.fromEntries(
    Object.entries(fields).map(([key, value]) => [key, secretKeyPattern.test(key) ? "[REDACTED]" : value]),
  );
}

function log(level: LogLevel, message: string, fields: LogFields = {}): void {
  console[level](
    JSON.stringify({
      timestamp: new Date().toISOString(),
      level,
      message,
      ...redact(fields),
    }),
  );
}

export const logger = {
  debug: (message: string, fields?: LogFields) => log("debug", message, fields),
  info: (message: string, fields?: LogFields) => log("info", message, fields),
  warn: (message: string, fields?: LogFields) => log("warn", message, fields),
  error: (message: string, fields?: LogFields) => log("error", message, fields),
};
