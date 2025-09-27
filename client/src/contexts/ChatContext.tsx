import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import type { Message, ChatRoom } from '@whisp/shared';
import { useAuth } from './AuthContext';

interface ChatContextType {
  socket: Socket | null;
  currentRoom: string | null;
  messages: Message[];
  rooms: ChatRoom[];
  isConnected: boolean;
  joinRoom: (roomId: string) => void;
  leaveRoom: () => void;
  sendMessage: (content: string) => void;
  createRoom: (name: string) => Promise<ChatRoom>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

interface ChatProviderProps {
  children: React.ReactNode;
}

export const ChatProvider: React.FC<ChatProviderProps> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [currentRoom, setCurrentRoom] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user) {
      const newSocket = io('http://localhost:3001', {
        auth: {
          userId: user.id,
          username: user.username,
        },
      });

      newSocket.on('connect', () => {
        setIsConnected(true);
        console.log('Connected to chat server');
      });

      newSocket.on('disconnect', () => {
        setIsConnected(false);
        console.log('Disconnected from chat server');
      });

      newSocket.on('message', (message: Message) => {
        setMessages(prev => [...prev, message]);
      });

      newSocket.on('room_joined', (roomId: string, roomMessages: Message[]) => {
        setCurrentRoom(roomId);
        setMessages(roomMessages);
      });

      newSocket.on('room_left', () => {
        setCurrentRoom(null);
        setMessages([]);
      });

      newSocket.on('rooms_updated', (updatedRooms: ChatRoom[]) => {
        setRooms(updatedRooms);
      });

      setSocket(newSocket);

      return () => {
        newSocket.disconnect();
      };
    }
  }, [isAuthenticated, user]);

  const joinRoom = (roomId: string): void => {
    if (socket) {
      socket.emit('join_room', roomId);
    }
  };

  const leaveRoom = (): void => {
    if (socket && currentRoom) {
      socket.emit('leave_room', currentRoom);
    }
  };

  const sendMessage = (content: string): void => {
    if (socket && currentRoom && user) {
      const message: Omit<Message, 'id' | 'createdAt'> = {
        content,
        userId: user.id,
        username: user.username,
        roomId: currentRoom,
      };
      socket.emit('send_message', message);
    }
  };

  const createRoom = async (name: string): Promise<ChatRoom> => {
    return new Promise((resolve, reject) => {
      if (socket && user) {
        socket.emit('create_room', { name, creatorId: user.id });
        socket.once('room_created', (room: ChatRoom) => {
          resolve(room);
        });
        socket.once('room_create_error', (error: string) => {
          reject(new Error(error));
        });
      } else {
        reject(new Error('Socket not connected or user not authenticated'));
      }
    });
  };

  const value: ChatContextType = {
    socket,
    currentRoom,
    messages,
    rooms,
    isConnected,
    joinRoom,
    leaveRoom,
    sendMessage,
    createRoom,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export const useChat = (): ChatContextType => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};