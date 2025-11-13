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
  corrected_answer?: string; // phiên bản được chỉnh sửa/hiệu đính của bài
  confidence?: { [k: string]: number } | null; // optional confidence scores
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
  
  // Clean up the string first - remove markdown code blocks
  let cleaned = s.trim();
  
  // Remove ```json and ``` markers if present
  cleaned = cleaned.replace(/^```json\s*/i, '').replace(/\s*```$/i, '');
  cleaned = cleaned.replace(/^```\s*/i, '').replace(/\s*```$/i, '');
  
  const start = cleaned.indexOf('{');
  if (start === -1) return null;
  
  let depth = 0;
  let inString = false;
  let escaped = false;
  
  for (let i = start; i < cleaned.length; i++) {
    const ch = cleaned[i];
    
    if (escaped) {
      escaped = false;
      continue;
    }
    
    if (ch === '\\') {
      escaped = true;
      continue;
    }
    
    if (ch === '"') {
      inString = !inString;
      continue;
    }
    
    if (inString) continue;
    
    if (ch === '{') {
      depth++;
    } else if (ch === '}') {
      depth--;
      if (depth === 0) {
        const candidate = cleaned.slice(start, i + 1);
        // Basic validation - check if it looks like valid JSON structure
        if (candidate.includes('"score"') || candidate.includes('"criteria"') || candidate.includes('"feedback"')) {
          return candidate;
        }
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
  
  return `Bạn là một giám khảo IELTS có kinh nghiệm, chấm nghiêm túc và đồng thời đóng vai trợ giảng: ngoài việc chấm điểm theo tiêu chuẩn, nếu cần hãy chỉnh sửa/viết lại phần trả lời của học sinh để cải thiện rõ rệt về nội dung, ngữ pháp và từ vựng.

**NHIỆM VỤ**: Chấm bài viết IELTS ${taskInfo.type.toUpperCase()} theo 4 tiêu chí chính (Task Response, Coherence & Cohesion, Lexical Resource, Grammatical Range & Accuracy) trên thang 0-9 với bước 0.5.

**NGÔN NGỮ**: Tất cả output (feedback, rationale, corrected_answer, suggested_corrections) PHẢI BẰNG TIẾNG VIỆT. Không có phần text nào bằng tiếng Anh.

**YÊU CẦU ĐẦU RA**: Trả về DUY NHẤT một chuỗi JSON hợp lệ (KHÔNG có giải thích bổ sung bên ngoài JSON). Đảm bảo JSON syntax chính xác - không có trailing commas, quotes đúng chuẩn, và structure hoàn chỉnh.

**ĐỊNH DẠNG JSON BẮT BUỘC**:
{
  "score": 0.0,
  "criteria": {
    "task_response": 0.0,
    "coherence": 0.0,
    "lexical": 0.0,
    "grammar": 0.0
  },
  "confidence": {
    "task_response": 85,
    "coherence": 90,
    "lexical": 75,
    "grammar": 80,
    "overall": 85
  },
  "rationale": [
    "Lý do chính cho điểm số này",
    "Điểm mạnh và điểm yếu chính"
  ],
  "feedback": [
    "Task Response (Trả lời đề bài): Đánh giá cách trả lời yêu cầu đề bài",
    "Coherence & Cohesion (Mạch lạc & Liên kết): Đánh giá tính logic và liên kết",
    "Lexical Resource (Từ vựng): Đánh giá việc sử dụng từ vựng",
    "Grammatical Range & Accuracy (Ngữ pháp): Đánh giá ngữ pháp và cấu trúc câu"
  ],
  "suggested_corrections": "Tóm tắt 2-3 cải thiện quan trọng nhất",
  "corrected_answer": ""
}

**HƯỚNG DẪN QUAN TRỌNG**:
1. Trả về DUY NHẤT chuỗi JSON hợp lệ - không có text nào khác
2. Tất cả điểm số từ 0-9, bước 0.5 (ví dụ: 6.5, 7.0, 7.5)
3. Score = trung bình của 4 tiêu chí, làm tròn về 0.5
4. Confidence = số từ 0-100 cho độ tin cậy
5. Tất cả feedback và rationale PHẢI bằng tiếng Việt
6. Suggested_corrections: tóm tắt 2-3 điểm cần sửa ngay
7. Corrected_answer: để trống "" nếu bài ổn, hoặc viết lại ngắn gọn nếu có lỗi lớn

THỐNG KÊ BÀI VIẾT:
- Số từ bài học sinh: ${wordCount} (yêu cầu: ${taskInfo.type === 'task1' ? '150+' : '250+'})

ĐỀ BÀI:
${taskPrompt}

BÀI HỌC SINH:
${userAnswer}`;
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
 * Clean và fix JSON string trước khi parse
 */
function cleanJsonString(jsonStr: string): string {
  if (!jsonStr) return jsonStr;
  
  // Remove BOM and invisible characters
  let cleaned = jsonStr.replace(/^\uFEFF/, '').trim();
  
  // Fix common JSON issues
  cleaned = cleaned
    // Fix trailing commas
    .replace(/,(\s*[}\]])/g, '$1')
    // Fix missing quotes around keys
    .replace(/(\w+):/g, '"$1":')
    // Fix single quotes to double quotes (but not inside strings)
    .replace(/'/g, '"')
    // Remove comments
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*$/gm, '');
    
  return cleaned;
}

/**
 * Parse và validate response từ LLM với improved error handling
 */
function parseGradingResponse(rawText: string, raw: any): WritingGradeResult {
  console.log('[WritingGrader] Parsing LLM response...');
  console.log('[WritingGrader] Raw response preview:', rawText.substring(0, 200) + '...');
  
  const parseErrors: string[] = [];
  let parsed: any = null;
  
  // Multiple strategies to extract and parse JSON
  const candidates = [];
  
  // Strategy 1: Extract first JSON from raw text
  const extractedJson = extractFirstJson(rawText);
  if (extractedJson) {
    candidates.push({ source: 'extracted', content: extractedJson });
  }
  
  // Strategy 2: Look for JSON in code blocks
  const codeBlockMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (codeBlockMatch) {
    candidates.push({ source: 'codeblock', content: codeBlockMatch[1].trim() });
  }
  
  // Strategy 3: Use raw text as-is
  candidates.push({ source: 'raw', content: rawText.trim() });
  
  // Strategy 4: Try to find JSON-like structure with regex
  const jsonMatch = rawText.match(/\{[\s\S]*"score"[\s\S]*\}/);
  if (jsonMatch) {
    candidates.push({ source: 'regex', content: jsonMatch[0] });
  }
  
  // Try to parse each candidate
  for (const candidate of candidates) {
    try {
      const cleaned = cleanJsonString(candidate.content);
      parsed = JSON.parse(cleaned);
      console.log(`[WritingGrader] Successfully parsed JSON using ${candidate.source} strategy`);
      break;
    } catch (e) {
      const error = `${candidate.source}: ${String(e)}`;
      parseErrors.push(error);
      console.log(`[WritingGrader] Parse attempt failed (${candidate.source}):`, String(e));
    }
  }

  // If all parsing failed, try to create a minimal valid response
  if (!parsed) {
    console.error('[WritingGrader] All JSON parse attempts failed:', parseErrors);
    
    // Last resort: try to extract score manually using regex
    const scoreMatch = rawText.match(/"score"?\s*:?\s*(\d+(?:\.\d+)?)/i);
    const extractedScore = scoreMatch ? parseFloat(scoreMatch[1]) : 0;
    
    console.log(`[WritingGrader] Attempting recovery with extracted score: ${extractedScore}`);
    
    return {
      score: normalizeScore(extractedScore),
      feedback: [
        'AI chấm điểm thành công nhưng kết quả chi tiết bị lỗi định dạng.',
        `Điểm ước tính: ${normalizeScore(extractedScore)}`,
        'Vui lòng thử lại hoặc liên hệ hỗ trợ kỹ thuật.'
      ],
      details: { 
        parse_error: true, 
        parse_errors: parseErrors.slice(0, 3),
        extracted_score: extractedScore,
        recovery_mode: true
      },
      raw: rawText.substring(0, 1000) // Limit raw text to avoid overwhelming
    };
  }

  // Successfully parsed - validate and extract results
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

  // Extract corrected answer and confidence if present
  const corrected = typeof parsed.corrected_answer === 'string' ? parsed.corrected_answer : (typeof parsed.correctedAnswer === 'string' ? parsed.correctedAnswer : undefined);
  const confidence = parsed.confidence && typeof parsed.confidence === 'object' ? parsed.confidence : undefined;

  return {
    score: overall,
    feedback: feedback.slice(0, 8), // Giới hạn số lượng feedback
    details,
    suggested_corrections: typeof parsed.suggested_corrections === 'string' 
      ? parsed.suggested_corrections.slice(0, 1000) 
      : (typeof parsed.suggestedCorrections === 'string' ? parsed.suggestedCorrections.slice(0,1000) : undefined),
    corrected_answer: corrected,
    confidence: confidence || null,
    raw: rawText
  };
}

/**
 * Extract feedback từ parsed response và đảm bảo có đầy đủ 4 tiêu chí IELTS
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

  // Convert English labels to Vietnamese và chuẩn hóa 4 tiêu chí
  feedback = feedback.map(item => {
    return item
      .replace(/^Task Response:/i, 'Task Response (Trả lời đề bài):')
      .replace(/^Coherence & Cohesion:/i, 'Coherence & Cohesion (Mạch lạc & Liên kết):')
      .replace(/^Coherence and Cohesion:/i, 'Coherence & Cohesion (Mạch lạc & Liên kết):')
      .replace(/^Lexical Resource:/i, 'Lexical Resource (Từ vựng):')
      .replace(/^Grammar:/i, 'Grammatical Range & Accuracy (Ngữ pháp):')
      .replace(/^Grammatical Range and Accuracy:/i, 'Grammatical Range & Accuracy (Ngữ pháp):');
  });

  // Đảm bảo có đầy đủ 4 tiêu chí IELTS nếu thiếu
  const criteriaLabels = [
    'Task Response (Trả lời đề bài):',
    'Coherence & Cohesion (Mạch lạc & Liên kết):',
    'Lexical Resource (Từ vựng):',
    'Grammatical Range & Accuracy (Ngữ pháp):'
  ];

  const missingCriteria: string[] = [];
  for (const label of criteriaLabels) {
    const found = feedback.some(item => item.startsWith(label));
    if (!found) {
      missingCriteria.push(label);
    }
  }

  // Thêm các tiêu chí còn thiếu với feedback mặc định
  if (missingCriteria.length > 0 && parsed.criteria) {
    for (const missing of missingCriteria) {
      const criteriaName = missing.split('(')[0].trim().toLowerCase().replace(/\s+/g, '_');
      let score = 0;
      
      if (criteriaName.includes('task_response') || criteriaName.includes('task response')) {
        score = parsed.criteria.task_response || 0;
      } else if (criteriaName.includes('coherence')) {
        score = parsed.criteria.coherence || 0;
      } else if (criteriaName.includes('lexical')) {
        score = parsed.criteria.lexical || 0;
      } else if (criteriaName.includes('grammatical')) {
        score = parsed.criteria.grammar || 0;
      }
      
      const defaultFeedback = generateCriteriaFeedback(score, missing);
      feedback.push(defaultFeedback);
    }
  }

  return feedback;
}

/**
 * Tạo feedback cho từng tiêu chí dựa trên điểm số
 */
function generateCriteriaFeedback(score: number, criteriaLabel: string): string {
  const getPerformanceLevel = (score: number): string => {
    if (score >= 8) return 'Xuất sắc';
    if (score >= 7) return 'Tốt';
    if (score >= 6) return 'Khá';
    if (score >= 5) return 'Trung bình';
    if (score >= 4) return 'Yếu';
    return 'Kém';
  };

  const getSuggestion = (criteriaLabel: string, score: number): string => {
    if (criteriaLabel.includes('Task Response')) {
      if (score >= 7) return 'Trả lời đúng và đầy đủ yêu cầu đề bài.';
      return 'Cần trả lời đầy đủ hơn các câu hỏi trong đề bài.';
    }
    if (criteriaLabel.includes('Coherence')) {
      if (score >= 7) return 'Ý tưởng được sắp xếp logic và liên kết tốt.';
      return 'Cần cải thiện cách sắp xếp ý và sử dụng từ nối.';
    }
    if (criteriaLabel.includes('Lexical')) {
      if (score >= 7) return 'Từ vựng đa dạng và phù hợp ngữ cảnh.';
      return 'Nên mở rộng vốn từ vựng và dùng từ chính xác hơn.';
    }
    if (criteriaLabel.includes('Grammatical')) {
      if (score >= 7) return 'Ngữ pháp chính xác với cấu trúc câu đa dạng.';
      return 'Cần cải thiện ngữ pháp và đa dạng hóa cấu trúc câu.';
    }
    return 'Cần tiếp tục luyện tập để cải thiện.';
  };

  const level = getPerformanceLevel(score);
  const suggestion = getSuggestion(criteriaLabel, score);
  
  return `${criteriaLabel} ${level} (${score}/9) - ${suggestion}`;
}
  
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
