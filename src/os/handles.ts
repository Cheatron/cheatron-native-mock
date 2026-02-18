import * as Def from '@cheatron/win32-ext';

export interface ISimulatedObject {
  id: number;
}

export interface HandleObject {
  type: 'Process' | 'Thread' | 'File' | 'Event' | 'Unknown';
  object: ISimulatedObject; // The actual simulation object
  accessMask: number;
}

export class HandleTable {
  private handles = new Map<bigint, HandleObject>();
  private nextHandleValue = 4n; // Windows handles are often multiples of 4

  createHandle(
    object: ISimulatedObject,
    type: HandleObject['type'],
    accessMask: number,
  ): Def.HANDLE {
    const handleValue = this.nextHandleValue;
    this.nextHandleValue += 4n;

    // Simulate handle reuse? For now, just increment.

    this.handles.set(handleValue, {
      type,
      object,
      accessMask,
    });

    return handleValue as unknown as Def.HANDLE;
  }

  getObject(handle: Def.HANDLE): HandleObject | undefined {
    return this.handles.get(BigInt(handle as bigint));
  }

  closeHandle(handle: Def.HANDLE): boolean {
    return this.handles.delete(BigInt(handle as bigint));
  }
}
