/**
 * Process access rights
 * https://learn.microsoft.com/en-us/windows/win32/procthread/process-security-and-access-rights
 */
export const ProcessAccess = {
  TERMINATE: 0x0001,
  CREATE_THREAD: 0x0002,
  SET_SESSIONID: 0x0004,
  VM_OPERATION: 0x0008,
  VM_READ: 0x0010,
  VM_WRITE: 0x0020,
  DUP_HANDLE: 0x0040,
  CREATE_PROCESS: 0x0080,
  SET_QUOTA: 0x0100,
  SET_INFORMATION: 0x0200,
  QUERY_INFORMATION: 0x0400,
  SUSPEND_RESUME: 0x0800,
  QUERY_LIMITED_INFORMATION: 0x1000,
  SET_LIMITED_INFORMATION: 0x2000,
  ALL_ACCESS: 0x1fffff,
} as const;

/**
 * Thread access rights
 * https://learn.microsoft.com/en-us/windows/win32/procthread/thread-security-and-access-rights
 */
export const ThreadAccess = {
  TERMINATE: 0x0001,
  SUSPEND_RESUME: 0x0002,
  GET_CONTEXT: 0x0008,
  SET_CONTEXT: 0x0010,
  SET_INFORMATION: 0x0020,
  QUERY_INFORMATION: 0x0040,
  SET_THREAD_TOKEN: 0x0080,
  IMPERSONATE: 0x0100,
  DIRECT_IMPERSONATION: 0x0200,
  SET_LIMITED_INFORMATION: 0x0400,
  QUERY_LIMITED_INFORMATION: 0x0800,
  ALL_ACCESS: 0x1fffff,
} as const;

/**
 * Memory protection constants
 * https://learn.microsoft.com/en-us/windows/win32/memory/memory-protection-constants
 */
export const MemoryProtection = {
  NOACCESS: 0x01,
  READONLY: 0x02,
  READWRITE: 0x04,
  WRITECOPY: 0x08,
  EXECUTE: 0x10,
  EXECUTE_READ: 0x20,
  EXECUTE_READWRITE: 0x40,
  EXECUTE_WRITECOPY: 0x80,
  GUARD: 0x100,
  NOCACHE: 0x200,
  WRITECOMBINE: 0x400,
} as const;

/**
 * Memory state constants
 */
export const MemoryState = {
  COMMIT: 0x1000,
  RESERVE: 0x2000,
  FREE: 0x10000,
} as const;

/**
 * Memory type constants
 */
export const MemoryType = {
  PRIVATE: 0x20000,
  MAPPED: 0x40000,
  IMAGE: 0x1000000,
} as const;

export type ProcessAccessValue =
  (typeof ProcessAccess)[keyof typeof ProcessAccess];
export type ThreadAccessValue =
  (typeof ThreadAccess)[keyof typeof ThreadAccess];

/**
 * MEMORY_BASIC_INFORMATION structure
 * https://learn.microsoft.com/en-us/windows/win32/api/winnt/ns-winnt-memory_basic_information
 */
export interface MemoryBasicInformation {
  BaseAddress: number | bigint;
  AllocationBase: number | bigint;
  AllocationProtect: number;
  RegionSize: number | bigint;
  State: number;
  Protect: number;
  Type: number;
}

import { ffi } from 'win32-def';

// Koffi struct for MEMORY_BASIC_INFORMATION (64-bit)
export const MEMORY_BASIC_INFORMATION = ffi.struct('MEMORY_BASIC_INFORMATION', {
  BaseAddress: 'uint64',
  AllocationBase: 'uint64',
  AllocationProtect: 'uint32',
  __PartitionId: 'uint16',
  __pad: 'uint16',
  RegionSize: 'uint64',
  State: 'uint32',
  Protect: 'uint32',
  Type: 'uint32',
  __pad2: 'uint32',
});

export const MBI_SIZE = ffi.sizeof(MEMORY_BASIC_INFORMATION);

/**
 * CONTEXT flags for x64
 * https://learn.microsoft.com/en-us/windows/win32/api/winnt/ns-winnt-context
 */
