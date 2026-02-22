import { type LPVOID, type SIZE_T } from '@cheatron/win32-ext';
import { kernel } from './os/kernel';

/**
 * MSVCRT function definitions
 */
export interface MSVCRT {
  malloc: (size: SIZE_T) => LPVOID;
  free: (ptr: LPVOID) => void;
  memcpy: (dest: LPVOID, src: LPVOID, count: SIZE_T) => LPVOID;
  memset: (dest: LPVOID, value: number, count: SIZE_T) => LPVOID;
  memcmp: (buf1: LPVOID | Buffer, buf2: LPVOID | Buffer, count: SIZE_T) => number;
}

/**
 * Simulated implementation of MSVCRT
 */
export const MsvcrtImpl: MSVCRT = {
  malloc: (size: SIZE_T): LPVOID => {
    const addr = kernel.currentProcess.memory.allocate(0, Number(size));
    return BigInt(addr) as unknown as LPVOID;
  },

  free: (ptr: LPVOID): void => {
    kernel.currentProcess.memory.free(Number(ptr));
  },

  memcpy: (
    dest: LPVOID | Buffer,
    src: LPVOID | Buffer,
    count: SIZE_T,
  ): LPVOID => {
    const size = Number(count);
    let data: Buffer;

    if (Buffer.isBuffer(src)) {
      data = src.subarray(0, size);
    } else {
      data = kernel.currentProcess.memory.read(Number(src), size);
    }

    if (Buffer.isBuffer(dest)) {
      data.copy(dest);
    } else {
      kernel.currentProcess.memory.write(Number(dest), data);
    }

    return dest as LPVOID;
  },

  memset: (dest: LPVOID | Buffer, value: number, count: SIZE_T): LPVOID => {
    const size = Number(count);
    const data = Buffer.alloc(size, value);

    if (Buffer.isBuffer(dest)) {
      data.copy(dest);
    } else {
      kernel.currentProcess.memory.write(Number(dest), data);
    }

    return dest as LPVOID;
  },

  memcmp: (
    buf1: LPVOID | Buffer,
    buf2: LPVOID | Buffer,
    count: SIZE_T,
  ): number => {
    const size = Number(count);
    let data1: Buffer;
    let data2: Buffer;

    if (Buffer.isBuffer(buf1)) {
      data1 = buf1.subarray(0, size);
    } else {
      data1 = kernel.currentProcess.memory.read(Number(buf1), size);
    }

    if (Buffer.isBuffer(buf2)) {
      data2 = buf2.subarray(0, size);
    } else {
      data2 = kernel.currentProcess.memory.read(Number(buf2), size);
    }

    return data1.compare(data2);
  },
};
