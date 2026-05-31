import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

if (!apiKey) {
  throw new Error("Missing Gemini API Key");
}

const genAI = new GoogleGenerativeAI(apiKey);

// We use the new 3.5 Flash model depending on needs, Flash is faster for standard OCR.
export const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });

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
