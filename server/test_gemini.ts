import * as dotenv from 'dotenv';
dotenv.config();

import { callLLMForText } from './src/services/llm';

async function test() {
  try {
    const result = await callLLMForText('Say hello');
    console.log('Success:', result.text);
  } catch (err: any) {
    console.error('Error:', err.message);
  }
}

test();