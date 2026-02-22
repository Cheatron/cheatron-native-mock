import { expect, test, describe } from 'bun:test';
import { PsapiImpl, Kernel32Impl } from '../../src';

describe('PSAPI Simulation', () => {
  test('GetModuleInformation', () => {
    const hProcess = Kernel32Impl.GetCurrentProcess();
    const hModule = Kernel32Impl.GetModuleHandleW('kernel32.dll');

    const info = Buffer.alloc(24); // MODULEINFO size (x64)
    const success = PsapiImpl.GetModuleInformation(
      hProcess,
      hModule,
      info,
      24 as never,
    );

    expect(success).toBe(1);
    expect(info.readBigUInt64LE(0)).toBe(BigInt(hModule as bigint)); // lpBaseOfDll
    expect(info.readUInt32LE(8)).toBeGreaterThan(0); // SizeOfImage
    expect(info.readBigUInt64LE(12)).toBeDefined(); // EntryPoint
  });

  test('GetModuleInformation with invalid module', () => {
    const hProcess = Kernel32Impl.GetCurrentProcess();
    const info = Buffer.alloc(24);
    const success = PsapiImpl.GetModuleInformation(
      hProcess,
      0x1234n as never,
      info,
      24 as never,
    );
    expect(success).toBe(0);
  });
});
