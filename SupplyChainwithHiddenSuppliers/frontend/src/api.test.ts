import { describe, it, expect } from 'vitest';
import { hexToBytes, bytesToHex, CLAIM_LABELS } from './api';

describe('hexToBytes / bytesToHex', () => {
  it('round-trips byte arrays', () => {
    const bytes = new Uint8Array([0x00, 0x01, 0x7f, 0x80, 0xff]);
    expect(hexToBytes(bytesToHex(bytes))).toEqual(bytes);
  });

  it('handles a 0x prefix and leading zeroes', () => {
    const bytes = hexToBytes('0x0abc');
    expect(bytes.length).toBe(2);
    expect(bytes[0]).toBe(0x0a);
    expect(bytes[1]).toBe(0xbc);
  });

  it('maps a known hex string', () => {
    expect(bytesToHex(new Uint8Array([0xde, 0xad, 0xbe, 0xef]))).toBe('deadbeef');
  });
});

describe('CLAIM_LABELS', () => {
  it('labels every public claim for the dashboard', () => {
    expect(CLAIM_LABELS.isEthical).toContain('Ethical');
    expect(CLAIM_LABELS.allCertified).toContain('certified');
    expect(CLAIM_LABELS.allRoutesCompliant).toContain('compliant');
    expect(CLAIM_LABELS.fairPricing).toContain('pricing');
  });
});
