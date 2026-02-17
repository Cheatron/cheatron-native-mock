# @cheatron/cheatron-native-mock

This package provides a pure JavaScript/TypeScript mock implementation of `@cheatron/cheatron-native`.

It simulates the Windows API (`Kernel32`) and core classes (`Process`, `Thread`) in memory, allowing tests and development on non-Windows platforms without native dependencies.

## Features

- **In-Memory Kernel32**: Simulates memory operations, handle management, and process/thread APIs.
- **Type-Safe**: Uses `win32-def` for accurate Windows API type definitions.
- **Dependency-Free**: Removes `koffi` and `win32-api` runtime dependencies.
- **Test Compatibility**: Passes the standard `@cheatron/cheatron-native` test suite.

## Usage

This package is intended for testing and development environments where native modules cannot be loaded.

```bash
bun install
bun test
```
