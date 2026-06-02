import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { AdminAuthContext } from './AdminAuthContext';

const SocketContext = createContext();

export const useSocket = () => {
  return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const { isAdminAuthenticated } = useContext(AdminAuthContext);

  useEffect(() => {
    let newSocket;
    if (isAdminAuthenticated) {
      newSocket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
        withCredentials: true,
      });

      setSocket(newSocket);
    }

    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, [isAdminAuthenticated]);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};
