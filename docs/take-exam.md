# Hướng dẫn `TakeExam` — API và tích hợp frontend

Tài liệu này mô tả chi tiết flow làm bài thi (TakeExam) đã được triển khai trong dự án. Nội dung gồm: contract API (start/save/submit/get attempt), payload mẫu, chiến lược autosave, handling lỗi phổ biến, và hướng dẫn tích hợp frontend.

## Mục tiêu
- Giải thích rõ các endpoint liên quan tới attempt/exam mà frontend cần gọi.
- Mô tả dữ liệu request/response mẫu để dev frontend dễ tích hợp.
- Đưa ra chiến lược autosave và xử lý cạnh-cạnh (expired attempt, version, merge answers).

## Các endpoint chính

1) POST /exams/:id/start
- Mục đích: Tạo attempt mới cho user (bắt đầu bài thi).
- Request: Không cần body (server lấy user từ session nếu có). Nếu muốn randomize order, admin có thể cấu hình.
- Response (200):
  {
    "attemptId": "<id>",
    "expiresAt": "2025-10-13T10:20:30.000Z",
    "order": ["q1","q2",...]
  }
- Lỗi: 400 invalid exam id, 403 not published / not allowed, 429 attempts limit exceeded

2) GET /attempts/:attemptId
- Mục đích: Lấy thông tin attempt (dùng khi client điều hướng tới trang làm bài để nạp dữ liệu)
- Response (200):
  {
    "id": "<attemptId>",
    "examId": "<examId>",
    "userId": "<userId>",
    "startedAt": "...",
    "expiresAt": "...",
    "status": "in_progress", // hoặc "submitted", "expired"
    "version": 3,
    "answers": [ { "questionId": "q1", "answer": "c2" }, ... ],
    "order": ["q1","q2", ...],
    "exam": { /* optional: embedded exam snapshot (sections/questions) */ }
  }
- Lỗi: 404 attempt not found, 403 forbidden

3) POST /exams/:id/attempts/:attemptId/save
- Mục đích: Autosave / lưu tạm câu trả lời.
- Request body:
  {
    "answers": [ { "questionId": "q1", "answer": <value> }, ... ]
  }
  - Note: `answer` có thể là string (mcq), array (multi), or text for open answers.
- Response (200):
  { "ok": true, "version": 4 }
- Errors:
  - 400 invalid payload
  - 404 attempt not found
  - 400 attempt expired or not in_progress
  - 409 conflict (rare) — e.g., version mismatch if implemented

4) POST /exams/:id/attempts/:attemptId/submit
- Mục đích: Nộp bài, server sẽ merge answers, chấm tự động các câu auto-gradable, lưu kết quả.
- Request body: same shape as save.
- Response (200):
  {
    "score": 12.5,
    "total": 20,
    "percent": 62.5,
    "pass": true,
    "details": [ { "questionId": "q1", "score": 1, "max": 1 }, ... ]
  }
- Errors:
  - 400 invalid attempt/exam
  - 409 already submitted
  - 400 attempt expired (if server rejects late submissions)

## Frontend integration (TakeExam)

Các bước chính trên client `src/pages/TakeExam.tsx` đã triển khai:
1. Khi mount, gọi `GET /attempts/:attemptId` để nạp:
   - `attempt.answers` → chuyển thành `answersMap: Record<questionId, answer>` để dễ cập nhật.
   - `attempt.order` → dùng để render các câu theo đúng thứ tự.
   - `attempt.expiresAt` → tính timeLeft (giây) cho countdown.
2. Renderer câu hỏi: tùy `question.type`:
   - `mcq` → radio
   - `multi` → checkbox (answers là array)
   - fallback → textarea
3. Autosave:
   - Mỗi 20s (configable) gửi POST /exams/:id/attempts/:attemptId/save với payload current answers.
   - Nếu save lỗi (network/server), show toast lỗi và tiếp tục retry theo lần sau.
4. Submit:
   - Khi user nhấn Nộp hoặc timeLeft === 0: gửi POST /exams/:id/attempts/:attemptId/submit
   - Hiển thị kết quả trả về (score/total/percent) và điều hướng tới trang review hoặc exam list.

## Payload examples

Save payload:
```
{
  "answers": [
    { "questionId": "q1", "answer": "choice_3" },
    { "questionId": "q2", "answer": ["c1","c4"] },
    { "questionId": "q5", "answer": "My essay text..." }
  ]
}
```

Submit response example:
```
{
  "score": 15,
  "total": 20,
  "percent": 75,
  "pass": true,
  "details": [ { "questionId":"q1","score":1,"max":1 }, ... ]
}
```

## Strategies & edge-cases

- Merge answers: server-side `mergeAnswers` helper sẽ cập nhật các answer mới vào attempt.answers (theo questionId). Client có thể gửi chỉ subset câu đã thay đổi.
- Versioning: server trả `version` sau save; client có thể dùng để detect lost updates (hiện implementation cơ bản chưa enforce optimistic locking but version increments).
- Expiry: nếu attempt.expiresAt đã qua, server trả lỗi 400 cho save/submit (hoặc auto-submit tùy cấu hình). Client nên hiển thị message rõ ràng và đưa người dùng tới trang kết quả/kết thúc.
- Offline / reconnect:
  - Nếu client offline, lưu tạm answers vào localStorage và retry khi back online.
  - Khi reconnect, call save with current answers; server mergeAnswers sẽ cập nhật.
- Partial answers: it's OK to submit partial answers; grader will score auto-gradable ones and ungraded remain 0.

## Error handling (thông dụng)
- 400 invalid payload: kiểm tra shape `answers`.
- 404 attempt not found: attemptId sai hoặc đã bị xóa; redirect về trang exam list.
- 400 expired / not in_progress: show message "Bài thi đã hết thời gian hoặc đã nộp" và điều hướng.
- Network errors: show toast, retry autosave later.

## Test checklist (manual)
1. Start an exam (POST /exams/:id/start) → get attemptId
2. Open `/exams/:id/take/:attemptId` → confirm questions render and timer shows.
3. Answer several questions, wait autosave (20s) → check server attempt shows answers updated.
4. Submit → check server returns score and attempt saved with status `submitted`.
5. Try expired attempt: set expiresAt in the past on server and call save/submit → expect 400/error.

## Hướng dẫn dev: code links
- Frontend TakeExam page: `src/pages/TakeExam.tsx`
- API client wrapper: `src/services/_apiClient.ts` và `src/services/content.ts` (functions: `startExam`, `getAttempt`)
- Backend endpoints: `server/src/routes/exams.ts` (start/save/submit handlers), `server/src/utils/attemptHelpers.ts`, `server/src/services/grader.ts`

---

Nếu bạn muốn tôi mở rộng tài liệu này thành dạng checklist cho QA, hoặc tạo một file PlantUML minh họa luồng Attempt, tôi có thể tiếp tục. Tôi sẽ đánh dấu todo `Viết docs cho TakeExam` là đã hoàn thành (completed) nếu bạn đồng ý với nội dung trên. Nếu cần chỉnh sửa, nói rõ phần muốn mở rộng/giải thích thêm.