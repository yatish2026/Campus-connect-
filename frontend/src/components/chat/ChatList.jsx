import React from 'react';

export default function ChatList({ conversations = [], onlineUsers = {}, onOpen }) {
  return (
    <div>
      <h2 className="p-4 font-bold">Messages</h2>
      <ul>
        {conversations.map(c => {
          const partnerId = c._id;
          const last = c.lastMessage;
          const isOnline = onlineUsers[partnerId];
          return (
            <li key={partnerId} className="p-3 border-b cursor-pointer" onClick={() => onOpen(partnerId)}>
              <div className="flex items-center">
                <div style={{ width: 12, height: 12, borderRadius: 6, background: isOnline ? 'green' : 'gray', marginRight: 8 }} />
                <div>
                  <div className="font-medium">User {partnerId}</div>
                  <div className="text-sm text-gray-600">{last?.text}</div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
