Mô hình Attempt và API cho làm bài thi

Tổng quan

Tài liệu này mô tả mô hình `Attempt` (phía server) và các endpoint API dùng để bắt đầu, lưu tạm và nộp bài thi.

Mô tả ngắn schema `Attempt`

- _id: ObjectId
- examId: ObjectId (tham chiếu tới `Exam`)
- userId: ObjectId | null
- startedAt: Date
- expiresAt: Date | null
- submittedAt: Date | null
- status: 'in_progress' | 'submitted' | 'graded'
- answers: [{ questionId, answer, updatedAt }]
- order: [questionId] (tuỳ chọn - lưu thứ tự câu hỏi đã random)
- score: number
- details: object (chi tiết kết quả/chấm điểm)
- version: number

Endpoint API

1) POST /exams/:id/start
- Mục đích: Khởi tạo một lần làm bài (attempt) mới cho đề thi.
- Request: không cần body (xác thực user qua cookie `ielts_user` nếu có)
- Response (200): { ok: true, attemptId, expiresAt, order }
- Trường hợp lỗi:
  - 400: exam id không hợp lệ
  - 404: đề thi không tìm thấy hoặc chưa publish
  - 400: đã vượt quá giới hạn số lần làm (attempts limit reached)
  - 500: lỗi server

2) POST /exams/:id/attempts/:attemptId/save
- Mục đích: Lưu tạm câu trả lời (autosave).
- Request: { answers: [{ questionId, answer }] }
- Response: { ok: true, version }
- Example:
  Request payload:
  {
    "answers": [
      { "questionId": "q_1", "answer": "A" },
      { "questionId": "q_3", "answer": { "text": "Đáp án tự luận" } }
    ]
  }

  Response:
  { "ok": true, "version": 3 }

  3) POST /exams/:id/attempts/:attemptId/submit
  - Mục đích: Nộp bài và chấm điểm (submit).
  - Request: { answers: [...] }
  - Response: { score, total, pass, details }
  - Example request:
    {
      "answers": [
        { "questionId": "q_1", "answer": "choice_12" },
        { "questionId": "q_2", "answer": ["choice_3","choice_4"] }
      ]
    }

    Example response:
    {
      "ok": true,
      "score": 3.5,
      "total": 5,
      "pass": true,
      "details": {
        "totalPossible": 5,
        "details": [ { "questionId":"q_1","awarded":1,"maxPoints":1 }, ... ],
        "percent": 70,
        "passThreshold": 60
      }
    }

  Grading rules implemented (hiện tại):
  - `mcq`: full points if selected choice id matches the single correct choice; otherwise 0 (and negative marking applies if configured).
  - `multi`: partial credit proportional to number of correct selections, minus `negativeMarking.perWrong` * wrongCount.
  - Các loại khác (essay, fill, match) hiện chưa được chấm tự động — được ghi nhận với 0 điểm và cần chấm thủ công.

3) POST /exams/:id/attempts/:attemptId/submit
- Mục đích: Nộp bài và chấm điểm (submit). (Chưa implement)
- Request: { answers: [...] }
- Response: { score, total, pass, details }

Ghi chú & chi tiết triển khai

- Kiểm soát số lần làm: `exam.settings.attemptsAllowed` (0 = không giới hạn). Nếu user đã đăng nhập thì server sẽ kiểm tra số lần gửi (submitted) trước đó.
- Giới hạn thời gian: server thiết lập `expiresAt` khi start dựa trên `exam.settings.timeLimitMinutes`. Client nên dùng `expiresAt` trả về để đếm ngược thời gian.
- Randomization: nếu `exam.settings.randomizeQuestions` = true thì server sẽ sinh và lưu `attempt.order` (đảm bảo thứ tự câu hỏi cố định trong lần làm đó).
- Bảo mật: server luôn bắt buộc kiểm tra thời hạn (expiry) và attemptsAllowed; kiểm tra ở client chỉ là UX.

Thử nghiệm

- Bắt đầu attempt (ví dụ dùng curl):
  curl -X POST http://localhost:3000/exams/<examId>/start -b "ielts_user=<userId>"
- Kỳ vọng: server trả JSON có `attemptId` và `expiresAt`.

## Bảng giải thích (Q/A)

Dưới đây là bảng giải thích ngắn gọn theo dạng hỏi đáp để dễ tra cứu nhanh khi phát triển hoặc test.

### 1) Các trường chính của `Attempt`

| Trường | Kiểu | Mô tả |
|---|---:|---|
| `_id` | ObjectId | ID của Attempt (do Mongo tạo) |
| `examId` | ObjectId | Tham chiếu tới `Exam` mà attempt thuộc về |
| `userId` | ObjectId \/ null | ID user nếu có (lưu cookie `ielts_user`) |
| `startedAt` | Date | Thời điểm bắt đầu attempt |
| `expiresAt` | Date \/ null | Thời điểm hết hạn (nếu exam có timeLimit) |
| `submittedAt` | Date \/ null | Thời điểm submit (nếu đã nộp) |
| `status` | string | Trạng thái: `in_progress`, `submitted`, `graded` |
| `answers` | Array | Mảng câu trả lời: `{ questionId, answer, updatedAt }` |
| `order` | Array[string] | (Tuỳ) danh sách questionId nếu đã randomize |
| `score` | number | Tổng điểm (sau khi chấm) |
| `details` | object | Chi tiết chấm từng câu (nếu có) |
| `version` | number | Phiên bản để hỗ trợ optimistic update |

### 2) Tóm tắt các endpoint chính

| Endpoint | Method | Request (body) | Response (success) | Lỗi thường gặp | Ghi chú |
|---|---:|---|---|---|---|
| `/exams/:id/start` | POST | - | `{ ok:true, attemptId, expiresAt, order }` | 400 invalid id, 404 not found, 400 attempts limit reached | Tạo Attempt mới, set expiresAt theo `timeLimitMinutes`, persist order nếu randomize |
| `/exams/:id/attempts/:attemptId/save` | POST | `{ answers: [{ questionId, answer }] }` | `{ ok:true, version }` | 400 invalid id, 404 attempt not found, 400 attempt expired / not in_progress | Merge câu trả lời vào attempt.answers, tăng `version` |
| `/exams/:id/attempts/:attemptId/submit` | POST | `{ answers: [...] }` | `{ score, total, pass, details }` | 400 invalid, 409 already submitted, 400 expired | Chấm tự động những câu auto-gradable; áp negativeMarking; (chưa implement) |
| `/attempts/:attemptId` | GET | - | `Attempt` object | 404 not found | Dùng để lấy attempt + kết quả cho review |

Nếu muốn, mình có thể mở rộng bảng lỗi để liệt kê mã lỗi cụ thể và message trả về theo từng trường hợp.

---

Mình đã thêm phần này vào cuối file `docs/attempts.md`. Bạn muốn mình cập nhật thêm ví dụ curl cụ thể cho `save` và `submit` luôn không, hay tiếp tục triển khai endpoint `submit` (chấm điểm)?


