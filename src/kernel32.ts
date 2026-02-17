import * as D from 'win32-def';
import { kernel } from './os/kernel';
import { SimulatedProcess } from './os/process';

// Constants
const PSEUDO_HANDLE_PROCESS = 0xffffffffffffffffn as unknown as D.HANDLE; // -1
const PSEUDO_HANDLE_THREAD = 0xfffffffffffffffen as unknown as D.HANDLE; // -2

export const Kernel32Impl = {
  // Process
  OpenProcess: (
    dwDesiredAccess: D.DWORD,
    bInheritHandle: D.BOOL,
    dwProcessId: D.DWORD,
  ): D.HANDLE => {
    return kernel.OpenProcess(dwDesiredAccess, !!bInheritHandle, dwProcessId);
  },
  GetCurrentProcess: (): D.HANDLE => PSEUDO_HANDLE_PROCESS,
  GetCurrentProcessId: (): D.DWORD => kernel.currentProcess.id,
  CloseHandle: (hObject: D.HANDLE): D.BOOL => {
    if (hObject === PSEUDO_HANDLE_PROCESS || hObject === PSEUDO_HANDLE_THREAD) {
      return 1;
    }
    return kernel.CloseHandle(hObject) ? 1 : 0;
  },

  // Memory
  ReadProcessMemory: (
    hProcess: D.HANDLE,
    lpBaseAddress: D.LPCVOID, // bigint | number
    lpBuffer: Buffer, // LPVOID
    nSize: D.SIZE_T, // bigint | number
    _lpNumberOfBytesRead: D.LPDWORD | null, // ptr
  ): D.BOOL => {
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

    const addr = Number(lpBaseAddress);
    const size = Number(nSize);

    try {
      const data = process.memory.read(addr, size);
      data.copy(lpBuffer);
      return 1;
    } catch (_e) {
      return 0;
    }
  },
  WriteProcessMemory: (
    hProcess: D.HANDLE,
    lpBaseAddress: D.LPCVOID,
    lpBuffer: Buffer,
    nSize: D.SIZE_T,
    _lpNumberOfBytesWritten: D.LPDWORD | null,
  ): D.BOOL => {
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

    const addr = Number(lpBaseAddress);

    // Ensure we only write nSize bytes essentially
    const dataToWrite = lpBuffer.subarray(0, Number(nSize));

    try {
      if (process.memory.write(addr, dataToWrite) > 0) {
        return 1;
      }
      return 0;
    } catch (_e) {
      return 0;
    }
  },
  VirtualAlloc: (
    lpAddress: D.LPCVOID,
    dwSize: D.SIZE_T,
    flAllocationType: D.DWORD,
    flProtect: D.DWORD,
  ): D.LPVOID => {
    return Kernel32Impl.VirtualAllocEx(
      PSEUDO_HANDLE_PROCESS,
      lpAddress,
      dwSize,
      flAllocationType,
      flProtect,
    );
  },
  VirtualAllocEx: (
    hProcess: D.HANDLE,
    lpAddress: D.LPCVOID,
    dwSize: D.SIZE_T,
    flAllocationType: D.DWORD,
    flProtect: D.DWORD,
  ): D.LPVOID => {
    let process: SimulatedProcess | undefined;

    if (hProcess === PSEUDO_HANDLE_PROCESS) {
      process = kernel.currentProcess;
    } else {
      const handleObj = kernel.getObjectFromHandle(hProcess);
      if (handleObj && handleObj.type === 'Process') {
        process = handleObj.object as SimulatedProcess;
      }
    }

    if (!process) return 0n as unknown as D.LPVOID;

    const addr = Number(lpAddress);
    const size = Number(dwSize);

    // We assume flAllocationType and flProtect match our internal constants or we pass them through
    // Our MemoryManager uses constants from constants.ts which match Win32

    try {
      const allocatedAddr = process.memory.allocate(
        addr,
        size,
        flAllocationType,
        flProtect,
      );
      return BigInt(allocatedAddr) as unknown as D.LPVOID;
    } catch (_e) {
      return 0n as unknown as D.LPVOID;
    }
  },

  VirtualQuery: (
    lpAddress: D.LPCVOID,
    lpBuffer: Buffer, // PMEMORY_BASIC_INFORMATION
    dwLength: D.SIZE_T,
  ): D.SIZE_T => {
    // Queries CURRENT process
    return Kernel32Impl.VirtualQueryEx(
      PSEUDO_HANDLE_PROCESS,
      lpAddress,
      lpBuffer,
      dwLength,
    );
  },
  VirtualQueryEx: (
    hProcess: D.HANDLE,
    lpAddress: D.LPCVOID,
    lpBuffer: Buffer,
    dwLength: D.SIZE_T,
  ): D.SIZE_T => {
    let process: SimulatedProcess | undefined;

    if (hProcess === PSEUDO_HANDLE_PROCESS) {
      process = kernel.currentProcess;
    } else {
      const handleObj = kernel.getObjectFromHandle(hProcess);
      if (handleObj && handleObj.type === 'Process') {
        process = handleObj.object as SimulatedProcess;
      }
    }

    if (!process) return 0n as unknown as D.SIZE_T;

    const addr = Number(lpAddress);
    const info = process.memory.query(addr);

    // Serialize info to lpBuffer
    // BaseAddress (0)
    lpBuffer.writeBigUInt64LE(BigInt(info.BaseAddress), 0);
    // AllocationBase (8)
    lpBuffer.writeBigUInt64LE(BigInt(info.AllocationBase), 8);
    // AllocationProtect (16)
    lpBuffer.writeUInt32LE(info.AllocationProtect, 16);
    // RegionSize (24)
    lpBuffer.writeBigUInt64LE(BigInt(info.RegionSize), 24);
    // State (32)
    lpBuffer.writeUInt32LE(info.State, 32);
    // Protect (36)
    lpBuffer.writeUInt32LE(info.Protect, 36);
    // Type (40)
    lpBuffer.writeUInt32LE(info.Type, 40);

    return BigInt(dwLength) as unknown as D.SIZE_T;
  },

  // Thread
  OpenThread: (
    _dwDesiredAccess: D.DWORD,
    _bInheritHandle: D.BOOL,
    _dwThreadId: D.DWORD,
  ): D.HANDLE => {
    return 0x200n as unknown as D.HANDLE;
  },
  GetCurrentThread: (): D.HANDLE => PSEUDO_HANDLE_THREAD,
  GetCurrentThreadId: (): D.DWORD => 98765,
  SuspendThread: (hThread: D.HANDLE): D.DWORD => {
    if (hThread === PSEUDO_HANDLE_THREAD) return 0;
    const handleObj = kernel.getObjectFromHandle(hThread);
    if (handleObj && handleObj.type === 'Thread') {
      // return (handleObj.object as SimulatedThread).suspend();
      return 0; // SimulatedThread import might be cyclic or tricky, simplified for now
    }
    return 0; // Fail
  },
  ResumeThread: (hThread: D.HANDLE): D.DWORD => {
    if (hThread === PSEUDO_HANDLE_THREAD) return 0;
    const handleObj = kernel.getObjectFromHandle(hThread);
    if (handleObj && handleObj.type === 'Thread') {
      // return (handleObj.object as SimulatedThread).resume();
      return 0;
    }
    return 0;
  },
  GetThreadContext: (_hThread: D.HANDLE, _lpContext: Buffer): D.BOOL => {
    return 0;
  },
  SetThreadContext: (_hThread: D.HANDLE, _lpContext: Buffer): D.BOOL => {
    return 1;
  },
  GetLastError: (): D.DWORD => 0,
};
