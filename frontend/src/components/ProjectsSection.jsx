import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosInstance } from '../lib/axios';
import { toast } from 'react-hot-toast';

const ProjectsSection = ({ userData, isOwnProfile, onSave }) => {
  const [projects, setProjects] = useState(userData.projects || []);
  const [editing, setEditing] = useState(false);
  const [newProject, setNewProject] = useState({ title: '', description: '', url: '' });
  const queryClient = useQueryClient();

  const { mutate: saveProjects, isLoading } = useMutation({
    mutationFn: async (updated) => {
      await axiosInstance.put('/users/profile', { projects: updated });
    },
    onSuccess: () => {
      toast.success('Projects saved');
      queryClient.invalidateQueries(['userProfile']);
      queryClient.invalidateQueries(['authUser']);
      setEditing(false);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to save projects');
    },
  });

  const addProject = () => {
    if (!newProject.title.trim()) return toast.error('Project title required');
    const updated = [newProject, ...projects];
    setProjects(updated);
    setNewProject({ title: '', description: '', url: '' });
  };

  const removeProject = (index) => {
    const updated = projects.filter((_, i) => i !== index);
    setProjects(updated);
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-6 transition-transform hover:-translate-y-0.5">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-semibold">Projects</h3>
        {isOwnProfile && (
          <div>
            {!editing ? (
              <button className="btn btn-outline btn-sm" onClick={() => setEditing(true)}>Edit</button>
            ) : (
              <>
                <button className="btn btn-primary btn-sm mr-2" onClick={() => saveProjects(projects)} disabled={isLoading}>Save</button>
                <button className="btn btn-ghost btn-sm" onClick={() => { setEditing(false); setProjects(userData.projects || []); }}>Cancel</button>
              </>
            )}
          </div>
        )}
      </div>

      {editing && (
        <div className="mb-3">
          <input className="input input-bordered w-full mb-2" placeholder="Project title" value={newProject.title} onChange={(e) => setNewProject({ ...newProject, title: e.target.value })} />
          <input className="input input-bordered w-full mb-2" placeholder="Project URL" value={newProject.url} onChange={(e) => setNewProject({ ...newProject, url: e.target.value })} />
          <textarea className="textarea textarea-bordered w-full mb-2" placeholder="Short description" value={newProject.description} onChange={(e) => setNewProject({ ...newProject, description: e.target.value })} />
          <div className="flex gap-2">
            <button className="btn btn-primary btn-sm" onClick={addProject}>Add</button>
            <button className="btn btn-ghost btn-sm" onClick={() => setNewProject({ title: '', description: '', url: '' })}>Clear</button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {projects.length === 0 && <p className="text-sm text-gray-600">No projects yet</p>}
        {projects.map((p, i) => (
          <div key={i} className="p-3 bg-base-100 rounded">
            <div className="flex justify-between items-start">
              <div>
                <a href={p.url} target="_blank" rel="noreferrer" className="font-semibold text-primary hover:underline">{p.title}</a>
                <p className="text-sm text-gray-700">{p.description}</p>
              </div>
              {isOwnProfile && editing && (
                <button className="btn btn-ghost btn-sm text-red-500" onClick={() => removeProject(i)}>Remove</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProjectsSection;
