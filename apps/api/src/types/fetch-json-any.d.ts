// apps/api/src/types/fetch-json-any.d.ts

// Patch TypeScript lib.dom: Response.json() is typed as Promise<unknown> in recent TS versions.
// We override it to Promise<any> for this project so existing code compiles without refactors.

export {};

declare global {
  interface Body {
    json(): Promise<any>;
  }
}