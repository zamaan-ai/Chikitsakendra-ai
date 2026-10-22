/**
 * Automated WebSocket Connection and Ping-Pong Test
 */
const WebSocket = require('ws');
const axios = require('axios');

async function testWS() {
  try {
    const res = await axios.post('http://localhost:3000/api/patients/anonymous');
    const { wsToken } = res.data;
    console.log('✓ Acquired ephemeral patient WebSocket token.');

    const ws = new WebSocket(`ws://localhost:3000?token=${wsToken}`);

    ws.on('open', () => {
      console.log('✓ WebSocket connected successfully to server.');
      ws.send(JSON.stringify({ type: 'ping' }));
    });

    ws.on('message', (data) => {
      const msg = JSON.parse(data.toString());
      if (msg.type === 'pong') {
        console.log('✓ Handshake confirmed (pong received):', msg);
        ws.close();
        process.exit(0);
      }
    });

    ws.on('error', (err) => {
      console.error('✗ Connection Error:', err.message);
      process.exit(1);
    });
  } catch (err) {
    console.error('✗ Error requesting token:', err.message);
    process.exit(1);
  }
}

testWS();
