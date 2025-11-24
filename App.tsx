import React, { useState } from 'react';
import RepoForm from './components/RepoForm';
import MarkdownPreview from './components/MarkdownPreview';
import { RepoConfig, ProcessingStatus } from './types';
import { GitHubService } from './services/githubService';
import { FileCode, Loader2, XCircle } from 'lucide-react';

const App: React.FC = () => {
  const [status, setStatus] = useState<ProcessingStatus>({
    state: 'idle',
    totalFiles: 0,
    processedFiles: 0
  });
  
  const [markdownContent, setMarkdownContent] = useState<string>('');
  const [currentRepo, setCurrentRepo] = useState<string>('');

  const handleFetch = async (config: RepoConfig) => {
    setStatus({ state: 'fetching_tree', totalFiles: 0, processedFiles: 0 });
    setMarkdownContent('');
    
    const service = new GitHubService(config);

    try {
      // Step 1: Get Tree
      const tree = await service.fetchTree();
      setStatus({ 
        state: 'fetching_files', 
        totalFiles: tree.length, 
        processedFiles: 0 
      });

      // Step 2: Fetch Content
      const content = await service.fetchAllFiles(tree, (completed, file) => {
        setStatus(prev => ({
          ...prev,
          processedFiles: completed + 1,
          currentFile: file
        }));
      });

      setMarkdownContent(content);
      setCurrentRepo(`${config.owner}/${config.repo}`);
      setStatus({ state: 'completed', totalFiles: tree.length, processedFiles: tree.length });
    } catch (error: any) {
      setStatus({ 
        state: 'error', 
        totalFiles: 0, 
        processedFiles: 0, 
        error: error.message || 'Unknown error occurred' 
      });
    }
  };

  const getProgressPercentage = () => {
    if (status.totalFiles === 0) return 0;
    return Math.round((status.processedFiles / status.totalFiles) * 100);
  };

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center py-12 px-4 sm:px-6">
      <header className="mb-10 text-center space-y-2">
        <div className="flex items-center justify-center gap-3 mb-2">
          <div className="p-3 bg-blue-600/20 rounded-xl border border-blue-500/30">
            <FileCode className="w-8 h-8 text-blue-400" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
            RepoConcat
          </h1>
        </div>
        <p className="text-gray-400 max-w-lg mx-auto">
          Convert any public GitHub repository into a single Markdown file for LLM context, documentation, or reading.
        </p>
      </header>

      <div className="w-full max-w-4xl space-y-8 flex flex-col items-center">
        {/* Form Section */}
        <RepoForm 
          onSubmit={handleFetch} 
          disabled={status.state === 'fetching_tree' || status.state === 'fetching_files'} 
        />

        {/* Status Indicators */}
        {status.state !== 'idle' && status.state !== 'completed' && status.state !== 'error' && (
          <div className="w-full bg-gray-900 p-6 rounded-xl border border-gray-800 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                <span className="font-medium text-white">
                  {status.state === 'fetching_tree' ? 'Fetching file structure...' : `Downloading files...`}
                </span>
              </div>
              <span className="text-blue-400 font-mono font-bold">{getProgressPercentage()}%</span>
            </div>
            
            <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 transition-all duration-300 ease-out"
                style={{ width: `${getProgressPercentage()}%` }}
              />
            </div>
            
            {status.currentFile && (
              <p className="mt-3 text-xs text-gray-500 font-mono truncate">
                Processing: {status.currentFile}
              </p>
            )}
          </div>
        )}

        {/* Error State */}
        {status.state === 'error' && (
          <div className="w-full bg-red-950/30 p-4 rounded-xl border border-red-900/50 flex items-center gap-3 text-red-400">
            <XCircle className="w-6 h-6 flex-shrink-0" />
            <p className="font-medium">{status.error}</p>
          </div>
        )}

        {/* Results */}
        {status.state === 'completed' && markdownContent && (
          <MarkdownPreview 
            content={markdownContent} 
            fileName={`${currentRepo.replace('/', '-')}-full.md`}
          />
        )}
      </div>

      <footer className="mt-20 text-gray-600 text-sm">
        <p>Built with React & Tailwind CSS</p>
      </footer>
    </div>
  );
};

export default App;