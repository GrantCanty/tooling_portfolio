import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Folder, FileCode, GitBranch, GitCommit, Star, GitFork, ArrowLeft, MessageSquare, Plus, ExternalLink, Loader } from 'lucide-react';

const Github = ({ size = 20, className, style }) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    stroke="currentColor"
    strokeWidth="2"
    fill="none"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={style}
  >
    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
  </svg>
);

const ProjectsView = ({ id, initialTab, initialBranch, initialFilePath, onNavigate }) => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Detail View State
  const [projectDetails, setProjectDetails] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [openFolders, setOpenFolders] = useState({});

  // Import Modal State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [repoUrl, setRepoUrl] = useState('');
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState('');

  // Branch switcher state
  const [isBranchDropdownOpen, setIsBranchDropdownOpen] = useState(false);
  const [branchSearch, setBranchSearch] = useState('');

  // Active Tab state ('code' or 'commits')
  const [activeTab, setActiveTab] = useState('code');

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8888';

  // Fetch the list of projects for the grid
  const fetchProjects = async () => {
    try {
      const response = await axios.get(`${apiUrl}/data/projects`);
      setProjects(response.data);
    } catch (error) {
      console.error("Error fetching projects:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  // Fetch specific project details when ID is active
  useEffect(() => {
    if (!id) {
      setProjectDetails(null);
      setSelectedFile(null);
      setIsBranchDropdownOpen(false);
      setBranchSearch('');
      setActiveTab('code');
      return;
    }

    const fetchProjectDetails = async () => {
      setDetailLoading(true);
      setIsBranchDropdownOpen(false);
      setBranchSearch('');
      setActiveTab('code');
      try {
        const response = await axios.get(`${apiUrl}/data/project-${id}`);
        setProjectDetails(response.data);

        // Auto-expand top level folders in file tree
        const initialOpen = {};
        if (response.data.file_paths) {
          response.data.file_paths.forEach(p => {
            const parts = p.split('/');
            if (parts.length > 1) {
              initialOpen[parts[0]] = true;
            }
          });
        }
        setOpenFolders(initialOpen);
      } catch (error) {
        console.error("Error fetching project details:", error);
      } finally {
        setDetailLoading(false);
      }
    };

    fetchProjectDetails();
  }, [id]);

  // Listen to deep-links / AI tool navigation requests
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  useEffect(() => {
    if (initialBranch && projectDetails && projectDetails.github_url && initialBranch !== projectDetails.active_branch) {
      handleBranchChange(initialBranch);
    }
  }, [initialBranch, projectDetails]);

  useEffect(() => {
    if (initialFilePath) {
      let matchedPath = initialFilePath;
      
      // Fuzzy match: if not found exactly, look for a file ending with initialFilePath
      if (projectDetails && projectDetails.files && !projectDetails.files[initialFilePath]) {
        const normalizedInput = initialFilePath.replace(/\\/g, '/').toLowerCase();
        const found = Object.keys(projectDetails.files).find(p => {
          const normP = p.replace(/\\/g, '/').toLowerCase();
          return normP === normalizedInput || normP.endsWith('/' + normalizedInput);
        });
        if (found) {
          matchedPath = found;
        }
      }
      
      setSelectedFile(matchedPath);
      setActiveTab('code');
      
      // Auto-expand parent directories in the tree explorer
      const parts = matchedPath.split('/');
      if (parts.length > 1) {
        setOpenFolders(prev => {
          const nextOpen = { ...prev };
          let currentPath = '';
          for (let i = 0; i < parts.length - 1; i++) {
            currentPath = currentPath ? `${currentPath}/${parts[i]}` : parts[i];
            nextOpen[currentPath] = true;
          }
          return nextOpen;
        });
      }
    }
  }, [initialFilePath, projectDetails]);

  const handleImport = async (e) => {
    e.preventDefault();
    if (!repoUrl.trim()) return;

    setImporting(true);
    setImportError('');
    try {
      const response = await axios.post(`${apiUrl}/import`, { repo_url: repoUrl });
      if (response.data.success) {
        setIsImportModalOpen(false);
        setRepoUrl('');
        // Refresh grid list
        await fetchProjects();
        // Go to the newly imported project details page
        onNavigate('projects', response.data.project.id);
      }
    } catch (error) {
      console.error("Import error:", error);
      setImportError(error.response?.data?.detail || "Failed to import project. Please check the URL.");
    } finally {
      setImporting(false);
    }
  };

  const handleBranchChange = async (branchName) => {
    setIsBranchDropdownOpen(false);
    if (!projectDetails || !projectDetails.github_url) return;
    
    setDetailLoading(true);
    try {
      const response = await axios.post(`${apiUrl}/import`, { 
        repo_url: projectDetails.github_url,
        branch: branchName
      });
      if (response.data.success) {
        const detailRes = await axios.get(`${apiUrl}/data/project-${id}`);
        setProjectDetails(detailRes.data);
        setSelectedFile(null);
      }
    } catch (error) {
      console.error("Error switching branch:", error);
      alert(error.response?.data?.detail || "Failed to switch branch");
    } finally {
      setDetailLoading(false);
    }
  };

  const toggleFolder = (path) => {
    setOpenFolders(prev => ({
      ...prev,
      [path]: !prev[path]
    }));
  };

  // Turn flat list of paths into a nested tree structure
  const buildTree = (paths) => {
    const root = {};
    paths.forEach(p => {
      const parts = p.split('/');
      let current = root;
      parts.forEach((part, index) => {
        if (!current[part]) {
          current[part] = {
            name: part,
            path: parts.slice(0, index + 1).join('/'),
            isFolder: index < parts.length - 1,
            children: {}
          };
        }
        current = current[part].children;
      });
    });
    return root;
  };

  const renderTree = (node) => {
    const items = Object.values(node).sort((a, b) => {
      // Folders first, then files
      if (a.isFolder && !b.isFolder) return -1;
      if (!a.isFolder && b.isFolder) return 1;
      return a.name.localeCompare(b.name);
    });

    return items.map(item => {
      const isOpen = openFolders[item.path];
      const isSelected = selectedFile === item.path;

      if (item.isFolder) {
        return (
          <div key={item.path} className="tree-folder-group">
            <div
              className="tree-node folder"
              onClick={() => toggleFolder(item.path)}
              style={{ paddingLeft: `${(item.path.split('/').length - 1) * 12 + 8}px` }}
            >
              <Folder size={16} className="folder-icon" fill={isOpen ? "var(--accent-blue)" : "none"} stroke={isOpen ? "var(--accent-blue)" : "var(--text-secondary)"} />
              <span>{item.name}</span>
            </div>
            {isOpen && renderTree(item.children)}
          </div>
        );
      } else {
        return (
          <div
            key={item.path}
            className={`tree-node file ${isSelected ? 'active-file' : ''}`}
            onClick={() => setSelectedFile(item.path)}
            style={{ paddingLeft: `${(item.path.split('/').length - 1) * 12 + 8}px` }}
          >
            <FileCode size={16} className="file-icon" stroke={isSelected ? "#58a6ff" : "var(--text-secondary)"} />
            <span>{item.name}</span>
          </div>
        );
      }
    });
  };

  if (loading) return <div className="loading">Loading Projects...</div>;

  // RENDER DETAILED GITHUB VIEW
  if (id) {
    if (!projectDetails || (detailLoading && projectDetails.id !== id)) {
      return <div className="loading">Loading repository details...</div>;
    }

    const treeData = buildTree(projectDetails.file_paths || []);
    const fileContent = selectedFile ? projectDetails.files[selectedFile] : null;

    return (
      <div className="projects-detail-view">
        <div className="detail-actions">
          <button onClick={() => onNavigate('projects', null)} className="back-btn-grid">
            <ArrowLeft size={16} /> Back to Projects
          </button>
        </div>

        <div className="github-layout glass">
          {detailLoading && (
            <div className="github-loading-overlay">
              <div className="spinner-container">
                <Loader size={40} className="spin" />
                <span>Switching branch...</span>
              </div>
            </div>
          )}
          {/* Header */}
          <div className="github-header">
            <div className="github-repo-title">
              <Github size={20} />
              <span className="repo-name">GrantCanty / {projectDetails.id}</span>
              <span className="badge">public</span>
            </div>
            <div className="github-header-actions">
              {projectDetails.github_url && (
                <a href={projectDetails.github_url} target="_blank" rel="noreferrer" className="github-btn primary">
                  <ExternalLink size={14} /> GitHub <ExternalLink size={10} style={{ marginLeft: 2 }} />
                </a>
              )}
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="github-tabs-nav">
            <button 
              className={`tab-btn ${activeTab === 'code' ? 'active' : ''}`}
              onClick={() => setActiveTab('code')}
            >
              <FileCode size={16} />
              <span>Code</span>
            </button>
            <button 
              className={`tab-btn ${activeTab === 'commits' ? 'active' : ''}`}
              onClick={() => setActiveTab('commits')}
            >
              <GitCommit size={16} />
              <span>Commits</span>
              {projectDetails.commits && projectDetails.commits.length > 0 && (
                <span className="tab-count">
                  {projectDetails.commits.length}
                  {projectDetails.has_more_commits ? '+' : ''}
                </span>
              )}
            </button>
          </div>

          {/* Subbar */}
          <div className="github-subbar">
            {projectDetails.branches && projectDetails.branches.length > 0 ? (
              <div className="branch-dropdown-container">
                <button 
                  className="branch-select-btn"
                  onClick={() => setIsBranchDropdownOpen(!isBranchDropdownOpen)}
                >
                  <GitBranch size={14} />
                  <span>{projectDetails.active_branch || 'main'}</span>
                  <span className="chevron-down">▼</span>
                </button>
                {isBranchDropdownOpen && (
                  <>
                    <div className="dropdown-overlay-dismiss" onClick={() => setIsBranchDropdownOpen(false)} />
                    <div className="branch-dropdown-menu glass">
                      <div className="dropdown-header">
                        <span>Switch branches/tags</span>
                        <button className="close-dropdown-btn" onClick={() => setIsBranchDropdownOpen(false)}>×</button>
                      </div>
                      <div className="dropdown-filter">
                        <input 
                          type="text" 
                          placeholder="Filter branches..." 
                          value={branchSearch}
                          onChange={(e) => setBranchSearch(e.target.value)}
                          autoFocus
                        />
                      </div>
                      <div className="dropdown-list">
                        {projectDetails.branches
                          .filter(b => b.toLowerCase().includes(branchSearch.toLowerCase()))
                          .map(branchName => (
                            <div 
                              key={branchName} 
                              className={`dropdown-item ${branchName === (projectDetails.active_branch || 'main') ? 'active' : ''}`}
                              onClick={() => handleBranchChange(branchName)}
                            >
                              {branchName}
                            </div>
                          ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="branch-select disabled">
                <GitBranch size={14} />
                <span>main</span>
              </div>
            )}
            <div className="github-stats">
              <div className="stat-item">
                <Star size={14} />
                <span>{projectDetails.stars || 0} stars</span>
              </div>
              <div className="stat-item">
                <GitFork size={14} />
                <span>{projectDetails.forks || 0} forks</span>
              </div>
            </div>
          </div>

          {/* Body Panels */}
          {activeTab === 'code' ? (
            <div className="github-body">
              {/* Sidebar Explorer */}
              <div className="github-sidebar">
                <div className="sidebar-header">Files</div>
                <div className="file-tree">
                  {/* README link to clear selection */}
                  <div
                    className={`tree-node file ${!selectedFile ? 'active-file' : ''}`}
                    onClick={() => setSelectedFile(null)}
                    style={{ paddingLeft: '8px' }}
                  >
                    <FileCode size={16} stroke={!selectedFile ? "#58a6ff" : "var(--text-secondary)"} />
                    <span>README.md</span>
                  </div>
                  {renderTree(treeData)}
                </div>
              </div>

              {/* Content Display Workspace */}
              <div className="github-content">
                {selectedFile ? (
                  // Code File Viewer
                  <div className="code-viewer-container">
                    <div className="editor-header">
                      <div className="file-tabs">
                        <div className="file-tab">
                          <FileCode size={14} />
                          <span>{selectedFile.split('/').pop()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="editor-body">
                      <div className="line-numbers">
                        {(fileContent || '').split('\n').map((_, index) => (
                          <div key={index}>{index + 1}</div>
                        ))}
                      </div>
                      <pre className="code-pre">
                        <code>{fileContent}</code>
                      </pre>
                    </div>
                  </div>
                ) : (
                  // README Display
                  <div className="readme-container">
                    <div className="readme-card">
                      <div className="readme-header">
                        <FileCode size={14} />
                        <span>README.md</span>
                      </div>
                      <div className="readme-body markdown-content">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {projectDetails.readme}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            // COMMITS VIEW
            <div className="github-body commits-view-body">
              <div className="commits-container">
                <div className="commits-header">
                  <GitCommit size={18} />
                  <h3>Commit History</h3>
                </div>
                <div className="commits-list">
                  {projectDetails.commits && projectDetails.commits.length > 0 ? (
                    projectDetails.commits.map((commit) => {
                      const commitDate = new Date(commit.date).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      });
                      
                      return (
                        <div key={commit.sha} className="commit-item">
                          <div className="commit-main">
                            <div className="commit-message">{commit.message}</div>
                            <div className="commit-meta">
                              {commit.author_avatar ? (
                                <img src={commit.author_avatar} alt={commit.author_login} className="commit-author-avatar" />
                              ) : (
                                <div className="commit-author-avatar-placeholder">
                                  {commit.author_name ? commit.author_name[0].toUpperCase() : 'U'}
                                </div>
                              )}
                              <span className="commit-author-name">
                                {commit.author_login || commit.author_name || 'Unknown Author'}
                              </span>
                              <span className="commit-date">committed on {commitDate}</span>
                            </div>
                          </div>
                          <div className="commit-action">
                            {projectDetails.github_url && commit.sha ? (
                              <a 
                                href={`${projectDetails.github_url}/commit/${commit.sha}`} 
                                target="_blank" 
                                rel="noreferrer" 
                                className="commit-sha-badge"
                              >
                                {commit.sha.substring(0, 7)}
                              </a>
                            ) : (
                              <span className="commit-sha-badge-static">
                                {commit.sha ? commit.sha.substring(0, 7) : 'mocksha'}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    // Fallback placeholders for local projects
                    [
                      {
                        sha: "a1b2c3d4e5f6g7h8i9j0",
                        message: `Initial release of ${projectDetails.title || 'project'}`,
                        author_name: "Grant Canty",
                        date: "2026-05-01T12:00:00Z"
                      },
                      {
                        sha: "f9e8d7c6b5a43210zyxw",
                        message: "Configure build pipelines and asset compression",
                        author_name: "Grant Canty",
                        date: "2026-05-15T15:30:00Z"
                      }
                    ].map((commit) => {
                      const commitDate = new Date(commit.date).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      });
                      return (
                        <div key={commit.sha} className="commit-item mock">
                          <div className="commit-main">
                            <div className="commit-message">{commit.message}</div>
                            <div className="commit-meta">
                              <div className="commit-author-avatar-placeholder">G</div>
                              <span className="commit-author-name">{commit.author_name}</span>
                              <span className="commit-date">committed on {commitDate}</span>
                            </div>
                          </div>
                          <div className="commit-action">
                            <span className="commit-sha-badge-static">{commit.sha.substring(0, 7)}</span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <style jsx>{`
          .projects-detail-view {
            padding: 40px;
            max-width: 1400px;
            margin: 0 auto;
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column;
            gap: 20px;
          }
          .detail-actions {
            display: flex;
            justify-content: flex-start;
          }
          .back-btn-grid {
            display: flex;
            align-items: center;
            gap: 8px;
            background: transparent;
            border: none;
            color: var(--text-secondary);
            cursor: pointer;
            font-size: 1rem;
            transition: color 0.2s;
          }
          .back-btn-grid:hover {
            color: var(--text-primary);
          }
          .folder-icon {
            margin-right: 2px;
          }
          .file-icon {
            margin-right: 2px;
          }
          .tree-folder-group {
            display: flex;
            flex-direction: column;
          }
        `}</style>
      </div>
    );
  }

  // RENDER PROJECTS GRID
  return (
    <div className="projects-view">
      <div className="view-header">
        <h2>Selected Projects</h2>
        <p>Explore engineering repositories or import a custom repository from GitHub.</p>
      </div>

      <div className="projects-grid">
        {projects.map((project, i) => (
          <motion.div
            key={project.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`project-card glass ${id === project.id ? 'highlight' : ''}`}
            onClick={() => onNavigate('projects', project.id)}
            id={project.id}
          >
            <div className="project-image">
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

        {/* Import Project Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: projects.length * 0.1 }}
          className="project-card glass import-trigger-card"
          onClick={() => setIsImportModalOpen(true)}
        >
          <div className="import-card-body">
            <Plus size={40} className="plus-icon" />
            <h3>Import from GitHub</h3>
            <p>Paste a public repository URL to parse and interact with its source code.</p>
          </div>
        </motion.div>
      </div>

      {/* Import Modal Dialog */}
      <AnimatePresence>
        {isImportModalOpen && (
          <div className="dialog-overlay" onClick={() => setIsImportModalOpen(false)}>
            <div className="dialog-content" onClick={(e) => e.stopPropagation()}>
              <div className="dialog-header">
                <h3>Import GitHub Repository</h3>
                <button className="close-btn" onClick={() => setIsImportModalOpen(false)}>×</button>
              </div>
              <form onSubmit={handleImport}>
                <div className="dialog-body">
                  <div className="form-group">
                    <label className="form-label">Repository URL</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="https://github.com/owner/repo"
                      value={repoUrl}
                      onChange={(e) => setRepoUrl(e.target.value)}
                      disabled={importing}
                      required
                    />
                  </div>
                  {importError && <div className="import-error-msg">{importError}</div>}
                </div>
                <div className="dialog-footer">
                  <button
                    type="button"
                    className="github-btn"
                    onClick={() => setIsImportModalOpen(false)}
                    disabled={importing}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="github-btn primary"
                    disabled={importing || !repoUrl.trim()}
                  >
                    {importing ? (
                      <>
                        <Loader size={14} className="spin" style={{ marginRight: 6 }} /> Importing...
                      </>
                    ) : "Import"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </AnimatePresence>

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
          height: 180px;
          background: #121214;
          display: flex;
          align-items: center;
          justify-content: center;
          border-bottom: 1px solid var(--border-color);
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
          min-height: 48px;
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

        .import-trigger-card {
          border: 2px dashed var(--border-color);
          display: flex;
          align-items: center;
          justify-content: center;
          background: transparent;
        }

        .import-trigger-card:hover {
          border-color: var(--accent-blue);
          background: rgba(66, 153, 225, 0.02);
        }

        .import-card-body {
          padding: 40px 30px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          color: var(--text-secondary);
        }

        .import-card-body h3 {
          color: var(--text-primary);
          margin-bottom: 0;
        }

        .import-card-body p {
          font-size: 0.9rem;
          line-height: 1.5;
        }

        .plus-icon {
          color: var(--text-secondary);
          transition: transform 0.3s ease;
        }

        .import-trigger-card:hover .plus-icon {
          transform: rotate(90deg);
          color: var(--accent-blue);
        }

        .import-error-msg {
          color: #f85149;
          font-size: 0.85rem;
          margin-top: 12px;
          padding: 8px 12px;
          background: rgba(248, 81, 73, 0.1);
          border: 1px solid rgba(248, 81, 73, 0.2);
          border-radius: 6px;
        }

        .spin {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default ProjectsView;
