import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { Image, Loader } from "lucide-react";
import { useQuery } from '@tanstack/react-query';

const PostCreation = ({ user, selectedClubFromParent, onCreated }) => {
  const [content, setContent] = useState("");
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const queryClient = useQueryClient();

  const { mutate: createPostMutation, isPending } = useMutation({
    mutationFn: async (postData) => {
      const res = await axiosInstance.post("/posts/create", postData, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      return res.data;
    },
    onSuccess: () => {
      resetForm();
      toast.success("Post created successfully");
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      if (onCreated) onCreated();
    },
    onError: (err) => {
      toast.error(err.response.data.message || "Failed to create post");
    },
  });

  const handlePostCreation = async () => {
    try {
      const postData = { content };
      if (image) postData.image = await readFileAsDataURL(image);
      // parent can force a club id (posting from club page)
      if (selectedClubFromParent) postData.clubId = selectedClubFromParent;
      else if (selectedClub) postData.clubId = selectedClub;

      createPostMutation(postData);
    } catch (error) {
      console.error("Error in handlePostCreation:", error);
      toast.error("Failed to create post");
    }
  };

  const { data: myClubs } = useQuery({
    queryKey: ['myClubs'],
    queryFn: async () => {
      const res = await axiosInstance.get('/clubs/mine');
      return res.data;
    }
  });
  const [selectedClub, setSelectedClub] = useState(null);

  const resetForm = () => {
    setContent("");
    setImage(null);
    setImagePreview(null);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setImage(file);
    if (file) {
      readFileAsDataURL(file).then(setImagePreview);
    } else {
      setImagePreview(null);
    }
  };

  const readFileAsDataURL = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  return (
    <div className="bg-secondary rounded-lg shadow mb-4 p-3 sm:p-4 w-full">
      <div className="flex flex-col sm:flex-row sm:space-x-3">
        <img
          src={user.profilePicture || "/avatar.png"}
          alt={user.name}
          className="w-12 h-12 rounded-full mb-3 sm:mb-0"
        />
        <textarea
          placeholder="What's on your mind?"
          className="w-full p-3 rounded-lg bg-base-100 hover:bg-base-200 focus:bg-base-200 focus:outline-none resize-none transition-colors duration-200 min-h-[80px]"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
      </div>
      {myClubs?.length > 0 && !selectedClubFromParent && (
        <div className="mt-3">
          <select className="p-2 rounded w-full sm:w-auto" value={selectedClub || ''} onChange={e => setSelectedClub(e.target.value || null)}>
            <option value="">Post as yourself</option>
            {myClubs.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
        </div>
      )}
      {selectedClubFromParent && (
        <div className="mt-3 text-sm text-gray-600">Posting to this club</div>
      )}

      {imagePreview && (
        <div className="mt-3">
          <img
            src={imagePreview}
            alt="Selected"
            className="w-full h-auto rounded-lg max-h-[40vh] object-contain"
          />
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-center gap-3 mt-4">
        <div className="flex items-center gap-4">
          <label className="flex items-center text-info hover:text-info-dark transition-colors duration-200 cursor-pointer px-3 py-2 rounded-md bg-base-100">
            <Image size={18} className="mr-2" />
            <span className="text-sm">Photo</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageChange}
            />
          </label>
        </div>

        <button
          className="bg-primary text-white rounded-lg px-4 py-2 hover:bg-primary-dark transition-colors duration-200 w-full sm:w-auto"
          onClick={handlePostCreation}
          disabled={isPending}
        >
          {isPending ? <Loader className="size-5 animate-spin" /> : "Share"}
        </button>
      </div>
    </div>
  );
};

export default PostCreation;
