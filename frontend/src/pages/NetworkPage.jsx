import { useQuery } from "@tanstack/react-query";
import { axiosInstance } from "../lib/axios";
import Sidebar from "../components/Sidebar";
import { UserPlus } from "lucide-react";
import FriendRequest from "../components/FriendRequest";
import UserCard from "../components/UserCard";

const NetworkPage = () => {
  const { data: user } = useQuery({ queryKey: ["authUser"] });

  const { data: connectionRequests } = useQuery({
    queryKey: ["connectionRequests"],
    queryFn: async () => {
      try {
        const res = await axiosInstance.get("/connections/requests");
        return res.data;
      } catch (err) {
        return [];
      }
    },
  });

  const { data: connections } = useQuery({
    queryKey: ["connections"],
    queryFn: async () => {
      try {
        const res = await axiosInstance.get("/connections");
        return res.data;
      } catch (err) {
        return [];
      }
    },
  });

  const { data: suggestions } = useQuery({
    queryKey: ["suggestedUsers"],
    queryFn: async () => {
      try {
        const res = await axiosInstance.get('/users/suggestions');
        return res.data;
      } catch (err) {
        return [];
      }
    },
  });

  // (related users removed per request)

  // prepare suggested list excluding current connections and self
  const suggestedList = (() => {
    try {
      const items = suggestions || [];
      const connIds = new Set((connections || []).map((c) => c._id));
      return items.filter((s) => s._id !== user?._id && !connIds.has(s._id)).slice(0, 12);
    } catch (err) {
      return [];
    }
  })();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <div className="col-span-1 lg:col-span-1">
        <Sidebar user={user} />
      </div>
      <div className="col-span-1 lg:col-span-3">
        <div className="bg-secondary rounded-lg shadow p-6 mb-6">
          <h1 className="text-2xl font-bold mb-6">My Network</h1>

          {connectionRequests?.length > 0 ? (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-2">Connection Request</h2>
              <div className="space-y-4">
                {connectionRequests.map((request) => (
                  <FriendRequest key={request._id} request={request} />
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-6 text-center mb-6">
              <UserPlus size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold mb-2">
                No Connection Requests
              </h3>
              <p className="text-gray-600">
                You don&apos;t have any pending connection requests at the
                moment.
              </p>
              <p className="text-gray-600 mt-2">
                Explore suggested connections below to expand your network!
              </p>
            </div>
          )}
          {/* My Connections (moved to top) */}
          {connections?.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">My Connections</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {connections.map((connection) => (
                  <UserCard
                    key={connection._id}
                    user={connection}
                    isConnection={true}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Suggested users (below connections) */}
          {suggestedList?.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Suggested for you</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {suggestedList.map((s) => (
                  <UserCard key={s._id} user={s} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default NetworkPage;
