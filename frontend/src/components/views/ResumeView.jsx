import React from 'react';
import { motion } from 'framer-motion';

const ResumeView = () => {
  return (
    <div className="resume-view">
      <motion.div 
        className="view-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2>Interactive Resume</h2>
        <p>Feel free to ask the AI any questions about my professional background!</p>
      </motion.div>

      <motion.div 
        className="resume-container glass"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5, ease: "easeOut" }}
      >
        <object 
          data="/resume.pdf" 
          type="application/pdf" 
          className="pdf-viewer"
        >
          <div className="pdf-fallback">
            <p>It appears your browser doesn't support embedded PDFs.</p>
            <a href="/resume.pdf" target="_blank" rel="noopener noreferrer" className="download-btn">
              Download Resume
            </a>
          </div>
        </object>
      </motion.div>

      <style jsx>{`
        .resume-view {
          padding: 40px;
          max-width: 1200px;
          margin: 0 auto;
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
        }

        .view-header {
          margin-bottom: 30px;
          text-align: center;
          flex-shrink: 0;
        }

        h2 {
          font-size: 3rem;
          margin-bottom: 10px;
          color: var(--text-primary);
        }

        .view-header p {
          color: var(--text-secondary);
          font-size: 1.1rem;
        }

        .resume-container {
          flex: 1;
          width: 100%;
          border-radius: 24px;
          overflow: hidden;
          background: rgba(25, 25, 30, 0.4);
          border: 1px solid rgba(255, 255, 255, 0.05);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
          display: flex;
          flex-direction: column;
          min-height: 600px;
        }

        .pdf-viewer {
          width: 100%;
          height: 100%;
          border: none;
          background-color: #333; /* Dark background behind PDF */
        }

        .pdf-fallback {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          padding: 40px;
          text-align: center;
          color: var(--text-secondary);
        }

        .download-btn {
          margin-top: 20px;
          padding: 12px 24px;
          background: var(--accent-blue);
          color: white;
          text-decoration: none;
          border-radius: 8px;
          font-weight: 500;
          transition: all 0.2s ease;
        }

        .download-btn:hover {
          background: #53acee;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(66, 153, 225, 0.4);
        }
        
        @media (max-width: 768px) {
          .resume-view {
            padding: 20px;
          }
          
          h2 {
            font-size: 2.5rem;
          }
          
          .resume-container {
            min-height: 80vh;
            border-radius: 16px;
          }
        }
      `}</style>
    </div>
  );
};

export default ResumeView;
