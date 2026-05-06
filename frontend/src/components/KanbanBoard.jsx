// src/components/KanbanBoard.jsx

import React from 'react';
import { STATUS_ORDER, STATUS_LABEL } from '../constants/status';
import { tasksAPI } from '../api/projects';

export const KanbanBoard = ({ tasks, setTasks }) => {

  const groupTasks = () => {
    const map = {
      todo: [],
      in_progress: [],
      review: [],
      done: [],
    };

    tasks.forEach(task => {
      map[task.status || 'todo'].push(task);
    });

    return map;
  };

  const columns = groupTasks();

  const handleDrop = async (taskId, newStatus) => {
    const updated = tasks.map(t =>
      t.id === taskId ? { ...t, status: newStatus } : t
    );

    setTasks(updated);

    try {
      await tasksAPI.update(taskId, { status: newStatus });
    } catch {
      alert('Failed to update');
    }
  };

  return (
    <div className="kanban">
      {STATUS_ORDER.map(status => (
        <div key={status} className="kanban-col">
          <h3>{STATUS_LABEL[status]}</h3>

          {columns[status].map(task => (
            <div
              key={task.id}
              className="kanban-card"
              draggable
              onDragStart={(e) =>
                e.dataTransfer.setData('taskId', task.id)
              }
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                const id = e.dataTransfer.getData('taskId');
                handleDrop(id, status);
              }}
            >
              <strong>{task.title}</strong>
              <p>{task.description}</p>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};