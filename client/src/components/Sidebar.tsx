import React, { useState } from 'react';
import { Plus, Hash, Users } from 'lucide-react';
import { useChat } from '@/contexts/ChatContext';

const Sidebar: React.FC = () => {
  const { rooms, currentRoom, joinRoom, createRoom } = useChat();
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');

  const handleCreateRoom = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (newRoomName.trim()) {
      try {
        const room = await createRoom(newRoomName.trim());
        joinRoom(room.id);
        setNewRoomName('');
        setIsCreatingRoom(false);
      } catch (error) {
        console.error('Failed to create room:', error);
      }
    }
  };

  return (
    <div className="w-64 bg-gray-800 text-white flex flex-col">
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-lg font-semibold">Chat Rooms</h2>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-300 uppercase tracking-wide">
              Rooms
            </h3>
            <button
              onClick={() => setIsCreatingRoom(true)}
              className="p-1 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
              title="Create Room"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {isCreatingRoom && (
            <form onSubmit={handleCreateRoom} className="mb-4">
              <input
                type="text"
                value={newRoomName}
                onChange={e => setNewRoomName(e.target.value)}
                placeholder="Room name..."
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                autoFocus
                onBlur={() => {
                  if (!newRoomName.trim()) {
                    setIsCreatingRoom(false);
                  }
                }}
              />
            </form>
          )}

          <div className="space-y-1">
            {rooms.map(room => (
              <button
                key={room.id}
                onClick={() => joinRoom(room.id)}
                className={`w-full flex items-center space-x-2 px-3 py-2 text-left rounded-md transition-colors ${
                  currentRoom === room.id
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <Hash className="w-4 h-4" />
                <span className="truncate">{room.name}</span>
                {room.memberCount && (
                  <div className="ml-auto flex items-center text-xs text-gray-400">
                    <Users className="w-3 h-3 mr-1" />
                    {room.memberCount}
                  </div>
                )}
              </button>
            ))}
          </div>

          {rooms.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              <Hash className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No rooms yet</p>
              <p className="text-xs mt-1">Create your first room!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;