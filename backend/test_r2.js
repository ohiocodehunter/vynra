const { uploadFileToR2 } = require('./dist/services/r2');
require('dotenv').config();

async function test() {
  try {
    console.log('Testing R2 upload...');
    const url = await uploadFileToR2('uploads/temp/23e41bf1-bb4c-4a55-a032-0048db513863.mp4', 'videos/test_r2_upload.mp4', 'video/mp4');
    console.log('R2 Upload result:', url);
  } catch (err) {
    console.error('Test error:', err);
  }
}
test();
