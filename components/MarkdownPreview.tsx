import React from 'react';
import { Download, Copy, Check } from 'lucide-react';

interface MarkdownPreviewProps {
  content: string;
  fileName: string;
}

const MarkdownPreview: React.FC<MarkdownPreviewProps> = ({ content, fileName }) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const stats = {
    lines: content.split('\n').length,
    chars: content.length,
    size: (content.length / 1024 / 1024).toFixed(2)
  };

  return (
    <div className="w-full max-w-4xl space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-gray-900 p-4 rounded-xl border border-gray-800">
        <div className="flex flex-col">
          <h3 className="text-lg font-bold text-white">{fileName}</h3>
          <div className="text-xs text-gray-400 font-mono space-x-3">
            <span>{stats.lines.toLocaleString()} lines</span>
            <span>{stats.size} MB</span>
            <span>{stats.chars.toLocaleString()} chars</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2 w-full md:w-auto">
          <button
            onClick={handleCopy}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors border border-gray-700 text-sm font-medium"
          >
            {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
          
          <button
            onClick={handleDownload}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors font-medium text-sm"
          >
            <Download className="w-4 h-4" />
            Download
          </button>
        </div>
      </div>

      <div className="relative h-96 bg-gray-900 rounded-xl border border-gray-800 overflow-hidden group">
        <div className="absolute inset-0 p-4 overflow-auto custom-scrollbar">
          <pre className="font-mono text-xs md:text-sm text-gray-300 whitespace-pre-wrap break-all">
            {content.slice(0, 10000)}
            {content.length > 10000 && (
              <span className="text-gray-500 italic block mt-4">
                ... Preview truncated (Download to see full {stats.size}MB file) ...
              </span>
            )}
          </pre>
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-gray-900/50 pointer-events-none" />
      </div>
    </div>
  );
};

export default MarkdownPreview;