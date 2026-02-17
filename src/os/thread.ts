export enum ThreadState {
  INITIALIZED,
  READY,
  RUNNING,
  WAITING,
  TERMINATED,
}

export interface ThreadContext {
  Rip: bigint; // Instruction pointer
  Rax: bigint;
  Rbx: bigint;
  Rcx: bigint;
  Rdx: bigint;
  Rsi: bigint;
  Rdi: bigint;
  Rbp: bigint;
  Rsp: bigint;
  R8: bigint;
  R9: bigint;
  R10: bigint;
  R11: bigint;
  R12: bigint;
  R13: bigint;
  R14: bigint;
  R15: bigint;
  EFlags: number;
}

export class SimulatedThread {
  public id: number;
  public state: ThreadState;
  public suspendCount: number = 0;
  public context: ThreadContext;
  public ownerProcessId: number;

  constructor(tid: number, ownerPid: number) {
    this.id = tid;
    this.ownerProcessId = ownerPid;
    this.state = ThreadState.INITIALIZED;

    // Initialize context with some reasonable defaults
    this.context = {
      Rip: 0x7ff700001000n, // Dummy entry point
      Rax: 0n,
      Rbx: 0n,
      Rcx: 0n,
      Rdx: 0n,
      Rsi: 0n,
      Rdi: 0n,
      Rbp: 0n,
      Rsp: 0x000000e0000n, // Dummy stack
      R8: 0n,
      R9: 0n,
      R10: 0n,
      R11: 0n,
      R12: 0n,
      R13: 0n,
      R14: 0n,
      R15: 0n,
      EFlags: 0x202, // IF bit set
    };
  }

  suspend(): number {
    this.suspendCount++;
    if (this.state === ThreadState.RUNNING) {
      this.state = ThreadState.WAITING; // Simplification
    }
    return this.suspendCount - 1; // Return previous count
  }

  resume(): number {
    if (this.suspendCount > 0) {
      this.suspendCount--;
      if (this.suspendCount === 0) {
        this.state = ThreadState.READY; // Ready to run
      }
    }
    return this.suspendCount;
  }

  getContext(_flags: number): ThreadContext {
    // Should respect flags (CONTEXT_FULL, etc.), but for mock we return full.
    return { ...this.context };
  }

  setContext(ctx: Partial<ThreadContext>): void {
    Object.assign(this.context, ctx);
  }
}
