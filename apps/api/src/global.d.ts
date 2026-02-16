// apps/api/src/global.d.ts
// Force Response.json() to be Promise<any> (so result is not "unknown").
// This avoids touching existing services.

export {};

declare global {
  interface Body {
    json(): Promise<any>;
  }
}