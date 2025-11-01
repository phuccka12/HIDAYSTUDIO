import { callLLMForText } from './llm';

export interface WritingGradeResult {
  score: number;        // điểm tổng (0..9, .0 hoặc .5)
  feedback: string[];   // mảng các gạch đầu dòng nhận xét ngắn
  details?: {           // chi tiết các tiêu chí chấm điểm
    task_response?: number;
    coherence?: number;
    lexical?: number;
    grammar?: number;
    [key: string]: any;  // cho phép các trường khác như parse_error, no_feedback, etc.
  };        
  suggested_corrections?: string;
  raw?: string;         // đầu ra thô của LLM để kiểm tra
  processing_time?: number; // thời gian xử lý (ms)
  model_used?: string;  // model được sử dụng
}

export interface IELTSCriteria {
  task_response: number;  // Task Achievement/Response (0-9)
  coherence: number;      // Coherence and Cohesion (0-9)  
  lexical: number;        // Lexical Resource (0-9)
  grammar: number;        // Grammatical Range and Accuracy (0-9)
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

/**
 * Phân tích task type để xác định yêu cầu chấm điểm
 */
function analyzeTaskType(taskPrompt: string): { type: string; requirements: string[] } {
  const prompt = taskPrompt.toLowerCase();
  
  if (prompt.includes('task 1') || prompt.includes('describe') || prompt.includes('graph') || prompt.includes('chart')) {
    return {
      type: 'task1',
      requirements: [
        'Mô tả chính xác thông tin từ biểu đồ/bảng',
        'Tổ chức logic với overview và details',
        'So sánh và làm nổi bật xu hướng chính',
        'Đạt tối thiểu 150 từ'
      ]
    };
  } else {
    return {
      type: 'task2', 
      requirements: [
        'Trả lời đầy đủ câu hỏi đề bài',
        'Đưa ra quan điểm rõ ràng với luận cứ',
        'Phát triển ý tưởng với ví dụ cụ thể',
        'Đạt tối thiểu 250 từ'
      ]
    };
  }
}

/**
 * Tạo prompt chuyên nghiệp cho chấm điểm IELTS Writing 
 */
function buildPrompt(taskPrompt: string, userAnswer: string): string {
  const taskInfo = analyzeTaskType(taskPrompt);
  const wordCount = userAnswer.trim().split(/\s+/).length;
  
  return `Bạn là giám khảo IELTS chính thức với 15+ năm kinh nghiệm. Chấm bài viết theo tiêu chuẩn IELTS chính xác.

**NHIỆM VỤ**: Chấm điểm bài viết IELTS ${taskInfo.type.toUpperCase()} theo 4 tiêu chí chính với thang điểm 0-9 (bước 0.5).

**QUAN TRỌNG**: Tất cả nhận xét phải bằng TIẾNG VIỆT. Không được sử dụng tiếng Anh trong phần feedback.

**YÊU CẦU ĐẦU RA**: Trả về CHÍNH XÁC định dạng JSON sau (không có text thêm):

\`\`\`json
{
  "criteria": {
    "task_response": [số từ 0-9, bước 0.5],
    "coherence": [số từ 0-9, bước 0.5], 
    "lexical": [số từ 0-9, bước 0.5],
    "grammar": [số từ 0-9, bước 0.5]
  },
  "feedback": [
    "Phản hồi nhiệm vụ: [nhận xét cụ thể bằng tiếng Việt]",
    "Tính mạch lạc và liên kết: [nhận xét cụ thể bằng tiếng Việt]", 
    "Từ vựng: [nhận xét cụ thể bằng tiếng Việt]",
    "Ngữ pháp: [nhận xét cụ thể bằng tiếng Việt]"
  ],
  "suggested_corrections": "[sửa lỗi quan trọng nhất - tối đa 3 câu]"
}
\`\`\`

**TIÊU CHÍ CHẤM ĐIỂM**:

1. **Task Response** (${taskInfo.type === 'task1' ? 'Task Achievement' : 'Task Response'}):
${taskInfo.requirements.map(req => `   - ${req}`).join('\n')}

2. **Coherence and Cohesion**: 
   - Tổ chức ý tưởng logic và mạch lạc
   - Sử dụng liên từ và từ nối phù hợp
   - Chia đoạn văn hợp lý

3. **Lexical Resource**:
   - Phạm vi từ vựng phong phú và chính xác
   - Collocations tự nhiên
   - Ít lỗi chính tả và từ vựng

4. **Grammatical Range and Accuracy**:
   - Đa dạng cấu trúc câu
   - Độ chính xác ngữ pháp cao
   - Punctuation đúng

**THỐNG KÊ BÀI VIẾT**:
- Số từ: ${wordCount} (yêu cầu: ${taskInfo.type === 'task1' ? '150+' : '250+'})
- Task type: ${taskInfo.type.toUpperCase()}

**ĐỀ BÀI**:
${taskPrompt}

**BÀI VIẾT CỦA HỌC SINH**:
${userAnswer}

**LƯU Ý QUAN TRỌNG**: 
- Chấm điểm nghiêm khắc theo chuẩn IELTS thực tế
- Ưu tiên điểm .0 và .5, tránh điểm lẻ khác
- Feedback cụ thể và xây dựng
- Chỉ trả về JSON không có text bổ sung
- **BẮT BUỘC: Tất cả nhận xét phải viết bằng TIẾNG VIỆT hoàn toàn. Không được có từ tiếng Anh nào trong phần feedback.**`;
}

/**
 * Gọi LLM để chấm bài viết với error handling và logging nâng cao
 * Trả về WritingGradeResult; luôn trả feedback dưới dạng mảng string.
 */
export async function gradeWriting(taskPrompt: string, userAnswer: string): Promise<WritingGradeResult> {
  const startTime = Date.now();
  const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash-exp';
  
  console.log(`[WritingGrader] Starting grading process with model: ${model}`);
  console.log(`[WritingGrader] Task prompt length: ${taskPrompt?.length || 0}, Answer length: ${userAnswer?.length || 0}`);
  
  // Validation đầu vào
  if (!taskPrompt?.trim()) {
    console.warn('[WritingGrader] Empty task prompt provided');
    return {
      score: 0,
      feedback: ['Không có đề bài để chấm điểm'],
      details: { validation_error: true },
      processing_time: Date.now() - startTime,
      model_used: model
    };
  }

  if (!userAnswer?.trim()) {
    console.warn('[WritingGrader] Empty user answer provided');
    return {
      score: 0,
      feedback: ['Bài viết trống - không thể chấm điểm'],
      details: { validation_error: true },
      processing_time: Date.now() - startTime,
      model_used: model
    };
  }

  // Kiểm tra độ dài bài viết
  const wordCount = userAnswer.trim().split(/\s+/).length;
  if (wordCount < 50) {
    console.warn(`[WritingGrader] Answer too short: ${wordCount} words`);
    return {
      score: 1.0,
      feedback: [`Bài viết quá ngắn (${wordCount} từ). IELTS yêu cầu tối thiểu 150-250 từ tùy theo task.`],
      details: { word_count: wordCount, too_short: true },
      processing_time: Date.now() - startTime,
      model_used: model
    };
  }

  const prompt = buildPrompt(taskPrompt, userAnswer);
  let rawText = '';
  let raw: any = {};

  try {
    console.log('[WritingGrader] Calling LLM API...');
    const response = await callLLMForText(prompt);
    rawText = typeof response.text === 'string' ? response.text : String(response.text);
    raw = response.raw;
    console.log(`[WritingGrader] LLM response received, length: ${rawText.length}`);
    console.log(`[WritingGrader] Raw AI response preview:`, rawText.substring(0, 300) + '...');
  } catch (err: any) {
    console.error('[WritingGrader] LLM API call failed:', err);
    const errorMsg = `Lỗi gọi LLM: ${String(err?.message ?? err)}`;
    return {
      score: 0,
      feedback: [errorMsg],
      details: { llm_error: true, error_message: String(err?.message ?? err) },
      raw: errorMsg,
      processing_time: Date.now() - startTime,
      model_used: model
    };
  }

  // Trích xuất và parse JSON response
  const result = parseGradingResponse(rawText, raw);
  
  // Thêm metadata
  result.processing_time = Date.now() - startTime;
  result.model_used = model;
  
  console.log(`[WritingGrader] Grading completed in ${result.processing_time}ms, final score: ${result.score}`);
  
  return result;
}

/**
 * Parse và validate response từ LLM
 */
function parseGradingResponse(rawText: string, raw: any): WritingGradeResult {
  console.log('[WritingGrader] Parsing LLM response...');
  
  // Cố gắng trích xuất JSON từ response
  let jsonCandidate = extractFirstJson(rawText);
  if (!jsonCandidate) {
    // Thử tìm JSON trong markdown code block
    const codeBlockMatch = rawText.match(/```json\s*([\s\S]*?)\s*```/i);
    if (codeBlockMatch) {
      jsonCandidate = codeBlockMatch[1].trim();
    } else {
      jsonCandidate = rawText;
    }
  }

  let parsed: any = null;
  const parseErrors: string[] = [];

  // Thử parse JSON với nhiều cách khác nhau
  for (const candidate of [jsonCandidate, rawText]) {
    try {
      parsed = JSON.parse(candidate);
      console.log('[WritingGrader] Successfully parsed JSON response');
      break;
    } catch (e) {
      parseErrors.push(String(e));
    }
  }

  if (!parsed) {
    console.error('[WritingGrader] Failed to parse JSON response:', parseErrors);
    return {
      score: 0,
      feedback: [
        'Không thể phân tích kết quả chấm tự động.',
        `Parse errors: ${parseErrors.slice(0, 2).join(', ')}`,
        `Raw response preview: ${rawText.slice(0, 500)}...`
      ],
      details: { parse_error: true, parse_errors: parseErrors },
      raw: rawText
    };
  }

  // Validate và extract điểm số
  return extractGradingResults(parsed, rawText);
}

/**
 * Extract và validate kết quả chấm điểm từ parsed JSON
 */
function extractGradingResults(parsed: any, rawText: string): WritingGradeResult {
  const criteria = parsed.criteria;
  let overall = 0;
  let details: any = null;

  // Validate và tính điểm từ criteria
  if (criteria && typeof criteria === 'object') {
    const scores = {
      task_response: normalizeScore(Number(criteria.task_response) || 0),
      coherence: normalizeScore(Number(criteria.coherence) || 0),
      lexical: normalizeScore(Number(criteria.lexical) || 0),
      grammar: normalizeScore(Number(criteria.grammar) || 0)
    };

    // Validate tất cả scores > 0
    const validScores = Object.values(scores).filter(s => s > 0);
    if (validScores.length === 4) {
      overall = normalizeScore((scores.task_response + scores.coherence + scores.lexical + scores.grammar) / 4);
      details = scores;
      console.log(`[WritingGrader] Extracted individual scores:`, scores);
    } else {
      console.warn('[WritingGrader] Some criteria scores are invalid:', scores);
    }
  }

  // Fallback nếu không có criteria hợp lệ
  if (overall === 0) {
    const fallbackScore = Number(parsed.score ?? parsed.band ?? parsed.overall ?? 0);
    overall = normalizeScore(isNaN(fallbackScore) ? 0 : fallbackScore);
    if (overall === 0) {
      overall = 3.0; // Default minimum score nếu không extract được gì
      console.warn('[WritingGrader] Using fallback minimum score: 3.0');
    }
  }

  // Extract và validate feedback
  let feedback = extractFeedback(parsed);
  if (feedback.length === 0) {
    feedback = generateFallbackFeedback(details, overall);
  }

  return {
    score: overall,
    feedback: feedback.slice(0, 8), // Giới hạn số lượng feedback
    details,
    suggested_corrections: typeof parsed.suggested_corrections === 'string' 
      ? parsed.suggested_corrections.slice(0, 1000) 
      : undefined,
    raw: rawText
  };
}

/**
 * Extract feedback từ parsed response
 */
function extractFeedback(parsed: any): string[] {
  let feedback: string[] = [];
  
  if (Array.isArray(parsed.feedback)) {
    feedback = parsed.feedback
      .map((item: any) => String(item).trim())
      .filter(Boolean)
      .slice(0, 8);
  } else if (typeof parsed.feedback === 'string') {
    feedback = parsed.feedback
      .split(/\n+/)
      .map((line: string) => line.trim())
      .filter(Boolean)
      .slice(0, 8);
  }

  // Convert English labels to Vietnamese
  feedback = feedback.map(item => {
    return item
      .replace(/^Task Response:/i, 'Phản hồi nhiệm vụ:')
      .replace(/^Coherence & Cohesion:/i, 'Tính mạch lạc và liên kết:')
      .replace(/^Coherence and Cohesion:/i, 'Tính mạch lạc và liên kết:')
      .replace(/^Lexical Resource:/i, 'Từ vựng:')
      .replace(/^Grammar:/i, 'Ngữ pháp:')
      .replace(/^Grammatical Range and Accuracy:/i, 'Ngữ pháp:');
  });

  return feedback;
}

/**
 * Tạo feedback dự phòng khi LLM không trả về feedback hợp lệ
 */
function generateFallbackFeedback(criteria: any, overall: number): string[] {
  const feedback: string[] = [];
  
  if (criteria) {
    const getCriteriaFeedback = (score: number, criterionName: string): string => {
      if (score >= 8) return `${criterionName}: Xuất sắc - duy trì chất lượng này`;
      if (score >= 6.5) return `${criterionName}: Tốt - có thể cải thiện thêm để đạt band cao hơn`;
      if (score >= 5) return `${criterionName}: Ở mức trung bình - cần cải thiện đáng kể`;
      return `${criterionName}: Yếu - cần tập trung phát triển kỹ năng này`;
    };
    
    if (criteria.task_response) feedback.push(getCriteriaFeedback(criteria.task_response, 'Task Response'));
    if (criteria.coherence) feedback.push(getCriteriaFeedback(criteria.coherence, 'Coherence & Cohesion'));
    if (criteria.lexical) feedback.push(getCriteriaFeedback(criteria.lexical, 'Lexical Resource'));
    if (criteria.grammar) feedback.push(getCriteriaFeedback(criteria.grammar, 'Grammar Range & Accuracy'));
  }
  
  if (feedback.length === 0) {
    if (overall >= 7) {
      feedback.push('Bài viết đạt chất lượng tốt với band score cao');
    } else if (overall >= 5) {
      feedback.push('Bài viết ở mức trung bình, cần cải thiện để đạt band score cao hơn');
    } else {
      feedback.push('Bài viết cần cải thiện nhiều về nội dung, ngữ pháp và từ vựng');
    }
  }
  
  return feedback;
}

export default { gradeWriting };
