import { io } from 'socket.io-client';

// Should match the IP used in client.ts without the /api suffix
const SOCKET_URL = 'http://10.252.145.66:5001';

export const socket = io(SOCKET_URL, {
  autoConnect: true,
  transports: ['websocket', 'polling'],
});
