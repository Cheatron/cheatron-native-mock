import { MemoryManager } from './memory';
import { HandleTable } from './handles';
import { SimulatedThread } from './thread';
import { SimulatedModule } from './module';

export class SimulatedProcess {
  public id: number;
  public name: string;
  public memory: MemoryManager;
  public handles: HandleTable;
  public threads: Map<number, SimulatedThread>;
  public modules: Map<string, SimulatedModule> = new Map();
  public exitCode: number | null = null;

  private nextThreadId: number = 1000;

  constructor(pid: number, name: string) {
    this.id = pid;
    this.name = name;
    this.memory = new MemoryManager();
    this.handles = new HandleTable();
    this.threads = new Map();
  }

  createThread(): SimulatedThread {
    const tid = this.nextThreadId++;
    const thread = new SimulatedThread(tid, this.id);
    this.threads.set(tid, thread);
    return thread;
  }

  createModule(
    name: string,
    baseAddress: number,
    size: number,
  ): SimulatedModule {
    const id = this.modules.size + 1;
    const mod = new SimulatedModule(id, name, baseAddress, size);
    this.modules.set(name.toLowerCase(), mod);
    return mod;
  }

  getModule(name: string): SimulatedModule | undefined {
    return this.modules.get(name.toLowerCase());
  }

  getThread(tid: number): SimulatedThread | undefined {
    return this.threads.get(tid);
  }

  terminate(exitCode: number = 0) {
    this.exitCode = exitCode;
    // Cleanup threads
    this.threads.clear();
    // Cleanup handles?
    // In a real OS, handles are closed.
  }
}
