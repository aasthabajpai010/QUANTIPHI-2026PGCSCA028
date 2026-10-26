import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../api/axios.js';
import KanbanBoard from '../components/KanbanBoard.jsx';
import TeamSidebar from '../components/TeamSidebar.jsx';
import FilterBar from '../components/FilterBar.jsx';
import ProjectPanel from '../components/ProjectPanel.jsx';
import AiAssistant from '../components/AiAssistant.jsx';
import TaskModal from '../components/TaskModal.jsx';

export default function Dashboard() {
  const { user, logout } = useAuth();

  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [workload, setWorkload] = useState([]);
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  // Fetch all projects for the current user
  const fetchProjects = useCallback(async () => {
    try {
      const res = await api.get('/projects');
      setProjects(res.data);
      if (res.data.length > 0 && !selectedProject) {
        setSelectedProject(res.data[0]);
      }
    } catch (err) {
      console.error('Failed to fetch projects:', err);
    }
  }, [selectedProject]);

  // Fetch tasks for the selected project
  const fetchTasks = useCallback(async () => {
    if (!selectedProject) return;
    setLoadingTasks(true);
    try {
      const res = await api.get(`/tasks?projectId=${selectedProject.id}`);
      setTasks(res.data);
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
    } finally {
      setLoadingTasks(false);
    }
  }, [selectedProject]);

  // Fetch workload for the selected project
  const fetchWorkload = useCallback(async () => {
    if (!selectedProject) return;
    try {
      const res = await api.get(`/users/workload?projectId=${selectedProject.id}`);
      setWorkload(res.data);
    } catch (err) {
      console.error('Failed to fetch workload:', err);
    }
  }, [selectedProject]);

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      fetchTasks();
      fetchWorkload();
    }
  }, [selectedProject]);

  // Filtered tasks for display
  const filteredTasks = priorityFilter === 'ALL'
    ? tasks
    : tasks.filter((t) => t.priority === priorityFilter);

  // Task counts per status (of filtered tasks)
  const taskCounts = {
    TODO: filteredTasks.filter((t) => t.status === 'TODO').length,
    IN_PROGRESS: filteredTasks.filter((t) => t.status === 'IN_PROGRESS').length,
    DONE: filteredTasks.filter((t) => t.status === 'DONE').length,
  };

  // Handle task status change from drag-drop
  const handleTaskStatusChange = (taskId, newStatus) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    );
  };

  // Handle task creation
  const handleTaskCreated = (newTask) => {
    setTasks((prev) => [...prev, newTask]);
    fetchWorkload();
  };

  // Handle task update
  const handleTaskUpdated = (updatedTask) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === updatedTask.id ? updatedTask : t))
    );
    fetchWorkload();
  };

  // Handle task deletion
  const handleTaskDeleted = (taskId) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    fetchWorkload();
  };

  // Open modal for editing
  const handleEditTask = (task) => {
    setEditingTask(task);
    setShowTaskModal(true);
  };

  // Open modal for creating
  const handleCreateTask = () => {
    setEditingTask(null);
    setShowTaskModal(true);
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Left Sidebar */}
      <aside className="w-72 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col">
        {/* App header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <span className="font-bold text-gray-900">Kanban</span>
          </div>
          <button
            onClick={logout}
            title="Sign out"
            className="text-gray-400 hover:text-red-500 transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>

        {/* User info */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{user?.name}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Project panel */}
        <div className="flex-1 overflow-y-auto">
          <ProjectPanel
            projects={projects}
            selectedProject={selectedProject}
            onSelectProject={setSelectedProject}
            onProjectCreated={(p) => {
              setProjects((prev) => [p, ...prev]);
              setSelectedProject(p);
            }}
            onProjectUpdated={fetchProjects}
          />

          {/* Team sidebar */}
          {selectedProject && (
            <TeamSidebar workload={workload} />
          )}
        </div>
      </aside>

      {/* Main area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              {selectedProject ? selectedProject.name : 'Select a project'}
            </h1>
            {selectedProject?.description && (
              <p className="text-sm text-gray-500 mt-0.5">{selectedProject.description}</p>
            )}
          </div>
          <button
            onClick={handleCreateTask}
            disabled={!selectedProject}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Task
          </button>
        </header>

        {/* Filter bar */}
        {selectedProject && (
          <FilterBar
            priorityFilter={priorityFilter}
            onFilterChange={setPriorityFilter}
            taskCounts={taskCounts}
          />
        )}

        {/* Kanban board */}
        <div className="flex-1 overflow-auto p-6">
          {!selectedProject ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-gray-700">No project selected</h2>
              <p className="text-gray-500 mt-1 text-sm">Create or select a project from the sidebar to get started.</p>
            </div>
          ) : loadingTasks ? (
            <div className="flex items-center justify-center h-full">
              <div className="flex items-center gap-3 text-gray-500">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Loading tasks…
              </div>
            </div>
          ) : (
            <KanbanBoard
              tasks={filteredTasks}
              onStatusChange={handleTaskStatusChange}
              onEditTask={handleEditTask}
              projectId={selectedProject?.id}
            />
          )}
        </div>
      </main>

      {/* Task modal */}
      {showTaskModal && (
        <TaskModal
          task={editingTask}
          projectId={selectedProject?.id}
          onClose={() => {
            setShowTaskModal(false);
            setEditingTask(null);
          }}
          onCreated={handleTaskCreated}
          onUpdated={handleTaskUpdated}
          onDeleted={handleTaskDeleted}
        />
      )}

      {/* AI Assistant floating button */}
      <AiAssistant />
    </div>
  );
}
