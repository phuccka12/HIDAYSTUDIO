import { callLLMForText } from './llm';

export interface WritingGradeResult {
  score: number;        // điểm tổng (0..9, .0 hoặc .5)
  feedback: string[];   // mảng các gạch đầu dòng nhận xét ngắn
  details?: any;        // chi tiết (ví dụ: tiêu chí chấm)
  suggested_corrections?: string;
  raw?: string;         // đầu ra thô của LLM để kiểm tra
}

/**
 * Làm tròn về bước 0.5 và giới hạn trong khoảng [0,9]
 */
function normalizeScore(n: number) {
  if (!isFinite(n)) return 0;
  let v = Math.round(n * 2) / 2; // làm tròn về gần nhất 0.5
  if (v < 0) v = 0;
  if (v > 9) v = 9;
  return v;
}

/**
 * Trích xuất chuỗi JSON đầu tiên có dấu ngoặc mở và đóng cân bằng trong một đoạn văn bản.
 * Tránh lỗi khi model trả thêm văn bản trước/sau JSON.
 */
function extractFirstJson(s: string): string | null {
  if (!s) return null;
  const start = s.indexOf('{');
  if (start === -1) return null;
  let depth = 0;
  for (let i = start; i < s.length; i++) {
    const ch = s[i];
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) {
        return s.slice(start, i + 1);
      }
    }
  }
  return null;
}

/** Tạo prompt chuẩn cho Gemini */
function buildPrompt(taskPrompt: string, userAnswer: string): string {
  return `Bạn là một giám khảo kỳ cựu của kỳ thi viết IELTS. Chấm điểm bài viết sử dụng thang điểm IELTS từ 0-9 (cho phép .0 hoặc .5).
Trả về CHỈ JSON (JSON hợp lệ). Ưu tiên trả về "criteria" (task_response, coherence, lexical, grammar). Nếu bạn trả về các tiêu chí, hệ thống sẽ tự tính tổng điểm.

Dạng JSON mong đợi:
{
  "criteria": {
    "task_response": number,
    "coherence": number,
    "lexical": number,
    "grammar": number
  },
  "feedback": ["gạch đầu dòng ngắn 1", "gạch đầu dòng ngắn 2"],
  "suggested_corrections": "phần bài viết đã sửa (<=200 từ)"
}

Đề bài:
${taskPrompt}

Đáp án của học sinh:
${userAnswer}

Ràng buộc: chấm điểm bảo thủ, ưu tiên các mức điểm tăng theo 0.0 hoặc 0.5. Chỉ xuất JSON hợp lệ.
`;
}

/**
 * Gọi LLM để chấm bài viết.
 * Trả về WritingGradeResult; luôn trả feedback dưới dạng mảng string.
 */
export async function gradeWriting(taskPrompt: string, userAnswer: string): Promise<WritingGradeResult> {
  const prompt = buildPrompt(taskPrompt ?? '', userAnswer ?? '');

  // Gọi LLM (wrapper trả về { text, raw })
const model = process.env.GEMINI_MODEL || 'gemini-pro';
  const maxTokens = Number(process.env.GEMINI_MAX_TOKENS || 60000);

  const { text: rawText, raw } = await callLLMForText(prompt)
  .catch((err) => {
    const msg = `Lỗi gọi LLM: ${String(err?.message ?? err)}`;
    return { text: msg, raw: msg };
  });

  const rawOut = typeof rawText === 'string' ? rawText : String(rawText);
  // Cố gắng trích xuất JSON cân bằng
  const jsonCandidate = extractFirstJson(rawOut) ?? rawOut;

  let parsed: any = null;
  try {
    parsed = JSON.parse(jsonCandidate);
  } catch (e) {
    try {
      parsed = JSON.parse(rawOut);
    } catch (e2) {
      parsed = null;
    }
  }

  if (!parsed) {
    // không thể parse -> trả về fallback để lưu và kiểm tra
    return {
      score: 0,
      feedback: [`Không thể phân tích kết quả chấm tự động. Raw LLM (rút gọn): ${rawOut.slice(0, 800)}`],
      details: { parse_error: true },
      raw: rawOut
    };
  }

  // Lấy điểm từ các tiêu chí hoặc từ trường score
  let details: any = parsed.criteria ?? null;
  let overall = 0;

  if (details && typeof details === 'object') {
    const t = Number(details.task_response ?? details.taskResponse ?? 0) || 0;
    const co = Number(details.coherence ?? 0) || 0;
    const le = Number(details.lexical ?? 0) || 0;
    const gr = Number(details.grammar ?? 0) || 0;
    overall = normalizeScore((t + co + le + gr) / 4);
  } else {
    const s = Number(parsed.score ?? parsed.band ?? 0);
    overall = normalizeScore(isNaN(s) ? 0 : s);
    if (parsed.criteria) details = parsed.criteria;
  }

  // Chuẩn hóa feedback thành mảng các chuỗi ngắn
  let feedbackArr: string[] = [];
  if (Array.isArray(parsed.feedback)) {
    feedbackArr = parsed.feedback.map((x: any) => String(x).trim()).filter(Boolean);
  } else if (typeof parsed.feedback === 'string') {
    feedbackArr = parsed.feedback.split(/\r?\n+/).map((s: string) => s.trim()).filter(Boolean);
  }

  // Nếu model không trả feedback, tự sinh dựa trên các tiêu chí
  if (feedbackArr.length === 0 && details && typeof details === 'object') {
    const bullets: string[] = [];
    const suggest = (score: number, aspect: string) => {
      if (score >= 7) return `${aspect}: Mạnh — tiếp tục sử dụng từ vựng đa dạng và cấu trúc phức tạp.`;
      if (score >= 5) return `${aspect}: Đủ — cải thiện tính liên kết và tập trung vào nhiệm vụ để đạt band 7.`;
      return `${aspect}: Yếu — tập trung vào độ rõ ràng, tổ chức và ngữ pháp chính xác.`;
    };
    if (typeof details.task_response === 'number') bullets.push(suggest(Number(details.task_response), 'Task Response'));
    if (typeof details.coherence === 'number') bullets.push(suggest(Number(details.coherence), 'Coherence & Cohesion'));
    if (typeof details.lexical === 'number') bullets.push(suggest(Number(details.lexical), 'Lexical Resource'));
    if (typeof details.grammar === 'number') bullets.push(suggest(Number(details.grammar), 'Grammar'));
    feedbackArr = bullets;
  }

  // Nếu vẫn không có feedback, thử sử dụng suggested_corrections hoặc thông báo fallback ngắn
  if (feedbackArr.length === 0) {
    if (typeof parsed.suggested_corrections === 'string' && parsed.suggested_corrections.trim()) {
      feedbackArr = [parsed.suggested_corrections.trim().slice(0, 1000)];
    } else {
      feedbackArr = ['Không có nhận xét chi tiết từ LLM.'];
      details = { ...details, no_feedback: true };
    }
  }

  if (feedbackArr.length > 10) feedbackArr = feedbackArr.slice(0, 10);

  return {
    score: overall,
    feedback: feedbackArr,
    details,
    suggested_corrections: typeof parsed.suggested_corrections === 'string' ? parsed.suggested_corrections : undefined,
    raw: rawOut
  };
}

export default { gradeWriting };
