import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import ProfileHeader from "../components/ProfileHeader";
import AboutSection from "../components/AboutSection";
import ExperienceSection from "../components/ExperienceSection";
import EducationSection from "../components/EducationSection";
import SkillsSection from "../components/SkillsSection";
import ProjectsSection from "../components/ProjectsSection";
import Post from "../components/Post";

const ProfilePage = () => {
  const params = useParams();
  // decodeURIComponent to handle encoded spaces or special chars in usernames
  const username = params && params.username ? decodeURIComponent(params.username) : undefined;
  const queryClient = useQueryClient();
  const { data: authUser, isLoading } = useQuery({
    queryKey: ["authUser"],
  });

  const decodedParam = username && typeof username === 'string' ? username.trim() : '';
  const isObjectId = decodedParam && /^[0-9a-fA-F]{24}$/.test(decodedParam);

  const { data: userProfile, isLoading: isUserProfileLoading } = useQuery({
    queryKey: ["userProfile", decodedParam],
    queryFn: async () => {
      try {
        if (!decodedParam) {
          return null;
        }
        // If the param looks like an ObjectId, prefer the id endpoint
        if (isObjectId) {
          const res = await axiosInstance.get(`/users/id/${decodedParam}`);
          return res.data;
        }

        // Try username lookup first
        try {
          const res = await axiosInstance.get(`/users/${encodeURIComponent(decodedParam)}`);
          return res.data;
        } catch (err) {
          // If username lookup failed, try to fetch by id as a fallback
          if (decodedParam && /^[0-9a-fA-F]{24}$/.test(decodedParam)) {
            const res2 = await axiosInstance.get(`/users/id/${decodedParam}`);
            return res2.data;
          }
          throw err;
        }
      } catch (err) {
        console.error('Error fetching user profile:', err);
        toast.error('Failed to load user profile');
        throw err;
      }
    },
    retry: 2,
    retryDelay: 1000,
  });

  // fetch posts for the profile user (hook must be called unconditionally to preserve hook order)
  const { data: userPosts = [], isLoading: isLoadingPosts } = useQuery({
    queryKey: ["userPosts", decodedParam],
    queryFn: async () => {
      try {
        if (!decodedParam) return [];
        const res = await axiosInstance.get(`/posts/user/${encodeURIComponent(decodedParam)}`);
        if (!res.data) return [];
        return res.data || [];
      } catch (err) {
        console.error('Error fetching user posts:', err);
        toast.error('Failed to load posts');
        return [];
      }
    },
    enabled: !!decodedParam,
    retry: 2,
    retryDelay: 1000,
  });

  const { mutate: updateProfile } = useMutation({
    mutationFn: async (updatedData) => {
      await axiosInstance.put("/users/profile", updatedData);
    },
    onSuccess: () => {
      toast.success("Profile updated successfully");
      queryClient.invalidateQueries(["userProfile", username]);
    },
  });

  const handleMessage = () => {
    const id = userProfile?._id || userProfile?.id || userProfile?.username;
    window.location.href = `/messages?open=${id}`;
  };

  const handleRemoveConnection = async () => {
    try {
      if (userProfile.isConnected) {
        // connections API removes by userId
        const targetId = userProfile._id;
        await axiosInstance.delete(`/connections/${targetId}`);
        toast.success("Connection removed successfully");
        // refresh profile & connections
        queryClient.invalidateQueries(["userProfile", username]);
        queryClient.invalidateQueries(["connections"]);
      } else {
        toast.error("You can only disconnect connected users.");
      }
    } catch (err) {
      console.error('Error removing connection', err);
      toast.error('Unable to remove connection');
    }
  };

  if (isLoading || isUserProfileLoading) {
    return <div className="max-w-4xl mx-auto p-4">
      <div className="animate-pulse">
        <div className="h-32 bg-gray-200 rounded-lg mb-4"></div>
        <div className="h-20 bg-gray-200 rounded-lg mb-4"></div>
        <div className="h-40 bg-gray-200 rounded-lg"></div>
      </div>
    </div>;
  }

  if (!userProfile) {
    return <div className="max-w-4xl mx-auto p-4">
      <div className="text-center py-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Profile Not Found</h2>
        <p className="text-gray-600">The requested profile could not be found.</p>
      </div>
    </div>;
  }

  const isOwnProfile = authUser?.username === userProfile?.username;

  const userData = isOwnProfile ? authUser : userProfile;

  return (
    <div className="max-w-4xl mx-auto p-4">
      {!isOwnProfile && (
        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={handleMessage}
            className="bg-primary text-white px-4 py-2 rounded hover:bg-primary-dark transition duration-300"
          >
            Message
          </button>
          <button
            onClick={handleRemoveConnection}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-700 transition duration-300"
          >
            Remove Connection
          </button>
        </div>
      )}
      <ProfileHeader
        userData={userData}
        isOwnProfile={isOwnProfile}
        onSave={(updatedData) => updateProfile(updatedData)}
      />
      <ProjectsSection
        userData={userData}
        isOwnProfile={isOwnProfile}
        onSave={(updatedData) => updateProfile(updatedData)}
      />
      <AboutSection
        userData={userData}
        isOwnProfile={isOwnProfile}
        onSave={(updatedData) => updateProfile(updatedData)}
      />
      <ExperienceSection
        userData={userData}
        isOwnProfile={isOwnProfile}
        onSave={(updatedData) => updateProfile(updatedData)}
      />
      <EducationSection
        userData={userData}
        isOwnProfile={isOwnProfile}
        onSave={(updatedData) => updateProfile(updatedData)}
      />
      <SkillsSection
        userData={userData}
        isOwnProfile={isOwnProfile}
        onSave={(updatedData) => updateProfile(updatedData)}
      />

      {/* User's posts */}
      <div className="mt-6">
        <h2 className="text-xl font-semibold mb-3">Posts</h2>
        {isLoadingPosts ? (
          <p>Loading posts...</p>
        ) : Array.isArray(userPosts) && userPosts.length > 0 ? (
          userPosts.map((p) => <Post key={p._id} post={p} />)
        ) : (
          <p className="text-sm text-gray-600">No posts yet</p>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
