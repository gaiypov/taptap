#!/usr/bin/env node
// backend/cli/migrate-videos.ts
// CLI tool for video migration

import { Command } from 'commander';
import { videoMigration } from '../services/migration/videoMigration';

const program = new Command();

program
  .name('migrate-videos')
  .description('Migrate videos from api.video to Yandex Cloud Video')
  .version('1.0.0');

program
  .command('status')
  .description('Get migration status')
  .action(async () => {
    try {
      const status = await videoMigration.getStatus();
      console.log('\n📊 Migration Status:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`Total videos:        ${status.total}`);
      console.log(`Migrated (Yandex):  ${status.yandex} (${((status.yandex / status.total) * 100).toFixed(1)}%)`);
      console.log(`Remaining (api.video): ${status.apivideo} (${((status.apivideo / status.total) * 100).toFixed(1)}%)`);
      console.log(`Failed:             ${status.failed}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    } catch (error) {
      console.error('❌ Error getting status:', error);
      process.exit(1);
    }
  });

program
  .command('migrate')
  .description('Migrate batch of videos')
  .option('-b, --batch <size>', 'Batch size', '100')
  .option('-d, --dry-run', 'Dry run (no actual migration)', false)
  .action(async (options) => {
    const batchSize = parseInt(options.batch, 10);

    if (options.dryRun) {
      console.log(`🔍 Dry run: Would migrate ${batchSize} videos`);
      return;
    }

    console.log(`🚀 Starting migration batch (${batchSize} videos)...\n`);

    try {
      const result = await videoMigration.migrateBatch(batchSize);
      console.log('\n✅ Batch completed:');
      console.log(`   Migrated: ${result.migrated}`);
      console.log(`   Failed: ${result.failed}`);
      console.log(`   Remaining: ${result.inProgress}\n`);
    } catch (error) {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    }
  });

program
  .command('migrate-one')
  .description('Migrate single video')
  .argument('<listingId>', 'Listing ID')
  .action(async (listingId: string) => {
    console.log(`🚀 Migrating video for listing: ${listingId}\n`);

    try {
      const result = await videoMigration.migrateVideo(listingId);

      if (result.success) {
        console.log(`✅ Success! Video ID: ${result.videoId}\n`);
      } else {
        console.error(`❌ Failed: ${result.error}\n`);
        process.exit(1);
      }
    } catch (error) {
      console.error('❌ Migration error:', error);
      process.exit(1);
    }
  });

program
  .command('cleanup')
  .description('Cleanup temporary migration files')
  .action(async () => {
    try {
      await videoMigration.cleanup();
      console.log('✅ Cleanup completed\n');
    } catch (error) {
      console.error('❌ Cleanup error:', error);
      process.exit(1);
    }
  });

program.parse();

