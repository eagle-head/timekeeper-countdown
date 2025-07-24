import { test, expect } from '@playwright/test';

test.describe('Timer Precision E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/test.html');
    await page.waitForLoadState('networkidle');
  });

  test('should countdown precisely over 3 seconds', async ({ page }) => {
    // Create a 3-second timer
    await page.evaluate(() => {
      window.TimerTest.clearLogs();
      window.TimerTest.createTimer(3);
    });

    // Verify initial state
    await expect(page.locator('#total-seconds')).toHaveText('3');
    await expect(page.locator('#state')).toHaveText('IDLE');

    // Start timer and record start time
    const startTime = Date.now();
    await page.evaluate(() => {
      window.TimerTest.timer.start();
    });

    await expect(page.locator('#state')).toHaveText('RUNNING');

    // Wait for completion with some tolerance
    await page.waitForFunction(() => {
      return window.TimerTest.timer.state === 'COMPLETED';
    }, { timeout: 5000 });

    const endTime = Date.now();
    const elapsedTime = endTime - startTime;

    // Verify final state
    await expect(page.locator('#total-seconds')).toHaveText('0');
    await expect(page.locator('#state')).toHaveText('COMPLETED');

    // Check timing precision (E2E allows wider tolerance for browser variability)
    expect(elapsedTime).toBeGreaterThanOrEqual(2300);
    expect(elapsedTime).toBeLessThanOrEqual(3200);
  });

  test('should emit tick events at correct intervals', async ({ page }) => {
    await page.evaluate(() => {
      window.TimerTest.clearLogs();
      window.TimerTest.createTimer(3);
    });

    await page.evaluate(() => {
      window.TimerTest.timer.start();
    });

    // Wait for at least 2 tick events
    await page.waitForFunction(() => {
      return window.TimerTest.logs.filter(log => log.event === 'tick').length >= 2;
    }, { timeout: 3000 });

    const tickLogs = await page.evaluate(() => {
      return window.TimerTest.logs.filter(log => log.event === 'tick');
    });

    // Verify tick intervals (should be approximately 1000ms apart with E2E tolerance)
    expect(tickLogs.length).toBeGreaterThanOrEqual(2);
    
    for (let i = 1; i < tickLogs.length; i++) {
      const interval = tickLogs[i].timestamp - tickLogs[i-1].timestamp;
      expect(interval).toBeGreaterThanOrEqual(900);
      expect(interval).toBeLessThanOrEqual(1100);
    }
  });

  test('should handle pause and resume accurately', async ({ page }) => {
    await page.evaluate(() => {
      window.TimerTest.clearLogs();
      window.TimerTest.createTimer(5);
    });

    // Start timer
    await page.evaluate(() => {
      window.TimerTest.timer.start();
    });

    // Wait 1 second, then pause
    await page.waitForTimeout(1000);
    
    const remainingBeforePause = await page.evaluate(() => {
      return window.TimerTest.timer.totalSeconds;
    });

    await page.evaluate(() => {
      window.TimerTest.timer.pause();
    });

    await expect(page.locator('#state')).toHaveText('PAUSED');

    // Wait another second while paused
    await page.waitForTimeout(1000);

    const remainingAfterPause = await page.evaluate(() => {
      return window.TimerTest.timer.totalSeconds;
    });

    // Time should not have changed during pause
    expect(remainingAfterPause).toBe(remainingBeforePause);

    // Resume and verify timing continues correctly
    await page.evaluate(() => {
      window.TimerTest.timer.resume();
    });

    await expect(page.locator('#state')).toHaveText('RUNNING');

    // Wait another second and verify countdown resumed
    await page.waitForTimeout(1100);
    
    const remainingAfterResume = await page.evaluate(() => {
      return window.TimerTest.timer.totalSeconds;
    });

    expect(remainingAfterResume).toBeLessThan(remainingAfterPause);
    expect(remainingAfterResume).toBeGreaterThanOrEqual(remainingAfterPause - 3);
  });

  test('should maintain precision across multiple cycles', async ({ page }) => {
    const results = [];

    for (let i = 0; i < 3; i++) {
      // Reload the page to ensure clean state for each cycle
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      await page.evaluate(() => {
        window.TimerTest.clearLogs();
        window.TimerTest.createTimer(2);
      });

      const startTime = Date.now();
      
      await page.evaluate(() => {
        window.TimerTest.timer.start();
      });

      await page.waitForFunction(() => {
        return window.TimerTest.timer.state === 'COMPLETED';
      }, { timeout: 3000 });

      const endTime = Date.now();
      const elapsedTime = endTime - startTime;
      results.push(elapsedTime);
    }

    // All cycles should be consistent (E2E allows wider tolerance)
    for (const elapsed of results) {
      expect(elapsed).toBeGreaterThanOrEqual(1300);
      expect(elapsed).toBeLessThanOrEqual(2200);
    }

    // Variance between cycles should be minimal
    const max = Math.max(...results);
    const min = Math.min(...results);
    expect(max - min).toBeLessThanOrEqual(200);
  });

  test('should trigger complete event at precise timing', async ({ page }) => {
    await page.evaluate(() => {
      window.TimerTest.clearLogs();
      window.TimerTest.createTimer(2);
    });

    const startTime = Date.now();
    
    await page.evaluate(() => {
      window.TimerTest.timer.start();
    });

    // Wait for complete event
    await page.waitForFunction(() => {
      return window.TimerTest.logs.some(log => log.event === 'complete');
    }, { timeout: 3000 });

    const completeLog = await page.evaluate(() => {
      return window.TimerTest.logs.find(log => log.event === 'complete');
    });

    expect(completeLog).toBeTruthy();
    expect(completeLog.data.totalSeconds).toBe(0);
    expect(completeLog.data.state).toBe('COMPLETED');

    // Complete event timing with E2E tolerance
    const completeTime = completeLog.timestamp;
    const relativeCompleteTime = completeTime - (await page.evaluate(() => {
      return window.TimerTest.logs.find(log => log.event === 'start').timestamp;
    }));

    expect(relativeCompleteTime).toBeGreaterThanOrEqual(1400);
    expect(relativeCompleteTime).toBeLessThanOrEqual(2200);
  });
});