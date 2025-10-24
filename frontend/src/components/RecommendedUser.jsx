import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { Check, Clock, UserCheck, UserPlus, X } from "lucide-react";

const RecommendedUser = ({ user }) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  if (!user) return null;

  const { data: connectionStatus, isLoading } = useQuery({
    queryKey: ["connectionStatus", user._id],
    queryFn: async () => {
      try {
        const res = await axiosInstance.get(`/connections/status/${user._id}`);
        return res.data;
      } catch (err) {
        return null;
      }
    },
    enabled: !!user._id,
  });

  const sendConnectionRequest = useMutation({
    mutationFn: (userId) => axiosInstance.post(`/connections/request/${userId}`),
    onSuccess: () => {
      toast.success("Connection request sent");
      queryClient.invalidateQueries({ queryKey: ["connectionStatus", user._id] });
    },
    onError: (error) => {
      toast.error(error?.response?.data?.error || "An error occurred");
    },
  });

  const acceptRequest = useMutation({
    mutationFn: (requestId) => axiosInstance.put(`/connections/accept/${requestId}`),
    onSuccess: () => {
      toast.success("Connection request accepted");
      queryClient.invalidateQueries({ queryKey: ["connectionStatus", user._id] });
    },
    onError: (error) => {
      toast.error(error?.response?.data?.error || "An error occurred");
    },
  });

  const rejectRequest = useMutation({
    mutationFn: (requestId) => axiosInstance.put(`/connections/reject/${requestId}`),
    onSuccess: () => {
      toast.success("Connection request rejected");
      queryClient.invalidateQueries({ queryKey: ["connectionStatus", user._id] });
    },
    onError: (error) => {
      toast.error(error?.response?.data?.error || "An error occurred");
    },
  });

  const handleConnect = () => {
    if (connectionStatus?.status === "not_connected") {
      sendConnectionRequest.mutate(user._id);
    }
  };

  const shuffleArray = (array) => {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  };

  const openProfile = async () => {
    if (user.username) {
      navigate(`/profile/${encodeURIComponent(user.username)}`);
      return;
    }
    try {
      const res = await axiosInstance.get(`/users/id/${user._id}`);
      const uname = res.data?.username || res.data?.name || res.data?._id;
      if (uname) {
        navigate(`/profile/${uname}`);
        return;
      }
      // if we reach here, username is not available — fallthrough to suggestions
    } catch (err) {
      // ignore error and fall back to suggestions
    }

    // Fallback: fetch suggestions and navigate to a random suggested user's profile
    try {
      const sugRes = await axiosInstance.get(`/users/suggestions`);
      let suggestions = Array.isArray(sugRes.data) ? sugRes.data : sugRes.data?.users || [];
      suggestions = shuffleArray(suggestions); // Shuffle the suggestions list

      // prefer suggestions that have username
      const withUsername = suggestions.filter((s) => s && (s.username || s.name));
      if (withUsername.length > 0) {
        const pick = withUsername[0]; // Pick the first user after shuffle
        const pickName = pick.username || pick.name || pick._id;
        navigate(`/profile/${encodeURIComponent(pickName)}`);
        return;
      }
      // as last resort, go to the first suggestion's id (if any)
      if (suggestions.length > 0) {
        const pick = suggestions[0];
        navigate(`/profile/${pick._id}`);
        return;
      }

      // If no suggestions, show a toast and do nothing
      toast.error("Profile not available");
    } catch (err) {
      toast.error("Profile not available");
    }
  };

  const renderButton = () => {
    if (isLoading) {
      return (
        <button className="px-3 py-1 rounded-full text-sm bg-gray-200 text-gray-500" disabled>
          Loading...
        </button>
      );
    }

    const status = connectionStatus?.status;

    if (status === "pending") {
      return (
        <button className="px-3 py-1 rounded-full text-sm bg-yellow-500 text-white flex items-center" disabled>
          <Clock size={16} className="mr-1" />
          Pending
        </button>
      );
    }

    if (status === "received") {
      return (
        <div className="flex gap-2 justify-center">
          <button
            onClick={() => acceptRequest.mutate(connectionStatus.requestId)}
            className="rounded-full p-1 flex items-center justify-center bg-green-500 hover:bg-green-600 text-white"
          >
            <Check size={16} />
          </button>
          <button
            onClick={() => rejectRequest.mutate(connectionStatus.requestId)}
            className="rounded-full p-1 flex items-center justify-center bg-red-500 hover:bg-red-600 text-white"
          >
            <X size={16} />
          </button>
        </div>
      );
    }

    if (status === "connected") {
      return (
        <button className="px-3 py-1 rounded-full text-sm bg-green-500 text-white flex items-center" disabled>
          <UserCheck size={16} className="mr-1" />
          Connected
        </button>
      );
    }

    return (
      <button
        className="px-3 py-1 rounded-full text-sm border border-primary text-primary hover:bg-primary hover:text-white transition-colors duration-200 flex items-center"
        onClick={handleConnect}
      >
        <UserPlus size={16} className="mr-1" />
        Connect
      </button>
    );
  };

  return (
    <div className="flex items-center justify-between mb-4">
      <button onClick={openProfile} className="flex items-center flex-grow text-left">
        <img src={user.profilePicture || "/avatar.png"} alt={user.name || user.username} className="w-12 h-12 rounded-full mr-3" />
        <div>
          <h3 className="font-semibold text-sm">{user.name || user.username || "Unknown"}</h3>
          <p className="text-xs text-info">{user.headline}</p>
        </div>
      </button>
      {renderButton()}
    </div>
  );
};

export default RecommendedUser;
