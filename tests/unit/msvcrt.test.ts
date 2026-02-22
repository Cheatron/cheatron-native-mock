import { expect, test, describe } from 'bun:test';
import { MsvcrtImpl, Kernel32Impl } from '../../src';

describe('MSVCRT Simulation', () => {
  test('malloc and free', () => {
    const size = 256;
    const ptr = MsvcrtImpl.malloc(size as never);
    expect(ptr).not.toBe(0n as never);

    // Test if memory is actually allocated in current process
    const hProcess = Kernel32Impl.GetCurrentProcess();
    const info = Buffer.alloc(48);
    const result = Kernel32Impl.VirtualQueryEx(
      hProcess,
      ptr as never,
      info,
      48,
    );
    expect(Number(result)).toBeGreaterThan(0);
    expect(info.readUInt32LE(32)).toBe(0x1000); // MEM_COMMIT

    MsvcrtImpl.free(ptr);
  });

  test('memcpy and memcmp', () => {
    const src = Buffer.from('Source Data');
    const dest = Buffer.alloc(src.length);

    MsvcrtImpl.memcpy(dest, src, src.length as never);
    expect(dest.toString()).toBe(src.toString());

    expect(MsvcrtImpl.memcmp(dest, src, src.length as never)).toBe(0);

    const diff = Buffer.from('Diff Data ');
    expect(MsvcrtImpl.memcmp(dest, diff, diff.length as never)).not.toBe(0);
  });

  test('memset', () => {
    const buf = Buffer.alloc(10, 0);
    MsvcrtImpl.memset(buf, 0x41, 5 as never); // 'A'

    expect(buf[0]).toBe(0x41);
    expect(buf[4]).toBe(0x41);
    expect(buf[5]).toBe(0);
  });
});
