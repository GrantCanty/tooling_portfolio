import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const LandingView = ({ hasStartedChat }) => {
  return (
    <div className="landing-view">
      <AnimatePresence>
        {!hasStartedChat && (
          <motion.div 
            initial={{ opacity: 0, height: 'auto' }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
            className="hero-content"

          >
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="neon-text"
            >
              Grant's Portfolio
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="subtitle"
            >
              Gen AI Developer & Music Producer
            </motion.p>
            
            <motion.div 
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 1, duration: 1.5 }}
              className="accent-line"
            />
            
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5 }}
              className="intro-text"
            >
              I build intelligent systems that bridge the gap between human creativity and machine logic. 
              Ask me about my work in LLMs, finance, or music production to get started.
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx>{`
        .landing-view {
          height: 100%;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: radial-gradient(circle at center, rgba(66, 153, 225, 0.05) 0%, transparent 70%);
        }

        .hero-content {
          text-align: center;
          width: 100%;
          max-width: 800px;
          margin: 0 auto;
        }


        h1 {
          font-size: 8rem;
          font-weight: 700;
          margin-bottom: 10px;
          letter-spacing: -2px;
          background: linear-gradient(to bottom, #fff 0%, #4299e1 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .subtitle {
          font-family: var(--font-heading);
          font-size: 1.5rem;
          color: var(--text-secondary);
          letter-spacing: 4px;
          text-transform: uppercase;
        }

        .accent-line {
          height: 2px;
          background: linear-gradient(90deg, transparent, var(--accent-blue), transparent);
          margin: 40px auto;
          width: 300px;
        }

        .intro-text {
          font-size: 1.2rem;
          color: var(--text-secondary);
          line-height: 1.6;
          max-width: 600px;
          margin: 0 auto;
        }

        @media (max-width: 768px) {
          h1 { font-size: 4rem; }
        }
      `}</style>
    </div>
  );
};

export default LandingView;
