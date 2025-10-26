import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { Link, useParams } from "react-router-dom";
import {
  Loader,
  MessageCircle,
  Send,
  Share2,
  ThumbsUp,
  Trash2,
} from "lucide-react";
import PostAction from "./PostAction";
import { formatDistanceToNow } from "date-fns";

const Post = ({ post }) => {
  const { data: authUser } = useQuery({
    queryKey: ["authUser"],
  });
  const { postId } = useParams();
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [comments, setComments] = useState(post.comments || []);
  const isOwner = authUser._id === post.author._id;
  const isLiked = post.likes.includes(authUser._id);

  const queryClient = useQueryClient();

  const { mutate: deletePost, isPending: isDeletingPost } = useMutation({
    mutationFn: async () => {
      await axiosInstance.delete(`/posts/delete/${post._id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      toast.success("Post deleted successfully");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const { mutate: createComment, isPending: isAddingComment } = useMutation({
    mutationFn: async (newComment) => {
      await axiosInstance.post(`/posts/${post._id}/comment`, {
        content: newComment,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      toast.success("Comment added successfully");
    },
    onError: (err) => {
      toast.error(err.response.data.message || "Failed to add comment");
    },
  });

  const { mutate: likePost, isPending: isLikingPost } = useMutation({
    mutationFn: async () => {
      await axiosInstance.post(`/posts/${post._id}/like`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["post", postId] });
    },
  });

  const handleDeletePost = () => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;
    deletePost();
  };

  const handleLikePost = async () => {
    //!if we are liking we dont send another request (like disabled)
    if (isLikingPost) return;

    likePost();
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (newComment.trim()) {
      createComment(newComment);
      setNewComment("");
      setComments([
        ...comments,
        {
          content: newComment,
          user: {
            _id: authUser._id,
            name: authUser.name,
            profilePicture: authUser.profilePicture,
          },
          createdAt: new Date(),
        },
      ]);
    }
  };

  const handleShare = async () => {
    try {
      const url = `${window.location.origin}/post/${post._id}`;
      const shareText = post.content ? post.content.slice(0, 120) : 'Check this post';

      // Web Share API
      if (navigator.share) {
        await navigator.share({
          title: post.title || 'Campus Connect Post',
          text: shareText,
          url,
        });
        toast.success('Shared successfully');
        return;
      }

      // Fallback: copy link to clipboard
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url);
        toast.success('Post link copied to clipboard');
      }

      // Also open WhatsApp share as a quick option fallback
      const waText = encodeURIComponent(`${shareText} \n${url}`);
      const waUrl = `https://api.whatsapp.com/send?text=${waText}`;
      window.open(waUrl, '_blank');
    } catch (err) {
      console.error('Share failed', err);
      toast.error('Unable to share');
    }
  };

  return (
    <div className="bg-secondary rounded-lg shadow mb-4 w-full">
      <div className="p-3 sm:p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            <Link to={`/profile/${encodeURIComponent(post?.author?.username)}`}>
              <img
                src={post.author.profilePicture || "/avatar.png"}
                alt={post.author.name}
                className="w-10 h-10 rounded-full mr-3"
              />
            </Link>
            <div>
              <Link to={`/profile/${encodeURIComponent(post?.author?.username)}`}>
                <h3 className="font-semibold">{post.author.name}</h3>
              </Link>
              <p className="text-xs text-info">{post.author.headline}</p>
              <p className="text-xs text-info">
                {formatDistanceToNow(new Date(post.createdAt), {
                  addSuffix: true,
                })}
              </p>
            </div>
          </div>
          {isOwner && (
            <button
              onClick={handleDeletePost}
              className="text-red-500 hover:text-red-700"
            >
              {isDeletingPost ? (
                <Loader size={18} className="animate-spin" />
              ) : (
                <Trash2 size={18} />
              )}
            </button>
          )}
        </div>
        <p className="mb-3 text-sm">{post.content}</p>
        {post.image && (
          <img
            src={post.image}
            alt="Post content"
            className="rounded-lg w-full mb-3 max-h-[60vh] object-contain"
          />
        )}
        <div className="flex justify-between text-info">
          <PostAction
            icon={
              <ThumbsUp
                size={18}
                className={isLiked ? "text-blue-500  fill-blue-300" : ""}
              />
            }
            text={`Like (${post.likes.length})`}
            onClick={handleLikePost}
          />

          <PostAction
            icon={<MessageCircle size={18} />}
            text={`Comment (${comments.length})`}
            onClick={() => setShowComments(!showComments)}
          />
          <PostAction icon={<Share2 size={18} />} text="Share" onClick={handleShare} />
        </div>
      </div>

      {showComments && (
        <div className="px-3 pb-3">
          <div className="mb-4 max-h-60 overflow-y-auto">
            {comments.map((comment) => (
              <div
                key={comment._id}
                className="mb-2 bg-base-100 p-2 rounded flex items-start"
              >
                <img
                  src={comment.user.profilePicture || "/avatar.png"}
                  alt={comment.user.name}
                  className="w-8 h-8 rounded-full mr-2 flex-shrink-0"
                />
                <div className="flex-grow">
                  <div className="flex items-center mb-1">
                    <span className="font-semibold mr-2">
                      {comment.user.name}
                    </span>
                    <span className="text-info text-xs">
                      {formatDistanceToNow(new Date(comment.createdAt))}
                    </span>
                  </div>
                  <p>{comment.content}</p>
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={handleAddComment} className="flex items-center gap-2">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="flex-grow p-2 rounded-lg bg-base-100 focus:outline-none focus:ring-2 focus:ring-primary"
            />

            <button
              type="submit"
              className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition duration-300"
              disabled={isAddingComment}
            >
              {isAddingComment ? (
                <Loader size={18} className="animate-spin" />
              ) : (
                <Send size={18} />
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default Post;
