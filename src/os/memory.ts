import {
  type MemoryBasicInformation,
  MemoryProtection,
  MemoryState,
  MemoryType,
} from '@cheatron/win32-ext';

const PAGE_SIZE = 4096;

interface Page {
  address: number;
  data: Buffer;
  state: number; // MemoryState.COMMIT | MemoryState.RESERVE
  protect: number; // MemoryProtection.
  type: number; // MemoryType.PRIVATE
}

export class MemoryManager {
  private pages = new Map<number, Page>();

  constructor() {}

  /**
   * Aligns an address down to the nearest page boundary.
   */
  private alignDown(address: number): number {
    return Math.floor(address / PAGE_SIZE) * PAGE_SIZE;
  }

  /**
   * Allocates memory.
   * Simplification: Always allocates MEM_PRIVATE, MEM_COMMIT | MEM_RESERVE.
   */
  allocate(
    address: number, // If 0, find free space
    size: number,
    _allocationType: number = MemoryState.COMMIT | MemoryState.RESERVE,
    protect: number = MemoryProtection.READWRITE,
  ): number {
    const numPages = Math.ceil(size / PAGE_SIZE);

    // Simple allocator: if address is 0, find a gap
    // Start searching from 0x10000 (64KB) to avoid null pointer issues
    let startAddress = address > 0 ? this.alignDown(address) : 0x10000;

    if (address === 0) {
      // Find a specialized gap
      // This is a naive implementation; performance might key for huge allocations
      while (true) {
        let collision = false;
        for (let i = 0; i < numPages; i++) {
          if (this.pages.has(startAddress + i * PAGE_SIZE)) {
            collision = true;
            break;
          }
        }
        if (!collision) break;
        startAddress += PAGE_SIZE;
      }
    } else {
      // Verify requested range is free
      for (let i = 0; i < numPages; i++) {
        // const _addr = startAddress + i * PAGE_SIZE;
        // Should check for collisions or if re-allocation is allowed
      }
    }

    for (let i = 0; i < numPages; i++) {
      const pageAddr = startAddress + i * PAGE_SIZE;
      const page: Page = this.pages.get(pageAddr) || {
        address: pageAddr,
        data: Buffer.alloc(PAGE_SIZE),
        state: MemoryState.FREE,
        protect: MemoryProtection.NOACCESS,
        type: MemoryType.PRIVATE,
      };

      page.state = MemoryState.COMMIT;
      page.protect = protect;
      this.pages.set(pageAddr, page);
    }

    return startAddress;
  }

  free(
    address: number,
    size: number = 0,
    freeType: number = 0x8000, // MEM_RELEASE
  ): boolean {
    const startAddress = this.alignDown(address);
    const numPages = Math.ceil(size / PAGE_SIZE) || 1;

    if (freeType === 0x4000) {
      // MEM_DECOMMIT
      for (let i = 0; i < numPages; i++) {
        const pageAddr = startAddress + i * PAGE_SIZE;
        const page = this.pages.get(pageAddr);
        if (page) {
          page.state = MemoryState.RESERVE;
        }
      }
      return true;
    }

    if (freeType === 0x8000) {
      // MEM_RELEASE
      // Note: Win32 rules say size must be 0 for MEM_RELEASE, but we'll be flexible
      if (size === 0) {
        // In a real OS, this would release the entire allocation starting at address
        // For simplicity, we just delete the page at address
        this.pages.delete(startAddress);
      } else {
        for (let i = 0; i < numPages; i++) {
          this.pages.delete(startAddress + i * PAGE_SIZE);
        }
      }
      return true;
    }

    return false;
  }

  read(address: number, size: number): Buffer {
    const result = Buffer.alloc(size);
    let bytesRead = 0;
    let currentAddr = address;

    while (bytesRead < size) {
      const pageAddr = this.alignDown(currentAddr);
      const offsetInPage = currentAddr - pageAddr;
      const bytesToRead = Math.min(PAGE_SIZE - offsetInPage, size - bytesRead);

      const page = this.pages.get(pageAddr);
      if (
        page &&
        page.state & MemoryState.COMMIT &&
        !(page.protect & MemoryProtection.NOACCESS)
      ) {
        page.data.copy(
          result,
          bytesRead,
          offsetInPage,
          offsetInPage + bytesToRead,
        );
      } else {
        // Unmapped or inaccessible
      }

      bytesRead += bytesToRead;
      currentAddr += bytesToRead;
    }

    return result;
  }

  write(address: number, data: Buffer): number {
    let bytesWritten = 0;
    let currentAddr = address;
    const size = data.length;

    while (bytesWritten < size) {
      const pageAddr = this.alignDown(currentAddr);
      const offsetInPage = currentAddr - pageAddr;
      const bytesToWrite = Math.min(
        PAGE_SIZE - offsetInPage,
        size - bytesWritten,
      );

      const page = this.pages.get(pageAddr);
      if (page && page.state & MemoryState.COMMIT) {
        // Check write permissions
        if (
          page.protect &
          (MemoryProtection.READWRITE | MemoryProtection.EXECUTE_READWRITE)
        ) {
          data.copy(
            page.data,
            offsetInPage,
            bytesWritten,
            bytesWritten + bytesToWrite,
          );
        } else {
          break;
        }
      } else {
        break;
      }

      bytesWritten += bytesToWrite;
      currentAddr += bytesToWrite;
    }

    return bytesWritten;
  }

  query(address: number): MemoryBasicInformation {
    const pageAddr = this.alignDown(address);
    const page = this.pages.get(pageAddr);

    if (!page) {
      return {
        BaseAddress: BigInt(pageAddr),
        AllocationBase: BigInt(pageAddr),
        AllocationProtect: MemoryProtection.NOACCESS,
        RegionSize: BigInt(PAGE_SIZE),
        State: MemoryState.FREE,
        Protect: MemoryProtection.NOACCESS,
        Type: MemoryType.PRIVATE,
      } as unknown as MemoryBasicInformation;
    }

    return {
      BaseAddress: BigInt(page.address),
      AllocationBase: BigInt(page.address),
      AllocationProtect: page.protect,
      RegionSize: BigInt(PAGE_SIZE),
      State: page.state,
      Protect: page.protect,
      Type: page.type,
    } as unknown as MemoryBasicInformation;
  }
}
