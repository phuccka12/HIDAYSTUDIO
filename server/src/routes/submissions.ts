// ...existing code...
import { Router } from 'express';
import mongoose from 'mongoose';
import Submission from '../models/Submission';
import UserProgress from '../models/UserProgress';
import { gradeWriting } from '../services/writingGrader';

const router = Router();

/**
 * Cập nhật UserProgress sau khi có submission mới được chấm điểm
 */
async function updateUserProgress(userId: string, skillType: 'listening' | 'reading' | 'writing' | 'speaking', newScore: number) {
  try {
    if (!mongoose.isValidObjectId(userId) || !newScore || newScore <= 0) {
      console.warn(`[UserProgress] Invalid input: userId=${userId}, skillType=${skillType}, score=${newScore}`);
      return;
    }

    // Tìm hoặc tạo UserProgress record
    const progress = await UserProgress.findOneAndUpdate(
      { user_id: userId, skill_type: skillType },
      {
        $setOnInsert: {
          user_id: userId,
          skill_type: skillType,
          target_score: 7.0, // Default target
          completed_exercises: 0,
          created_at: new Date()
        }
      },
      { upsert: true, new: false } // Return old document to check if it existed
    );

    // Tính current_level mới (trung bình có trọng số)
    const existingLevel = progress?.current_level || 0;
    const exerciseCount = (progress?.completed_exercises || 0) + 1;
    
    let newCurrentLevel: number;
    if (existingLevel === 0) {
      // Lần đầu tiên
      newCurrentLevel = newScore;
    } else {
      // Trung bình có trọng số: 70% score cũ + 30% score mới
      newCurrentLevel = existingLevel * 0.7 + newScore * 0.3;
    }

    // Cập nhật progress
    await UserProgress.updateOne(
      { user_id: userId, skill_type: skillType },
      {
        $set: {
          current_level: Math.round(newCurrentLevel * 10) / 10, // Round to 1 decimal
          updated_at: new Date()
        },
        $inc: {
          completed_exercises: 1
        }
      }
    );

    console.log(`[UserProgress] Updated ${skillType} for user ${userId}: ${existingLevel} → ${newCurrentLevel.toFixed(1)} (${exerciseCount} exercises)`);
  } catch (error) {
    console.error(`[UserProgress] Failed to update progress for user ${userId}:`, error);
  }
}

function isWritingTask(taskType?: string) {
  return !!taskType && (taskType.startsWith('IELTS') || taskType === 'TOEFL' || taskType === 'Other');
}

