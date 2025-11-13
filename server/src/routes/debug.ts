import { Router } from 'express';
import { gradeWriting } from '../services/writingGrader';

const router = Router();

// Debug endpoint to test Vietnamese feedback
router.post('/test-vietnamese', async (req, res) => {
  try {
    const { prompt, content } = req.body;
    
    const testPrompt = prompt || "Some people think that technology has made life easier. Others believe it has made life more complicated. Discuss both views and give your opinion.";
    const testContent = content || "Technology is everywhere in our lives today. I think it helps us a lot. For example, smartphones let us call people easily. We can also use internet to learn new things. However, some people think technology is too complicated. They say old people cannot use it well. In my opinion, technology is helpful but we need to learn how to use it properly.";
    
    console.log('[Debug] Testing Vietnamese feedback...');
    const result = await gradeWriting(testPrompt, testContent);
    
    res.json({
      success: true,
      result: result,
      feedback_preview: result.feedback,
      raw_response: result.raw
    });
    
  } catch (error) {
    console.error('[Debug] Error testing Vietnamese feedback:', error);
    res.status(500).json({
      success: false,
      error: String(error)
    });
  }
});

export default router;