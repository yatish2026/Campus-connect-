import { useQuery } from "@tanstack/react-query";
import { axiosInstance } from "../lib/axios";
import Sidebar from "../components/Sidebar";
import PostCreation from "../components/PostCreation";
import Post from "../components/Post";
import { Users, AlertCircle } from "lucide-react";
import RecommendedUser from "../components/RecommendedUser";

const HomePage = () => {
  const { data: authUser } = useQuery({ queryKey: ["authUser"] });

  const { data: recommendedUsers } = useQuery({
    queryKey: ["recommendedUsers"],
    queryFn: async () => {
      try {
        const res = await axiosInstance.get("/users/suggestions");
        // Check if backend returned HTML (backend down)
        if (typeof res.data === 'string' && res.data.includes('<!DOCTYPE html>')) {
          console.error('Backend connection failed');
          return [];
        }
        return Array.isArray(res.data) ? res.data : [];
      } catch (error) {
        console.error('Failed to fetch recommended users:', error);
        return [];
      }
    },
  });
  
  const { data: posts, isLoading: isLoadingPosts, error: postsError } = useQuery({
    queryKey: ["posts"],
    queryFn: async () => {
      try {
        const res = await axiosInstance.get("/posts");
        // Check if backend returned HTML (backend down)
        if (typeof res.data === 'string' && res.data.includes('<!DOCTYPE html>')) {
          console.error('Backend connection failed');
          return [];
        }
        return Array.isArray(res.data) ? res.data : [];
      } catch (error) {
        console.error('Failed to fetch posts:', error);
        return [];
      }
    },
  });

  // Check if backend is down (returning HTML)
  const isBackendDown = typeof posts === 'string' && posts.includes('<!DOCTYPE html>');

  console.log("posts", posts);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <div className="hidden lg:block lg:col-span-1">
        <Sidebar user={authUser} />
      </div>
      
      <div className="col-span-1 lg:col-span-2 order-first lg:order-none">
        <PostCreation user={authUser} />
        
        {/* Show backend connection error */}
        {isBackendDown && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="text-yellow-600" size={24} />
              <div>
                <h3 className="font-semibold text-yellow-800">Backend Server Not Connected</h3>
                <p className="text-yellow-700 text-sm">
                  Please make sure your backend server is running on port 5000.
                </p>
              </div>
            </div>
          </div>
        )}

        {isLoadingPosts ? (
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <p>Loading posts...</p>
          </div>
        ) : postsError ? (
          <div className="bg-white rounded-lg shadow p-4 text-center text-red-500">
            <p>Error loading posts. Please try again later.</p>
          </div>
        ) : (
          <>
            {(Array.isArray(posts) ? posts : []).map((post) => (
              <Post key={post._id} post={post} />
            ))}
            {(!Array.isArray(posts) || posts.length === 0) && !isBackendDown && (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <div className="mb-6">
                  <Users size={64} className="mx-auto text-blue-500" />
                </div>
                <h2 className="text-2xl font-bold mb-4 text-gray-800">
                  No Posts Yet
                </h2>
                <p className="text-gray-600 mb-6">
                  Connect with others to start seeing posts in your feed!
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Safe recommended users rendering */}
      {Array.isArray(recommendedUsers) && recommendedUsers.length > 0 && (
        <div className="col-span-1 lg:col-span-1">
          <div className="bg-secondary rounded-lg shadow p-4">
            <h2 className="font-semibold mb-4">People you may know</h2>
            {recommendedUsers.map((user) => (
              <RecommendedUser key={user._id} user={user} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;