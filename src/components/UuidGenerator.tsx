import React, { useState, useCallback, useRef } from 'react';
import { Copy, Clipboard, FileText, Trash2, Wand2 } from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';

interface ParsedUuid {
  isValid: boolean;
  standardFormat: string;
  rawContents: string;
  version: string;
  variant: string;
  errorMessage?: string;
}

interface GenerateOptions {
  format: 'standard' | 'no-hyphens' | 'uppercase' | 'uppercase-no-hyphens';
  count: number;
}

const UuidGenerator: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'input' | 'clipboard' | 'sample' | 'clear'>('input');
  const [inputUuid, setInputUuid] = useState('');
  const [parsedUuid, setParsedUuid] = useState<ParsedUuid | null>(null);
  const [generatedUuids, setGeneratedUuids] = useState<string[]>([]);
  const [uuidVersion, setUuidVersion] = useState('v4');
  const [generateCount, setGenerateCount] = useState(1);
  const [isLowercase, setIsLowercase] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);
  
  // Resizable panels state
  const [leftPanelWidth, setLeftPanelWidth] = useState(50); // percentage
  const [isResizing, setIsResizing] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startWidth, setStartWidth] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleParse = useCallback(async () => {
    if (!inputUuid.trim()) {
      setParsedUuid(null);
      return;
    }

    try {
      const result = await invoke<ParsedUuid>('parse_uuid', { uuid: inputUuid.trim() });
      setParsedUuid(result);
    } catch (error) {
      setParsedUuid({
        isValid: false,
        standardFormat: '',
        rawContents: '',
        version: '',
        variant: '',
        errorMessage: error as string
      });
    }
  }, [inputUuid]);

  const handleGenerate = useCallback(async () => {
    try {
      const options: GenerateOptions = {
        format: isLowercase ? 'standard' : 'uppercase',
        count: generateCount
      };
      
      const result = await invoke<string[]>('generate_uuids', { 
        version: uuidVersion, 
        options 
      });
      
      setGeneratedUuids(result);
    } catch (error) {
      console.error('Failed to generate UUIDs:', error);
    }
  }, [uuidVersion, generateCount, isLowercase]);

  const copyToClipboard = useCallback((text: string, id?: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id || text);
    setTimeout(() => setCopied(null), 2000);
  }, []);

  const copyAllGenerated = useCallback(() => {
    if (generatedUuids.length > 0) {
      navigator.clipboard.writeText(generatedUuids.join('\n'));
      setCopied('all');
      setTimeout(() => setCopied(null), 2000);
    }
  }, [generatedUuids]);

  const loadSampleUuid = useCallback(() => {
    const sampleUuid = '550e8400-e29b-41d4-a716-446655440000';
    setInputUuid(sampleUuid);
    setActiveTab('sample');
  }, []);

  const clearInput = useCallback(() => {
    setInputUuid('');
    setParsedUuid(null);
    setActiveTab('clear');
  }, []);

  const clearGenerated = useCallback(() => {
    setGeneratedUuids([]);
  }, []);

  const handleClipboard = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      setInputUuid(text);
      setActiveTab('clipboard');
    } catch (error) {
      console.error('Failed to read clipboard:', error);
    }
  }, []);

  React.useEffect(() => {
    if (inputUuid) {
      handleParse();
    }
  }, [inputUuid, handleParse]);

  React.useEffect(() => {
    if (activeTab === 'sample') {
      loadSampleUuid();
    } else if (activeTab === 'clear') {
      clearInput();
    } else if (activeTab === 'clipboard') {
      handleClipboard();
    }
  }, [activeTab, loadSampleUuid, clearInput, handleClipboard]);

  // Handle resizing
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsResizing(true);
    setStartX(e.clientX);
    setStartWidth(leftPanelWidth);
    e.preventDefault();
    e.stopPropagation();
  }, [leftPanelWidth]);

  const handleMouseMove = React.useCallback((e: MouseEvent) => {
    if (!isResizing || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const deltaX = e.clientX - startX;
    const deltaPercent = (deltaX / rect.width) * 100;
    const newWidth = startWidth + deltaPercent;
    
    // Constrain between 25% and 75%
    if (newWidth >= 25 && newWidth <= 75) {
      setLeftPanelWidth(newWidth);
    }
  }, [isResizing, startX, startWidth]);

  const handleMouseUp = React.useCallback(() => {
    setIsResizing(false);
  }, []);

  React.useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, handleMouseMove, handleMouseUp]);

  return (
    <div ref={containerRef} className="flex h-full">
      {/* Left Panel - Parser/Validator */}
      <div 
        className="space-y-4 overflow-hidden" 
        style={{ width: `${leftPanelWidth}%`, paddingRight: '12px' }}
      >
        <div>
          <div className="flex gap-2 mb-4">
            <button
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'input'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
              onClick={() => setActiveTab('input')}
            >
              Input
            </button>
            <button
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${
                activeTab === 'clipboard'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
              onClick={() => setActiveTab('clipboard')}
            >
              <Clipboard className="w-4 h-4" />
              Clipboard
            </button>
            <button
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${
                activeTab === 'sample'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
              onClick={() => setActiveTab('sample')}
            >
              <FileText className="w-4 h-4" />
              Sample
            </button>
            <button
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${
                activeTab === 'clear'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
              onClick={() => setActiveTab('clear')}
            >
              <Trash2 className="w-4 h-4" />
              Clear
            </button>
          </div>
          
          <textarea
            placeholder="Enter UUID to parse/validate..."
            value={inputUuid}
            onChange={(e) => setInputUuid(e.target.value)}
            className="w-full min-h-[120px] p-3 font-mono text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        {parsedUuid && (
          <div className="space-y-3">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Standard String Format</label>
              <div className="flex items-center gap-2">
                <input 
                  value={parsedUuid.standardFormat} 
                  readOnly 
                  className="flex-1 p-2 font-mono text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800"
                />
                <button
                  onClick={() => copyToClipboard(parsedUuid.standardFormat, 'standard')}
                  disabled={!parsedUuid.isValid}
                  className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 disabled:opacity-50"
                >
                  {copied === 'standard' ? (
                    <span className="text-green-600 dark:text-green-400">✓</span>
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Raw Contents</label>
              <div className="flex items-center gap-2">
                <input 
                  value={parsedUuid.rawContents} 
                  readOnly 
                  className="flex-1 p-2 font-mono text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800"
                />
                <button
                  onClick={() => copyToClipboard(parsedUuid.rawContents, 'raw')}
                  disabled={!parsedUuid.isValid}
                  className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 disabled:opacity-50"
                >
                  {copied === 'raw' ? (
                    <span className="text-green-600 dark:text-green-400">✓</span>
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Version</label>
              <div className="flex items-center gap-2">
                <input 
                  value={parsedUuid.version} 
                  readOnly 
                  className="flex-1 p-2 font-mono text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800"
                />
                <button
                  onClick={() => copyToClipboard(parsedUuid.version, 'version')}
                  disabled={!parsedUuid.isValid}
                  className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 disabled:opacity-50"
                >
                  {copied === 'version' ? (
                    <span className="text-green-600 dark:text-green-400">✓</span>
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Variant</label>
              <div className="flex items-center gap-2">
                <input 
                  value={parsedUuid.variant} 
                  readOnly 
                  className="flex-1 p-2 font-mono text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800"
                />
                <button
                  onClick={() => copyToClipboard(parsedUuid.variant, 'variant')}
                  disabled={!parsedUuid.isValid}
                  className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 disabled:opacity-50"
                >
                  {copied === 'variant' ? (
                    <span className="text-green-600 dark:text-green-400">✓</span>
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {!parsedUuid.isValid && parsedUuid.errorMessage && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-md text-sm">
                {parsedUuid.errorMessage}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Resize Handle */}
      <div
        className="w-1 bg-gray-200 dark:bg-gray-700 hover:bg-blue-500 dark:hover:bg-blue-500 cursor-col-resize transition-colors relative group"
        onMouseDown={handleMouseDown}
        title="Drag to resize panels"
      >
        <div className="absolute inset-y-0 -inset-x-1 group-hover:bg-blue-500/20 transition-colors" />
      </div>

      {/* Right Panel - Generator */}
      <div 
        className="space-y-4 overflow-hidden" 
        style={{ width: `${100 - leftPanelWidth}%`, paddingLeft: '12px' }}
      >
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Generate new IDs</h3>
          
          <div className="flex items-center gap-3 flex-wrap">
            <select 
              value={uuidVersion} 
              onChange={(e) => setUuidVersion(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="v1">UUID v1</option>
              <option value="v3">UUID v3</option>
              <option value="v4">UUID v4</option>
              <option value="v5">UUID v5</option>
              <option value="v7">UUID v7</option>
            </select>

            <span className="text-sm text-gray-500 dark:text-gray-400">×</span>
            
            <input
              type="number"
              value={generateCount}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setGenerateCount(Math.max(1, Math.min(1000, parseInt(e.target.value) || 1)))}
              className="w-20 px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="1"
              max="1000"
            />

            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
              <input
                type="checkbox"
                checked={isLowercase}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setIsLowercase(e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              />
              lowercase
            </label>
          </div>

          <div className="flex gap-2">
            <button 
              onClick={handleGenerate} 
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              <Wand2 className="w-4 h-4" />
              Generate
            </button>
            <button 
              onClick={copyAllGenerated} 
              disabled={generatedUuids.length === 0}
              className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {copied === 'all' ? (
                <span className="text-green-600 dark:text-green-400">✓</span>
              ) : (
                <Copy className="w-4 h-4" />
              )}
              Copy
            </button>
            <button 
              onClick={clearGenerated} 
              disabled={generatedUuids.length === 0}
              className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Clear
            </button>
          </div>
        </div>

        <div className="flex-1 border border-gray-200 dark:border-gray-700 rounded-lg p-3 overflow-auto bg-white dark:bg-gray-800 min-h-[300px]">
          {generatedUuids.length > 0 ? (
            <div className="space-y-1">
              {generatedUuids.map((uuid, index) => (
                <div
                  key={index}
                  className="font-mono text-sm hover:bg-gray-100 dark:hover:bg-gray-700 px-2 py-1 rounded cursor-pointer transition-colors"
                  onClick={() => copyToClipboard(uuid)}
                  title="Click to copy"
                >
                  {uuid}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 dark:text-gray-400 py-12">
              Click "Generate" to create UUIDs
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UuidGenerator;
