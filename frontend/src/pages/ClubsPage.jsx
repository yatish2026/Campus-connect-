import React, { useEffect, useState } from 'react';
import { axiosInstance } from '../lib/axios';
import ClubCard from '../components/ClubCard';
import CreateClubModal from '../components/CreateClubModal';

const ClubsPage = () => {
  const [clubs, setClubs] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [openCreate, setOpenCreate] = useState(false);

  const fetch = async () => {
    try {
      const res = await axiosInstance.get('/clubs');
      setClubs(res.data || []);
    } catch (err) {
      console.error('fetch clubs', err);
    }
  };

  useEffect(() => { fetch(); }, []);
  useEffect(() => {
    (async () => {
      try {
        const res = await axiosInstance.get('/auth/me');
        setCurrentUser(res.data);
      } catch (err) {
        // ignore
      }
    })();
  }, []);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Clubs</h1>
        <button onClick={() => setOpenCreate(true)} className="bg-blue-600 text-white px-4 py-2 rounded-2xl">Create Club</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {clubs.map(c => {
          const currentUserId = currentUser?._id || null;
          return <ClubCard key={c._id} club={{ ...c, currentUserId }} onChange={fetch} />
        })}
      </div>
      {openCreate && <CreateClubModal onClose={() => { setOpenCreate(false); fetch(); }} />}
    </div>
  );
};

export default ClubsPage;
