export class SimulatedModule {
  public id: number;
  public name: string;
  public baseAddress: number;
  public size: number;
  public exports: Map<string, number> = new Map();

  constructor(id: number, name: string, baseAddress: number, size: number) {
    this.id = id;
    this.name = name;
    this.baseAddress = baseAddress;
    this.size = size;
  }

  addExport(name: string, offset: number) {
    this.exports.set(name, this.baseAddress + offset);
  }

  getProcAddress(name: string): number | undefined {
    return this.exports.get(name);
  }
}
