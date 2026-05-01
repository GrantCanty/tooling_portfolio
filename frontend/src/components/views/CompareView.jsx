import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';

const CompareView = ({ id1, id2 }) => {
  const [project1, setProject1] = useState(null);
  const [project2, setProject2] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:8888'}/data/projects`);
        const allProjects = response.data;
        
        const p1 = allProjects.find(p => p.id === id1);
        const p2 = allProjects.find(p => p.id === id2);
        
        setProject1(p1);
        setProject2(p2);
      } catch (error) {
        console.error("Error fetching projects for comparison:", error);
      } finally {
        setLoading(false);
      }
    };

    if (id1 && id2) {
      fetchProjects();
    } else {
      setLoading(false);
    }
  }, [id1, id2]);

  if (loading) {
    return <div className="loading">Loading Comparison...</div>;
  }

  if (!project1 || !project2) {
    return (
      <div className="compare-view error-state">
        <p>Please select two valid projects to compare.</p>
      </div>
    );
  }

  const renderProjectCard = (project, delayIndex) => (
    <motion.div 
      className="project-card glass"
      initial={{ opacity: 0, x: delayIndex === 0 ? -50 : 50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: delayIndex * 0.2, ease: "easeOut" }}
    >
      <div className="project-image">
        {project.image ? (
          <div className="image-placeholder">{project.title[0]}</div> // Could be img tag, keeping placeholder for style
        ) : (
          <div className="image-placeholder">{project.title[0]}</div>
        )}
      </div>
      <div className="project-content">
        <h3>{project.title}</h3>
        <p className="description">{project.description}</p>
        
        <div className="tech-section">
          <h4>Core Technologies</h4>
          <div className="tech-tags">
            {project.technologies.map(tech => (
              <span key={tech} className="tech-tag">{tech}</span>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="compare-view">
      <motion.div 
        className="view-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2>Project Comparison</h2>
        <p>Evaluating architectures side-by-side.</p>
      </motion.div>

      <div className="comparison-container">
        {renderProjectCard(project1, 0)}
        
        <motion.div 
          className="vs-divider"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.4, type: "spring" }}
        >
          <span>VS</span>
        </motion.div>

        {renderProjectCard(project2, 1)}
      </div>

      <style jsx>{`
        .compare-view {
          padding: 60px;
          max-width: 1400px;
          margin: 0 auto;
          width: 100%;
          min-height: 100%;
          display: flex;
          flex-direction: column;
        }

        .view-header {
          margin-bottom: 50px;
          text-align: center;
        }

        h2 {
          font-size: 3rem;
          margin-bottom: 10px;
        }

        .view-header p {
          color: var(--text-secondary);
          font-size: 1.1rem;
        }

        .comparison-container {
          display: flex;
          align-items: stretch;
          justify-content: center;
          gap: 40px;
          position: relative;
          flex: 1;
        }

        .project-card {
          flex: 1;
          display: flex;
          flex-direction: column;
          border-radius: 24px;
          overflow: hidden;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
          background: rgba(25, 25, 30, 0.4);
          border: 1px solid rgba(255, 255, 255, 0.05);
        }

        .project-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4);
          border-color: rgba(255, 255, 255, 0.1);
        }

        .project-image {
          height: 250px;
          background: linear-gradient(135deg, rgba(66, 153, 225, 0.1) 0%, rgba(159, 122, 234, 0.1) 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }

        .image-placeholder {
          font-size: 6rem;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.1);
          font-family: var(--font-heading);
        }

        .project-content {
          padding: 40px;
          display: flex;
          flex-direction: column;
          flex: 1;
        }

        h3 {
          font-size: 2rem;
          margin-bottom: 20px;
          color: var(--text-primary);
        }

        .description {
          color: var(--text-secondary);
          font-size: 1.1rem;
          line-height: 1.7;
          margin-bottom: 40px;
          flex: 1;
        }

        .tech-section {
          margin-top: auto;
        }

        h4 {
          font-size: 0.9rem;
          text-transform: uppercase;
          letter-spacing: 2px;
          color: var(--text-secondary);
          margin-bottom: 15px;
        }

        .tech-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }

        .tech-tag {
          padding: 8px 16px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          font-size: 0.85rem;
          color: var(--text-primary);
          transition: all 0.2s ease;
        }

        .tech-tag:hover {
          background: rgba(66, 153, 225, 0.15);
          border-color: rgba(66, 153, 225, 0.3);
          transform: translateY(-2px);
        }

        .vs-divider {
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10;
        }

        .vs-divider span {
          background: var(--bg-dark);
          color: var(--text-secondary);
          font-family: var(--font-heading);
          font-weight: 700;
          font-size: 1.2rem;
          width: 60px;
          height: 60px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid rgba(255, 255, 255, 0.05);
          box-shadow: 0 0 20px rgba(0,0,0,0.5);
        }

        .error-state {
          align-items: center;
          justify-content: center;
          color: var(--text-secondary);
          font-size: 1.2rem;
        }

        @media (max-width: 900px) {
          .comparison-container {
            flex-direction: column;
            gap: 20px;
          }

          .vs-divider {
            margin: 10px 0;
          }
        }
      `}</style>
    </div>
  );
};

export default CompareView;
