import React from 'react';

export default function TypingIndicator({ isTyping }) {
  if (!isTyping) return null;
  return (
    <div className="text-sm text-gray-500 italic">Typing...</div>
  );
}
