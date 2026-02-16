// apps/api/src/common/http-json.ts
export async function jsonAny(res: Response): Promise<any> {
  // fetch().json() returns unknown in TS -> we cast to any once, in one place.
  const data = (await res.json()) as any;
  return data;
}