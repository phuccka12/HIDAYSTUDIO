// Gemini SDK integration
import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export async function callGeminiSDK(prompt: string) {
  if (!GEMINI_API_KEY) throw new Error('No GEMINI_API_KEY found in environment');
  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ 
    model: process.env.GEMINI_MODEL || "gemini-2.0-flash-exp",
    generationConfig: {
      maxOutputTokens: 500,
      temperature: 0.1
    }
  });
  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();
  return { text, raw: response };
}
// Lightweight REST-based client for Google Generative Language (Gemini)
// This avoids depending on a specific client library API and gives clearer
// control over requests and errors. It supports using an API key (dev) or
// Application Default Credentials (service account) when available.

// ...existing code...
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-1.5-pro';

if (!GEMINI_API_KEY && !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  // eslint-disable-next-line no-console
  console.warn('No GEMINI_API_KEY or GOOGLE_APPLICATION_CREDENTIALS set; Gemini calls will fail.');
}

async function fetchJson(url: string, options: any) {
  // node >=18 provides global fetch; if not, developer should install node-fetch
  // Keep this simple and throw rich errors on non-OK responses.
  const res = await fetch(url, options as any);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(`HTTP ${res.status} - ${res.statusText}: ${JSON.stringify(data)}`);
    // @ts-ignore
    err.status = res.status;
    // @ts-ignore
    err.body = data;
    throw err;
  }
  return data;
}

/** List available models for quick debugging */
export async function listGeminiModels() {
  const url = `https://generativelanguage.googleapis.com/v1/models${GEMINI_API_KEY ? `?key=${encodeURIComponent(GEMINI_API_KEY)}` : ''}`;
  return fetchJson(url, { method: 'GET' });
}

/**
 * Call the Gemini (Generative Language) REST API to generate text.
 * Returns { text, raw } where raw is the full JSON response.
 */
export async function callLLMForText(prompt: string) {
  // prefer explicit API key for simplicity in dev; service account via ADC also supported by server environment
  if (!GEMINI_API_KEY && !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    throw new Error('No GEMINI_API_KEY or GOOGLE_APPLICATION_CREDENTIALS found in environment');
  }

  // Build request to v1beta generateContent endpoint (new API)
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(GEMINI_MODEL)}:generateContent${GEMINI_API_KEY ? `?key=${encodeURIComponent(GEMINI_API_KEY)}` : ''}`;

  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: Number(process.env.GEMINI_MAX_TOKENS || 2048)
    }
  };

  try {
    const data = await fetchJson(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    // Parse v1beta generateContent response
    let text = '';
    const response: any = data;
    if (Array.isArray(response?.candidates) && response.candidates[0]) {
      const candidate = response.candidates[0];
      
      // Try to get text from parts
      if (candidate?.content?.parts && Array.isArray(candidate.content.parts)) {
        text = candidate.content.parts.map((part: any) => part.text || '').join('\n');
      }
      // If no parts, but has content, try direct access
      else if (candidate?.content?.text) {
        text = candidate.content.text;
      }
      // Check finishReason for issues
      if (candidate.finishReason === 'MAX_TOKENS') {
        console.log('⚠️ Gemini response was truncated due to MAX_TOKENS');
      }
    }
    
    if (!text && typeof data === 'string') {
      text = data;
    } else if (!text) {
      // If still no text, return error message with reason
      const finishReason = response?.candidates?.[0]?.finishReason;
      text = `Error: No text content received from Gemini. FinishReason: ${finishReason || 'unknown'}`;
    }

    return { text: String(text), raw: data };
  } catch (err: any) {
    // Log and rethrow with helpful message
    console.error('Gemini REST call failed:', err);
    throw new Error(`Gemini API Error: ${err.message || String(err)}`);
  }
}

export default { callLLMForText, listGeminiModels };