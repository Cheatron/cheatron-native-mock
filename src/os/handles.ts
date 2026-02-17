import * as D from 'win32-def';

export interface HandleObject {
  type: 'Process' | 'Thread' | 'File' | 'Event' | 'Unknown';
  object: any; // The actual simulation object (Process, Thread, etc.)
  accessMask: number;
}

export class HandleTable {
  private handles = new Map<bigint, HandleObject>();
  private nextHandleValue = 4n; // Windows handles are often multiples of 4

  createHandle(
    object: any,
    type: HandleObject['type'],
    accessMask: number,
  ): D.HANDLE {
    const handleValue = this.nextHandleValue;
    this.nextHandleValue += 4n;

    // Simulate handle reuse? For now, just increment.

    this.handles.set(handleValue, {
      type,
      object,
      accessMask,
    });

    return handleValue as unknown as D.HANDLE;
  }

  getObject(handle: D.HANDLE): HandleObject | undefined {
    return this.handles.get(BigInt(handle as bigint));
  }

  closeHandle(handle: D.HANDLE): boolean {
    return this.handles.delete(BigInt(handle as bigint));
  }
}
