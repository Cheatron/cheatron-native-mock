import { Kernel32Impl as Kernel32 } from './kernel32';
import * as Types from 'win32-def/types';
import {
  ThreadAccess,
  ContextFlags,
  CONTEXT,
  CONTEXT_SIZE,
  type ThreadContext,
} from './constants';
import { ffi } from 'win32-def';

import { log } from './logger';

/**
 * Handle management registry for automatic cleanup
 */
const registry = new FinalizationRegistry((handle: Types.HANDLE) => {
  if (handle) {
    log.trace('Thread', 'Closing orphaned handle via GC');
    Kernel32.CloseHandle(handle);
  }
});

/**
 * Represents a thread handle
 */
export class Thread {
  protected _handle: Types.HANDLE | null;

  constructor(handle: Types.HANDLE | null, autoClose: boolean = true) {
    this._handle = handle;
    if (autoClose && handle) {
      registry.register(this, handle, this);
    }
  }

  static open(
    threadId: number,
    access: number = ThreadAccess.ALL_ACCESS,
  ): Thread {
    log.debug('Thread', `Opening thread ${threadId}`, { access });
    const handle = Kernel32.OpenThread(access, 0, threadId);
    if (!handle) {
      log.error('Thread', `Failed to open thread ${threadId}`);
      throw new Error(`Failed to open thread ${threadId}`);
    }
    return new Thread(handle);
  }

  static current(): CurrentThread {
    return currentThread;
  }

  static currentId(): number {
    return Kernel32.GetCurrentThreadId();
  }

  isValid(): boolean {
    return this._handle !== null && this._handle !== undefined;
  }

  close() {
    if (this.isValid()) {
      log.debug('Thread', 'Closing thread handle');
      const h = this._handle!;
      this._handle = null;
      registry.unregister(this);
      Kernel32.CloseHandle(h);
    }
  }

  suspend(): number {
    if (!this.isValid()) throw new Error('Thread handle is closed');
    const count = Kernel32.SuspendThread(this._handle!);
    if (count === 0xffffffff) {
      log.error('Thread', 'SuspendThread failed');
      throw new Error('SuspendThread failed');
    }
    return count;
  }

  resume(): number {
    if (!this.isValid()) throw new Error('Thread handle is closed');
    const count = Kernel32.ResumeThread(this._handle!);
    if (count === 0xffffffff) {
      log.error('Thread', 'ResumeThread failed');
      throw new Error('ResumeThread failed');
    }
    return count;
  }

  getContext(flags: number = ContextFlags.FULL): ThreadContext {
    if (!this.isValid()) throw new Error('Thread handle is closed');

    const buf = Buffer.alloc(CONTEXT_SIZE);
    // ContextFlags is at offset 0x30 (after 6 × uint64 P*Home registers)
    buf.writeUInt32LE(flags, 0x30);

    const success = Kernel32.GetThreadContext(this._handle!, buf);
    if (!success) {
      log.error('Thread', 'GetThreadContext failed');
      throw new Error('GetThreadContext failed');
    }

    return ffi.decode(buf, CONTEXT) as ThreadContext;
  }

  setContext(ctx: ThreadContext): void {
    if (!this.isValid()) throw new Error('Thread handle is closed');

    const buf = Buffer.alloc(CONTEXT_SIZE);
    ffi.encode(buf, CONTEXT, ctx);

    const success = Kernel32.SetThreadContext(this._handle!, buf);
    if (!success) {
      log.error('Thread', 'SetThreadContext failed');
      throw new Error('SetThreadContext failed');
    }
  }

  get handle() {
    return this._handle;
  }
}

/**
 * Represents the current thread (singleton)
 */
export class CurrentThread extends Thread {
  constructor() {
    // Current thread uses a pseudo-handle that doesn't need closing
    super(Kernel32.GetCurrentThread(), false);
  }

  override close() {
    this._handle = null;
  }
}

// Export a pre-initialized instance of the current thread
export const currentThread = new CurrentThread();
