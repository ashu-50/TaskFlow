import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { projectsAPI, tasksAPI, dashboardAPI } from '../api/projects';
import { useAuth } from '../context/AuthContext';
import { TaskCard } from '../components/TaskCard';
import TaskForm from '../components/TaskForm';

/* ENUMS */
const STATUS_OPTIONS = [
  { value: 'todo', label: 'To Do' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'review', label: 'Review' },
  { value: 'done', label: 'Done' },
];

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

const ProjectDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);

  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState('tasks');
  const [taskFilters, setTaskFilters] = useState({ status: '', priority: '' });

  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);

  /* ── FETCH ── */
  const fetchAll = useCallback(async () => {
    if (!id) return;

    setLoading(true);

    try {
      const [projRes, taskRes] = await Promise.all([
        projectsAPI.getById(id),
        tasksAPI.getAll({ projectId: id, ...taskFilters }),
      ]);

      const projectData =
        projRes?.project ||
        projRes?.data?.project ||
        projRes?.data ||
        projRes;

      const taskData =
        taskRes?.tasks ||
        taskRes?.data?.tasks ||
        taskRes?.data ||
        [];

      if (!projectData || !projectData.id) {
        navigate('/projects');
        return;
      }

      setProject(projectData);
      setTasks(taskData);
      setMembers(projectData.projectMembers || []);

    } catch {
      navigate('/projects');
    } finally {
      setLoading(false);
    }
  }, [id, taskFilters, navigate]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  /* ── FETCH USERS ── */
  useEffect(() => {
    if (isAdmin && showMemberModal) {
      dashboardAPI.getUsers()
        .then((res) => {
          const users =
            res?.users ||
            res?.data?.users ||
            res?.data ||
            [];
          setAllUsers(users);
        })
        .catch(() => {});
    }
  }, [showMemberModal, isAdmin]);

  /* ── TASK HANDLERS ── */
  const handleStatusChange = async (taskId, status) => {
    await tasksAPI.update(taskId, { status });
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status } : t))
    );
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;
    await tasksAPI.delete(taskId);
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  };

  const handleCreateTask = async (formData) => {
    const res = await tasksAPI.create({ ...formData, projectId: id });
    const newTask = res?.task || res?.data?.task || res?.data || res;
    setTasks((prev) => [newTask, ...prev]);
    setShowTaskModal(false);
  };

  /* ── MEMBER HANDLERS ── */
  const handleAddMember = async (userId) => {
    await projectsAPI.addMember(id, { userId, projectRole: 'contributor' });
    fetchAll();
    setShowMemberModal(false);
  };

  const handleRemoveMember = async (userId) => {
    if (!window.confirm('Remove member?')) return;
    await projectsAPI.removeMember(id, userId);
    setMembers((prev) => prev.filter((m) => m.userId !== userId));
  };

  /* ── STATES ── */
  if (loading) return <div className="spinner" />;
  if (!project) return <p>Project not found</p>;

  const memberIds = members.map((m) => m.userId);
  const nonMembers = allUsers.filter((u) => !memberIds.includes(u.id));

  const isOwnerOrManager =
    project.ownerId === user?.id ||
    isAdmin ||
    members.some(
      (m) => m.userId === user?.id && m.projectRole === 'manager'
    );

  return (
    <div className="project-detail">

      {/* HEADER */}
      <div className="project-header">
        <h1>{project.name}</h1>
        {project.description && <p>{project.description}</p>}
      </div>

      {/* TOP SECTION */}
      <div className="project-top">

        {/* TABS */}
        <div className="project-tabs">
          <button
            className={`project-tab ${activeTab === 'tasks' ? 'active' : ''}`}
            onClick={() => setActiveTab('tasks')}
          >
            Tasks ({tasks.length})
          </button>

          <button
            className={`project-tab ${activeTab === 'members' ? 'active' : ''}`}
            onClick={() => setActiveTab('members')}
          >
            Members ({members.length})
          </button>
        </div>

        {/* TOOLBAR */}
        {activeTab === 'tasks' && (
          <div className="project-toolbar">

            <div className="filters">
              <select
                value={taskFilters.status}
                onChange={(e) =>
                  setTaskFilters({ ...taskFilters, status: e.target.value })
                }
              >
                <option value="">All</option>
                {STATUS_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>

              <select
                value={taskFilters.priority}
                onChange={(e) =>
                  setTaskFilters({ ...taskFilters, priority: e.target.value })
                }
              >
                <option value="">All</option>
                {PRIORITY_OPTIONS.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>

            {isOwnerOrManager && (
              <button
                className="btn-primary"
                onClick={() => setShowTaskModal(true)}
              >
                + Task
              </button>
            )}
          </div>
        )}
      </div>

      {/* TASKS */}
      {activeTab === 'tasks' && (
        <div className="kanban">
          {STATUS_OPTIONS.map((col) => {
            const columnTasks = tasks.filter(
              (t) => (t.status || 'todo') === col.value
            );

            return (
              <div key={col.value} className="kanban-col">
                <h3>{col.label}</h3>

                {columnTasks.length === 0 ? (
                  <div className="kanban-empty">No tasks</div>
                ) : (
                  columnTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onStatusChange={handleStatusChange}
                      onDelete={handleDeleteTask}
                      canManage={isOwnerOrManager}
                    />
                  ))
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* MEMBERS */}
      {activeTab === 'members' && (
        <div className="members-section">
          {members.map((m) => (
            <div key={m.id} className="member-item">
              {m.user?.name} ({m.projectRole})

              {isAdmin && m.userId !== project.ownerId && (
                <button
                  className="btn-danger"
                  onClick={() => handleRemoveMember(m.userId)}
                >
                  Remove
                </button>
              )}
            </div>
          ))}

          {isAdmin && (
            <button
              className="btn-primary"
              onClick={() => setShowMemberModal(true)}
            >
              + Add Member
            </button>
          )}
        </div>
      )}

      {/* MODALS */}
      {showTaskModal && (
        <TaskForm
          mode="create"
          members={members}
          onSubmit={handleCreateTask}
          onClose={() => setShowTaskModal(false)}
        />
      )}

      {showMemberModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Add Members</h3>

            {nonMembers.map((u) => (
              <div key={u.id} className="member-item">
                {u.name}
                <button onClick={() => handleAddMember(u.id)}>Add</button>
              </div>
            ))}

            <button onClick={() => setShowMemberModal(false)}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetailPage;