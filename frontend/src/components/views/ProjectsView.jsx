import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';

const ProjectsView = ({ id }) => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:8888'}/data/projects`);
        setProjects(response.data);
      } catch (error) {
        console.error("Error fetching projects:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  if (loading) return <div className="loading">Loading Projects...</div>;

  return (
    <div className="projects-view">
      <div className="view-header">
        <h2>Selected Projects</h2>
        <p>A showcase of AI, Finance, and Music Engineering.</p>
      </div>

      <div className="projects-grid">
        {projects.map((project, i) => (
          <motion.div 
            key={project.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.15 }}
            className={`project-card glass ${id === project.id ? 'highlight' : ''}`}
            id={project.id}
          >
            <div className="project-image">
              {/* Image would go here */}
              <div className="image-placeholder">{project.title[0]}</div>
            </div>
            <div className="project-info">
              <h3>{project.title}</h3>
              <p>{project.description}</p>
              <div className="tech-tags">
                {project.technologies.map(tech => (
                  <span key={tech} className="tech-tag">{tech}</span>
                ))}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <style jsx>{`
        .projects-view {
          padding: 60px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .view-header {
          margin-bottom: 40px;
        }

        h2 {
          font-size: 3rem;
          margin-bottom: 10px;
        }

        .view-header p {
          color: var(--text-secondary);
          font-size: 1.1rem;
        }

        .projects-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 30px;
        }

        .project-card {
          overflow: hidden;
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          cursor: pointer;
        }

        .project-card:hover {
          transform: translateY(-10px);
          border-color: var(--accent-blue);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        }

        .project-card.highlight {
          border-color: var(--accent-blue);
          box-shadow: 0 0 20px rgba(66, 153, 225, 0.2);
          background: rgba(66, 153, 225, 0.05);
        }

        .project-image {
          height: 200px;
          background: #1a1a1d;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .image-placeholder {
          font-size: 4rem;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.05);
        }

        .project-info {
          padding: 25px;
        }

        h3 {
          font-size: 1.5rem;
          margin-bottom: 15px;
        }

        .project-info p {
          color: var(--text-secondary);
          font-size: 0.95rem;
          margin-bottom: 20px;
          line-height: 1.6;
        }

        .tech-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .tech-tag {
          padding: 4px 10px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--border-color);
          border-radius: 4px;
          font-size: 0.75rem;
          color: var(--text-secondary);
        }
      `}</style>
    </div>
  );
};

export default ProjectsView;
