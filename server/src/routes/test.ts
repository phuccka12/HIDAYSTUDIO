/**
 * Test endpoint để debug Gemini API
 */
import { Router } from 'express';
import { listGeminiModels, findWorkingModel, callLLMForText } from '../services/llm';

const router = Router();

// Test endpoint để list models
router.get('/models', async (req, res) => {
  try {
    const models = await listGeminiModels();
    res.json(models);
  } catch (err: any) {
    res.status(500).json({ 
      error: 'Failed to list models', 
      message: err.message 
    });
  }
});

// Test endpoint để find working model
router.get('/working-model', async (req, res) => {
  try {
    const model = await findWorkingModel();
    res.json({ 
      workingModel: model,
      message: 'Found working model successfully'
    });
  } catch (err: any) {
    res.status(500).json({ 
      error: 'Failed to find working model', 
      message: err.message 
    });
  }
});

// Test endpoint để test API với prompt đơn giản
router.post('/test', async (req, res) => {
  try {
    const testPrompt = req.body.prompt || 'Hello, respond with just "API works!"';
    console.log('[Test] Testing API with prompt:', testPrompt);
    
    const result = await callLLMForText(testPrompt);
    
    res.json({
      success: true,
      prompt: testPrompt,
      response: result.text,
      raw: result.raw,
      message: 'API test successful'
    });
  } catch (err: any) {
    console.error('[Test] API test failed:', err);
    res.status(500).json({ 
      error: 'API test failed', 
      message: err.message,
      stack: err.stack
    });
  }
});

export default router;