const sharp = require('sharp');
const fs = require('fs');

async function create360TextIcon(outputPath, size, bgColor = '#E31E24') {
  try {
    // Создаем SVG с текстом "360°"
    const fontSize = Math.floor(size * 0.35); // 35% от размера
    const svg = `
      <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
        <rect width="${size}" height="${size}" fill="${bgColor}"/>
        <text
          x="50%"
          y="50%"
          font-family="Arial, sans-serif"
          font-size="${fontSize}"
          font-weight="bold"
          fill="white"
          text-anchor="middle"
          dominant-baseline="middle"
        >360°</text>
      </svg>
    `;
    
    // Конвертируем SVG в PNG
    await sharp(Buffer.from(svg))
      .png({ quality: 95 })
      .toFile(outputPath);
    
    console.log(`✅ Создан: ${outputPath} (${size}×${size})`);
  } catch (error) {
    console.error(`❌ Ошибка при создании ${outputPath}:`, error.message);
  }
}

async function main() {
  console.log('🎨 Создаю иконки 360°...\n');
  
  // Создаем директорию для бэкапа
  const backupDir = 'assets/images/backup-old-icons';
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  
  // Бэкапим старые иконки
  const filesToBackup = [
    'assets/images/icon.png',
    'assets/images/android-icon-foreground.png',
    'assets/images/android-icon-monochrome.png',
    'assets/images/splash-icon.png',
    'assets/images/favicon.png',
    'assets/icon.png',
    'assets/adaptive-icon.png',
    'assets/splash.png'
  ];
  
  console.log('📦 Создаю бэкап старых иконок...');
  filesToBackup.forEach(file => {
    if (fs.existsSync(file)) {
      const filename = file.split('/').pop();
      fs.copyFileSync(file, `${backupDir}/${filename}`);
      console.log(`  └─ Сохранен: ${filename}`);
    }
  });
  
  console.log('\n🎨 Создаю новые иконки с "360°"...\n');
  
  // Создаем все необходимые иконки
  await create360TextIcon('assets/images/icon.png', 1024);
  await create360TextIcon('assets/icon.png', 1024);
  await create360TextIcon('assets/adaptive-icon.png', 1024);
  await create360TextIcon('assets/images/android-icon-foreground.png', 1024);
  await create360TextIcon('assets/images/splash-icon.png', 512);
  await create360TextIcon('assets/splash.png', 2048);
  
  // Favicon (маленький)
  await create360TextIcon('assets/images/favicon.png', 192);
  
  // Android monochrome (белый на прозрачном)
  const monochromeSize = 1024;
  const monochromeSvg = `
    <svg width="${monochromeSize}" height="${monochromeSize}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${monochromeSize}" height="${monochromeSize}" fill="transparent"/>
      <text
        x="50%"
        y="50%"
        font-family="Arial, sans-serif"
        font-size="${Math.floor(monochromeSize * 0.35)}"
        font-weight="bold"
        fill="white"
        text-anchor="middle"
        dominant-baseline="middle"
      >360°</text>
    </svg>
  `;
  
  await sharp(Buffer.from(monochromeSvg))
    .png({ quality: 95 })
    .toFile('assets/images/android-icon-monochrome.png');
  console.log(`✅ Создан: assets/images/android-icon-monochrome.png (${monochromeSize}×${monochromeSize})`);
  
  // Обновляем логотип в папке logos
  await create360TextIcon('assets/logos/360-logo.png', 1024);
  console.log(`✅ Создан: assets/logos/360-logo.png (1024×1024)`);
  
  console.log('\n🎉 Все иконки созданы!');
  console.log('📦 Старые иконки сохранены в: assets/images/backup-old-icons/');
  console.log('\n✅ Все иконки созданы успешно!');
  console.log('\n📊 Запустите: npx expo start --clear');
  console.log('   чтобы очистить кэш и увидеть новые иконки');
}

main().catch(console.error);

