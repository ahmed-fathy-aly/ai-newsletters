// Test script for prompt optimization - runs a quick test with fewer evaluations
import 'dotenv/config';
import { optimizePrompt } from './optimize_prompt_fixed';

async function runTest() {
  console.log('🧪 Running prompt optimization test with 3 evaluations...');
  
  try {
    await optimizePrompt(20); // Run with just 3 evaluations for testing
    console.log('✅ Test completed successfully!');
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

runTest();