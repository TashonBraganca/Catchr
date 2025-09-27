import { v4 as uuidv4 } from 'uuid';
// In-memory storage (in production, use a database)
const connectedUsers = new Map();
const rooms = new Map();
const userRooms = new Map(); // userId -> Set of roomIds
export const setupSocketHandlers = (io) => {
    io.on('connection', (socket) => {
        console.log(`User connected: ${socket.id}`);
        socket.on('authenticate', ({ userId, username }) => {
            // Store user connection
            connectedUsers.set(socket.id, { id: userId, username, socketId: socket.id });
            // Send current rooms to user
            const userRoomIds = userRooms.get(userId) || new Set();
            const userRoomsData = Array.from(userRoomIds)
                .map(roomId => {
                const room = rooms.get(roomId);
                if (!room)
                    return null;
                return {
                    id: room.id,
                    name: room.name,
                    createdBy: room.createdBy,
                    createdAt: room.createdAt,
                    memberCount: room.members.size,
                };
            })
                .filter((room) => room !== null);
            socket.emit('rooms_updated', userRoomsData);
        });
        socket.on('create_room', ({ name, creatorId }) => {
            try {
                const roomId = uuidv4();
                const room = {
                    id: roomId,
                    name,
                    createdBy: creatorId,
                    createdAt: new Date(),
                    members: new Set([creatorId]),
                    messages: [],
                };
                rooms.set(roomId, room);
                // Add room to user's rooms
                if (!userRooms.has(creatorId)) {
                    userRooms.set(creatorId, new Set());
                }
                userRooms.get(creatorId).add(roomId);
                const roomData = {
                    id: room.id,
                    name: room.name,
                    createdBy: room.createdBy,
                    createdAt: room.createdAt,
                    memberCount: room.members.size,
                };
                socket.emit('room_created', roomData);
                // Update rooms list for the user
                const userRoomIds = userRooms.get(creatorId) || new Set();
                const userRoomsData = Array.from(userRoomIds)
                    .map(id => {
                    const r = rooms.get(id);
                    if (!r)
                        return null;
                    return {
                        id: r.id,
                        name: r.name,
                        createdBy: r.createdBy,
                        createdAt: r.createdAt,
                        memberCount: r.members.size,
                    };
                })
                    .filter((r) => r !== null);
                socket.emit('rooms_updated', userRoomsData);
            }
            catch (error) {
                socket.emit('room_create_error', 'Failed to create room');
            }
        });
        socket.on('join_room', (roomId) => {
            const user = connectedUsers.get(socket.id);
            const room = rooms.get(roomId);
            if (!user || !room) {
                socket.emit('error', 'Invalid room or user');
                return;
            }
            // Join socket room
            socket.join(roomId);
            // Add user to room members
            room.members.add(user.id);
            // Add room to user's rooms if not already there
            if (!userRooms.has(user.id)) {
                userRooms.set(user.id, new Set());
            }
            userRooms.get(user.id).add(roomId);
            // Send room messages to user
            socket.emit('room_joined', roomId, room.messages);
            // Notify other users in the room
            socket.to(roomId).emit('user_joined', {
                userId: user.id,
                username: user.username,
            });
            console.log(`User ${user.username} joined room ${room.name}`);
        });
        socket.on('leave_room', (roomId) => {
            const user = connectedUsers.get(socket.id);
            const room = rooms.get(roomId);
            if (!user || !room)
                return;
            // Leave socket room
            socket.leave(roomId);
            // Remove user from room members
            room.members.delete(user.id);
            // Notify user they left
            socket.emit('room_left');
            // Notify other users in the room
            socket.to(roomId).emit('user_left', {
                userId: user.id,
                username: user.username,
            });
            console.log(`User ${user.username} left room ${room.name}`);
        });
        socket.on('send_message', (messageData) => {
            const user = connectedUsers.get(socket.id);
            const room = rooms.get(messageData.roomId);
            if (!user || !room || !room.members.has(user.id)) {
                socket.emit('error', 'Cannot send message');
                return;
            }
            const message = {
                id: uuidv4(),
                content: messageData.content,
                userId: messageData.userId,
                username: messageData.username,
                roomId: messageData.roomId,
                createdAt: new Date(),
            };
            // Store message
            room.messages.push(message);
            // Broadcast message to all users in the room
            io.to(messageData.roomId).emit('message', message);
            console.log(`Message from ${user.username} in room ${room.name}: ${message.content}`);
        });
        socket.on('disconnect', () => {
            const user = connectedUsers.get(socket.id);
            if (user) {
                console.log(`User disconnected: ${user.username}`);
                // Remove user from all rooms
                const userRoomIds = userRooms.get(user.id) || new Set();
                userRoomIds.forEach(roomId => {
                    const room = rooms.get(roomId);
                    if (room) {
                        room.members.delete(user.id);
                        socket.to(roomId).emit('user_left', {
                            userId: user.id,
                            username: user.username,
                        });
                    }
                });
                connectedUsers.delete(socket.id);
            }
        });
    });
};
//# sourceMappingURL=socketService.js.map