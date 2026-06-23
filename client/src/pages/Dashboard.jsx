import React, { useState, useEffect, useCallback } from 'react';
import Navbar from '../components/Navbar';
import TaskCard from '../components/TaskCard';
import TaskModal from '../components/TaskModal';
import TaskForm from '../components/TaskForm';
import Loader from '../components/Loader';
import { useAuth } from '../context/AuthContext';
import { getTasks, createTask, updateTask, deleteTask } from '../services/api';
import { FiPlus, FiSearch, FiSliders, FiList, FiCheckCircle, FiActivity, FiInbox } from 'react-icons/fi';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [unfilteredTasks, setUnfilteredTasks] = useState([]); // Used for calculating stats accurately
  const [loading, setLoading] = useState(true);
  
  // Tab Navigation State
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Settings States (moved to top level to avoid React Hook violations)
  const [settingsTheme, setSettingsTheme] = useState(() => {
    return localStorage.getItem('theme') || 'dark';
  });
  const [settingsNotify, setSettingsNotify] = useState(true);
  const [settingsDefaultView, setSettingsDefaultView] = useState('kanban');

  // Dynamically update document body theme class when settingsTheme changes
  useEffect(() => {
    document.body.classList.remove('theme-dark', 'theme-glass', 'theme-neon');
    document.body.classList.add(`theme-${settingsTheme}`);
    localStorage.setItem('theme', settingsTheme);
  }, [settingsTheme]);
  
  // Filter & Search states
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [sortBy, setSortBy] = useState('-createdAt');

  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  // Fetch filtered tasks for display
  const fetchFilteredTasks = useCallback(async () => {
    try {
      const params = { sort: sortBy };
      if (statusFilter) params.status = statusFilter;
      if (priorityFilter) params.priority = priorityFilter;
      if (search) params.search = search;
      
      const data = await getTasks(params);
      setTasks(data.tasks || []);
    } catch (error) {
      console.error('Error fetching filtered tasks:', error);
      toast.error('Failed to load tasks');
    }
  }, [statusFilter, priorityFilter, sortBy, search]);

  // Fetch unfiltered tasks to recalculate stats
  const fetchStatsTasks = useCallback(async () => {
    try {
      const data = await getTasks();
      setUnfilteredTasks(data.tasks || []);
    } catch (error) {
      console.error('Error fetching stats tasks:', error);
    }
  }, []);

  // Fetch all data
  const loadData = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchFilteredTasks(), fetchStatsTasks()]);
    setLoading(false);
  }, [fetchFilteredTasks, fetchStatsTasks]);

  // Debounced search & filter trigger
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchFilteredTasks();
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [search, statusFilter, priorityFilter, sortBy, fetchFilteredTasks]);

  // Run on startup
  useEffect(() => {
    loadData();
  }, []);

  // Compute stat counts dynamically from unfiltered list
  const stats = {
    total: unfilteredTasks.length,
    pending: unfilteredTasks.filter(t => t.status === 'pending').length,
    inProgress: unfilteredTasks.filter(t => t.status === 'in-progress').length,
    completed: unfilteredTasks.filter(t => t.status === 'completed').length,
  };

  // Add Task submit handler
  const handleCreateSubmit = async (taskData) => {
    try {
      await createTask(taskData);
      toast.success('Task created successfully!');
      setIsModalOpen(false);
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create task');
    }
  };

  // Edit Task submit handler
  const handleEditSubmit = async (taskData) => {
    try {
      await updateTask(selectedTask._id, taskData);
      toast.success('Task updated successfully!');
      setIsModalOpen(false);
      setSelectedTask(null);
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update task');
    }
  };

  // Quick status toggle select callback
  const handleQuickStatusChange = async (taskId, newStatus) => {
    try {
      await updateTask(taskId, { status: newStatus });
      toast.success(`Task status set to ${newStatus}`);
      
      // Update local task states directly for smooth UI transition
      setTasks(prev => prev.map(t => t._id === taskId ? { ...t, status: newStatus } : t));
      setUnfilteredTasks(prev => prev.map(t => t._id === taskId ? { ...t, status: newStatus } : t));
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  // Delete Task callback
  const handleDelete = async (taskId) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await deleteTask(taskId);
        toast.success('Task deleted successfully');
        loadData();
      } catch (error) {
        toast.error('Failed to delete task');
      }
    }
  };

  const openCreateModal = () => {
    setSelectedTask(null);
    setIsModalOpen(true);
  };

  const openEditModal = (task) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedTask(null);
  };

  // Render Analytics View Tab
  const renderAnalyticsView = () => {
    const completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
    const highPriorityTasks = unfilteredTasks.filter(t => t.priority === 'high').length;
    const pendingHighPriority = unfilteredTasks.filter(t => t.priority === 'high' && t.status !== 'completed').length;
    
    const priorityStats = {
      high: unfilteredTasks.filter(t => t.priority === 'high').length,
      medium: unfilteredTasks.filter(t => t.priority === 'medium').length,
      low: unfilteredTasks.filter(t => t.priority === 'low').length,
    };

    return (
      <div className="analytics-view fade-in">
        <h2 className="section-title">Workspace Analytics</h2>
        
        <div className="analytics-summary-grid">
          <div className="analytics-card glass-panel">
            <span className="card-label">COMPLETION RATE</span>
            <div className="card-large-value text-highlight">{completionRate}%</div>
            <div className="card-bar-container">
              <div className="card-bar-fill" style={{ width: `${completionRate}%` }}></div>
            </div>
            <span className="card-sub">{stats.completed} of {stats.total} tasks completed</span>
          </div>

          <div className="analytics-card glass-panel">
            <span className="card-label">HIGH PRIORITY FOCUS</span>
            <div className="card-large-value text-high">{pendingHighPriority} Pending</div>
            <div className="card-bar-container">
              <div className="card-bar-fill bg-high" style={{ width: `${stats.total > 0 ? (priorityStats.high / stats.total) * 100 : 0}%` }}></div>
            </div>
            <span className="card-sub">{priorityStats.high} total high priority tasks</span>
          </div>
        </div>

        <div className="analytics-details glass-panel">
          <h3>Priority Distribution</h3>
          <div className="priority-distribution-list">
            <div className="distribution-item">
              <div className="distribution-header">
                <span className="priority-badge priority-high">High</span>
                <span>{priorityStats.high} Tasks</span>
              </div>
              <div className="distribution-bar">
                <div className="distribution-fill bg-high" style={{ width: `${stats.total > 0 ? (priorityStats.high / stats.total) * 100 : 0}%` }}></div>
              </div>
            </div>
            
            <div className="distribution-item">
              <div className="distribution-header">
                <span className="priority-badge priority-medium">Medium</span>
                <span>{priorityStats.medium} Tasks</span>
              </div>
              <div className="distribution-bar">
                <div className="distribution-fill bg-medium" style={{ width: `${stats.total > 0 ? (priorityStats.medium / stats.total) * 100 : 0}%` }}></div>
              </div>
            </div>

            <div className="distribution-item">
              <div className="distribution-header">
                <span className="priority-badge priority-low">Low</span>
                <span>{priorityStats.low} Tasks</span>
              </div>
              <div className="distribution-bar">
                <div className="distribution-fill bg-low" style={{ width: `${stats.total > 0 ? (priorityStats.low / stats.total) * 100 : 0}%` }}></div>
              </div>
            </div>
          </div>
        </div>

        <div className="analytics-details glass-panel">
          <h3>Recent Productivity Insights</h3>
          <p className="insight-text">
            {completionRate >= 80 
              ? 'Excellent velocity! You are maintaining an elite completion rate of over 80%. Keep up the strong focus.'
              : completionRate >= 50
              ? 'Steady progress. You have completed more than half of your tasks. Focus on resolving the pending high priority items.'
              : stats.total === 0
              ? 'No task data available. Create some tasks on the Dashboard to see real-time insights.'
              : 'Action required: Your completion rate is currently under 50%. Try breaking down large tasks and scheduling due dates.'}
          </p>
        </div>
      </div>
    );
  };

  // Render Settings View Tab
  const renderSettingsView = () => {
    const handleSaveSettings = (e) => {
      e.preventDefault();
      toast.success('Settings updated successfully!');
    };

    return (
      <div className="settings-view fade-in">
        <h2 className="section-title">Settings</h2>
        
        <form onSubmit={handleSaveSettings} className="settings-form glass-panel">
          <h3 className="settings-sub-title">Profile Settings</h3>
          <div className="form-group">
            <label>Full Name</label>
            <input type="text" value={user?.name || ''} disabled className="disabled-input" />
            <span className="input-tip">Name modifications are handled by account administration.</span>
          </div>

          <div className="form-group">
            <label>Email Address</label>
            <input type="email" value={user?.email || ''} disabled className="disabled-input" />
          </div>

          <hr className="settings-divider" />

          <h3 className="settings-sub-title">Workspace Preferences</h3>
          <div className="form-group">
            <label>Theme Style</label>
            <select value={settingsTheme} onChange={(e) => setSettingsTheme(e.target.value)}>
              <option value="dark">Luminous Dark Slate (Default)</option>
              <option value="glass">Glassmorphic Glow</option>
              <option value="neon">Neon Ambient Focus</option>
            </select>
          </div>

          <div className="form-group">
            <label>Default Layout View</label>
            <select value={settingsDefaultView} onChange={(e) => setSettingsDefaultView(e.target.value)}>
              <option value="kanban">Kanban Columns</option>
              <option value="grid">Compact Grid</option>
            </select>
          </div>

          <div className="form-group checkbox-group">
            <label className="checkbox-label">
              <input type="checkbox" checked={settingsNotify} onChange={(e) => setSettingsNotify(e.target.checked)} />
              <span>Enable email notifications for overdue tasks</span>
            </label>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-primary">Save Preferences</button>
          </div>
        </form>
      </div>
    );
  };

  return (
    <div className="dashboard-page">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="dashboard-main">
        {activeTab === 'dashboard' && (
          <>
            {/* Statistics Grid */}
            <section className="stats-grid">
              <div className="stat-card glass-panel">
                <div className="stat-header">
                  <span className="stat-title">TOTAL TASKS</span>
                </div>
                <div className="stat-value">{stats.total}</div>
              </div>
              
              <div className="stat-card glass-panel">
                <div className="stat-header">
                  <span className="stat-title">VELOCITY</span>
                </div>
                <div className="stat-value text-highlight">
                  {stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%
                </div>
              </div>

              <div className="stat-card glass-panel">
                <div className="stat-header">
                  <span className="stat-title">COMPLETED</span>
                </div>
                <div className="stat-value text-success">
                  {stats.completed}/{stats.total}
                </div>
              </div>
            </section>

            {/* Filters and Controls Panel */}
            <section className="controls-panel glass-panel">
              <div className="search-bar">
                <FiSearch className="search-icon" />
                <input
                  type="text"
                  placeholder="Search tasks..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <div className="filter-group">
                <div className="filter-item">
                  <FiSliders className="control-icon" />
                  <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                    <option value="">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>

                <div className="filter-item">
                  <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
                    <option value="">All Priorities</option>
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                  </select>
                </div>

                <div className="filter-item">
                  <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                    <option value="-createdAt">Newest First</option>
                    <option value="createdAt">Oldest First</option>
                    <option value="dueDate">Due Date (Asc)</option>
                    <option value="-dueDate">Due Date (Desc)</option>
                    <option value="title">Alphabetical (A-Z)</option>
                  </select>
                </div>
              </div>
            </section>

            {/* Kanban Board Layout */}
            <section className="task-content-section">
              {loading ? (
                <Loader />
              ) : (
                <div className="board-container">
                  {/* Pending Column */}
                  <div className="board-column">
                    <div className="board-column-header">
                      <span className="dot dot-pending"></span>
                      <span>Pending ({tasks.filter(t => t.status === 'pending').length})</span>
                    </div>
                    <div className="board-task-list">
                      {tasks.filter(t => t.status === 'pending').length === 0 ? (
                        <div className="empty-column-state">No pending tasks</div>
                      ) : (
                        tasks.filter(t => t.status === 'pending').map(task => (
                          <TaskCard
                            key={task._id}
                            task={task}
                            onEdit={openEditModal}
                            onDelete={handleDelete}
                            onStatusChange={handleQuickStatusChange}
                          />
                        ))
                      )}
                    </div>
                  </div>

                  {/* In Progress Column */}
                  <div className="board-column">
                    <div className="board-column-header">
                      <span className="dot dot-inprogress"></span>
                      <span>In Progress ({tasks.filter(t => t.status === 'in-progress').length})</span>
                    </div>
                    <div className="board-task-list">
                      {tasks.filter(t => t.status === 'in-progress').length === 0 ? (
                        <div className="empty-column-state">No tasks in progress</div>
                      ) : (
                        tasks.filter(t => t.status === 'in-progress').map(task => (
                          <TaskCard
                            key={task._id}
                            task={task}
                            onEdit={openEditModal}
                            onDelete={handleDelete}
                            onStatusChange={handleQuickStatusChange}
                          />
                        ))
                      )}
                    </div>
                  </div>

                  {/* Completed Column */}
                  <div className="board-column">
                    <div className="board-column-header">
                      <span className="dot dot-completed"></span>
                      <span>Completed ({tasks.filter(t => t.status === 'completed').length})</span>
                    </div>
                    <div className="board-task-list">
                      {tasks.filter(t => t.status === 'completed').length === 0 ? (
                        <div className="empty-column-state">No completed tasks</div>
                      ) : (
                        tasks.filter(t => t.status === 'completed').map(task => (
                          <TaskCard
                            key={task._id}
                            task={task}
                            onEdit={openEditModal}
                            onDelete={handleDelete}
                            onStatusChange={handleQuickStatusChange}
                          />
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}
            </section>
          </>
        )}

        {activeTab === 'analytics' && renderAnalyticsView()}
        {activeTab === 'settings' && renderSettingsView()}
      </main>

      {/* Floating Add Button */}
      {activeTab === 'dashboard' && (
        <button className="floating-add-btn" onClick={openCreateModal} title="Create New Task">
          <FiPlus />
        </button>
      )}

      {/* Form Modal */}
      <TaskModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        title={selectedTask ? 'Edit Task' : 'Create New Task'}
      >
        <TaskForm
          onSubmit={selectedTask ? handleEditSubmit : handleCreateSubmit}
          onCancel={handleModalClose}
          initialData={selectedTask}
        />
      </TaskModal>
    </div>
  );
};

export default Dashboard;

