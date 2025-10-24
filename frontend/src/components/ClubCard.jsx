import React, { useState } from 'react';
import { axiosInstance } from '../lib/axios';

const ClubCard = ({ club, onChange }) => {
  const [loading, setLoading] = useState(false);
  const [isFollowing, setIsFollowing] = useState((club.followers || []).some(f => f === club.currentUserId || f._id === club.currentUserId));
  const [followersCount, setFollowersCount] = useState((club.followers || []).length);

  const follow = async () => {
    if (loading) return;
    if (!club.currentUserId) {
      alert('Please log in to follow clubs');
      return;
    }
    // optimistic update
    setLoading(true);
    setIsFollowing(!isFollowing);
    setFollowersCount(prev => isFollowing ? prev - 1 : prev + 1);
    try {
      const res = await axiosInstance.post(`/clubs/${club._id}/follow`);
      onChange && onChange(res.data);
    } catch (err) {
      console.error('follow', err);
      // rollback on error
      setIsFollowing(prev => !prev);
      setFollowersCount(prev => isFollowing ? prev + 1 : prev - 1);
    } finally { setLoading(false); }
  };

  const apply = async () => {
    if (!club.currentUserId) return alert('Please log in to apply');
    const reason = prompt('Why do you want to join this club?');
    if (!reason) return;
    setLoading(true);
    try {
      await axiosInstance.post(`/clubs/${club._id}/apply`, { message: reason });
      alert('Application submitted');
    } catch (err) {
      console.error('apply', err);
    } finally { setLoading(false); }
  };

  return (
    <div className="bg-white rounded-2xl shadow p-4 hover:shadow-md transition">
      <img src={club.banner || '/club-banner.png'} alt="banner" className="w-full h-28 object-cover rounded-lg mb-3" />
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-semibold">{club.name}</h3>
          <p className="text-sm text-gray-500 truncate max-w-xs">{club.description}</p>
          <div className="text-xs text-gray-400 mt-2">By {club.creator?.name || club.creator?.username}</div>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-600">{followersCount} followers</div>
          <button onClick={follow} disabled={loading} className={`mt-2 px-3 py-1 rounded-2xl ${isFollowing ? 'bg-gray-200 text-gray-700' : 'bg-blue-600 text-white'}`}>
            {isFollowing ? 'Following' : 'Follow'}
          </button>
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        <button onClick={apply} className="text-sm px-3 py-1 rounded-2xl border">Apply for Membership</button>
        <a href={`/club/${club._id}`} className="ml-auto text-sm text-blue-600">Open</a>
      </div>
    </div>
  );
};

export default ClubCard;
