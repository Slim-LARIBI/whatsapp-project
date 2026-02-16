// apps/api/src/undici-json-any.d.ts
// Force undici Response.json() to be Promise<any> so "result" is not unknown.
// SAFE: no change to existing services.

import 'undici';

declare module 'undici' {
  interface BodyMixin {
    json(): Promise<any>;
  }
}

export {};