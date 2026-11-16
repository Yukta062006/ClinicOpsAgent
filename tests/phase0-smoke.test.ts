import { describe, it, expect } from 'vitest';
import { apiAuth, apiTts } from '../src/utils/api';

describe('Phase 0 Test Harness & Sanity Checks', () => {
  it('loads API utility modules without throwing', () => {
    expect(typeof apiAuth.login).toBe('function');
    expect(typeof apiAuth.register).toBe('function');
    expect(typeof apiTts.getStatus).toBe('function');
  });

  it('calculates deterministic queue priorities correctly', () => {
    const normalQueue = [
      { id: '1', priority: 'normal', arrivalTime: '10:00' },
      { id: '2', priority: 'urgent', arrivalTime: '10:15' },
      { id: '3', priority: 'normal', arrivalTime: '09:45' },
    ];

    const sorted = [...normalQueue].sort((a, b) => {
      if (a.priority === 'urgent' && b.priority !== 'urgent') return -1;
      if (b.priority === 'urgent' && a.priority !== 'urgent') return 1;
      return a.arrivalTime.localeCompare(b.arrivalTime);
    });

    expect(sorted[0].id).toBe('2'); // Urgent first
    expect(sorted[1].id).toBe('3'); // Earliest normal
    expect(sorted[2].id).toBe('1'); // Later normal
  });

  it('validates sequential token format requirements', () => {
    const formatToken = (num: number): string => String(num).padStart(3, '0');
    expect(formatToken(1)).toBe('001');
    expect(formatToken(42)).toBe('042');
    expect(formatToken(999)).toBe('999');
    expect(formatToken(1000)).toBe('1000');
  });
});
