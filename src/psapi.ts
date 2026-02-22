import * as Def from '@cheatron/win32-ext';
import { kernel } from './os/kernel';
import { SimulatedProcess } from './os/process';

export const PsapiImpl = {
  GetModuleInformation: (
    hProcess: Def.HANDLE,
    hModule: Def.HMODULE,
    lpmodinfo: Def.ModuleInfo | Buffer,
    cb: Def.DWORD,
  ): Def.BOOL => {
    let process: SimulatedProcess | undefined;
    const h = BigInt.asIntN(64, BigInt(hProcess as bigint));

    if (h === -1n) {
      process = kernel.currentProcess;
    } else {
      const handleObj = kernel.getObjectFromHandle(hProcess);
      if (handleObj && handleObj.type === 'Process') {
        process = handleObj.object as SimulatedProcess;
      }
    }

    if (!process) return 0;

    // Find module by name or base address
    // hModule is typically the base address
    const mod = Array.from(process.modules.values()).find(
      (m) => BigInt(m.baseAddress) === BigInt(hModule as bigint),
    );

    if (!mod) return 0;

    // lpmodinfo is LPMODULEINFO (12 bytes on x86, 24 bytes on x64)
    // typedef struct _MODULEINFO {
    //   LPVOID lpBaseOfDll;
    //   DWORD  SizeOfImage;
    //   LPVOID EntryPoint;
    // } MODULEINFO, *LPMODULEINFO;

    if (cb < 24) return 0; // Assuming x64 for mock

    if (Buffer.isBuffer(lpmodinfo)) {
      lpmodinfo.writeBigUInt64LE(BigInt(mod.baseAddress), 0);
      lpmodinfo.writeUInt32LE(mod.size, 8);
      lpmodinfo.writeBigUInt64LE(BigInt(mod.baseAddress + 0x1000), 12); // Dummy entry point
    } else {
      lpmodinfo.lpBaseOfDll = BigInt(mod.baseAddress) as unknown as Def.LPVOID;
      lpmodinfo.SizeOfImage = mod.size;
      lpmodinfo.EntryPoint = BigInt(
        mod.baseAddress + 0x1000,
      ) as unknown as Def.LPVOID;
    }

    return 1;
  },
};
