import { createError } from '../middleware/errorHandler.js';
// Mock room storage (in production, use a database)
const rooms = new Map();
export const getRooms = async (req, res) => {
    // In production, get rooms based on user permissions/membership
    const roomList = Array.from(rooms.values()).map(room => ({
        id: room.id,
        name: room.name,
        createdBy: room.createdBy,
        createdAt: room.createdAt,
        memberCount: room.memberCount,
    }));
    res.status(200).json({
        rooms: roomList,
    });
};
export const createRoom = async (req, res) => {
    const { name, creatorId } = req.body;
    if (!name || !creatorId) {
        throw createError('Room name and creator ID are required', 400);
    }
    if (name.length < 1 || name.length > 50) {
        throw createError('Room name must be between 1 and 50 characters', 400);
    }
    const roomId = Date.now().toString();
    const room = {
        id: roomId,
        name: name.trim(),
        createdBy: creatorId,
        createdAt: new Date(),
        memberCount: 1,
        messages: [],
    };
    rooms.set(roomId, room);
    res.status(201).json({
        message: 'Room created successfully',
        room: {
            id: room.id,
            name: room.name,
            createdBy: room.createdBy,
            createdAt: room.createdAt,
            memberCount: room.memberCount,
        },
    });
};
export const getRoomById = async (req, res) => {
    const { roomId } = req.params;
    const room = rooms.get(roomId);
    if (!room) {
        throw createError('Room not found', 404);
    }
    res.status(200).json({
        room: {
            id: room.id,
            name: room.name,
            createdBy: room.createdBy,
            createdAt: room.createdAt,
            memberCount: room.memberCount,
        },
    });
};
export const getRoomMessages = async (req, res) => {
    const { roomId } = req.params;
    const room = rooms.get(roomId);
    if (!room) {
        throw createError('Room not found', 404);
    }
    // In production, implement pagination
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    const messages = room.messages.slice(-limit);
    res.status(200).json({
        messages,
        total: room.messages.length,
    });
};
//# sourceMappingURL=roomController.js.map