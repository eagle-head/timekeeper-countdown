export function Formatter() {
  // Função auxiliar para sanitizar entrada
  function sanitizeSeconds(totalSeconds: number): number {
    if (typeof totalSeconds !== "number" || !Number.isFinite(totalSeconds)) {
      return 0; // Valor seguro
    }
    return Math.floor(Math.max(0, Math.min(totalSeconds, Number.MAX_SAFE_INTEGER)));
  }

  // Função auxiliar para formatação segura
  function safeFormat(value: number, padLength: number = 2): string {
    try {
      if (!Number.isFinite(value) || value < 0) {
        return "0".repeat(padLength);
      }
      return Math.floor(value).toString().padStart(padLength, "0");
    } catch {
      return "0".repeat(padLength);
    }
  }

  function formatTime(totalSeconds: number): {
    minutes: string;
    seconds: string;
  } {
    const safeSeconds = sanitizeSeconds(totalSeconds);
    const minutes = safeFormat(Math.floor(safeSeconds / 60));
    const seconds = safeFormat(safeSeconds % 60);

    return { minutes, seconds };
  }

  function formatMinutes(totalSeconds: number): string {
    const safeSeconds = sanitizeSeconds(totalSeconds);
    return safeFormat(Math.floor(safeSeconds / 60));
  }

  function formatSeconds(totalSeconds: number): string {
    const safeSeconds = sanitizeSeconds(totalSeconds);
    return safeFormat(safeSeconds % 60);
  }

  function formatHours(totalSeconds: number): string {
    const safeSeconds = sanitizeSeconds(totalSeconds);
    const hours = Math.floor(safeSeconds / 3600) % 24;
    return safeFormat(hours);
  }

  function formatDays(totalSeconds: number): string {
    const safeSeconds = sanitizeSeconds(totalSeconds);
    const days = Math.floor(safeSeconds / 86400) % 7;
    return safeFormat(days);
  }

  function formatWeeks(totalSeconds: number): string {
    const safeSeconds = sanitizeSeconds(totalSeconds);
    const weeks = Math.floor(safeSeconds / 604800) % 52;
    return safeFormat(weeks);
  }

  function formatYears(totalSeconds: number): string {
    const safeSeconds = sanitizeSeconds(totalSeconds);
    const years = Math.floor(safeSeconds / 31536000);
    return safeFormat(years);
  }

  return {
    formatTime,
    formatMinutes,
    formatSeconds,
    formatHours,
    formatDays,
    formatWeeks,
    formatYears,
  };
}
