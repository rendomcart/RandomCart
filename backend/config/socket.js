import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';

let io;

export const initializeSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: [process.env.CLIENT_URL, process.env.ADMIN_URL],
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.use((socket, next) => {
    try {
      // In a real scenario, you'd extract the token from cookies or auth headers
      const cookies = socket.handshake.headers.cookie;
      if (!cookies) {
        return next(new Error('Authentication error'));
      }
      
      // Basic cookie parsing to find token
      const tokenCookie = cookies.split(';').find(c => c.trim().startsWith('token='));
      if (!tokenCookie) {
         // Allow connection, but they won't join specific private rooms if unauthenticated
         // We might handle this better later when auth is fully integrated
         return next();
      }

      const token = tokenCookie.split('=')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // We need to know the role, which isn't in the JWT payload.
      // So we fetch the user from the database.
      import('../models/User.model.js').then(({ default: User }) => {
        User.findById(decoded.id).then(user => {
          if (user) {
            socket.user = { id: user._id, role: user.role };
          } else {
            socket.user = decoded;
          }
          next();
        }).catch(() => {
          socket.user = decoded;
          next();
        });
      }).catch(() => {
        socket.user = decoded;
        next();
      });

    } catch (error) {
      console.log('Socket Auth Error:', error.message);
      // We'll let unauthenticated users connect (for public client) but they won't join restricted rooms
      next();
    }
  });

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    if (socket.user) {
      if (socket.user.role === 'admin') {
        socket.join('admin-room');
        console.log(`Admin joined room: admin-room`);
      } else {
        socket.join(`user-${socket.user.id}`);
        console.log(`User joined room: user-${socket.user.id}`);
      }
    }

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};
