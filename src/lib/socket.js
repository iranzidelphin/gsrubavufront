import { io } from 'socket.io-client';
import { getStoredToken, SERVER_BASE_URL } from './api';

let socketInstance = null;

export function getSocket() {
  const token = getStoredToken();

  if (!token) {
    return null;
  }

  if (!socketInstance) {
    socketInstance = io(SERVER_BASE_URL, {
      auth: {
        token,
      },
    });
  }

  return socketInstance;
}

export function disconnectSocket() {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
}
