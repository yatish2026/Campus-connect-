import React, { useEffect, useState } from 'react';
import { axiosInstance } from '../lib/axios';
import PostCreation from '../components/PostCreation';
import Post from '../components/Post';
import { useParams, useNavigate } from 'react-router-dom';
import { getSocket, initSocket } from '../lib/socket';

const ClubPage = () => {
  const { id } = useParams();
  const [club, setClub] = useState(null);
  const [clubPosts, setClubPosts] = useState([]);
  const navigate = useNavigate();
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

  // realtime: listen for clubPost events and prepend to posts if relevant
  useEffect(() => {
    let s = getSocket();
    if (!s) {
      const token = localStorage.getItem('token');
      if (token) s = initSocket(token);
    }
    if (!s) return;
    const onClubPost = (payload) => {
      try {
        const post = payload?.post;
        if (!post) return;
        // ensure this post belongs to the current club
        if (String(post.club) === String(id)) {
          setClubPosts((p) => [post, ...(p || [])]);
        }
      } catch (e) { /* ignore */ }
    };
    const onMemberApproved = (payload) => {
      try {
        if (!payload) return;
        if (String(payload.clubId) !== String(id)) return;
        // add member to club.members and remove from applications list
        setClub((c) => {
          const next = { ...(c || {}) };
          const member = payload.member;
          // avoid duplicates
          const exists = (next.members || []).some(m => String((m && m._id) || m) === String((member && member._id) || member));
          if (!exists) next.members = [...(next.members || []), member];
          // remove application if present
          next.applications = (next.applications || []).filter(a => String(a._id) !== String(payload.appId));
          return next;
        });
      } catch (e) { console.error('onMemberApproved', e); }
    };

    const onMemberRemoved = (payload) => {
      try {
        if (!payload) return;
        if (String(payload.clubId) !== String(id)) return;
        const memberId = payload.memberId || payload.member || payload.memberId;
        setClub((c) => ({ ...c, members: (c.members || []).filter(m => String((m && m._id) || m) !== String(memberId)) }));
      } catch (e) { console.error('onMemberRemoved', e); }
    };
    s.on('clubPost', onClubPost);
    s.on('memberApproved', onMemberApproved);
    s.on('memberRemoved', onMemberRemoved);
    return () => {
      s.off('clubPost', onClubPost);
      s.off('memberApproved', onMemberApproved);
      s.off('memberRemoved', onMemberRemoved);
    };
  }, [id]);

  if (!club) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-4 sm:p-6 max-w-full overflow-x-hidden">
      <div className="bg-white rounded-2xl shadow p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <img src={club.banner || '/club-banner.png'} alt="banner" className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg object-cover mx-auto sm:mx-0" />
          <div className="flex-1">
            <h2 className="text-xl font-semibold break-words">{club.name}</h2>
            <div className="text-sm text-gray-500">By {club.creator?.name || club.creator?.username}</div>
            <div className="text-sm text-gray-600 mt-2 break-words">{club.description}</div>
          </div>
          {/* action area: follower count and follow button - kept inside card to avoid overflow */}
          <div className="flex-shrink-0 self-start sm:self-auto mt-3 sm:mt-0">
            <div className="text-sm text-gray-500 text-right">{club.members.length} followers</div>
            <div className="mt-2 flex gap-2 justify-end">
              <button className="px-3 py-1 rounded border text-sm" onClick={() => setShowFollowers(true)}>View</button>
              {club.isMember ? (
                <button className="px-3 py-1 rounded bg-gray-200 text-gray-800 text-sm">Member</button>
              ) : (
                <button className="px-3 py-1 rounded bg-blue-600 text-white text-sm" onClick={async () => {
                  try {
                    await axiosInstance.post(`/clubs/${club._id}/follow`);
                    fetch();
                  } catch (e) { console.error('follow', e); }
                }}>Follow</button>
              )}
            </div>
            <div className="mt-2 text-right">
              <button className="px-3 py-1 rounded border text-sm" onClick={fetch}>Refresh</button>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <h3 className="font-semibold mb-4">Club Posts</h3>
        {club.isMember ? (
          <div className="mb-4">
            <PostCreation user={club.currentUser} selectedClubFromParent={club._id} onCreated={fetch} />
          </div>
        ) : (
          <div className="mb-4 bg-white rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-2">You must be a member to post in this club.</div>
            <div className="flex gap-2">
              <button className="px-3 py-1 rounded bg-blue-600 text-white" onClick={async () => {
                try {
                  await axiosInstance.post(`/clubs/${club._id}/follow`);
                  fetch();
                } catch (e) { console.error('follow', e); }
              }}>Follow</button>
              <button className="px-3 py-1 rounded border" onClick={async () => {
                const msg = window.prompt('Why do you want to join this club? (optional)', '');
                try {
                  await axiosInstance.post(`/clubs/${club._id}/apply`, { message: msg });
                  alert('Application submitted');
                  fetch();
                } catch (e) { console.error('apply', e); alert('Failed to apply'); }
              }}>Apply to Join</button>
            </div>
          </div>
        )}

        {/* Creator admin panel: review applications */}
        {club.creator && club.currentUser && club.creator._id === club.currentUser._id && (
          <div className="mt-6 bg-white p-4 rounded">
            <h4 className="font-semibold mb-2">Membership Applications</h4>
            <div className="flex gap-2 mb-2">
              <button className="px-3 py-1 rounded bg-red-600 text-white" onClick={async () => {
                const ok = window.confirm('Delete this club? This will remove all posts and cannot be undone.');
                if (!ok) return;
                try {
                  await axiosInstance.delete(`/clubs/${club._id}`);
                  alert('Club deleted');
                  // navigate back to clubs list
                  navigate('/clubs');
                } catch (e) {
                  console.error('failed to delete club', e);
                  alert('Failed to delete club');
                }
              }}>Delete Club</button>
              <button className="px-3 py-1 rounded border" onClick={fetch}>Refresh</button>
            </div>
            {club.applications && club.applications.length === 0 && <div className="text-gray-500">No pending applications</div>}
            {club.applications && club.applications.map(app => (
              <div key={app._id} className="flex items-center justify-between mb-2">
                <div>
                  <div className="font-semibold">{app.user?.name || app.user?.username || 'Unknown'}</div>
                  <div className="text-sm text-gray-500">{app.message}</div>
                  <div className="text-xs text-gray-400">Status: {app.status || 'pending'}</div>
                </div>
                <div className="flex gap-2">
                  <button className="px-3 py-1 rounded bg-green-600 text-white" onClick={async () => {
                    try {
                      // optimistic UI update
                      app.status = 'approved';
                      // add to members list in UI
                      setClub((c) => ({ ...c, members: [...(c.members || []), (app.user?._id || app.user)] }));
                      await axiosInstance.post(`/clubs/${club._id}/review`, { appId: app._id, action: 'approve' });
                      fetch();
                    } catch (e) {
                      console.error('approve error', e);
                      fetch();
                    }
                  }}>Approve</button>
                  <button className="px-3 py-1 rounded border" onClick={async () => {
                    try {
                      app.status = 'rejected';
                      await axiosInstance.post(`/clubs/${club._id}/review`, { appId: app._id, action: 'reject' });
                      fetch();
                    } catch (e) {
                      console.error('reject error', e);
                      fetch();
                    }
                  }}>Reject</button>
                </div>
              </div>
            ))}

            {/* Member management */}
            <div className="mt-4">
              <h4 className="font-semibold mb-2">Members</h4>
              {(!club.members || club.members.length === 0) && <div className="text-gray-500">No members yet.</div>}
              {club.members && club.members.map(m => {
                const id = m && m._id ? m._id : m;
                const name = (m && (m.name || m.username)) || id;
                return (
                  <div key={id} className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <img src={(m && m.profilePicture) || '/avatar.png'} alt={name} className="w-8 h-8 rounded-full" />
                      <div>
                        <div className="font-semibold text-sm">{name}</div>
                        <div className="text-xs text-gray-500">{id}</div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {String(id) !== String(club.creator._id) && (
                        <button className="px-3 py-1 rounded bg-red-500 text-white" onClick={async () => {
                          if (!window.confirm('Remove member from club?')) return;
                          try {
                            await axiosInstance.post(`/clubs/${club._id}/remove-member`, { memberId: id });
                            // update UI
                            setClub((c) => ({ ...c, members: (c.members || []).filter(x => String((x && x._id) || x) !== String(id)) }));
                          } catch (e) {
                            console.error('remove member', e);
                            fetch();
                          }
                        }}>Remove</button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
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