router.post('/', async (req, res) => {
  const payload = req.body || {};
  const startTime = Date.now();
  
  console.log(`[Submissions] New submission request:`, {
    taskType: payload.task_type,
    userId: payload.user_id,
    promptLength: payload.prompt?.length || 0,
    contentLength: payload.content?.length || 0,
    timestamp: new Date().toISOString()
  });

  if (!payload.task_type || !payload.prompt || !payload.content) {
    console.warn('[Submissions] Missing required fields in request:', {
      hasTaskType: !!payload.task_type,
      hasPrompt: !!payload.prompt,
      hasContent: !!payload.content
    });
    return res.status(400).json({ error: 'Missing required fields: task_type, prompt, or content' });
  }

  // Tạo document ban đầu
  let doc: any;
  try {
    doc = await Submission.create(payload);
  } catch (err: any) {
    console.error('Failed to create submission:', err);
    return res.status(500).json({ error: 'Failed to create submission', details: String(err?.message ?? err) });
  }

  try {
    if (isWritingTask(payload.task_type)) {
      const taskPrompt = payload.prompt || 'Please respond to the writing task.';
      const userAnswer = payload.content || '';

      // Gọi grader (trả WritingGradeResult)
      const result = await gradeWriting(taskPrompt, userAnswer);

      // Gán các trường tương thích với schema của bạn
      doc.ai_score = result.score;
      if (result.details) doc.ai_criteria = result.details;
      doc.ai_feedback = Array.isArray(result.feedback) ? result.feedback : [];
      const suggestedCorrections = (result as any).suggested_corrections ?? (result as any).suggestedCorrections;
      if (suggestedCorrections) doc.ai_corrections = suggestedCorrections;
  if ((result as any).corrected_answer) doc.ai_corrected = (result as any).corrected_answer;
  if ((result as any).confidence) doc.ai_confidence = (result as any).confidence;
      doc.ai_raw = result.raw;
      doc.graded_by = `gemini:${process.env.GEMINI_MODEL ?? 'gemini-1.5-flash-latest'}`;
      doc.graded_at = new Date();

      // Lưu kết quả chấm điểm vào database
      await doc.save();
      console.log(`[Submissions] Successfully graded writing submission ${doc._id} with score: ${result.score}`);
      
      // Cập nhật UserProgress cho kỹ năng Writing
      await updateUserProgress(payload.user_id, 'writing', result.score);
    }
  } catch (err: any) {
    console.error(`[Submissions] AI grading failed for submission ${doc?._id}:`, {
      error: err?.message || String(err),
      taskType: payload.task_type,
      promptLength: payload.prompt?.length || 0,
      contentLength: payload.content?.length || 0,
      stack: err?.stack
    });
    
    // Không block request — lưu lỗi vào ai_raw / ai_feedback để audit
    if (!doc) {
      // Nếu doc không tồn tại (hiếm), trả lỗi
      return res.status(500).json({ 
        error: 'Submission created but grading failed and doc missing', 
        details: String(err?.message ?? err) 
      });
    }
    
    doc.ai_feedback = Array.isArray(doc.ai_feedback) ? doc.ai_feedback : [];
    doc.ai_feedback.unshift(`AI grading error: ${String(err?.message ?? err)}`);
    doc.ai_raw = (doc.ai_raw || '') + `\nGRADER_ERROR: ${String(err?.message ?? err)}`;
    doc.graded_at = new Date();

    // Lưu lại lỗi vào database
    try { 
      await doc.save();
      console.log(`[Submissions] Saved error info for submission ${doc._id}`);
    } catch (e) { 
      console.error(`[Submissions] Failed to save doc after grading error for ${doc._id}:`, e);
    }
  }

  // Trả về document (đã được cập nhật)
  try {
    const out = await Submission.findById(doc._id).lean();
    const processingTime = Date.now() - startTime;
    
    console.log(`[Submissions] Request completed successfully:`, {
      submissionId: doc._id,
      processingTime: `${processingTime}ms`,
      aiScore: out?.ai_score,
      hasAiFeedback: Array.isArray(out?.ai_feedback) && out.ai_feedback.length > 0,
      isWritingTask: isWritingTask(payload.task_type)
    });
    
    return res.json(out);
  } catch (err: any) {
    console.error('[Submissions] Failed to fetch the updated submission:', err);
    return res.status(500).json({ 
      error: 'Failed to fetch the updated submission', 
      details: String(err?.message ?? err) 
    });
  }
});
// Lấy danh sách submission (có thể lọc theo user_id)
router.get('/', async (req, res) => {
  try {
    const userId = String(req.query.user_id || '').trim();
    const limit = Math.min(Number(req.query.limit) || 20, 200);
    const skip = Number(req.query.skip) || 0;

    const q: any = {};
    if (userId) q.user_id = userId;

    const docs = await Submission.find(q)
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return res.json(docs);
  } catch (err: any) {
    console.error('GET /submissions error', err);
    return res.status(500).json({ error: 'Failed to fetch submissions', details: String(err?.message ?? err) });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const doc = await Submission.findById(id).lean();
    if (!doc) return res.status(404).json({ error: 'Not Found' });
    return res.json(doc);
  } catch (err: any) {
    console.error('GET /submissions/:id error', err);
    return res.status(500).json({ error: 'Failed to fetch submission', details: String(err?.message ?? err) });
  }
});

export default router;
// ...existing code...