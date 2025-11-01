# Writing Grader Service - Hướng dẫn sử dụng

## Tổng quan

Chức năng chấm điểm Writing đã được xây dựng lại hoàn toàn với các cải tiến sau:

- ✅ API Gemini v1beta mới nhất (generateContent)
- ✅ Prompt chấm điểm IELTS chuyên nghiệp 
- ✅ Error handling và logging chi tiết
- ✅ Validation đầu vào mạnh mẽ
- ✅ JSON parsing an toàn
- ✅ Fallback mechanisms
- ✅ Performance monitoring

## Cấu hình

### 1. Environment Variables

Thêm vào file `.env`:

```bash
# Gemini AI Configuration for Writing Grader
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.0-flash-exp
GEMINI_MAX_TOKENS=8192
```

### 2. Lấy Gemini API Key

1. Truy cập [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Tạo API key mới
3. Copy và paste vào `.env` file

## Cách sử dụng

### 1. API Endpoint

```typescript
POST /api/submissions
Content-Type: application/json

{
  "task_type": "IELTS Task 2",
  "prompt": "Write about environmental problems...",
  "content": "Environmental issues have become...",
  "user_id": "user_id_here"
}
```

### 2. Response Format

```typescript
{
  "_id": "submission_id",
  "ai_score": 7.0,              // Điểm tổng (0-9, bước 0.5)
  "ai_criteria": {              // Điểm từng tiêu chí
    "task_response": 7.0,
    "coherence": 6.5,
    "lexical": 7.5,
    "grammar": 6.0
  },
  "ai_feedback": [              // Nhận xét chi tiết
    "Task Response: Good coverage...",
    "Coherence: Well-organized...",
    "Lexical: Strong vocabulary...",
    "Grammar: Generally accurate..."
  ],
  "ai_corrections": "Consider using more varied...",
  "graded_by": "gemini:gemini-2.0-flash-exp",
  "graded_at": "2024-11-01T...",
  // ... other fields
}
```

### 3. Programmatic Usage

```typescript
import { gradeWriting } from './services/writingGrader';

const result = await gradeWriting(
  "Write about technology impact on education...", // Task prompt
  "Technology has revolutionized education..."      // Student answer
);

console.log(`Score: ${result.score}/9`);
console.log('Criteria:', result.details);
console.log('Feedback:', result.feedback);
```

## Tiêu chí chấm điểm IELTS

### Task Response (25%)
- Trả lời đầy đủ câu hỏi đề bài
- Quan điểm rõ ràng và nhất quán
- Phát triển ý tưởng với ví dụ cụ thể
- Đạt số từ tối thiểu (150+ Task 1, 250+ Task 2)

### Coherence & Cohesion (25%)
- Tổ chức ý tưởng logic và mạch lạc
- Sử dụng liên từ phù hợp
- Chia đoạn văn hợp lý
- Progression ý tưởng tự nhiên

### Lexical Resource (25%)
- Phạm vi từ vựng phong phú
- Collocations tự nhiên
- Paraphrasing hiệu quả
- Ít lỗi chính tả

### Grammar Range & Accuracy (25%)
- Đa dạng cấu trúc câu
- Độ chính xác ngữ pháp cao
- Complex sentences appropriate
- Punctuation đúng

## Testing

### 1. Test Logic (không cần API key)
```bash
npm run test:writing:demo
```

### 2. Test với AI thực (cần API key)
```bash
npm run test:writing
```

### 3. Test cơ bản
```bash
npm run test:grader
```

## Monitoring & Debugging

### 1. Logs

Tất cả các bước được log chi tiết:

```
[WritingGrader] Starting grading process with model: gemini-1.5-flash
[WritingGrader] Task prompt length: 96, Answer length: 1638
[LLM] Calling Gemini gemini-1.5-flash with prompt length: 2847
[LLM] Response received, length: 1205
[WritingGrader] Successfully parsed JSON response
[WritingGrader] Extracted individual scores: {task_response: 7, coherence: 6.5, lexical: 7.5, grammar: 6}
[WritingGrader] Grading completed in 3240ms, final score: 6.5
[Submissions] Successfully graded writing submission 67... with score: 6.5
```

### 2. Error Handling

- **No API Key**: Trả về lỗi với hướng dẫn
- **Network Issues**: Retry logic và fallback
- **JSON Parse Errors**: Multiple parsing strategies  
- **Invalid Scores**: Default scoring và validation
- **Empty Content**: Validation và meaningful feedback

### 3. Performance Monitoring

- Processing time tracking
- Model usage logging
- Success/failure rates
- Score distribution analysis

## Troubleshooting

### ❌ "No GEMINI_API_KEY found"
- Kiểm tra file `.env` có tồn tại
- Đảm bảo GEMINI_API_KEY được set đúng
- Restart server sau khi thay đổi .env

### ❌ "Gemini API Error (HTTP 400)"
- API key không hợp lệ hoặc hết hạn
- Rate limiting - thử lại sau ít phút
- Check quota tại Google AI Studio

### ❌ "Cannot parse JSON response"
- Có thể do prompt quá phức tạp
- Kiểm tra raw response trong database
- Thử với bài viết ngắn hơn

### ❌ Score bất thường (quá cao/thấp)
- Kiểm tra prompt và context
- Review feedback để hiểu logic
- Có thể cần fine-tune prompt

## Phát triển tiếp

### Cải tiến có thể thêm:
1. **Fine-tuned model** cho chấm điểm IELTS
2. **Batch processing** cho nhiều bài cùng lúc
3. **Human review** workflow
4. **Score calibration** với expert graders
5. **Multi-language support**
6. **Speaking/Listening grading**

### Extension points:
```typescript
// Custom scoring weights
interface GradingConfig {
  weights: {
    task_response: number;
    coherence: number; 
    lexical: number;
    grammar: number;
  };
  strictness: 'lenient' | 'normal' | 'strict';
  task_type: 'task1' | 'task2' | 'general';
}

// Custom feedback templates
interface FeedbackTemplates {
  excellent: string[];
  good: string[];
  adequate: string[];
  weak: string[];
}
```