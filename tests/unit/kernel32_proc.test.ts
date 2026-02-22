import { expect, test, describe } from 'bun:test';
import { Kernel32Impl } from '../../src';

describe('Kernel32 Process Management', () => {
  test('GetCurrentProcess and GetProcessId', () => {
    const hProcess = Kernel32Impl.GetCurrentProcess();
    expect(hProcess).toBeDefined();

    const pid = Kernel32Impl.GetCurrentProcessId();
    expect(pid).toBeGreaterThan(0);

    const handlePid = Kernel32Impl.GetProcessId(hProcess);
    expect(handlePid).toBe(pid);
  });

  test('OpenProcess', () => {
    const pid = Kernel32Impl.GetCurrentProcessId();
    const hProcess = Kernel32Impl.OpenProcess(
      0x1fffff /* PROCESS_ALL_ACCESS */,
      0,
      pid,
    );
    expect(hProcess).not.toBe(0n as never);

    const handlePid = Kernel32Impl.GetProcessId(hProcess);
    expect(handlePid).toBe(pid);

    Kernel32Impl.CloseHandle(hProcess);
  });

  test('Pseudo-handle behavior', () => {
    const hProcess = Kernel32Impl.GetCurrentProcess();
    // Closing pseudo-handle should return true but not actually close it
    expect(Kernel32Impl.CloseHandle(hProcess)).toBe(1);
    expect(Kernel32Impl.GetProcessId(hProcess)).toBe(
      Kernel32Impl.GetCurrentProcessId(),
    );
  });
});
