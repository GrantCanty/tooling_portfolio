import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const LandingView = ({ hasStartedChat }) => {
  return (
    <div className="landing-view">
      <AnimatePresence mode="popLayout">
        {!hasStartedChat && (
          <motion.div
            initial={{ opacity: 0, height: 'auto' }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="hero-content"

          >
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              Grant
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="subtitle"
            >
              Gen AI Developer
            </motion.p>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="intro-text"
            >
              Ask about me
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx>{`
        .landing-view {
          width: 100%;
          display: flex;
          align-items: flex-start;
          justify-content: center;
          background: transparent;
        }

        .hero-content {
          text-align: center;
          width: 100%;
          max-width: 900px;
          margin: 0 auto;
          padding-top: 15vh;
        }


        h1 {
          font-size: 8rem;
          font-weight: 500;
          letter-spacing: -2px;
          background: transparent;;
        }

        .subtitle {
          font-family: var(--font-heading);
          font-size: 1.5rem;
          color: var(--text-secondary);
          letter-spacing: 4px;
          text-transform: uppercase;
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
