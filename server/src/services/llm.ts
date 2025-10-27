// Lightweight REST-based client for Google Generative Language (Gemini)
// This avoids depending on a specific client library API and gives clearer
// control over requests and errors. It supports using an API key (dev) or
// Application Default Credentials (service account) when available.

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
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

  // Build request to v1 generateText endpoint
  const url = `https://generativelanguage.googleapis.com/v1/models/${encodeURIComponent(GEMINI_MODEL)}:generateText${GEMINI_API_KEY ? `?key=${encodeURIComponent(GEMINI_API_KEY)}` : ''}`;

  const body = {
    prompt: { text: prompt },
    // tune these options as needed
    temperature: 0.0,
    maxOutputTokens: Number(process.env.GEMINI_MAX_TOKENS || 1024)
  };

  try {
    const data = await fetchJson(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    // Response shape may vary; try common locations for generated text
    // v1 responses often have `candidates` or `result.output` fields
    let text = '';
    if (Array.isArray(data?.candidates) && data.candidates[0]) {
      // candidate may contain `content` which is array of objects with `text`
      const c = data.candidates[0];
      if (typeof c === 'string') text = c;
      else if (c?.content) {
        // content may be array
        if (Array.isArray(c.content)) {
          text = c.content.map((p: any) => p.text || '').join('\n');
        } else if (typeof c.content === 'string') text = c.content;
      } else if (c?.output?.[0]?.content) {
        text = Array.isArray(c.output[0].content) ? c.output[0].content.map((p: any) => p.text || '').join('\n') : String(c.output[0].content);
      }
    } else if (data?.result?.output) {
      const out = data.result.output;
      if (Array.isArray(out)) {
        text = out.map((o: any) => (o?.content || []).map((c: any) => c.text || '').join('\n')).join('\n');
      } else if (typeof out === 'string') text = out;
    } else if (typeof data === 'string') text = data;
    else text = JSON.stringify(data);

    return { text: String(text), raw: data };
  } catch (err: any) {
    // Log and rethrow with helpful message
    console.error('Gemini REST call failed:', err);
    throw new Error(`Gemini API Error: ${err.message || String(err)}`);
  }
}

export default { callLLMForText, listGeminiModels };