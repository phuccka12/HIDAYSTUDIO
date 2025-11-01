// Lightweight REST-based client for Google Generative Language (Gemini)
// This avoids depending on a specific client library API and gives clearer
// control over requests and errors. It supports using an API key (dev) or
// Application Default Credentials (service account) when available.

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

/** Get the correct model name that works with the API */
function getWorkingModelName(): string {
  // Updated with actual available models from API response
  const candidates = [
    'models/gemini-2.0-flash-exp',
    'models/gemini-2.0-flash',
    'models/gemini-2.5-flash',
    'models/gemini-flash-latest',
    'models/gemini-pro-latest'
  ];
  
  const envModel = process.env.GEMINI_MODEL;
  if (envModel) {
    // Add models/ prefix if not present
    return envModel.startsWith('models/') ? envModel : `models/${envModel}`;
  }
  
  return candidates[0]; // Default to Gemini 2.0 Flash Exp
}

const GEMINI_MODEL = getWorkingModelName();

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
  if (!GEMINI_API_KEY) {
    console.warn('[LLM] No API key available for listing models');
    return null;
  }
  
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(GEMINI_API_KEY)}`;
  
  try {
    const data = await fetchJson(url, { method: 'GET' });
    const availableModels = data?.models?.map((m: any) => m.name) || [];
    console.log('[LLM] Available models:', data?.models?.map((m: any) => m.name) || 'No models found');
    console.log('[LLM] Now prioritizing Gemini 2.0 Flash models');
    return data;
  } catch (err: any) {
    console.error('[LLM] Failed to list models:', err.message);
    throw err;
  }
}

/** Find the first working model name for generateContent */
export async function findWorkingModel(): Promise<string> {
  if (!GEMINI_API_KEY) {
    return GEMINI_MODEL; // fallback to default
  }
  
  const candidates = [
    'models/gemini-2.0-flash-exp',
    'models/gemini-2.0-flash',
    'models/gemini-1.5-flash-latest',
    'models/gemini-1.5-flash',
    'models/gemini-1.5-pro-latest', 
    'models/gemini-1.5-pro'
  ];
  
  try {
    const modelsData = await listGeminiModels();
    if (modelsData?.models) {
      const availableNames = modelsData.models.map((m: any) => m.name);
      
      // Find first candidate that exists and supports generateContent
      for (const candidate of candidates) {
        const model = modelsData.models.find((m: any) => m.name === candidate);
        if (model && model.supportedGenerationMethods?.includes('generateContent')) {
          console.log(`[LLM] Found working model: ${candidate}`);
          return candidate;
        }
      }
      
      // Fallback: find any model that supports generateContent
      const workingModel = modelsData.models.find((m: any) => 
        m.supportedGenerationMethods?.includes('generateContent')
      );
      
      if (workingModel) {
        console.log(`[LLM] Using fallback model: ${workingModel.name}`);
        return workingModel.name;
      }
    }
  } catch (err: any) {
    console.warn('[LLM] Could not auto-detect working model, using default');
  }
  
  return GEMINI_MODEL;
}



/**
 * Call the Gemini (Generative Language) REST API to generate text.
 * Uses v1beta generateContent endpoint which is the correct current API.
 * Returns { text, raw } where raw is the full JSON response.
 */
export async function callLLMForText(prompt: string) {
  // prefer explicit API key for simplicity in dev; service account via ADC also supported by server environment
  if (!GEMINI_API_KEY && !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    throw new Error('No GEMINI_API_KEY or GOOGLE_APPLICATION_CREDENTIALS found in environment');
  }

  // Auto-detect working model first time
  let modelToUse = GEMINI_MODEL;
  
  try {
    modelToUse = await findWorkingModel();
  } catch (err) {
    console.warn('[LLM] Auto-detection failed, using default model');
  }

  // Build request to v1beta generateContent endpoint (correct current API)
  // Don't encode the model name since it already contains the 'models/' prefix
  const url = `https://generativelanguage.googleapis.com/v1beta/${modelToUse}:generateContent${GEMINI_API_KEY ? `?key=${encodeURIComponent(GEMINI_API_KEY)}` : ''}`;

  const body = {
    contents: [
      {
        parts: [
          {
            text: prompt
          }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: Number(process.env.GEMINI_MAX_TOKENS || 4096),
      topP: 0.8,
      topK: 10
    }
  };

  console.log(`[LLM] Calling Gemini ${modelToUse} with prompt length: ${prompt.length}`);
  console.log(`[LLM] API URL: ${url}`);

  try {
    const data = await fetchJson(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    // Extract text from v1beta generateContent response format
    let text = '';
    if (Array.isArray(data?.candidates) && data.candidates[0]) {
      const candidate = data.candidates[0];
      if (candidate?.content?.parts && Array.isArray(candidate.content.parts)) {
        text = candidate.content.parts
          .filter((part: any) => part.text)
          .map((part: any) => part.text)
          .join('\n');
      } else if (candidate?.output) {
        text = String(candidate.output);
      }
    }

    // Fallback if no text found
    if (!text && data) {
      console.warn('[LLM] Unexpected response format, using fallback:', JSON.stringify(data, null, 2));
      text = JSON.stringify(data);
    }

    console.log(`[LLM] Response received, length: ${text.length}`);
    return { text: String(text).trim(), raw: data };
  } catch (err: any) {
    // Enhanced error logging
    console.error('[LLM] Gemini API call failed:', {
      error: err.message,
      status: err.status,
      body: err.body,
      url,
      model: modelToUse
    });
    
    // If model not found, try with alternative models
    if (err.status === 404) {
      console.log('[LLM] Model not found, trying alternatives...');
      
      const alternatives = [
        'models/gemini-2.0-flash-exp',
        'models/gemini-2.0-flash',
        'models/gemini-1.5-flash',
        'models/gemini-1.5-pro',
        'models/gemini-1.5-flash-latest'
      ];
      
      for (const altModel of alternatives) {
        if (altModel === modelToUse) continue; // Skip the one we just tried
        
        try {
          console.log(`[LLM] Trying alternative: ${altModel}`);
          const altUrl = `https://generativelanguage.googleapis.com/v1beta/${altModel}:generateContent${GEMINI_API_KEY ? `?key=${encodeURIComponent(GEMINI_API_KEY)}` : ''}`;
          
          const altData = await fetchJson(altUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
          });
          
          console.log(`[LLM] Alternative model ${altModel} worked!`);
          let text = '';
          if (Array.isArray(altData?.candidates) && altData.candidates[0]) {
            const candidate = altData.candidates[0];
            if (candidate?.content?.parts && Array.isArray(candidate.content.parts)) {
              text = candidate.content.parts
                .filter((part: any) => part.text)
                .map((part: any) => part.text)
                .join('\n');
            }
          }
          
          console.log(`[LLM] Alternative response received, length: ${text.length}`);
          return { text: String(text).trim(), raw: altData };
          
        } catch (altErr: any) {
          console.error(`[LLM] Alternative ${altModel} also failed:`, altErr.message);
          continue;
        }
      }
    }
    
    throw new Error(`Gemini API Error: ${err.message || String(err)} ${err.status ? `(HTTP ${err.status})` : ''}`);
  }
}

export default { callLLMForText, listGeminiModels };