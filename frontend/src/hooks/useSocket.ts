import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import secureStorage from '../utils/secureStorage';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'https://beautycita.com';

interface UseSocketOptions {
  namespace?: string;
  autoConnect?: boolean;
}

export const useSocket = (options: UseSocketOptions = {}) => {
  const { namespace = '/', autoConnect = true } = options;
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const initSocket = async () => {
      // Use secureStorage for token retrieval (encrypted on mobile)
      const token = await secureStorage.getItem('authToken');

      if (!token || !autoConnect || !isMounted) {
        return;
      }

      // Create socket connection
      const socketPath = namespace === '/' ? '' : namespace;
      const socket = io(`${SOCKET_URL}${socketPath}`, {
        auth: {
          token: token
        },
        transports: ['websocket', 'polling']
      });

      if (!isMounted) {
        socket.disconnect();
        return;
      }

      socketRef.current = socket;

    // Connection handlers
    socket.on('connect', () => {
      console.log(`✅ Socket connected to ${namespace}`);
      setIsConnected(true);
      setError(null);
    });

    socket.on('disconnect', () => {
      console.log(`❌ Socket disconnected from ${namespace}`);
      setIsConnected(false);
    });

    socket.on('connect_error', (err) => {
      console.error(`Socket connection error on ${namespace}:`, err);
      setError(err.message);
      setIsConnected(false);
    });

    socket.on('connected', (data) => {
      console.log('Socket connection confirmed:', data);
    });

      // Cleanup on unmount
      return () => {
        if (socket.connected) {
          socket.disconnect();
        }
      };
    };

    // Initialize socket connection
    initSocket();

    // Cleanup function
    return () => {
      isMounted = false;
      if (socketRef.current?.connected) {
        socketRef.current.disconnect();
      }
    };
  }, [namespace, autoConnect]);

  const emit = (event: string, data: any) => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit(event, data);
    } else {
      console.warn('Socket not connected, cannot emit event:', event);
    }
  };

  const on = (event: string, handler: (...args: any[]) => void) => {
    if (socketRef.current) {
      socketRef.current.on(event, handler);
    }
  };

  const off = (event: string, handler?: (...args: any[]) => void) => {
    if (socketRef.current) {
      if (handler) {
        socketRef.current.off(event, handler);
      } else {
        socketRef.current.off(event);
      }
    }
  };

  return {
    socket: socketRef.current,
    isConnected,
    error,
    emit,
    on,
    off
  };
};

// Specific hooks for different namespaces
export const useChatSocket = () => useSocket({ namespace: '/chat' });
export const useNotificationsSocket = () => useSocket({ namespace: '/notifications' });
export const useVideoSocket = () => useSocket({ namespace: '/video' });
