const sharp = require('sharp');
const fs = require('fs');

async function createSquareIcon(inputPath, outputPath, size, bgColor = '#E31E24') {
  try {
    // Читаем оригинальное изображение
    const input = sharp(inputPath);
    const metadata = await input.metadata();
    
    // Вычисляем размеры для логотипа (80% от canvas)
    const logoWidth = Math.floor(size * 0.8);
    const logoHeight = Math.floor((logoWidth * metadata.height) / metadata.width);
    
    // Ресайзим логотип
    const resizedLogo = await input
      .resize(logoWidth, logoHeight, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .toBuffer();
    
    // Создаем квадратный canvas с красным фоном
    const canvas = sharp({
      create: {
        width: size,
        height: size,
        channels: 4,
        background: bgColor
      }
    });
    
    // Вычисляем позицию для центрирования
    const left = Math.floor((size - logoWidth) / 2);
    const top = Math.floor((size - logoHeight) / 2);
    
    // Накладываем логотип на canvas
    await canvas
      .composite([{
        input: resizedLogo,
        top: top,
        left: left
      }])
      .png({ quality: 95 })
      .toFile(outputPath);
    
    console.log(`✅ Создан: ${outputPath} (${size}×${size})`);
  } catch (error) {
    console.error(`❌ Ошибка при создании ${outputPath}:`, error.message);
  }
}

async function main() {
  const logoPath = 'assets/logos/360-logo.png';
  
  if (!fs.existsSync(logoPath)) {
    console.error(`❌ Файл не найден: ${logoPath}`);
    process.exit(1);
  }
  
  console.log('🎨 Создаю квадратные иконки с логотипом 360°...\n');
  
  // Создаем все необходимые иконки
  await createSquareIcon(logoPath, 'assets/images/icon.png', 1024);
  await createSquareIcon(logoPath, 'assets/icon.png', 1024);
  await createSquareIcon(logoPath, 'assets/adaptive-icon.png', 1024);
  await createSquareIcon(logoPath, 'assets/images/android-icon-foreground.png', 1024);
  await createSquareIcon(logoPath, 'assets/images/android-icon-monochrome.png', 1024);
  await createSquareIcon(logoPath, 'assets/images/splash-icon.png', 512);
  await createSquareIcon(logoPath, 'assets/splash.png', 2048);
  
  // Favicon (маленький)
  await sharp(logoPath)
    .resize(192, 192, { fit: 'contain', background: '#E31E24' })
    .png()
    .toFile('assets/images/favicon.png');
  console.log(`✅ Создан: assets/images/favicon.png (192×192)`);
  
  console.log('\n🎉 Все квадратные иконки созданы!');
  console.log('📊 Запустите: npx expo-doctor');
}

main().catch(console.error);

