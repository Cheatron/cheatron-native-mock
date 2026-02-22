import * as Def from '@cheatron/win32-ext';
import { kernel } from './os/kernel';
import { SimulatedProcess } from './os/process';
import { SimulatedThread } from './os/thread';

// Constants
const PSEUDO_HANDLE_PROCESS = 0xffffffffffffffffn as unknown as Def.HANDLE; // -1
const PSEUDO_HANDLE_THREAD = 0xfffffffffffffffen as unknown as Def.HANDLE; // -2

export const Kernel32Impl = {
  // Process
  OpenProcess: (
    dwDesiredAccess: Def.DWORD,
    bInheritHandle: Def.BOOL,
    dwProcessId: Def.DWORD,
  ): Def.HANDLE => {
    return kernel.OpenProcess(dwDesiredAccess, !!bInheritHandle, dwProcessId);
  },
  GetCurrentProcess: (): Def.HANDLE => PSEUDO_HANDLE_PROCESS,
  GetCurrentProcessId: (): Def.DWORD => kernel.currentProcess.id,
  GetProcessId: (hProcess: Def.HANDLE): Def.DWORD =>
    kernel.GetProcessId(hProcess),
  CloseHandle: (hObject: Def.HANDLE): Def.BOOL => {
    return kernel.CloseHandle(hObject) ? 1 : 0;
  },

  // Memory
  ReadProcessMemory: (
    hProcess: Def.HANDLE,
    lpBaseAddress: Def.LPCVOID,
    lpBuffer: Buffer,
    nSize: Def.SIZE_T,
    _lpNumberOfBytesRead: Def.SIZE_T | null,
  ): Def.BOOL => {
    let process: SimulatedProcess | undefined;

    if (hProcess === PSEUDO_HANDLE_PROCESS) {
      process = kernel.currentProcess;
    } else {
      const handleObj = kernel.getObjectFromHandle(hProcess);
      if (handleObj && handleObj.type === 'Process') {
        process = handleObj.object as SimulatedProcess;
      }
    }

    if (!process) return 0;

    try {
      const data = process.memory.read(Number(lpBaseAddress), Number(nSize));
      data.copy(lpBuffer);
      return 1;
    } catch (_e) {
      return 0;
    }
  },
  WriteProcessMemory: (
    hProcess: Def.HANDLE,
    lpBaseAddress: Def.LPVOID,
    lpBuffer: Buffer,
    nSize: Def.SIZE_T,
    _lpNumberOfBytesWritten: Def.SIZE_T | null,
  ): Def.BOOL => {
    let process: SimulatedProcess | undefined;

    if (hProcess === PSEUDO_HANDLE_PROCESS) {
      process = kernel.currentProcess;
    } else {
      const handleObj = kernel.getObjectFromHandle(hProcess);
      if (handleObj && handleObj.type === 'Process') {
        process = handleObj.object as SimulatedProcess;
      }
    }

    if (!process) return 0;

    const dataToWrite = lpBuffer.subarray(0, Number(nSize));

    try {
      if (process.memory.write(Number(lpBaseAddress), dataToWrite) > 0) {
        return 1;
      }
      return 0;
    } catch (_e) {
      return 0;
    }
  },
  VirtualAlloc: (
    lpAddress: Def.LPVOID | null,
    dwSize: Def.SIZE_T,
    flAllocationType: Def.DWORD,
    flProtect: Def.DWORD,
  ): Def.LPVOID => {
    return Kernel32Impl.VirtualAllocEx(
      PSEUDO_HANDLE_PROCESS,
      lpAddress,
      dwSize,
      flAllocationType,
      flProtect,
    );
  },
  VirtualAllocEx: (
    hProcess: Def.HANDLE,
    lpAddress: Def.LPVOID | null,
    dwSize: Def.SIZE_T,
    flAllocationType: Def.DWORD,
    flProtect: Def.DWORD,
  ): Def.LPVOID => {
    let process: SimulatedProcess | undefined;

    if (hProcess === PSEUDO_HANDLE_PROCESS) {
      process = kernel.currentProcess;
    } else {
      const handleObj = kernel.getObjectFromHandle(hProcess);
      if (handleObj && handleObj.type === 'Process') {
        process = handleObj.object as SimulatedProcess;
      }
    }

    if (!process) return 0n as unknown as Def.LPVOID;

    try {
      const addr = process.memory.allocate(
        Number(lpAddress || 0),
        Number(dwSize),
        flAllocationType,
        flProtect,
      );
      return BigInt(addr) as unknown as Def.LPVOID;
    } catch (_e) {
      return 0n as unknown as Def.LPVOID;
    }
  },

  VirtualQuery: (
    lpAddress: Def.LPCVOID,
    lpBuffer: Buffer,
    dwLength: Def.SIZE_T,
  ): Def.SIZE_T => {
    return Kernel32Impl.VirtualQueryEx(
      PSEUDO_HANDLE_PROCESS,
      lpAddress,
      lpBuffer,
      dwLength,
    );
  },
  VirtualQueryEx: (
    hProcess: Def.HANDLE,
    lpAddress: Def.LPCVOID,
    lpBuffer: Buffer,
    dwLength: Def.SIZE_T,
  ): Def.SIZE_T => {
    let process: SimulatedProcess | undefined;

    if (hProcess === PSEUDO_HANDLE_PROCESS) {
      process = kernel.currentProcess;
    } else {
      const handleObj = kernel.getObjectFromHandle(hProcess);
      if (handleObj && handleObj.type === 'Process') {
        process = handleObj.object as SimulatedProcess;
      }
    }

    if (!process) return 0n as unknown as Def.SIZE_T;

    const info = process.memory.query(Number(lpAddress));

    // Serialize info to lpBuffer (PMEMORY_BASIC_INFORMATION)
    lpBuffer.writeBigUInt64LE(BigInt(info.BaseAddress), 0);
    lpBuffer.writeBigUInt64LE(BigInt(info.AllocationBase), 8);
    lpBuffer.writeUInt32LE(info.AllocationProtect, 16);
    lpBuffer.writeBigUInt64LE(BigInt(info.RegionSize), 24);
    lpBuffer.writeUInt32LE(info.State, 32);
    lpBuffer.writeUInt32LE(info.Protect, 36);
    lpBuffer.writeUInt32LE(info.Type, 40);

    return BigInt(dwLength) as unknown as Def.SIZE_T;
  },
  VirtualFree: (
    lpAddress: Def.LPVOID,
    dwSize: Def.SIZE_T,
    dwFreeType: Def.MemoryFreeType | Def.DWORD,
  ): Def.BOOL => {
    return Kernel32Impl.VirtualFreeEx(
      PSEUDO_HANDLE_PROCESS,
      lpAddress,
      dwSize,
      dwFreeType,
    );
  },
  VirtualFreeEx: (
    hProcess: Def.HANDLE,
    lpAddress: Def.LPVOID,
    dwSize: Def.SIZE_T,
    dwFreeType: Def.MemoryFreeType | Def.DWORD,
  ): Def.BOOL => {
    let process: SimulatedProcess | undefined;

    if (hProcess === PSEUDO_HANDLE_PROCESS) {
      process = kernel.currentProcess;
    } else {
      const handleObj = kernel.getObjectFromHandle(hProcess);
      if (handleObj && handleObj.type === 'Process') {
        process = handleObj.object as SimulatedProcess;
      }
    }

    if (!process) return 0;

    return process.memory.free(
      Number(lpAddress),
      Number(dwSize),
      Number(dwFreeType),
    )
      ? 1
      : 0;
  },

  // Thread
  OpenThread: (
    dwDesiredAccess: Def.DWORD,
    bInheritHandle: Def.BOOL,
    dwThreadId: Def.DWORD,
  ): Def.HANDLE => {
    return kernel.OpenThread(dwDesiredAccess, !!bInheritHandle, dwThreadId);
  },
  GetCurrentThread: (): Def.HANDLE => PSEUDO_HANDLE_THREAD,
  GetCurrentThreadId: (): Def.DWORD => kernel.GetThreadId(PSEUDO_HANDLE_THREAD),
  GetThreadId: (hThread: Def.HANDLE): Def.DWORD => kernel.GetThreadId(hThread),
  SuspendThread: (hThread: Def.HANDLE): Def.DWORD => {
    if (hThread === PSEUDO_HANDLE_THREAD) {
      // Find current thread of current process
      const tid = kernel.GetThreadId(hThread);
      const thread = kernel.currentProcess.getThread(tid);
      return thread ? thread.suspend() : 0;
    }
    const handleObj = kernel.getObjectFromHandle(hThread);
    if (handleObj && handleObj.type === 'Thread') {
      return (handleObj.object as SimulatedThread).suspend();
    }
    return 0;
  },
  ResumeThread: (hThread: Def.HANDLE): Def.DWORD => {
    if (hThread === PSEUDO_HANDLE_THREAD) {
      const tid = kernel.GetThreadId(hThread);
      const thread = kernel.currentProcess.getThread(tid);
      return thread ? thread.resume() : 0;
    }
    const handleObj = kernel.getObjectFromHandle(hThread);
    if (handleObj && handleObj.type === 'Thread') {
      return (handleObj.object as SimulatedThread).resume();
    }
    return 0;
  },
  GetExitCodeThread: (hThread: Def.HANDLE, lpExitCode: Buffer): Def.BOOL => {
    let thread: SimulatedThread | undefined;
    if (hThread === PSEUDO_HANDLE_THREAD) {
      const tid = kernel.GetThreadId(hThread);
      thread = kernel.currentProcess.getThread(tid);
    } else {
      const handleObj = kernel.getObjectFromHandle(hThread);
      if (handleObj && handleObj.type === 'Thread') {
        thread = handleObj.object as SimulatedThread;
      }
    }

    if (thread) {
      lpExitCode.writeUInt32LE(
        thread.state === 4 /* TERMINATED */ ? 0 : 259 /* STILL_ACTIVE */,
        0,
      );
      return 1;
    }
    return 0;
  },
  GetThreadContext: (hThread: Def.HANDLE, _lpContext: Buffer): Def.BOOL => {
    let thread: SimulatedThread | undefined;
    if (hThread === PSEUDO_HANDLE_THREAD) {
      const tid = kernel.GetThreadId(hThread);
      thread = kernel.currentProcess.getThread(tid);
    } else {
      const handleObj = kernel.getObjectFromHandle(hThread);
      if (handleObj && handleObj.type === 'Thread') {
        thread = handleObj.object as SimulatedThread;
      }
    }

    if (thread) {
      thread.getContext(0);
      return 1;
    }
    return 0;
  },
  SetThreadContext: (hThread: Def.HANDLE, _lpContext: Buffer): Def.BOOL => {
    let thread: SimulatedThread | undefined;
    if (hThread === PSEUDO_HANDLE_THREAD) {
      const tid = kernel.GetThreadId(hThread);
      thread = kernel.currentProcess.getThread(tid);
    } else {
      const handleObj = kernel.getObjectFromHandle(hThread);
      if (handleObj && handleObj.type === 'Thread') {
        thread = handleObj.object as SimulatedThread;
      }
    }
    return thread ? 1 : 0;
  },
  CreateThread: (
    _lpThreadAttributes: Def.SecurityAttributes | Def.LPVOID | null,
    _dwStackSize: Def.SIZE_T,
    _lpStartAddress: Def.LPVOID,
    _lpParameter: Def.LPVOID | null,
    _dwCreationFlags: Def.ThreadCreationFlags | Def.DWORD,
    lpThreadId: Buffer | null,
  ): Def.HANDLE => {
    return Kernel32Impl.CreateRemoteThread(
      PSEUDO_HANDLE_PROCESS,
      _lpThreadAttributes,
      _dwStackSize,
      _lpStartAddress,
      _lpParameter,
      _dwCreationFlags,
      lpThreadId,
    );
  },
  CreateRemoteThread: (
    hProcess: Def.HANDLE,
    _lpThreadAttributes: Def.SecurityAttributes | Def.LPVOID | null,
    _dwStackSize: Def.SIZE_T,
    _lpStartAddress: Def.LPVOID,
    _lpParameter: Def.LPVOID | null,
    _dwCreationFlags: Def.ThreadCreationFlags | Def.DWORD,
    lpThreadId: Buffer | null,
  ): Def.HANDLE => {
    let process: SimulatedProcess | undefined;
    if (hProcess === PSEUDO_HANDLE_PROCESS) {
      process = kernel.currentProcess;
    } else {
      const handleObj = kernel.getObjectFromHandle(hProcess);
      if (handleObj && handleObj.type === 'Process') {
        process = handleObj.object as SimulatedProcess;
      }
    }

    if (!process) return 0n as unknown as Def.HANDLE;

    const thread = process.createThread();
    if (lpThreadId) {
      lpThreadId.writeUInt32LE(thread.id, 0);
    }

    return kernel.currentProcess.handles.createHandle(
      thread,
      'Thread',
      0x1fffff /* ALL_ACCESS */,
    );
  },

  // Synchronization
  WaitForSingleObject: (
    hHandle: Def.HANDLE,
    _dwMilliseconds: Def.DWORD,
  ): Def.DWORD => {
    const handleObj = kernel.getObjectFromHandle(hHandle);
    if (handleObj && handleObj.type === 'Thread') {
      (handleObj.object as SimulatedThread).state = 4; // TERMINATED
    }
    return 0; // WAIT_OBJECT_0
  },

  // Modules
  GetModuleHandleW: (lpModuleName: string | null): Def.HMODULE => {
    const name = lpModuleName || 'kernel32.dll';
    const mod = kernel.currentProcess.getModule(name);
    if (mod) return BigInt(mod.baseAddress) as unknown as Def.HMODULE;

    // Create on the fly if not exists (lazy loading simulation)
    const base = 0x7ff00000 + kernel.currentProcess.modules.size * 0x100000;
    const newMod = kernel.currentProcess.createModule(name, base, 0x100000);
    return BigInt(newMod.baseAddress) as unknown as Def.HMODULE;
  },
  GetModuleHandleA: (lpModuleName: string | null): Def.HMODULE => {
    return Kernel32Impl.GetModuleHandleW(lpModuleName);
  },
  GetProcAddress: (hModule: Def.HMODULE, lpProcName: string): Def.INT_PTR => {
    // Find module by base address
    const mod = Array.from(kernel.currentProcess.modules.values()).find(
      (m) => BigInt(m.baseAddress) === BigInt(hModule as bigint),
    );

    if (mod) {
      let addr = mod.getProcAddress(lpProcName);
      if (!addr) {
        // Add pseudo-export if it doesn't exist
        const offset = mod.exports.size * 16;
        mod.addExport(lpProcName, offset);
        addr = mod.getProcAddress(lpProcName);
      }
      return BigInt(addr!) as Def.INT_PTR;
    }
    return 0 as Def.INT_PTR;
  },

  GetLastError: (): Def.DWORD => 0,
};
