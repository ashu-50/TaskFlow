import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { projectsAPI } from '../api/projects';
import { useAuth } from '../context/AuthContext';

const ProjectsPage = () => {
  const { user, isAdmin } = useAuth();

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    name: '',
    description: '',
  });

  /* ── FETCH PROJECTS ── */
  const fetchProjects = async () => {
    setLoading(true);

    try {
      const res = await projectsAPI.getAll();

      let data = [];

      if (Array.isArray(res)) {
        data = res;
      } else if (res?.projects) {
        data = res.projects;
      } else if (res?.data?.projects) {
        data = res.data.projects;
      } else if (res?.data && Array.isArray(res.data)) {
        data = res.data;
      }

      setProjects(data);
    } catch (err) {
      console.error('FETCH ERROR:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  /* ── CREATE PROJECT ── */
  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.name.trim()) {
      setError('Project name required');
      return;
    }

    try {
      const res = await projectsAPI.create(form);

      const newProject =
        res?.project ||
        res?.data?.project ||
        res?.data ||
        res;

      if (!newProject || !newProject.id) {
        throw new Error('Invalid project response');
      }

      setProjects((prev) => [newProject, ...prev]);

      setForm({ name: '', description: '' });
      setShowModal(false);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.message ||
        'Failed to create project'
      );
    }
  };

  /* ── DELETE PROJECT ── */
  const handleDelete = async (id) => {
    if (!window.confirm('Delete project?')) return;

    try {
      await projectsAPI.delete(id);

      setProjects((prev) =>
        prev.filter((p) => p.id !== id)
      );
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed');
    }
  };

  /* ── UI STATES ── */
  if (loading) return <div className="spinner" />;

  return (
    <div className="projects-page"> {/* ✅ FIXED WRAPPER */}

      {/* HEADER */}
      <div className="projects-header"> {/* ✅ FIXED STRUCTURE */}
        <h1>Projects</h1>

        {user && (
          <button
            className="btn-primary"
            onClick={() => setShowModal(true)}
          >
            + New Project
          </button>
        )}
      </div>

      {/* LIST */}
      {projects.length === 0 ? (
        <div className="projects-empty">
          No projects yet
        </div>
      ) : (
        <div className="projects-grid">
          {projects.map((project, index) => {
            if (!project) return null;

            return (
              <div
                key={project.id || index}
                className="project-card"
              >
                <h3>
                  {project.id ? (
                    <Link to={`/projects/${project.id}`}>
                      {project.name || 'Untitled'}
                    </Link>
                  ) : (
                    <span>{project.name || 'Untitled'}</span>
                  )}
                </h3>

                <p>{project.description || 'No description'}</p>

                {isAdmin && project.id && (
                  <button
                    className="btn-danger"
                    onClick={() => handleDelete(project.id)}
                  >
                    Delete
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL */}
      {showModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowModal(false)}
        >
          <div
            className="modal"
            onClick={(e) => e.stopPropagation()}
          >
            <h2>Create Project</h2>

            {error && <p className="error">{error}</p>}

            <form onSubmit={handleCreate}>
              <input
                placeholder="Project name"
                value={form.name}
                onChange={(e) =>
                  setForm({ ...form, name: e.target.value })
                }
              />

              <textarea
                placeholder="Description"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />

              <div className="modal-actions">
                <button className="btn-primary">
                  Create
                </button>

                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default ProjectsPage;