const CONTEXT_AMD64 = 0x00100000;
export const ContextFlags = {
  AMD64: CONTEXT_AMD64,
  CONTROL: CONTEXT_AMD64 | 0x01,
  INTEGER: CONTEXT_AMD64 | 0x02,
  SEGMENTS: CONTEXT_AMD64 | 0x04,
  FLOATING_POINT: CONTEXT_AMD64 | 0x08,
  DEBUG_REGISTERS: CONTEXT_AMD64 | 0x10,
  FULL: CONTEXT_AMD64 | 0x01 | 0x02 | 0x08,
  ALL: CONTEXT_AMD64 | 0x01 | 0x02 | 0x04 | 0x08 | 0x10,
} as const;

/**
 * M128A structure (128-bit register value)
 * https://learn.microsoft.com/en-us/windows/win32/api/winnt/ns-winnt-m128a
 */
export const M128A = ffi.struct('M128A', {
  Low: 'uint64',
  High: 'int64',
});

export interface M128AValue {
  Low: bigint;
  High: bigint;
}

/**
 * CONTEXT structure for x64 (AMD64)
 * https://learn.microsoft.com/en-us/windows/win32/api/winnt/ns-winnt-context
 */
export const CONTEXT = ffi.struct('CONTEXT', {
  // Register parameter home addresses
  P1Home: 'uint64',
  P2Home: 'uint64',
  P3Home: 'uint64',
  P4Home: 'uint64',
  P5Home: 'uint64',
  P6Home: 'uint64',

  // Control flags
  ContextFlags: 'uint32',
  MxCsr: 'uint32',

  // Segment registers
  SegCs: 'uint16',
  SegDs: 'uint16',
  SegEs: 'uint16',
  SegFs: 'uint16',
  SegGs: 'uint16',
  SegSs: 'uint16',

  // Flags
  EFlags: 'uint32',

  // Debug registers
  Dr0: 'uint64',
  Dr1: 'uint64',
  Dr2: 'uint64',
  Dr3: 'uint64',
  Dr6: 'uint64',
  Dr7: 'uint64',

  // Integer registers
  Rax: 'uint64',
  Rcx: 'uint64',
  Rdx: 'uint64',
  Rbx: 'uint64',
  Rsp: 'uint64',
  Rbp: 'uint64',
  Rsi: 'uint64',
  Rdi: 'uint64',
  R8: 'uint64',
  R9: 'uint64',
  R10: 'uint64',
  R11: 'uint64',
  R12: 'uint64',
  R13: 'uint64',
  R14: 'uint64',
  R15: 'uint64',

  // Program counter
  Rip: 'uint64',

  // Floating point / XMM save area (XMM_SAVE_AREA32 = 512 bytes)
  FltSave: 'uint8[512]',

  // Vector registers
  VectorRegister: 'M128A[26]',
  VectorControl: 'uint64',

  // Special debug registers
  DebugControl: 'uint64',
  LastBranchToRip: 'uint64',
  LastBranchFromRip: 'uint64',
  LastExceptionToRip: 'uint64',
  LastExceptionFromRip: 'uint64',
});

export const CONTEXT_SIZE = ffi.sizeof(CONTEXT);

/**
 * Parsed thread context (x64)
 */
export interface ThreadContext {
  P1Home: bigint;
  P2Home: bigint;
  P3Home: bigint;
  P4Home: bigint;
  P5Home: bigint;
  P6Home: bigint;
  ContextFlags: number;
  MxCsr: number;
  SegCs: number;
  SegDs: number;
  SegEs: number;
  SegFs: number;
  SegGs: number;
  SegSs: number;
  EFlags: number;
  Dr0: bigint;
  Dr1: bigint;
  Dr2: bigint;
  Dr3: bigint;
  Dr6: bigint;
  Dr7: bigint;
  Rax: bigint;
  Rcx: bigint;
  Rdx: bigint;
  Rbx: bigint;
  Rsp: bigint;
  Rbp: bigint;
  Rsi: bigint;
  Rdi: bigint;
  R8: bigint;
  R9: bigint;
  R10: bigint;
  R11: bigint;
  R12: bigint;
  R13: bigint;
  R14: bigint;
  R15: bigint;
  Rip: bigint;
  FltSave: number[];
  VectorRegister: M128AValue[];
  VectorControl: bigint;
  DebugControl: bigint;
  LastBranchToRip: bigint;
  LastBranchFromRip: bigint;
  LastExceptionToRip: bigint;
  LastExceptionFromRip: bigint;
}
