import { expect, test, describe } from 'bun:test';
import { Kernel32Impl, MsvcrtImpl, PsapiImpl } from '../../src';

describe('Bindings Integration Verification', () => {
  test('VirtualFree should decommit memory', () => {
    // AllocationType: MEM_COMMIT (0x1000)
    const addr = Kernel32Impl.VirtualAlloc(0n as never, 4096, 0x1000, 0x04);
    expect(addr).not.toBe(0n as never);

    // MEM_DECOMMIT (0x4000)
    const success = Kernel32Impl.VirtualFree(addr, 4096, 0x4000);
    expect(success).toBe(1);
  });

  test('memcmp should compare buffers and simulated memory', () => {
    const buf1 = Buffer.from('cheatron');
    const buf2 = Buffer.from('cheatron');
    const buf3 = Buffer.from('detected');

    expect(MsvcrtImpl.memcmp(buf1, buf2, 8)).toBe(0);
    expect(MsvcrtImpl.memcmp(buf1, buf3, 8)).not.toBe(0);
  });

  test('GetModuleInformation should return simulated module info', () => {
    const hProc = Kernel32Impl.GetCurrentProcess();
    const hMod = Kernel32Impl.GetModuleHandleW('kernel32.dll');
    const info = Buffer.alloc(24);

    const success = PsapiImpl.GetModuleInformation(hProc, hMod, info, 24);
    expect(success).toBe(1);

    const baseAddr = info.readBigUInt64LE(0);
    expect(baseAddr).toBe(BigInt(hMod as bigint));
  });
});
