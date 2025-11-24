import { RepoConfig, GitHubTreeItem } from '../types';

const IGNORED_EXTENSIONS = [
  '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.webp', '.mp4', '.mov', '.mp3', '.pdf',
  '.zip', '.tar', '.gz', '.7z', '.rar', '.exe', '.dll', '.so', '.dylib', '.class', '.jar',
  '.lock', 'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml'
];

const IGNORED_DIRS = [
  'node_modules/', 'dist/', 'build/', 'coverage/', '.git/', '.idea/', '.vscode/'
];

export class GitHubService {
  private config: RepoConfig;
  private abortController: AbortController | null = null;

  constructor(config: RepoConfig) {
    this.config = config;
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Accept': 'application/vnd.github.v3+json',
    };
    if (this.config.token) {
      headers['Authorization'] = `Bearer ${this.config.token}`;
    }
    return headers;
  }

  cancel() {
    if (this.abortController) {
      this.abortController.abort();
    }
  }

  async fetchTree(): Promise<GitHubTreeItem[]> {
    this.abortController = new AbortController();
    const { owner, repo, branch } = this.config;
    const url = `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`;

    const response = await fetch(url, {
      headers: this.getHeaders(),
      signal: this.abortController.signal,
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      throw new Error(errorBody.message || `Failed to fetch repository tree: ${response.statusText}`);
    }

    const data = await response.json();
    if (data.truncated) {
      console.warn('Repository tree is truncated. Some files may be missing.');
    }

    return (data.tree as GitHubTreeItem[])
      .filter(item => item.type === 'blob') // Only files
      .filter(item => !this.isIgnored(item.path));
  }

  private isIgnored(path: string): boolean {
    if (IGNORED_DIRS.some(dir => path.startsWith(dir) || path.includes('/' + dir))) return true;
    const ext = path.slice(path.lastIndexOf('.')).toLowerCase();
    return IGNORED_EXTENSIONS.includes(ext);
  }

  async fetchFileContent(path: string): Promise<string> {
    const { owner, repo, branch } = this.config;
    
    // Using the Raw media type to get content directly
    // Note: API rate limits apply.
    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`;

    const response = await fetch(url, {
      headers: {
        ...this.getHeaders(),
        'Accept': 'application/vnd.github.v3.raw' // Request raw content
      }
    });

    if (!response.ok) {
      // If raw fetch fails, return a placeholder
      return `[Failed to fetch content for ${path}: ${response.status} ${response.statusText}]`;
    }

    return await response.text();
  }

  // Helper to process files with concurrency limit
  async fetchAllFiles(
    files: GitHubTreeItem[], 
    onProgress: (completed: number, currentFile: string) => void
  ): Promise<string> {
    let output = `# Repository: ${this.config.owner}/${this.config.repo} (${this.config.branch})\n\n`;
    const concurrency = 5;
    let completed = 0;
    
    // Simple queue implementation
    const queue = [...files];
    const results: { path: string, content: string }[] = [];

    const worker = async () => {
      while (queue.length > 0) {
        if (this.abortController?.signal.aborted) return;
        
        const file = queue.shift();
        if (!file) break;

        onProgress(completed, file.path);
        
        try {
          const content = await this.fetchFileContent(file.path);
          results.push({ path: file.path, content });
        } catch (e) {
          results.push({ path: file.path, content: `[Error processing file: ${e}]` });
        }
        
        completed++;
      }
    };

    const workers = Array(concurrency).fill(null).map(() => worker());
    await Promise.all(workers);

    // Sort results to match original tree order (which is usually sorted by path)
    // or sort alphabetically to ensure deterministic output
    results.sort((a, b) => a.path.localeCompare(b.path));

    for (const res of results) {
      output += `## File: ${res.path}\n\n`;
      output += "```" + this.detectLanguage(res.path) + "\n";
      output += res.content + "\n";
      output += "```\n\n";
    }

    return output;
  }

  private detectLanguage(path: string): string {
    const ext = path.split('.').pop()?.toLowerCase();
    switch(ext) {
      case 'js': return 'javascript';
      case 'ts': return 'typescript';
      case 'tsx': return 'tsx';
      case 'jsx': return 'jsx';
      case 'py': return 'python';
      case 'rs': return 'rust';
      case 'go': return 'go';
      case 'java': return 'java';
      case 'c': return 'c';
      case 'cpp': return 'cpp';
      case 'h': return 'c';
      case 'css': return 'css';
      case 'html': return 'html';
      case 'json': return 'json';
      case 'md': return 'markdown';
      case 'yml': case 'yaml': return 'yaml';
      case 'sh': return 'bash';
      default: return '';
    }
  }
}
