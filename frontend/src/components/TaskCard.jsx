import React from 'react';
import { format, isPast, parseISO } from 'date-fns';

const PRIORITY_COLORS = {
  low: '#10b981',
  medium: '#f59e0b',
  high: '#ef4444',
};

const STATUSES = [
  { value: 'todo', label: 'To Do' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'review', label: 'Review' },
  { value: 'done', label: 'Done' },
];

export const TaskCard = ({ task, onStatusChange, onDelete, canManage }) => {
  const isOverdue =
    task.dueDate &&
    task.status !== 'done' &&
    isPast(parseISO(task.dueDate));

  return (
  <div className={`task-card ${isOverdue ? 'overdue' : ''}`}>

    {/* TOP ROW */}
    <div className="task-top">
      <div className="task-title-wrap">
        <span
          className="priority-dot"
          style={{ backgroundColor: PRIORITY_COLORS[task.priority] }}
        />
        <h4 className="task-title">{task.title}</h4>
      </div>

      {isOverdue && (
        <span className="badge-overdue">Overdue</span>
      )}
    </div>

    {/* DESCRIPTION */}
    {task.description && (
      <p className="task-desc">{task.description}</p>
    )}

    {/* META */}
    <div className="task-meta">
      {task.project && (
        <span className="meta-item">📁 {task.project.name}</span>
      )}

      {task.dueDate && (
        <span className={`meta-item ${isOverdue ? 'danger' : ''}`}>
          🗓 {task.dueDate}
        </span>
      )}

      <span className={`priority-chip ${task.priority}`}>
        {task.priority}
      </span>
    </div>

    {/* ACTIONS */}
    <div className="task-actions">
      <select
        value={task.status}
        onChange={(e) => onStatusChange(task.id, e.target.value)}
      >
        {STATUSES.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>

      {canManage && (
        <button
          className="delete-btn"
          onClick={() => onDelete(task.id)}
        >
          Discard
        </button>
      )}
    </div>

  </div>
);
};