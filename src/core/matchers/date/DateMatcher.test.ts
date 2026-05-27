import { describe, it, expect } from 'vitest';
import { DateMatcher } from './DateMatcher';

describe('DateMatcher', () => {
  const matcher = new DateMatcher();

  it('detects slash format DD/MM/YYYY', () => {
    const result = matcher.match('Evento el 25/12/2024');
    expect(result.length).toBe(1);
    expect(result[0].start).toBe(10);
    expect(result[0].end).toBe(20);
    expect(result[0].replacement).toContain('25/12/2024');
    expect(result[0].replacement).toContain('calendar.google.com');
  });

  it('detects dash format YYYY-MM-DD', () => {
    const result = matcher.match('Evento el 2024-12-25');
    expect(result.length).toBe(1);
    expect(result[0].replacement).toContain('2024-12-25');
  });

  it('detects multiple dates', () => {
    const result = matcher.match('Del 25/12/2024 al 31/12/2024');
    expect(result.length).toBe(2);
  });

  it('detects slash format YYYY/MM/DD', () => {
    const result = matcher.match('Evento el 2023/04/12');
    expect(result.length).toBe(1);
    expect(result[0].replacement).toContain('2023/04/12');
  });

  it('returns empty for no dates', () => {
    const result = matcher.match('Sin fechas aqui');
    expect(result).toEqual([]);
  });
});