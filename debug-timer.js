import { TimekeeperCountdown } from './dist/index.js';

console.log('Testing timer...');

const timer = new TimekeeperCountdown(3, {
  onTick: (data) => {
    console.log(`Tick: ${data.totalSeconds}s remaining`);
  },
  onComplete: (data) => {
    console.log('Timer completed!', data);
    process.exit(0);
  }
});

console.log('Initial state:', timer.totalSeconds, timer.state);

timer.start();
console.log('Timer started:', timer.state);

// Keep the process alive
setTimeout(() => {
  console.log('Timer did not complete in time');
  process.exit(1);
}, 5000);