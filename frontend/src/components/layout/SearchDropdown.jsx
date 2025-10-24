import React from 'react';
import { Link } from 'react-router-dom';

export default function SearchDropdown({ results, onClose }) {
  if (!results) return null;
  return (
    <div className="absolute mt-2 w-80 bg-white shadow-lg rounded border z-50">
      <div className="p-2">
        <div className="font-semibold">Users</div>
        {results.users?.length ? results.users.map(u => (
          <Link key={u._id} to={`/profile/${encodeURIComponent(u.username)}`} className="block p-2 hover:bg-gray-100" onClick={onClose}>
            <div className="font-medium">{u.name}</div>
            <div className="text-sm text-gray-500">@{u.username}</div>
          </Link>
        )) : <div className="text-sm text-gray-500 p-2">No users</div>}
      </div>
      <div className="border-t p-2">
        <div className="font-semibold">Posts</div>
        {results.posts?.length ? results.posts.map(p => (
          <Link key={p._id} to={`/post/${p._id}`} className="block p-2 hover:bg-gray-100" onClick={onClose}>
            <div className="font-medium">{p.title || p.content.slice(0, 60)}</div>
            <div className="text-sm text-gray-500">by {p.author?.name || p.author?.username}</div>
          </Link>
        )) : <div className="text-sm text-gray-500 p-2">No posts</div>}
      </div>
    </div>
  );
}
