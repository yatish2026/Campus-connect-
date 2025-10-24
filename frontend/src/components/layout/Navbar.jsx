import React from 'react';
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "../../lib/axios";
import { Link } from "react-router-dom";
import { Bell, Home, LogOut, User, Users, MessageSquare, BookOpen } from "lucide-react";
import SearchDropdown from './SearchDropdown';
import { useDebounce } from '../../utils/debounce';

const Navbar = () => {
  const queryClient = useQueryClient();
  // try to read cached authUser (set in App). If not available, fetch it.
  const cached = queryClient.getQueryData(['authUser']);
  const { data: authUser } = useQuery({
    queryKey: ['authUser'],
    queryFn: async () => {
      if (cached) return cached;
      const res = await axiosInstance.get('/auth/me');
      return res.data;
    },
  });

  const { data: notifications } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => axiosInstance.get("/notifications"),
    enabled: !!authUser,
  });

  const { data: connectionRequests } = useQuery({
    queryKey: ["connectionRequests"],
    queryFn: async () => axiosInstance.get("/connections/requests"),
    enabled: !!authUser,
  });

  const { mutate: logout } = useMutation({
    mutationFn: () => axiosInstance.post("/auth/logout"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["authUser"] });
    },
  });

  // console.log(notifications, connectionRequests);

  const unreadNotificationCount = notifications?.data.filter(
    (notif) => !notif.read
  ).length;
  const unreadConnectionRequestsCount = connectionRequests?.data?.length;

  // read message unread count from react-query cache (updated by ChatLayout)
  const { data: unreadMessagesCount } = useQuery({
    queryKey: ['unreadMessagesCount'],
    queryFn: async () => {
      // fallback to 0 if not set
      const v = queryClient.getQueryData(['unreadMessagesCount']);
      return typeof v === 'number' ? v : 0;
    },
  });

  const [query, setQuery] = React.useState('');
  const [results, setResults] = React.useState(null);
  const debouncedQuery = useDebounce(query, 300);

  React.useEffect(() => {
    const run = async () => {
      if (!debouncedQuery || debouncedQuery.length < 2) { setResults(null); return; }
      try {
        const res = await axiosInstance.get(`/search?q=${encodeURIComponent(debouncedQuery)}`);
        setResults(res.data);
      } catch (err) {
        console.error('Search error', err);
      }
    };
    run();
  }, [debouncedQuery]);

  return (
    <>
      <nav className="bg-secondary shadow-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center py-3">
            <div className="flex items-center space-x-4">
              <Link to="/">
                <img
                  className="h-8 rounded"
                  src="/small-logo.png"
                  alt="ProConnect"
                />
              </Link>
            </div>
            <div className="flex items-center gap-2 md:gap-6">
              <div className="relative">
                <input value={query} onChange={(e) => setQuery(e.target.value)} className="input input-sm w-40 sm:w-60" placeholder="Search users or posts..." />
                {results && <SearchDropdown results={results} onClose={() => { setQuery(''); setResults(null); }} />}
              </div>
              {authUser ? (
                <>
                  {/* Messages always visible on mobile top-right */}
                  <Link
                    to="/messages"
                    className="text-neutral flex flex-col items-center relative"
                  >
                    <MessageSquare size={20} />
                    <span className="text-xs hidden md:block">Messages</span>
                    {unreadMessagesCount > 0 && (
                      <span className="absolute -top-1 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">{unreadMessagesCount}</span>
                    )}
                  </Link>

                  {/* Other nav items hidden on small screens, visible md+ */}
                  <div className="hidden md:flex items-center gap-2 md:gap-6">
                    <Link to={"/"} className="text-neutral flex flex-col items-center">
                      <Home size={20} />
                      <span className="text-xs md:block">Home</span>
                    </Link>
                    <Link to="/network" className="text-neutral flex flex-col items-center relative">
                      <Users size={20} />
                      <span className="text-xs md:block">My Network</span>
                      {unreadConnectionRequestsCount > 0 && (
                        <span className="absolute -top-1 -right-1 md:right-4 bg-blue-500 text-white text-xs rounded-full size-3 md:size-4 flex items-center justify-center">{unreadConnectionRequestsCount}</span>
                      )}
                    </Link>
                    <Link to="/clubs" className="text-neutral flex flex-col items-center">
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L15 8H9L12 2Z" fill="#374151" /><path d="M4 10H20V20H4V10Z" fill="#374151" /></svg>
                      <span className="text-xs md:block">Clubs</span>
                    </Link>
                    <Link to="/interview" className="text-neutral flex flex-col items-center">
                      <BookOpen size={20} />
                      <span className="text-xs md:block">Interview</span>
                    </Link>
                    <Link to="/notifications" className="text-neutral flex flex-col items-center relative">
                      <Bell size={20} />
                      <span className="text-xs md:block">Notifications</span>
                      {unreadNotificationCount > 0 && (
                        <span className="absolute -top-1 -right-1 md:right-4 bg-blue-500 text-white text-xs rounded-full size-3 md:size-4 flex items-center justify-center">{unreadNotificationCount}</span>
                      )}
                    </Link>
                    <Link to={`/profile/${encodeURIComponent(authUser.username)}`} className="text-neutral flex flex-col items-center">
                      <User size={20} />
                      <span className="text-xs md:block">Me</span>
                    </Link>
                    <button className="flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-800" onClick={() => logout()}>
                      <LogOut size={20} />
                      <span className="hidden md:inline">Logout</span>
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="hidden md:flex items-center gap-2">
                    <Link to="/login" className="btn btn-ghost">Sign In</Link>
                    <Link to="/signup" className="btn btn-primary">Join now</Link>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-inner z-40 lg:hidden">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center py-2">
            <Link to="/" className="flex-1 text-center py-2">
              <Home size={20} className="mx-auto" />
              <div className="text-xs text-gray-600">Home</div>
            </Link>
            <Link to="/network" className="flex-1 text-center py-2">
              <Users size={20} className="mx-auto" />
              <div className="text-xs text-gray-600">My Network</div>
            </Link>
            <Link to="/interview" className="flex-1 text-center py-2">
              <BookOpen size={20} className="mx-auto" />
              <div className="text-xs text-gray-600">Interview</div>
            </Link>
            <Link to="/notifications" className="flex-1 text-center py-2">
              <Bell size={20} className="mx-auto" />
              <div className="text-xs text-gray-600">Notifications</div>
            </Link>
            <Link to="/clubs" className="flex-1 text-center py-2">
              <svg className="w-5 h-5 mx-auto" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L15 8H9L12 2Z" fill="#374151" /><path d="M4 10H20V20H4V10Z" fill="#374151" /></svg>
              <div className="text-xs text-gray-600">Clubs</div>
            </Link>
          </div>
        </div>
      </nav>
    </>
  );
};
export default Navbar;
