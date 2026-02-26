export const MOCK_MODE =
  process.env.NEXT_PUBLIC_MOCK_MODE === "1" ||
  process.env.NEXT_PUBLIC_MOCK_MODE === "true";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://whatsflow.tech";  
