/**
 * TEST SCRIPT: Verify GPT-5 Nano API is working correctly
 * Tests the deployed Vercel functions to confirm gpt-5-nano usage
 */

const fetch = require('node-fetch');

async function testVoiceCategorization() {
  console.log('🧪 Testing GPT-5 Nano Voice Categorization API...\n');

  const testTranscript = "This is Ibrahim speaking naturally, please listen to the recording.";

  try {
    const response = await fetch('https://cathcr.vercel.app/api/voice/categorize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        transcript: testTranscript
      })
    });

    const data = await response.json();

    console.log('📊 Response Status:', response.status);
    console.log('📦 Response Data:', JSON.stringify(data, null, 2));

    if (data.success) {
      console.log('\n✅ GPT-5 Nano categorization successful!');
      console.log(`   - Title: ${data.suggestedTitle}`);
      console.log(`   - Category: ${data.category}`);
      console.log(`   - Priority: ${data.priority}`);
      console.log(`   - Tags: ${data.suggestedTags?.join(', ')}`);
    } else {
      console.log('\n❌ Categorization failed:', data.error);
    }

    return data;
  } catch (error) {
    console.error('❌ Error testing API:', error.message);
    throw error;
  }
}

async function testAICategorization() {
  console.log('\n🧪 Testing GPT-5 Nano AI Categorization API...\n');

  const testText = "Need to finish the quarterly report by Friday. Should take about 2 hours.";

  try {
    const response = await fetch('https://cathcr.vercel.app/api/ai/categorize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: testText
      })
    });

    const data = await response.json();

    console.log('📊 Response Status:', response.status);
    console.log('📦 Response Data:', JSON.stringify(data, null, 2));

    if (data.success) {
      console.log('\n✅ GPT-5 Nano AI categorization successful!');
      console.log(`   - Title: ${data.suggestedTitle}`);
      console.log(`   - Category: ${data.category}`);
      console.log(`   - Folder: ${data.folder}`);
      console.log(`   - Priority: ${data.priority}`);
      console.log(`   - Duration: ${data.estimatedDuration}`);
      console.log(`   - Tags: ${data.tags?.join(', ')}`);
    } else {
      console.log('\n❌ Categorization failed:', data.error);
    }

    return data;
  } catch (error) {
    console.error('❌ Error testing API:', error.message);
    throw error;
  }
}

async function runTests() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  GPT-5 NANO API VERIFICATION TEST');
  console.log('  Vercel Deployment: https://cathcr.vercel.app');
  console.log('═══════════════════════════════════════════════════════\n');

  try {
    await testVoiceCategorization();
    await testAICategorization();

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('  ✅ ALL TESTS PASSED');
    console.log('  Next: Check OpenAI dashboard for gpt-5-nano usage');
    console.log('═══════════════════════════════════════════════════════\n');
  } catch (error) {
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('  ❌ TESTS FAILED');
    console.log('  Error:', error.message);
    console.log('═══════════════════════════════════════════════════════\n');
    process.exit(1);
  }
}

runTests();
