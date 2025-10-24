import React from 'react';

export default function ConversationHeader({ partner, isOnline }) {
  if (!partner) return null;
  return (
    <div className="flex items-center">
      <div className="mr-2">{/* avatar placeholder */}</div>
      <div>
        <div className="font-medium">{partner.name || `User ${partner._id}`}</div>
        <div className="text-sm text-gray-500">{isOnline ? 'Online now' : 'Last seen recently'}</div>
      </div>
    </div>
  );
}
