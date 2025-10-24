import React, { useEffect, useState } from 'react';
import { axiosInstance } from '../lib/axios';
import PostCreation from '../components/PostCreation';
import Post from '../components/Post';
import { useParams } from 'react-router-dom';

const ClubPage = () => {
  const { id } = useParams();
  const [club, setClub] = useState(null);
  const [clubPosts, setClubPosts] = useState([]);
  const [showFollowers, setShowFollowers] = useState(false);
  const [applications, setApplications] = useState([]);

  const fetch = async () => {
    try {
      const res = await axiosInstance.get(`/clubs/${id}`);
      const clubData = res.data;
      // determine if current user is a member (backend may not include current user id)
      let currentUser = null;
      try {
        const meRes = await axiosInstance.get('/auth/me');
        currentUser = meRes.data;
      } catch (e) {
        // if unauthenticated, currentUser remains null
        currentUser = null;
      }
      clubData.currentUser = currentUser;

      // normalize member ids to strings and check membership safely
      const memberIds = (clubData.members || []).map(m => (m && m._id ? m._id.toString() : (m ? m.toString() : '')));
      const creatorId = clubData.creator && clubData.creator._id ? clubData.creator._id.toString() : (clubData.creator ? clubData.creator.toString() : '');
      clubData.isMember = currentUser ? (memberIds.includes(currentUser._id.toString()) || creatorId === currentUser._id.toString()) : false;
      setClub(clubData);
      // fetch club posts
      try {
        const postsRes = await axiosInstance.get(`/clubs/${id}/posts`);
        setClubPosts(postsRes.data || []);
      } catch (e) {
        console.error('failed to fetch club posts', e);
        setClubPosts([]);
      }
    } catch (err) {
      console.error('fetch club', err);
    }
  };
  useEffect(() => { fetch(); }, [id]);

  if (!club) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6">
      <div className="bg-white rounded-2xl shadow p-6">
        <div className="flex items-center gap-4">
          <img src={club.banner || '/club-banner.png'} alt="banner" className="w-20 h-20 rounded-lg object-cover" />
          <div>
            <h2 className="text-xl font-semibold">{club.name}</h2>
            <div className="text-sm text-gray-500">By {club.creator?.name || club.creator?.username}</div>
            <div className="text-sm text-gray-600 mt-2">{club.description}</div>
            <div className="mt-3 flex gap-2 items-center">
              <button className="px-3 py-1 rounded border" onClick={() => setShowFollowers(true)}>{club.members.length} members</button>
              <button className="px-3 py-1 rounded border" onClick={fetch}>Refresh</button>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <h3 className="font-semibold mb-4">Club Posts</h3>
        {club.isMember && (
          <div className="mb-4">
            <PostCreation user={club.currentUser} selectedClubFromParent={club._id} onCreated={fetch} />
          </div>
        )}

        {/* Creator admin panel: review applications */}
        {club.creator && club.currentUser && club.creator._id === club.currentUser._id && (
          <div className="mt-6 bg-white p-4 rounded">
            <h4 className="font-semibold mb-2">Membership Applications</h4>
            {club.applications && club.applications.length === 0 && <div className="text-gray-500">No pending applications</div>}
            {club.applications && club.applications.map(app => (
              <div key={app._id} className="flex items-center justify-between mb-2">
                <div>
                  <div className="font-semibold">{app.user.name || app.user.username}</div>
                  <div className="text-sm text-gray-500">{app.message}</div>
                </div>
                <div className="flex gap-2">
                  <button className="px-3 py-1 rounded bg-green-600 text-white" onClick={async () => { await axiosInstance.post(`/clubs/${club._id}/review`, { appId: app._id, action: 'approve' }); fetch(); }}>Approve</button>
                  <button className="px-3 py-1 rounded border" onClick={async () => { await axiosInstance.post(`/clubs/${club._id}/review`, { appId: app._id, action: 'reject' }); fetch(); }}>Reject</button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="space-y-4">
          {clubPosts.length === 0 && <div className="text-gray-500">No posts yet.</div>}
          {clubPosts.map(p => <Post key={p._id} post={p} />)}
        </div>
      </div>
    </div>
  );
};

export default ClubPage;
