import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';

let io;

export const initSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: [
                "http://localhost:3000",
                "https://exlabour-frontend.vercel.app"
            ],
            methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            credentials: true
        }
    });

    io.use((socket, next) => {
        const token = socket.handshake.auth.token;
        if (!token) {
            return next(new Error('Authentication error'));
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            socket.userId = decoded.id; // Store user ID in socket
            next();
        } catch (error) {
            next(new Error('Authentication error'));
        }
    });

    io.on('connection', (socket) => {
        console.log(`User connected to Socket.IO: ${socket.userId}`);
        
        // Join a personal room for 1-to-1 notifications
        socket.join(socket.userId);

        // A socket can also join special rooms, e.g. "admin" room or "verified_taskers" room
        socket.on('join_role_room', (roleName) => {
            socket.join(roleName);
            console.log(`User ${socket.userId} joined room: ${roleName}`);
        });

        socket.on('disconnect', () => {
            console.log(`User disconnected: ${socket.userId}`);
        });
    });

    return io;
};

export const getIO = () => {
    if (!io) {
        throw new Error('Socket.io NOT initialized!');
    }
    return io;
};
