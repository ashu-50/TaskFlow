import React, { useState, useEffect } from 'react';
import { tasksAPI } from '../api/projects';
import { useAuth } from '../context/AuthContext';
import { TaskCard } from '../components/TaskCard';

/* ENUM FIX */
const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'todo', label: 'To Do' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'review', label: 'Review' },
  { value: 'done', label: 'Done' },
];

const PRIORITY_OPTIONS = [
  { value: '', label: 'All Priorities' },
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

const TasksPage = () => {
  const { user, isAdmin } = useAuth();

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    overdue: '',
  });

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  /* FETCH */
  const fetchTasks = async () => {
    setLoading(true);

    try {
      const params = {
        ...(isAdmin ? {} : { assigneeId: user?.id }),
        page,
        ...(filters.status && { status: filters.status }),
        ...(filters.priority && { priority: filters.priority }),
        ...(filters.overdue === 'true' && { overdue: 'true' }),
      };

      const data = await tasksAPI.getAll(params); // ✅ FIXED

      setTasks(data.tasks || []);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      console.error(err.message || 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [filters, page]);

  /* RESET PAGE ON FILTER CHANGE */
  useEffect(() => {
    setPage(1);
  }, [filters]);

  /* UPDATE TASK */
  const handleStatusChange = async (taskId, status) => {
    try {
      await tasksAPI.update(taskId, { status });
      fetchTasks();
    } catch (err) {
      alert(err.message || 'Failed to update task');
    }
  };

  /* DELETE TASK */
  const handleDelete = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;

    try {
      await tasksAPI.delete(taskId);
      fetchTasks();
    } catch (err) {
      alert(err.message || 'Failed to delete task');
    }
  };

 return (
  <div className="tasks-page">

    {/* HEADER + FILTERS */}
    <div className="tasks-top">

      <div className="tasks-header">
        <h1>{isAdmin ? 'All Tasks' : 'My Tasks'}</h1>
        <p>
          {tasks.length} task{tasks.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* FILTERS */}
      <div className="filter-bar">
        <select
          value={filters.status}
          onChange={(e) =>
            setFilters({ ...filters, status: e.target.value })
          }
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>

        <select
          value={filters.priority}
          onChange={(e) =>
            setFilters({ ...filters, priority: e.target.value })
          }
        >
          {PRIORITY_OPTIONS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>

        <select
          value={filters.overdue}
          onChange={(e) =>
            setFilters({ ...filters, overdue: e.target.value })
          }
        >
          <option value="">All Tasks</option>
          <option value="true">Overdue Only</option>
        </select>
      </div>

    </div>

    {/* CONTENT */}
    {loading ? (
      <div className="page-loading">
        <div className="spinner" />
      </div>
    ) : tasks.length === 0 ? (
      <div className="empty-page">
        <div className="empty-icon">✅</div>
        <h2>No tasks found</h2>
        <p>Try adjusting your filters.</p>
      </div>
    ) : (
      <>
        {/* TASK LIST */}
        <div className="task-grid">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onStatusChange={handleStatusChange}
              onDelete={handleDelete}
              canManage={isAdmin}
            />
          ))}
        </div>

        {/* PAGINATION */}
        {totalPages > 1 && (
          <div className="pagination">
            <button
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              className="btn btn-secondary btn-sm"
            >
              ← Prev
            </button>

            <span>
              Page {page} of {totalPages}
            </span>

            <button
              disabled={page === totalPages}
              onClick={() => setPage(page + 1)}
              className="btn btn-secondary btn-sm"
            >
              Next →
            </button>
          </div>
        )}
      </>
    )}

  </div>
);
};

export default TasksPage;