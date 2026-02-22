import { expect, test, describe } from 'bun:test';
import { Kernel32Impl } from '../../src';

describe('Kernel32 Thread Management', () => {
  test('GetCurrentThread and GetThreadId', () => {
    const hThread = Kernel32Impl.GetCurrentThread();
    expect(hThread).toBeDefined();

    const tid = Kernel32Impl.GetCurrentThreadId();
    expect(tid).toBeGreaterThan(0);

    const handleTid = Kernel32Impl.GetThreadId(hThread);
    expect(handleTid).toBe(tid);
  });

  test('CreateRemoteThread and Lifecycle', () => {
    const hProcess = Kernel32Impl.GetCurrentProcess();
    const tidBuf = Buffer.alloc(4);

    const hThread = Kernel32Impl.CreateRemoteThread(
      hProcess,
      null,
      0n as never,
      0x1000n as never, // Dummy start address
      null,
      0,
      tidBuf,
    );

    expect(hThread).not.toBe(0n as never);
    const tid = tidBuf.readUInt32LE(0);
    expect(tid).toBeGreaterThan(0);
    expect(Kernel32Impl.GetThreadId(hThread)).toBe(tid);

    // Suspend/Resume
    expect(Kernel32Impl.SuspendThread(hThread)).toBe(0); // Prev suspend count
    expect(Kernel32Impl.ResumeThread(hThread)).toBe(0); // New suspend count

    // Waiting and Exit Code
    Kernel32Impl.WaitForSingleObject(hThread, 100);

    const exitCodeBuf = Buffer.alloc(4);
    Kernel32Impl.GetExitCodeThread(hThread, exitCodeBuf);
    expect(exitCodeBuf.readUInt32LE(0)).toBe(0); // Marked as TERMINATED by wait simulation

    Kernel32Impl.CloseHandle(hThread);
  });

  test('Thread Context', () => {
    const hThread = Kernel32Impl.GetCurrentThread();
    const ctx = Buffer.alloc(1232); // CONTEXT size

    // Set Flags (not functionally used in mock yet, but should return 1)
    expect(Kernel32Impl.GetThreadContext(hThread, ctx)).toBe(1);
    expect(Kernel32Impl.SetThreadContext(hThread, ctx)).toBe(1);
  });
});
