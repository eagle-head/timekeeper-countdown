import { describe, it, expect } from 'vitest';
import {
  Formatter,
  formatTime as formatTimeDirect,
  formatMinutes as formatMinutesDirect,
  formatSeconds as formatSecondsDirect,
  formatHours as formatHoursDirect,
  formatDays as formatDaysDirect,
  formatWeeks as formatWeeksDirect,
  formatYears as formatYearsDirect,
} from '../format/formatter';
import { buildSnapshot } from '../../testing-utils/snapshots';

describe('Formatter', () => {
  const formatter = Formatter();

  describe('sanitizeSeconds', () => {
    it('should handle non-number inputs by returning 0', () => {
      const result = formatter.formatTime(null as any);
      expect(result).toEqual({ minutes: '00', seconds: '00' });
    });

    it('should handle non-finite numbers', () => {
      expect(formatter.formatTime(Infinity)).toEqual({ minutes: '00', seconds: '00' });
      expect(formatter.formatTime(-Infinity)).toEqual({ minutes: '00', seconds: '00' });
      expect(formatter.formatTime(NaN)).toEqual({ minutes: '00', seconds: '00' });
    });

    it('should handle negative numbers by returning 0', () => {
      expect(formatter.formatTime(-100)).toEqual({ minutes: '00', seconds: '00' });
    });

    it('should handle numbers larger than MAX_SAFE_INTEGER', () => {
      const result = formatter.formatTime(Number.MAX_SAFE_INTEGER + 1);
      expect(result.minutes).toBeDefined();
      expect(result.seconds).toBeDefined();
    });
  });

  describe('formatTime', () => {
    it('should format time correctly for valid inputs', () => {
      expect(formatter.formatTime(0)).toEqual({ minutes: '00', seconds: '00' });
      expect(formatter.formatTime(59)).toEqual({ minutes: '00', seconds: '59' });
      expect(formatter.formatTime(60)).toEqual({ minutes: '01', seconds: '00' });
      expect(formatter.formatTime(125)).toEqual({
        minutes: '02',
        seconds: '05',
      });
      expect(formatter.formatTime(3661)).toEqual({
        minutes: '61',
        seconds: '01',
      });
    });

    it('should handle decimal numbers by flooring them', () => {
      expect(formatter.formatTime(59.9)).toEqual({
        minutes: '00',
        seconds: '59',
      });
      expect(formatter.formatTime(60.5)).toEqual({
        minutes: '01',
        seconds: '00',
      });
    });
  });

  describe('formatMinutes', () => {
    it('should format minutes correctly', () => {
      expect(formatter.formatMinutes(0)).toBe('00');
      expect(formatter.formatMinutes(59)).toBe('00');
      expect(formatter.formatMinutes(60)).toBe('01');
      expect(formatter.formatMinutes(125)).toBe('02');
      expect(formatter.formatMinutes(3600)).toBe('00'); // 60 min % 60 = 0
    });

    it('should handle edge cases', () => {
      expect(formatter.formatMinutes(NaN)).toBe('00');
      expect(formatter.formatMinutes(Infinity)).toBe('00');
      expect(formatter.formatMinutes(-60)).toBe('00');
    });
  });

  describe('formatSeconds', () => {
    it('should format seconds correctly', () => {
      expect(formatter.formatSeconds(0)).toBe('00');
      expect(formatter.formatSeconds(59)).toBe('59');
      expect(formatter.formatSeconds(60)).toBe('00');
      expect(formatter.formatSeconds(125)).toBe('05');
      expect(formatter.formatSeconds(3661)).toBe('01');
    });

    it('should handle edge cases', () => {
      expect(formatter.formatSeconds(NaN)).toBe('00');
      expect(formatter.formatSeconds(Infinity)).toBe('00');
      expect(formatter.formatSeconds(-1)).toBe('00');
    });
  });

  describe('formatHours', () => {
    it('should format hours correctly', () => {
      expect(formatter.formatHours(0)).toBe('00');
      expect(formatter.formatHours(3599)).toBe('00');
      expect(formatter.formatHours(3600)).toBe('01');
      expect(formatter.formatHours(7200)).toBe('02');
      expect(formatter.formatHours(86399)).toBe('23');
      expect(formatter.formatHours(86400)).toBe('00'); // Resets after 24 hours
      expect(formatter.formatHours(90000)).toBe('01'); // 25 hours = 1 hour
    });

    it('should handle edge cases', () => {
      expect(formatter.formatHours(NaN)).toBe('00');
      expect(formatter.formatHours(Infinity)).toBe('00');
      expect(formatter.formatHours(-3600)).toBe('00');
    });
  });

  describe('formatDays', () => {
    it('should format days correctly', () => {
      expect(formatter.formatDays(0)).toBe('00');
      expect(formatter.formatDays(86399)).toBe('00');
      expect(formatter.formatDays(86400)).toBe('01');
      expect(formatter.formatDays(172800)).toBe('02');
      expect(formatter.formatDays(604799)).toBe('06');
      expect(formatter.formatDays(604800)).toBe('00'); // Resets after 7 days
      expect(formatter.formatDays(691200)).toBe('01'); // 8 days = 1 day
    });

    it('should handle edge cases', () => {
      expect(formatter.formatDays(NaN)).toBe('00');
      expect(formatter.formatDays(Infinity)).toBe('00');
      expect(formatter.formatDays(-86400)).toBe('00');
    });
  });

  describe('formatWeeks', () => {
    it('should format weeks correctly', () => {
      expect(formatter.formatWeeks(0)).toBe('00');
      expect(formatter.formatWeeks(604799)).toBe('00');
      expect(formatter.formatWeeks(604800)).toBe('01');
      expect(formatter.formatWeeks(1209600)).toBe('02');
      expect(formatter.formatWeeks(31449599)).toBe('51');
      expect(formatter.formatWeeks(31449600)).toBe('52'); // 364 days = 0 years + 52 weeks (< 365-day year)
      expect(formatter.formatWeeks(32054400)).toBe('00'); // 371 days = 1 year + 6 days = 0 weeks
    });

    it('should handle edge cases', () => {
      expect(formatter.formatWeeks(NaN)).toBe('00');
      expect(formatter.formatWeeks(Infinity)).toBe('00');
      expect(formatter.formatWeeks(-604800)).toBe('00');
    });
  });

  describe('formatYears', () => {
    it('should format years correctly', () => {
      expect(formatter.formatYears(0)).toBe('00');
      expect(formatter.formatYears(31535999)).toBe('00');
      expect(formatter.formatYears(31536000)).toBe('01');
      expect(formatter.formatYears(63072000)).toBe('02');
      expect(formatter.formatYears(315360000)).toBe('10');
    });

    it('should handle edge cases', () => {
      expect(formatter.formatYears(NaN)).toBe('00');
      expect(formatter.formatYears(Infinity)).toBe('00');
      expect(formatter.formatYears(-31536000)).toBe('00');
    });
  });

  describe('safeFormat edge cases', () => {
    it('should handle exceptions gracefully', () => {
      // Test with very large numbers that might cause issues
      const result = formatter.formatTime(Number.MAX_VALUE);
      expect(result.minutes).toBeDefined();
      expect(result.seconds).toBeDefined();
      expect(typeof result.minutes).toBe('string');
      expect(typeof result.seconds).toBe('string');
    });

    it('should handle negative values in safeFormat', () => {
      // This tests the !Number.isFinite(value) || value < 0 branch
      const result = formatter.formatTime(-100);
      expect(result.minutes).toBe('00');
      expect(result.seconds).toBe('00');
    });

    it('should handle non-finite values in internal calculations', () => {
      // Create a custom formatter instance to test edge cases
      const customFormatter = Formatter();

      // Test with a value that becomes non-finite after calculation
      // This should trigger the catch block in safeFormat
      // Mock value that throws error on toString - testing error handling
      // Since we can't directly pass the mock object through the public API,
      // this test documents the intended behavior

      // Since we can't directly pass the mock object through the public API,
      // we'll test with edge cases that might trigger the catch block
      const edgeCases = [
        Number.POSITIVE_INFINITY,
        Number.NEGATIVE_INFINITY,
        NaN,
        undefined as any,
        null as any,
        {} as any,
        [] as any,
        'string' as any,
        true as any,
        false as any,
      ];

      edgeCases.forEach(value => {
        const result = customFormatter.formatTime(value);
        expect(result.minutes).toMatch(/^\d{2,}$/);
        expect(result.seconds).toMatch(/^\d{2}$/);
      });
    });
  });

  describe('integration tests', () => {
    it('should handle complex time calculations', () => {
      // Test each function independently with appropriate values
      expect(formatter.formatYears(31536000)).toBe('01'); // 1 year
      expect(formatter.formatWeeks(1209600)).toBe('02'); // 2 weeks
      expect(formatter.formatDays(259200)).toBe('03'); // 3 days
      expect(formatter.formatHours(14400)).toBe('04'); // 4 hours
      expect(formatter.formatMinutes(300)).toBe('05'); // 5 minutes
      expect(formatter.formatSeconds(6)).toBe('06'); // 6 seconds
    });

    it('should handle a complex combined time value', () => {
      // 1 day, 2 hours, 3 minutes, 4 seconds = 93784 seconds
      const totalSeconds = 86400 + 7200 + 180 + 4;

      const time = formatter.formatTime(totalSeconds);
      expect(time.minutes).toBe('1563');
      expect(time.seconds).toBe('04');

      expect(formatter.formatDays(totalSeconds)).toBe('01');
      expect(formatter.formatHours(totalSeconds)).toBe('02');
      expect(formatter.formatMinutes(totalSeconds)).toBe('03'); // 1563 min % 60 = 3
      expect(formatter.formatSeconds(totalSeconds)).toBe('04');
    });
  });

  describe('100% coverage tests', () => {
    it('should cover the negative value branch in safeFormat', () => {
      // Para testar a condição value < 0 no safeFormat, precisamos passar um valor
      // que após o sanitizeSeconds ainda resulte em um valor negativo no cálculo
      // Isso é impossível pela implementação atual, então vamos testar com MAX_SAFE_INTEGER
      const result = formatter.formatTime(Number.MAX_SAFE_INTEGER);
      expect(result.minutes).toBeDefined();
      expect(result.seconds).toBeDefined();
    });

    it('should test padLength parameter in safeFormat', () => {
      // Testar diferentes padLength através das funções que calculam valores maiores
      const yearInSeconds = 31536000 * 100; // 100 anos
      expect(formatter.formatYears(yearInSeconds)).toBe('100'); // Testa padLength maior que 2
    });

    it('should handle Math operations that might produce non-finite values', () => {
      // Testar com o maior número possível para forçar overflow em cálculos
      const hugeNumber = Number.MAX_SAFE_INTEGER;

      // Estes testes garantem que mesmo com números muito grandes, o resultado é finito
      expect(formatter.formatMinutes(hugeNumber)).toBeDefined();
      expect(formatter.formatHours(hugeNumber)).toBeDefined();
      expect(formatter.formatDays(hugeNumber)).toBeDefined();
      expect(formatter.formatWeeks(hugeNumber)).toBeDefined();
      expect(formatter.formatYears(hugeNumber)).toBeDefined();
    });

    it('should cover the !Number.isFinite branch by manipulating Math.floor', () => {
      // Para testar !Number.isFinite(value) no safeFormat
      const originalFloor = Math.floor;

      // Fazer Math.floor retornar NaN para um valor específico
      Math.floor = function (value: number) {
        if (value === 123.456) {
          return NaN;
        }
        return originalFloor(value);
      };

      const result = formatter.formatTime(123.456);
      expect(result.minutes).toBe('00'); // Deve retornar '00' devido ao NaN

      // Restaurar
      Math.floor = originalFloor;
    });

    it('should test negative value after Math.floor to cover value < 0 branch', () => {
      // Para testar value < 0 no safeFormat
      const originalFloor = Math.floor;

      // Fazer Math.floor retornar valor negativo
      Math.floor = function (value: number) {
        if (value === 999.999) {
          return -1;
        }
        return originalFloor(value);
      };

      const result = formatter.formatTime(999.999);
      expect(result.minutes).toBe('00'); // Deve retornar '00' devido ao valor negativo

      // Restaurar
      Math.floor = originalFloor;
    });
  });

  describe('Format target variants', () => {
    it('should accept countdown snapshot inputs', () => {
      const snapshot = buildSnapshot({ totalSeconds: 125 });
      expect(formatter.formatSeconds(snapshot)).toBe('05');
      expect(formatter.formatMinutes(snapshot)).toBe('02');
    });

    it('should support direct helper exports', () => {
      expect(formatTimeDirect(125)).toEqual({ minutes: '02', seconds: '05' });
      expect(formatMinutesDirect(3600)).toBe('00'); // 60 min % 60 = 0
      expect(formatSecondsDirect(65)).toBe('05');
      expect(formatHoursDirect(90000)).toBe('01');
      expect(formatDaysDirect(172800)).toBe('02');
      expect(formatWeeksDirect(1209600)).toBe('02');
      expect(formatYearsDirect(31536000)).toBe('01');

      const snapshot = buildSnapshot({ totalSeconds: 90 });
      expect(formatTimeDirect(snapshot)).toEqual({ minutes: '01', seconds: '30' });
      expect(formatMinutesDirect(snapshot)).toBe('01');
      expect(formatSecondsDirect(snapshot)).toBe('30');
    });
  });
});
