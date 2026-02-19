import { SimulatedProcess } from './process';
import type { HandleObject } from './handles';
import * as Def from '@cheatron/win32-ext';

export class Kernel {
  public static instance: Kernel;

  private processes: Map<number, SimulatedProcess> = new Map();
  private nextPid: number = 4; // System processes start low

  // The process that is "executing" the API calls (e.g. the test runner or the cheat tool)
  public currentProcess: SimulatedProcess;

  constructor() {
    Kernel.instance = this;
    // Bootstrapping: Create a "System" process and "Current" process
    this.createSystemProcess();

    // The "Current Process" is the one running the tests/code.
    // We simulate it as a process so it can have a Handle Table.
    this.currentProcess = new SimulatedProcess(9999, 'CurrentTestRunner.exe');
    this.processes.set(this.currentProcess.id, this.currentProcess);

    // Create initial thread for current process
    this.currentProcess.createThread();
  }

  private createSystemProcess() {
    const sys = new SimulatedProcess(4, 'System');
    this.processes.set(4, sys);
  }

  public createProcess(name: string): SimulatedProcess {
    const pid = this.nextPid;
    this.nextPid += 4;
    const proc = new SimulatedProcess(pid, name);
    this.processes.set(pid, proc);
    return proc;
  }

  public getProcess(pid: number): SimulatedProcess | undefined {
    return this.processes.get(pid);
  }

  // --- Syscalls (Simulated) ---

  public OpenProcess(
    dwDesiredAccess: number,
    _bInheritHandle: boolean,
    dwProcessId: number,
  ): Def.HANDLE {
    const targetProc = this.processes.get(dwProcessId);
    if (!targetProc) {
      return 0n as unknown as Def.HANDLE; // NULL
    }

    // Create a handle in the CURRENT process's handle table pointing to the TARGET process
    const handle = this.currentProcess.handles.createHandle(
      targetProc,
      'Process',
      dwDesiredAccess,
    );
    return handle;
  }

  public OpenThread(
    dwDesiredAccess: number,
    _bInheritHandle: boolean,
    dwThreadId: number,
  ): Def.HANDLE {
    // Find thread across all processes
    for (const proc of this.processes.values()) {
      const thread = proc.getThread(dwThreadId);
      if (thread) {
        return this.currentProcess.handles.createHandle(
          thread,
          'Thread',
          dwDesiredAccess,
        );
      }
    }
    return 0n as unknown as Def.HANDLE;
  }

  public CloseHandle(hObject: Def.HANDLE): boolean {
    const h = BigInt.asIntN(64, BigInt(hObject as bigint));
    if (h === -1n || h === -2n) return true;
    return this.currentProcess.handles.closeHandle(hObject);
  }

  public GetProcessId(hProcess: Def.HANDLE): number {
    const h = BigInt.asIntN(64, BigInt(hProcess as bigint));
    if (h === -1n) return this.currentProcess.id;
    const obj = this.getObjectFromHandle(hProcess);
    if (obj && obj.type === 'Process') return obj.object.id;
    return 0;
  }

  public GetThreadId(hThread: Def.HANDLE): number {
    const h = BigInt.asIntN(64, BigInt(hThread as bigint));
    if (h === -2n) return this.currentProcess.threads.keys().next().value || 0;
    const obj = this.getObjectFromHandle(hThread);
    if (obj && obj.type === 'Thread') return obj.object.id;
    return 0;
  }

  // Helper to dereference a handle from the current process context
  public getObjectFromHandle(handle: Def.HANDLE): HandleObject | undefined {
    return this.currentProcess.handles.getObject(handle);
  }
}

// Global kernel instance
export const kernel = new Kernel();
