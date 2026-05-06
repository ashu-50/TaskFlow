import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { format, parseISO, differenceInCalendarDays } from 'date-fns';
import { dashboardAPI, tasksAPI } from '../api/projects';
import { useAuth } from '../context/AuthContext';

/* ================= ENUM CONFIG ================= */
const STATUS_META = {
  todo: { label: 'To Do', color: '#6366f1' },
  in_progress: { label: 'In Progress', color: '#f59e0b' },
  review: { label: 'Review', color: '#8b5cf6' },
  done: { label: 'Done', color: '#10b981' },
};

const STATUS_LIST = Object.keys(STATUS_META);

/* ================= OVERDUE ROW ================= */
const OverdueRow = ({ task, onStatusChange }) => {
  const daysLate = task.dueDate
    ? differenceInCalendarDays(new Date(), parseISO(task.dueDate))
    : 0;

  return (
    <div className="task-item">
      <span>{task.title}</span>

      <span className="deadline">{daysLate}d late</span>

      <select
        value={task.status}
        onChange={(e) => onStatusChange(task.id, e.target.value)}
      >
        {STATUS_LIST.map((s) => (
          <option key={s} value={s}>
            {STATUS_META[s].label}
          </option>
        ))}
      </select>
    </div>
  );
};

/* ================= MAIN ================= */
const DashboardPage = () => {
  const { user } = useAuth();

  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = useCallback(async () => {
    try {
      const data = await dashboardAPI.getDashboard();
      setDashboard(data.dashboard);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const handleStatusChange = async (taskId, status) => {
    try {
      await tasksAPI.update(taskId, { status });
      fetchDashboard();
    } catch {
      alert('Failed to update');
    }
  };

  if (loading) return <div className="spinner" />;
  if (!dashboard) return null;

  const {
    summary,
    myTasks,
    overdueTasks,
    upcomingDeadlines,
    recentActivity,
  } = dashboard;

  return (
    <div className="dashboard">

      {/* HEADER */}
      <div className="dashboard-header">
        <div>
          <h1>Dashboard</h1>
          <p className="dashboard-sub">
            Welcome back, {user?.name?.split(' ')[0]}
          </p>
        </div>

        <div className="dashboard-links">
          <Link to="/projects">Projects</Link>
          <Link to="/tasks">Tasks</Link>
        </div>
      </div>

      {/* STATS */}
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Projects</h3>
          <p>{summary?.totalProjects || 0}</p>
        </div>

        <div className="stat-card">
          <h3>Tasks</h3>
          <p>{summary?.totalTasks || 0}</p>
        </div>

        <div className="stat-card">
          <h3>Overdue</h3>
          <p>{summary?.overdueTasksCount || 0}</p>
        </div>
      </div>

      {/* MAIN GRID */}
      <div className="dashboard-grid">

        {/* LEFT */}
        <div className="dashboard-card">
          <h2>My Tasks</h2>

          {myTasks?.length === 0 ? (
            <p>No tasks</p>
          ) : (
            myTasks.map((task) => (
              <div key={task.id} className="task-item">
                <span>{task.title}</span>

                <select
                  value={task.status}
                  onChange={(e) =>
                    handleStatusChange(task.id, e.target.value)
                  }
                >
                  {STATUS_LIST.map((s) => (
                    <option key={s} value={s}>
                      {STATUS_META[s].label}
                    </option>
                  ))}
                </select>
              </div>
            ))
          )}
        </div>

        {/* RIGHT */}
        <div className="dashboard-side">

          <div className="dashboard-card">
            <h2>Overdue Tasks</h2>

            {overdueTasks?.length === 0 ? (
              <p>No overdue tasks</p>
            ) : (
              overdueTasks.map((task) => (
                <OverdueRow
                  key={task.id}
                  task={task}
                  onStatusChange={handleStatusChange}
                />
              ))
            )}
          </div>

          <div className="dashboard-card">
            <h2>Upcoming Deadlines</h2>

            {upcomingDeadlines?.length === 0 ? (
              <p>No deadlines</p>
            ) : (
              upcomingDeadlines.map((t) => (
                <div key={t.id} className="deadline-item">
                  {t.title} —{' '}
                  {t.dueDate && format(parseISO(t.dueDate), 'MMM d')}
                </div>
              ))
            )}
          </div>

          <div className="dashboard-card">
            <h2>Recent Activity</h2>

            {recentActivity?.length === 0 ? (
              <p>No activity</p>
            ) : (
              recentActivity.map((t) => (
                <div key={t.id} className="activity-item">
                  {t.title} — {STATUS_META[t.status]?.label}
                </div>
              ))
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default DashboardPage;