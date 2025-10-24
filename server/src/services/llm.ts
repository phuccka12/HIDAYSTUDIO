// Cấu hình sử dụng Google Gemini
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL ?? 'gemini-1.5-flash-latest';

if (!GEMINI_API_KEY) {
  // eslint-disable-next-line no-console
  console.warn('GEMINI_API_KEY not set; Gemini calls will fail.');
}

// Trong file ../services/llm.ts (hoặc nơi bạn định nghĩa callLLMForText)
import { GoogleGenerativeAI } from '@google/generative-ai';

// Khởi tạo client và BUỘC nó dùng API v1
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'v1');

// Bạn nên thêm GEMINI_MODEL=gemini-pro vào file .env
const modelName = process.env.GEMINI_MODEL || 'gemini-1.5-flash-latest';

export async function callLLMForText(prompt: string) {
  try {
    const model = genAI.getGenerativeModel({ model: modelName });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Gemini không trả về "raw" như OpenAI, 
    // bạn có thể trả về toàn bộ response hoặc chỉ text
    return { text: text, raw: response }; 
  } catch (err: any) {
    console.error('Lỗi gọi Gemini API:', err);
    throw new Error(`Gemini API Error: ${err.message}`);
  }
}