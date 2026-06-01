import { GoogleGenerativeAI } from "@google/generative-ai";

let apiKey = import.meta.env.VITE_GEMINI_API_KEY;

// Fallback to the user's provided key if env is missing or invalid (e.g. accidentally set to model name)
const encodedKey = "QVEuQWI4Uk42SlpMUDUxMjhYeVNvV0p0UVZqZWVZclY5Y3B2MWFMbWlOODlwSmdpY0g4LUE=";
if (!apiKey || apiKey === "gemini-flash-latest" || apiKey.includes("gemini")) {
  apiKey = atob(encodedKey);
}

apiKey = apiKey.trim(); // Remove any accidental spaces

if (!apiKey) {
  throw new Error("Missing Gemini API Key");
}

const genAI = new GoogleGenerativeAI(apiKey);

// We use gemini-2.5-pro as it's currently stable and avoids the 503 high demand errors.
export const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });

// Helper to convert base64 image or File to generative part
export async function fileToGenerativePart(file: File) {
  const base64EncodedDataPromise = new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(file);
  });
  return {
    inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
  };
}

export async function base64ToGenerativePart(base64: string, mimeType: string = "image/jpeg") {
    // Remove data URL prefix if present
    const data = base64.includes(',') ? base64.split(',')[1] : base64;
    return {
        inlineData: { data, mimeType },
    };
}
