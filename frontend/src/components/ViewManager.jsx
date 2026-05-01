import React, { Suspense, lazy } from 'react';
import LandingView from './views/LandingView';

// Lazy load heavy views
const ProjectsView = lazy(() => import('./views/ProjectsView'));
const ResumeView = lazy(() => import('./views/ResumeView'));
const EducationView = lazy(() => import('./views/EducationView'));
const MusicView = lazy(() => import('./views/MusicView'));
const GraphView = lazy(() => import('./views/GraphView'));
const CompareView = lazy(() => import('./views/CompareView'));

const ViewManager = ({ viewState, hasStartedChat }) => {
  const renderView = () => {
    switch (viewState.view) {
      case 'landing':
        return <LandingView hasStartedChat={hasStartedChat} />;
      case 'projects':
        return <ProjectsView id={viewState.id} />;
      case 'resume':
        return <ResumeView />;
      case 'education':
        return <EducationView />;
      case 'music':
        return <MusicView id={viewState.id} />;
      case 'graph':
        return <GraphView />;
      case 'compare':
        return <CompareView id1={viewState.id1} id2={viewState.id2} />;
      default:
        return <LandingView />;
    }
  };

  return (
    <div className="view-container" style={{ height: '100%', width: '100%' }}>
      <Suspense fallback={<div className="loading-view">Loading...</div>}>
        {renderView()}
      </Suspense>
    </div>
  );
};

export default ViewManager;
