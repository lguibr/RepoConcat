import React, { useState } from 'react';
import { RepoConfig } from '../types';
import { Github, Key, Search } from 'lucide-react';

interface RepoFormProps {
  onSubmit: (config: RepoConfig) => void;
  disabled: boolean;
}

const RepoForm: React.FC<RepoFormProps> = ({ onSubmit, disabled }) => {
  const [config, setConfig] = useState<RepoConfig>({
    owner: '',
    repo: '',
    branch: 'main',
    token: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (config.owner && config.repo && config.branch) {
      onSubmit(config);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-4xl bg-gray-900 p-6 rounded-xl border border-gray-800 shadow-xl space-y-6">
      <div className="flex items-center gap-2 mb-2">
        <Github className="w-6 h-6 text-blue-400" />
        <h2 className="text-xl font-bold text-white">Repository Details</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-400">Owner (User/Org)</label>
          <input
            type="text"
            required
            placeholder="e.g. facebook"
            className="w-full bg-gray-800 border border-gray-700 text-white p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
            value={config.owner}
            onChange={e => setConfig({ ...config, owner: e.target.value })}
            disabled={disabled}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-400">Repository Name</label>
          <input
            type="text"
            required
            placeholder="e.g. react"
            className="w-full bg-gray-800 border border-gray-700 text-white p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
            value={config.repo}
            onChange={e => setConfig({ ...config, repo: e.target.value })}
            disabled={disabled}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-400">Branch</label>
          <input
            type="text"
            required
            placeholder="e.g. main"
            className="w-full bg-gray-800 border border-gray-700 text-white p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
            value={config.branch}
            onChange={e => setConfig({ ...config, branch: e.target.value })}
            disabled={disabled}
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-medium text-gray-400">
          <Key className="w-4 h-4" />
          GitHub Token (Optional - Increases Rate Limits)
        </label>
        <input
          type="password"
          placeholder="ghp_..."
          className="w-full bg-gray-800 border border-gray-700 text-white p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none font-mono text-sm"
          value={config.token}
          onChange={e => setConfig({ ...config, token: e.target.value })}
          disabled={disabled}
        />
        <p className="text-xs text-gray-500">
          Without a token, GitHub limits to 60 requests/hour. For medium/large repos, a token is required.
        </p>
      </div>

      <div className="pt-2">
        <button
          type="submit"
          disabled={disabled}
          className={`w-full flex items-center justify-center gap-2 p-4 rounded-lg font-bold text-white transition-all transform hover:scale-[1.01] active:scale-[0.99]
            ${disabled 
              ? 'bg-gray-700 cursor-not-allowed opacity-50' 
              : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-blue-900/20'
            }`}
        >
          {disabled ? 'Processing...' : (
            <>
              <Search className="w-5 h-5" />
              Fetch Repository
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default RepoForm;
