import { expect, test, describe } from 'bun:test';
import { Kernel32Impl } from '../../src';

describe('Kernel32 Memory Management', () => {
  test('VirtualAllocEx and VirtualFreeEx', () => {
    const hProcess = Kernel32Impl.GetCurrentProcess();
    const size = 1024 * 16; // 4 pages

    // Allocate
    const addr = Kernel32Impl.VirtualAllocEx(
      hProcess,
      0n as never,
      size,
      0x1000 | 0x2000, // MEM_COMMIT | MEM_RESERVE
      0x04, // PAGE_READWRITE
    );
    expect(addr).not.toBe(0n as never);

    // Query
    const info = Buffer.alloc(48); // MEMORY_BASIC_INFORMATION size (x64)
    const result = Kernel32Impl.VirtualQueryEx(
      hProcess,
      addr as never,
      info,
      48,
    );
    expect(Number(result)).toBeGreaterThan(0);

    expect(info.readBigUInt64LE(0)).toBe(BigInt(addr as bigint)); // BaseAddress
    expect(info.readUInt32LE(32)).toBe(0x1000); // State (MEM_COMMIT)

    // Free - MEM_DECOMMIT
    let success = Kernel32Impl.VirtualFreeEx(
      hProcess,
      addr as never,
      size,
      0x4000,
    );
    expect(success).toBe(1);

    // Check state after decommit
    Kernel32Impl.VirtualQueryEx(hProcess, addr as never, info, 48);
    expect(info.readUInt32LE(32)).toBe(0x2000); // State (MEM_RESERVE)

    // Free - MEM_RELEASE
    success = Kernel32Impl.VirtualFreeEx(hProcess, addr as never, 0, 0x8000);
    expect(success).toBe(1);

    // Check state after release
    Kernel32Impl.VirtualQueryEx(hProcess, addr as never, info, 48);
    expect(info.readUInt32LE(32)).toBe(0x10000); // State (MEM_FREE)
  });

  test('ReadProcessMemory and WriteProcessMemory', () => {
    const hProcess = Kernel32Impl.GetCurrentProcess();
    const addr = Kernel32Impl.VirtualAlloc(0n as never, 1024, 0x1000, 0x04);

    const dataToWrite = Buffer.from('Cheatron OS Simulation Data');
    let success = Kernel32Impl.WriteProcessMemory(
      hProcess,
      addr as never,
      dataToWrite,
      dataToWrite.length,
      null,
    );
    expect(success).toBe(1);

    const readBuf = Buffer.alloc(dataToWrite.length);
    success = Kernel32Impl.ReadProcessMemory(
      hProcess,
      addr as never,
      readBuf,
      readBuf.length,
      null,
    );
    expect(success).toBe(1);
    expect(readBuf.toString()).toBe(dataToWrite.toString());

    Kernel32Impl.VirtualFree(addr as never, 0, 0x8000);
  });
});
