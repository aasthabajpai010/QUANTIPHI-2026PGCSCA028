import { useState } from 'react';
import api from '../api/axios.js';

export default function ProjectPanel({
  projects,
  selectedProject,
  onSelectProject,
  onProjectCreated,
  onMemberAdded,
}) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [memberEmail, setMemberEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/projects', { name, description });
      onProjectCreated(res.data);
      setName('');
      setDescription('');
      setShowCreateModal(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!memberEmail.trim() || !selectedProject) return;
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await api.post(`/projects/${selectedProject.id}/members`, {
        email: memberEmail.trim(),
      });
      setSuccess('Member added successfully!');
      setMemberEmail('');
      if (onMemberAdded) onMemberAdded(res.data);
      setTimeout(() => {
        setShowMemberModal(false);
        setSuccess('');
      }, 1200);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add member');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg backdrop-blur-md">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Current Project</h2>
          <p className="text-lg font-bold text-white tracking-tight">
            {selectedProject ? selectedProject.name : 'No Project Selected'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-3 py-1.5 text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg shadow-sm shadow-indigo-600/30 transition-all flex items-center gap-1.5"
          >
            <span>+</span> Project
          </button>
          {selectedProject && (
            <button
              onClick={() => setShowMemberModal(true)}
              className="px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg transition-all"
            >
              + Member
            </button>
          )}
        </div>
      </div>

      {/* Project Selector */}
      {projects && projects.length > 0 && (
        <div className="mb-2">
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Switch Project</label>
          <select
            value={selectedProject?.id || ''}
            onChange={(e) => {
              const p = projects.find((proj) => proj.id === e.target.value);
              if (p) onSelectProject(p);
            }}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
          >
            {projects.map((proj) => (
              <option key={proj.id} value={proj.id}>
                {proj.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {selectedProject?.description && (
        <p className="text-xs text-slate-400 mt-2 bg-slate-950/50 p-2.5 rounded-lg border border-slate-800/60 leading-relaxed">
          {selectedProject.description}
        </p>
      )}

      {/* Modal: Create Project */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-1">Create New Project</h3>
            <p className="text-xs text-slate-400 mb-4">Start a collaborative project board for your tasks.</p>

            {error && <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">{error}</div>}

            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Project Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Website Redesign"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Description</label>
                <textarea
                  rows="3"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Goals, deliverables, or team scope..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-600/30 disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Member */}
      {showMemberModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-1">Add Team Member</h3>
            <p className="text-xs text-slate-400 mb-4">Invite a registered user to "{selectedProject?.name}" by email.</p>

            {error && <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">{error}</div>}
            {success && <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs">{success}</div>}

            <form onSubmit={handleAddMember} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Member Email *</label>
                <input
                  type="email"
                  required
                  value={memberEmail}
                  onChange={(e) => setMemberEmail(e.target.value)}
                  placeholder="colleague@example.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowMemberModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-600/30 disabled:opacity-50"
                >
                  {loading ? 'Adding...' : 'Add Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
