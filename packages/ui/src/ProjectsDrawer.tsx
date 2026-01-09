/**
 * Projects Drawer - Cloud project management
 * Slide-out panel for listing, creating, and managing projects
 */

import { useState, useMemo } from 'react';
import { ContextMenu, ContextMenuItem } from './ContextMenu';

export interface ProjectItem {
  id: string;
  name: string;
  updatedAt: string;
  thumbnailUrl?: string;
  isCloud: boolean;
  isFavorite?: boolean;
  tags?: string[];
  folderId?: string | null;
}

export interface FolderItem {
  id: string;
  name: string;
  color: string;
  icon: string;
  projectCount?: number;
}

type SortOption = 'updated' | 'created' | 'name' | 'favorite';
type ViewMode = 'all' | 'favorites' | 'folder';

interface ProjectsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  projects: ProjectItem[];
  folders?: FolderItem[];
  currentProjectId: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  onSelectProject: (id: string) => void;
  onCreateProject: () => void;
  onDeleteProject: (id: string) => void;
  onDuplicateProject: (id: string) => void;
  onCreateFolder?: () => void;
  onToggleFavorite?: (projectId: string) => void;
  onSignIn: () => void;
  onRefresh?: () => void;
}

export function ProjectsDrawer({
  isOpen,
  onClose,
  projects,
  folders = [],
  currentProjectId,
  isAuthenticated,
  isLoading,
  onSelectProject,
  onCreateProject,
  onDeleteProject,
  onDuplicateProject,
  onCreateFolder,
  onToggleFavorite,
  onSignIn,
  onRefresh,
}: ProjectsDrawerProps) {
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('updated');
  const [viewMode, setViewMode] = useState<ViewMode>('all');
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; items: ContextMenuItem[] } | null>(null);

  // Filter and sort projects
  const filteredAndSortedProjects = useMemo(() => {
    let result = [...projects];
    
    // Filter by view mode
    if (viewMode === 'favorites') {
      result = result.filter(p => p.isFavorite);
    } else if (viewMode === 'folder' && selectedFolderId) {
      result = result.filter(p => p.folderId === selectedFolderId);
    } else if (viewMode === 'folder' && !selectedFolderId) {
      // Show projects without folder
      result = result.filter(p => !p.folderId);
    }
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(p => 
        p.name.toLowerCase().includes(query) ||
        p.tags?.some(t => t.toLowerCase().includes(query))
      );
    }
    
    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'favorite':
          // Favorites first
          if (a.isFavorite && !b.isFavorite) return -1;
          if (!a.isFavorite && b.isFavorite) return 1;
          // Then by updated date
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        case 'created':
        case 'updated':
        default:
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }
    });
    
    return result;
  }, [projects, searchQuery, sortBy, viewMode, selectedFolderId]);
  
  // Folders with project count
  const foldersWithCount = useMemo(() => {
    return folders.map(f => ({
      ...f,
      projectCount: projects.filter(p => p.folderId === f.id).length,
    }));
  }, [folders, projects]);
  
  // Count favorites
  const favoritesCount = projects.filter(p => p.isFavorite).length;

  // Context menu handlers
  const handleProjectContextMenu = (e: React.MouseEvent, project: ProjectItem) => {
    e.preventDefault();
    e.stopPropagation();
    
    const items: ContextMenuItem[] = [
      {
        label: project.isFavorite ? 'Remove from Favorites' : 'Add to Favorites',
        icon: '⭐',
        onClick: () => onToggleFavorite?.(project.id),
      },
      {
        label: 'Duplicate',
        icon: '📋',
        onClick: () => onDuplicateProject(project.id),
      },
      {
        label: 'Delete',
        icon: '🗑️',
        onClick: () => onDeleteProject(project.id),
        variant: 'danger' as const,
        divider: true,
      },
    ];
    
    setContextMenu({ x: e.clientX, y: e.clientY, items });
  };

  if (!isOpen) return null;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="relative w-80 max-w-[90vw] h-full bg-surface border-r border-border shadow-2xl flex flex-col animate-slide-in-left">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-text">Projects</h2>
            {isAuthenticated && onRefresh && (
              <button
                onClick={onRefresh}
                disabled={isLoading}
                className="p-1.5 hover:bg-surface2 rounded-lg transition-colors disabled:opacity-50"
                title="Refresh projects"
              >
                <svg className={`w-4 h-4 text-muted ${isLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-surface2 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* New Project Button */}
        <div className="p-4 border-b border-border">
          <button
            onClick={onCreateProject}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-accent hover:bg-accent/90 text-white font-medium rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Project
          </button>
        </div>

        {/* Search and Sort */}
        {isAuthenticated && projects.length > 0 && (
          <div className="p-4 border-b border-border space-y-3">
            {/* Search */}
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search projects..."
                className="w-full pl-9 pr-3 py-2 bg-surface2 border border-border/50 rounded-lg text-sm text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/50"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-surface rounded transition-colors"
                >
                  <svg className="w-3 h-3 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {/* Sort Options */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted">Sort:</span>
              <div className="flex gap-1 flex-wrap">
                {[
                  { value: 'updated' as const, label: 'Recent', icon: '🕐' },
                  { value: 'name' as const, label: 'Name', icon: 'Az' },
                  { value: 'favorite' as const, label: 'Favorites', icon: '⭐' },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setSortBy(option.value)}
                    className={`px-2 py-1 text-xs rounded-md transition-colors ${
                      sortBy === option.value
                        ? 'bg-accent text-white'
                        : 'bg-surface2 text-muted hover:bg-surface hover:text-text'
                    }`}
                  >
                    <span className="mr-1">{option.icon}</span>
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Results count */}
            {searchQuery && (
              <div className="text-xs text-muted">
                {filteredAndSortedProjects.length} result{filteredAndSortedProjects.length !== 1 ? 's' : ''}
              </div>
            )}
          </div>
        )}

        {/* Folders & Filters Section */}
        {isAuthenticated && !searchQuery && (
          <div className="border-b border-border">
            {/* Favorites */}
            {favoritesCount > 0 && (
              <button
                onClick={() => {
                  setViewMode('favorites');
                  setSelectedFolderId(null);
                }}
                className={`w-full flex items-center justify-between px-4 py-2.5 transition-colors ${
                  viewMode === 'favorites'
                    ? 'bg-accent/10 text-accent'
                    : 'hover:bg-surface2 text-muted'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm">⭐</span>
                  <span className="text-sm font-medium">Favorites</span>
                </div>
                <span className="text-xs bg-surface2 px-2 py-0.5 rounded-full">{favoritesCount}</span>
              </button>
            )}

            {/* Folders Section */}
            {onCreateFolder && (
              <div className="py-2">
                {foldersWithCount.length > 0 && (
                  <div className="px-4 py-1 text-xs font-semibold text-muted uppercase tracking-wider">
                    Folders
                  </div>
                )}
                {foldersWithCount.map((folder) => (
                  <button
                    key={folder.id}
                    onClick={() => {
                      setViewMode('folder');
                      setSelectedFolderId(folder.id);
                    }}
                    className={`w-full flex items-center justify-between px-4 py-2.5 transition-colors ${
                      viewMode === 'folder' && selectedFolderId === folder.id
                        ? 'bg-accent/10 text-accent'
                        : 'hover:bg-surface2 text-muted'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm" style={{ color: folder.color }}>📁</span>
                      <span className="text-sm font-medium truncate max-w-[180px]">{folder.name}</span>
                    </div>
                    {folder.projectCount! > 0 && (
                      <span className="text-xs bg-surface2 px-2 py-0.5 rounded-full">{folder.projectCount}</span>
                    )}
                  </button>
                ))}
                {/* New Folder button */}
                <button
                  onClick={onCreateFolder}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-muted hover:text-text hover:bg-surface2 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="font-medium">New Folder</span>
                </button>
              </div>
            )}

            {/* All Projects */}
            <button
              onClick={() => {
                setViewMode('all');
                setSelectedFolderId(null);
              }}
              className={`w-full flex items-center justify-between px-4 py-2.5 transition-colors ${
                viewMode === 'all'
                  ? 'bg-accent/10 text-accent'
                  : 'hover:bg-surface2 text-muted'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-sm">📋</span>
                <span className="text-sm font-medium">
                  {foldersWithCount.length > 0 ? 'All Projects' : 'Projects'}
                </span>
              </div>
              <span className="text-xs bg-surface2 px-2 py-0.5 rounded-full">{projects.length}</span>
            </button>
          </div>
        )}

        {/* Projects List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <svg className="w-6 h-6 animate-spin text-accent" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
          ) : !isAuthenticated ? (
            <div className="p-4 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-surface2 flex items-center justify-center">
                <svg className="w-8 h-8 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                </svg>
              </div>
              <p className="text-muted text-sm">Sign in to sync projects</p>
              <p className="text-muted/70 text-xs mt-1">Cloud projects require authentication</p>
              <button
                onClick={onSignIn}
                className="mt-4 px-4 py-2 bg-accent hover:bg-accent/90 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Sign In
              </button>
            </div>
          ) : projects.length === 0 ? (
            <div className="p-4 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-surface2 flex items-center justify-center">
                <svg className="w-8 h-8 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
              </div>
              <p className="text-muted text-sm">No projects yet</p>
              <p className="text-muted/70 text-xs mt-1">Create your first project to get started</p>
            </div>
          ) : (
            <div className="p-2">
              {filteredAndSortedProjects.map((project) => (
                <div
                  key={project.id}
                  className={`relative group rounded-lg transition-all cursor-pointer mb-2 ${
                    currentProjectId === project.id
                      ? 'bg-accent/20 ring-1 ring-accent/50'
                      : 'hover:bg-surface2'
                  }`}
                  onClick={() => onSelectProject(project.id)}
                  onContextMenu={(e) => handleProjectContextMenu(e, project)}
                  onMouseEnter={() => setHoveredId(project.id)}
                  onMouseLeave={() => {
                    setHoveredId(null);
                    if (deleteConfirmId === project.id) setDeleteConfirmId(null);
                  }}
                >
                  <div className="flex items-start gap-3 p-3">
                    {/* Thumbnail */}
                    <div className="w-12 h-12 rounded-lg bg-surface2 flex-shrink-0 overflow-hidden">
                      {project.thumbnailUrl ? (
                        <img
                          src={project.thumbnailUrl}
                          alt={project.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl">
                          ⚽
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        {project.isFavorite && <span className="text-xs">⭐</span>}
                        <h3 className="text-sm font-medium text-text truncate">{project.name}</h3>
                      </div>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-xs text-muted">{formatDate(project.updatedAt)}</span>
                        {project.isCloud && (
                          <span className="text-xs text-accent flex items-center gap-0.5">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                            </svg>
                            Cloud
                          </span>
                        )}
                        {project.tags && project.tags.length > 0 && (
                          <div className="flex gap-1">
                            {project.tags.slice(0, 2).map((tag) => (
                              <span key={tag} className="text-xs px-1.5 py-0.5 rounded bg-surface2/50 text-muted">
                                #{tag}
                              </span>
                            ))}
                            {project.tags.length > 2 && (
                              <span className="text-xs text-muted">+{project.tags.length - 2}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Current badge */}
                    {currentProjectId === project.id && (
                      <span className="text-xs bg-accent text-white px-2 py-0.5 rounded-full">
                        Current
                      </span>
                    )}
                  </div>

                  {/* Actions (visible on hover) */}
                  {hoveredId === project.id && currentProjectId !== project.id && (
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDuplicateProject(project.id);
                        }}
                        className="p-1.5 hover:bg-surface rounded-md transition-colors"
                        title="Duplicate"
                      >
                        <svg className="w-4 h-4 text-muted hover:text-text" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                      {deleteConfirmId === project.id ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteProject(project.id);
                            setDeleteConfirmId(null);
                          }}
                          className="p-1.5 bg-red-500/20 hover:bg-red-500/30 rounded-md transition-colors"
                          title="Confirm Delete"
                        >
                          <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </button>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteConfirmId(project.id);
                          }}
                          className="p-1.5 hover:bg-red-500/20 rounded-md transition-colors"
                          title="Delete"
                        >
                          <svg className="w-4 h-4 text-muted hover:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer - Cloud sync status */}
        <div className="p-4 border-t border-border">
          {isAuthenticated ? (
            <div className="flex items-center gap-2 text-xs text-muted">
              <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Cloud sync enabled</span>
            </div>
          ) : (
            <button
              onClick={onSignIn}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-surface2 hover:bg-surface text-text text-sm rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
              </svg>
              Sign in to sync to cloud
            </button>
          )}
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={contextMenu.items}
          onClose={() => setContextMenu(null)}
        />
      )}

      {/* Animation styles */}
      <style>{`
        @keyframes slide-in-left {
          from {
            transform: translateX(-100%);
          }
          to {
            transform: translateX(0);
          }
        }
        .animate-slide-in-left {
          animation: slide-in-left 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}
