import { useState, useEffect } from 'react';
import api from '../api/axios.js';
import AiBreakdown from './AiBreakdown.jsx';

const STATUSES = ['TODO', 'IN_PROGRESS', 'DONE'];
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH'];

const STATUS_LABELS = { TODO: 'To Do', IN_PROGRESS: 'In Progress', DONE: 'Done' };
const PRIORITY_LABELS = { LOW: 'Low', MEDIUM: 'Medium', HIGH: 'High' };

/**
 * TaskModal — create or edit a task in a modal overlay.
 */
export default function TaskModal({ task, projectId, onClose, onCreated, onUpdated, onDeleted }) {
  const isEditing = Boolean(task);

  const [formData, setFormData] = useState({
    title: task?.title || '',
    description: task?.description || '',
    priority: task?.priority || 'MEDIUM',
    status: task?.status || 'TODO',
    dueDate: task?.dueDate ? task.dueDate.split('T')[0] : '',
    assigneeId: task?.assigneeId || '',
  });

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showAiBreakdown, setShowAiBreakdown] = useState(false);

  // Fetch users for assignee select
  useEffect(() => {
    api.get('/users')
      .then((res) => setUsers(res.data))
      .catch(() => {});
  }, []);

  // Close on Escape key
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setError('Task title is required.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        priority: formData.priority,
        status: formData.status,
        dueDate: formData.dueDate || null,
        assigneeId: formData.assigneeId || null,
      };

      if (isEditing) {
        const res = await api.put(`/tasks/${task.id}`, payload);
        onUpdated(res.data);
      } else {
        const res = await api.post('/tasks', { ...payload, projectId });
        onCreated(res.data);
      }

      onClose();
    } catch (err) {
      const msg = err.response?.data?.error ||
        err.response?.data?.errors?.[0]?.msg ||
        'Failed to save task.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }

    setLoading(true);
    try {
      await api.delete(`/tasks/${task.id}`);
      onDeleted(task.id);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete task.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">
            {isEditing ? 'Edit Task' : 'Create New Task'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              name="title"
              type="text"
              value={formData.title}
              onChange={handleChange}
              placeholder="Enter task title"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Add a description…"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>

          {/* Priority + Status row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Due date + Assignee row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
              <input
                name="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Assignee</label>
              <select
                name="assigneeId"
                value={formData.assigneeId}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="">Unassigned</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* AI Breakdown toggle (only for existing tasks with a title) */}
          {formData.title.trim() && (
            <div className="border-t border-gray-100 pt-4">
              <button
                type="button"
                onClick={() => setShowAiBreakdown((v) => !v)}
                className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-800 font-medium"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                {showAiBreakdown ? 'Hide AI Breakdown' : 'Break Down with AI'}
              </button>

              {showAiBreakdown && (
                <div className="mt-3">
                  <AiBreakdown
                    title={formData.title}
                    description={formData.description}
                  />
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            {/* Delete button (edit mode only) */}
            {isEditing ? (
              <button
                type="button"
                onClick={handleDelete}
                disabled={loading}
                className={`text-sm font-medium px-3 py-2 rounded-lg transition ${
                  confirmDelete
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'text-red-600 hover:bg-red-50'
                }`}
              >
                {confirmDelete ? 'Confirm Delete' : 'Delete Task'}
              </button>
            ) : (
              <span />
            )}

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="text-sm text-gray-600 hover:text-gray-800 px-3 py-2 rounded-lg hover:bg-gray-100 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="bg-indigo-600 text-white text-sm font-semibold px-5 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed transition"
              >
                {loading ? 'Saving…' : isEditing ? 'Save Changes' : 'Create Task'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
