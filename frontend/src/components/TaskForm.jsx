import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

/* FIXED ENUMS */
const PRIORITIES = ['low', 'medium', 'high'];
const STATUSES = ['todo', 'in_progress', 'review', 'done'];

const PRIORITY_META = {
  low: { color: '#10b981', icon: '▽', label: 'Low' },
  medium: { color: '#f59e0b', icon: '◇', label: 'Medium' },
  high: { color: '#ef4444', icon: '△', label: 'High' },
};

const STATUS_LABELS = {
  todo: 'To Do',
  in_progress: 'In Progress',
  review: 'Review',
  done: 'Done',
};

const TaskForm = ({ mode = 'create', initialData = {}, members = [], onSubmit, onClose }) => {
  const { isAdmin, user } = useAuth();

  const [form, setForm] = useState({
    title: initialData.title || '',
    description: initialData.description || '',
    priority: initialData.priority || 'medium',
    status: initialData.status || 'todo',
    assigneeId: initialData.assigneeId || '',
    dueDate: initialData.dueDate || '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (field) => (e) =>
    setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError('');

    if (!form.title.trim() || form.title.trim().length < 2) {
      setError('Title must be at least 2 characters.');
      return;
    }

    setLoading(true);

    try {
      await onSubmit({
        ...form,
        assigneeId: form.assigneeId || undefined,
        dueDate: form.dueDate || undefined,
      });

      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save task.');
    } finally {
      setLoading(false);
    }
  };

  const canAssign =
    isAdmin ||
    members.some(
      (m) => m.projectRole === 'manager' && m.userId === user?.id
    );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal task-form-modal" onClick={(e) => e.stopPropagation()}>

        {/* HEADER */}
        <div className="modal-header">
          <h2>{mode === 'create' ? 'Create Task' : 'Edit Task'}</h2>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">

            {error && <div className="alert alert-error">{error}</div>}

            {/* TITLE */}
            <input
              type="text"
              value={form.title}
              onChange={set('title')}
              placeholder="Task title"
              required
            />

            {/* DESCRIPTION */}
            <textarea
              value={form.description}
              onChange={set('description')}
              placeholder="Description"
            />

            {/* PRIORITY */}
            <div>
              {PRIORITIES.map((p) => (
                <button
                  key={p}
                  type="button"
                  className={form.priority === p ? 'selected' : ''}
                  onClick={() => setForm({ ...form, priority: p })}
                >
                  {PRIORITY_META[p].icon} {PRIORITY_META[p].label}
                </button>
              ))}
            </div>

            {/* STATUS */}
            <select
              value={form.status}
              onChange={set('status')}
              className={`status-select-form status-form-${form.status}`}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </select>

            {/* ASSIGNEE */}
            <select
              value={form.assigneeId}
              onChange={set('assigneeId')}
              disabled={!canAssign}
            >
              <option value="">Unassigned</option>
              {members.map((m) => (
                <option key={m.userId} value={m.userId}>
                  {m.user?.name}
                </option>
              ))}
            </select>

            {/* DUE DATE */}
            <input
              type="date"
              value={form.dueDate}
              onChange={set('dueDate')}
            />

          </div>

          {/* FOOTER */}
          <div className="modal-footer">
            <button type="button" onClick={onClose}>
              Cancel
            </button>

            <button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default TaskForm;