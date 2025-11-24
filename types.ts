export interface RepoConfig {
  owner: string;
  repo: string;
  branch: string;
  token?: string;
}

export interface ProcessingStatus {
  state: 'idle' | 'fetching_tree' | 'fetching_files' | 'completed' | 'error';
  totalFiles: number;
  processedFiles: number;
  currentFile?: string;
  error?: string;
}

export interface GitHubTreeItem {
  path: string;
  mode: string;
  type: 'blob' | 'tree';
  sha: string;
  size?: number;
  url: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}
