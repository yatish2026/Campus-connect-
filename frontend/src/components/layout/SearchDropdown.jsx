import { Link } from 'react-router-dom';

export default function SearchDropdown({ results, onClose }) {
  if (!results) return null;

  // Safely extract users and posts as arrays to prevent map errors
  const users = Array.isArray(results.users) ? results.users : [];
  const posts = Array.isArray(results.posts) ? results.posts : [];

  return (
    <div className="absolute mt-2 w-80 bg-white shadow-lg rounded border z-50">
      <div className="p-2">
        <div className="font-semibold">Users</div>
        {users.length ? users.map(u => (
          <Link key={u._id} to={`/profile/${encodeURIComponent(u.username)}`} className="block p-2 hover:bg-gray-100" onClick={onClose}>
            <div className="font-medium">{u.name}</div>
            <div className="text-sm text-gray-500">@{u.username}</div>
          </Link>
        )) : <div className="text-sm text-gray-500 p-2">No users</div>}
      </div>
      <div className="border-t p-2">
        <div className="font-semibold">Posts</div>
        {posts.length ? posts.map(p => (
          <Link key={p._id} to={`/post/${p._id}`} className="block p-2 hover:bg-gray-100" onClick={onClose}>
            <div className="font-medium">{p.content?.slice(0, 60) || 'No content'}</div>
            <div className="text-sm text-gray-500">by {p.author?.name || p.author?.username}</div>
          </Link>
        )) : <div className="text-sm text-gray-500 p-2">No posts</div>}
      </div>
    </div>
  );
}
