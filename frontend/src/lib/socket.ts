import { io } from 'socket.io-client';

const URL = typeof window !== 'undefined' ? '' : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001');
export const socket = io(URL, {
  autoConnect: true,
});
