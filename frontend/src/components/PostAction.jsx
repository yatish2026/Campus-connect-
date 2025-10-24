export default function PostAction({ icon, text, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center px-3 py-2 rounded-md hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
      style={{ touchAction: 'manipulation' }}
    >
      <span className="mr-2">{icon}</span>
      <span className="hidden sm:inline text-sm">{text}</span>
    </button>
  );
}
