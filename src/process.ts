import { Kernel32Impl as Kernel32 } from './kernel32';
import type { HANDLE } from 'win32-def';
import {
  ProcessAccess,
  MEMORY_BASIC_INFORMATION,
  MBI_SIZE,
  type MemoryBasicInformation,
} from './constants';
import { ffi } from 'win32-def';
import { log } from './logger';

/**
 * Handle management registry for automatic cleanup
 */
const registry = new FinalizationRegistry((handle: HANDLE) => {
  if (handle) {
    log.trace('Process', 'Closing orphaned handle via GC');
    Kernel32.CloseHandle(handle);
  }
});

/**
 * Represents a remote process
 */
export class Process {
  protected _handle: HANDLE | null;
  protected _pid: number;

  constructor(
    handle: HANDLE | null,
    autoClose: boolean = true,
    pid: number = 0,
  ) {
    this._handle = handle;
    this._pid = pid;
    if (autoClose && handle) {
      registry.register(this, handle, this);
    }
  }

  static open(pid: number, access: number = ProcessAccess.ALL_ACCESS): Process {
    log.debug('Process', `Opening process ${pid}`, { access });
    const handle = Kernel32.OpenProcess(access, 0, pid);
    if (!handle) {
      log.error('Process', `Failed to open process ${pid}`);
      throw new Error(`Failed to open process ${pid}`);
    }
    return new Process(handle, true, pid);
  }

  static current(): CurrentProcess {
    return currentProcess;
  }

  get handle() {
    return this._handle;
  }
  get pid() {
    return this._pid;
  }

  isValid(): boolean {
    return this._handle !== null && this._handle !== undefined;
  }

  close() {
    if (this.isValid()) {
      log.debug('Process', `Closing process handle ${this._pid}`);
      const h = this._handle!;
      this._handle = null;
      registry.unregister(this);
      Kernel32.CloseHandle(h);
    }
  }

  read(address: number | bigint, size: number): Buffer {
    if (!this.isValid()) throw new Error('Process handle is closed');

    const buffer = Buffer.alloc(size);
    const success = Kernel32.ReadProcessMemory(
      this._handle!,
      address,
      buffer,
      size,
      null,
    );
    if (!success) {
      const errCode = Kernel32.GetLastError
        ? Kernel32.GetLastError()
        : 'unknown';
      log.error('Process', `ReadProcessMemory failed at ${address}`, {
        size,
        errCode,
      });
      throw new Error('ReadProcessMemory failed');
    }

    return buffer;
  }

  write(address: number | bigint, buffer: Buffer): void {
    if (!this.isValid()) throw new Error('Process handle is closed');

    const success = Kernel32.WriteProcessMemory(
      this._handle!,
      address,
      buffer,
      buffer.length,
      null,
    );
    if (!success) {
      const errCode = Kernel32.GetLastError
        ? Kernel32.GetLastError()
        : 'unknown';
      log.error('Process', `WriteProcessMemory failed at ${address}`, {
        size: buffer.length,
        errCode,
      });
      throw new Error('WriteProcessMemory failed');
    }
  }

  query(address: number | bigint): MemoryBasicInformation {
    if (!this.isValid()) throw new Error('Process handle is closed');

    const buffer = Buffer.alloc(MBI_SIZE);
    const result = Kernel32.VirtualQueryEx(
      this._handle!,
      address,
      buffer,
      MBI_SIZE,
    );
    if (!result) {
      log.error('Process', `VirtualQueryEx failed at ${address}`);
      throw new Error('VirtualQueryEx failed');
    }

    const info = ffi.decode(buffer, MEMORY_BASIC_INFORMATION);
    return info as MemoryBasicInformation;
  }
}

/**
 * Represents the current process (singleton)
 */
export class CurrentProcess extends Process {
  constructor() {
    // Current process uses a pseudo-handle that doesn't need closing
    super(Kernel32.GetCurrentProcess(), false, Kernel32.GetCurrentProcessId());
  }

  override close() {
    this._handle = null;
  }

  override query(address: number | bigint): MemoryBasicInformation {
    const buffer = Buffer.alloc(MBI_SIZE);
    const result = Kernel32.VirtualQuery(address, buffer, MBI_SIZE);
    if (!result) throw new Error('VirtualQuery failed');

    const info = ffi.decode(buffer, MEMORY_BASIC_INFORMATION);
    return info as MemoryBasicInformation;
  }
}

// Export a pre-initialized instance of the current process
export const currentProcess = new CurrentProcess();
export const currentProcessId = currentProcess.pid;
