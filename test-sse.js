// Test SSE connection
const userId = 'user_378qJ4kmAO9NbiO2e9BIeI9Pv8J';
const baseUrl = 'http://localhost:4000';

console.log(`Testing SSE connection to ${baseUrl}/api/message/${userId}`);

const eventSource = new (require('eventsource'))(
  `${baseUrl}/api/message/${userId}`,
  { withCredentials: false }
);

let messageCount = 0;

eventSource.addEventListener('open', () => {
  console.log('[OPEN] SSE connection established');
});

eventSource.addEventListener('message', (e) => {
  messageCount++;
  console.log(`[MESSAGE ${messageCount}]`, e.data);
});

eventSource.addEventListener('error', (e) => {
  console.error('[ERROR]', e);
  if (eventSource.readyState === EventSource.CLOSED) {
    console.log('Connection closed');
    process.exit(0);
  }
});

// Keep script running for 10 seconds
setTimeout(() => {
  console.log('\nClosing connection...');
  eventSource.close();
  process.exit(0);
}, 10000);
