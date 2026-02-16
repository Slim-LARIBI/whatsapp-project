// apps/api/src/undici-json-any.ts
// Type shim: make Response.json() return any instead of unknown (front/back safe).
// No dependency on "undici" package.

declare global {
  interface Response {
    json(): Promise<any>;
  }
}

export {};