import React, { useState } from 'react';
import { axiosInstance } from '../lib/axios';

const CreateClubModal = ({ onClose }) => {
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [banner, setBanner] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!name) return alert('Name required');
    setLoading(true);
    try {
      await axiosInstance.post('/clubs', { name, description: desc, banner });
      onClose();
    } catch (err) {
      console.error('create club', err);
      alert('Failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center">
      <div className="bg-white p-6 rounded-2xl w-96">
        <h3 className="font-semibold mb-4">Create Club</h3>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Club name" className="w-full p-2 border rounded mb-2" />
        <textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="Description" className="w-full p-2 border rounded mb-2" />
        <input value={banner} onChange={e => setBanner(e.target.value)} placeholder="Banner image URL (optional)" className="w-full p-2 border rounded mb-2" />
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-3 py-1 rounded">Cancel</button>
          <button onClick={submit} disabled={loading} className="bg-blue-600 text-white px-3 py-1 rounded">Create</button>
        </div>
      </div>
    </div>
  );
};

export default CreateClubModal;
