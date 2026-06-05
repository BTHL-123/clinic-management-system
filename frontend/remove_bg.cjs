const Jimp = require('jimp');

async function removeWhiteBg() {
  const image = await Jimp.read('C:\\Users\\Admin\\.gemini\\antigravity-ide\\brain\\e3d35b77-6d5f-4439-a1e2-62a23a9f67b8\\medical_clinic_logo_1780662424486.png');
  
  image.scan(0, 0, image.bitmap.width, image.bitmap.height, function(x, y, idx) {
    const r = this.bitmap.data[idx + 0];
    const g = this.bitmap.data[idx + 1];
    const b = this.bitmap.data[idx + 2];
    
    let whiteAmount = Math.min(r, g, b);
    let alpha = (255 - whiteAmount) / 255;
    
    if (alpha === 0) {
       this.bitmap.data[idx + 3] = 0;
    } else {
       this.bitmap.data[idx + 0] = Math.max(0, Math.min(255, (r - 255 * (1 - alpha)) / alpha));
       this.bitmap.data[idx + 1] = Math.max(0, Math.min(255, (g - 255 * (1 - alpha)) / alpha));
       this.bitmap.data[idx + 2] = Math.max(0, Math.min(255, (b - 255 * (1 - alpha)) / alpha));
       this.bitmap.data[idx + 3] = alpha * 255;
    }
  });

  await image.writeAsync('d:\\FPT Materials\\SWP391\\clinic-management-system\\frontend\\public\\logo-transparent-clean.png');
  console.log("Done");
}

removeWhiteBg().catch(console.error);
