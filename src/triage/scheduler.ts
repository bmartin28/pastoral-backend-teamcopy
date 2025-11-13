import cron from 'node-cron';
import { runTriageCycle } from './pipeline.js';

let cronJob: cron.ScheduledTask | null = null;

export function startScheduler() {
  // Run every 5 minutes
  const schedule = process.env.TRIAGE_SCHEDULE || '*/5 * * * *';
  
  cronJob = cron.schedule(schedule, async () => {
    console.log('Running scheduled triage cycle...');
    try {
      await runTriageCycle();
    } catch (error) {
      console.error('Scheduled triage cycle failed:', error);
    }
  });

  console.log(`Triage scheduler started with schedule: ${schedule}`);
}

export function stopScheduler() {
  if (cronJob) {
    cronJob.stop();
    cronJob = null;
    console.log('Triage scheduler stopped');
  }
}

