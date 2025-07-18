import { useState, useEffect, useRef, useCallback } from "react";
import { Copy, Settings, Check, X } from "lucide-react";
import { JsonViewer } from './JsonViewer';

export function JsonFormatter() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [parsedData, setParsedData] = useState<any>(null);
  const [error, setError] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState({
    indentSize: 2,
    useTabs: false,
    sortKeys: false,
    quoteStyle: "double" as "double" | "single"
  });

  // Resizable panels state
  const [leftPanelWidth, setLeftPanelWidth] = useState(50); // percentage
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Format/Validate JSON logic
  useEffect(() => {
    if (!input.trim()) {
      setOutput("");
      setParsedData(null);
      setError("");
      return;
    }

    try {
      // Parse JSON
      const parsed = JSON.parse(input);
      setError("");

      // Sort keys if enabled
      let finalObject = parsed;
      if (settings.sortKeys && typeof parsed === "object" && !Array.isArray(parsed)) {
        finalObject = sortObjectKeys(parsed);
      }

      // Store parsed data for JsonViewer
      setParsedData(finalObject);

      // Format with custom settings for text output
      const indentChar = settings.useTabs ? "\t" : " ".repeat(settings.indentSize);
      const formatted = JSON.stringify(finalObject, null, indentChar);

      // Apply quote style if single quotes requested
      const finalOutput = settings.quoteStyle === "single" 
        ? formatted.replace(/"([^"]+)":/g, "'$1':").replace(/: "([^"]*)"/g, ": '$1'")
        : formatted;

      setOutput(finalOutput);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Invalid JSON");
      setOutput("");
      setParsedData(null);
    }
  }, [input, settings]);

  const sortObjectKeys = (obj: any): any => {
    if (Array.isArray(obj)) {
      return obj.map(sortObjectKeys);
    } else if (obj !== null && typeof obj === "object") {
      return Object.keys(obj).sort().reduce((result, key) => {
        result[key] = sortObjectKeys(obj[key]);
        return result;
      }, {} as any);
    }
    return obj;
  };

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
  };

  const handleMinify = () => {
    if (!input.trim()) return;
    
    try {
      const parsed = JSON.parse(input);
      setInput(JSON.stringify(parsed));
      setError("");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Invalid JSON");
    }
  };

  const handleSampleData = () => {
    const sample = {
      "name": "DevWorkbench",
      "version": "1.0.0",
      "description": "Developer utilities application",
      "features": [
        "JSON Formatter",
        "Base64 Encoder",
        "Hash Generator"
      ],
      "settings": {
        "theme": "dark",
        "autoSave": true,
        "indentSize": 2
      }
    };
    setInput(JSON.stringify(sample, null, 2));
  };

  // Resizable panels handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsResizing(true);
    e.preventDefault();
    e.stopPropagation();
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing || !containerRef.current) return;
    
    const containerRect = containerRef.current.getBoundingClientRect();
    const containerWidth = containerRect.width;
    const offsetX = e.clientX - containerRect.left;
    const newWidthPercent = (offsetX / containerWidth) * 100;
    
    if (newWidthPercent >= 20 && newWidthPercent <= 80) {
      setLeftPanelWidth(newWidthPercent);
    }
  }, [isResizing]);

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  useEffect(() => {
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
    <div className="w-full h-full flex flex-col">
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div className="flex items-center gap-4">
          {error && (
            <div className="flex items-center gap-2 text-red-500">
              <X className="w-4 h-4" />
              <span className="text-sm">{error}</span>
            </div>
          )}
          {!error && output && (
            <div className="flex items-center gap-2 text-green-500">
              <Check className="w-4 h-4" />
              <span className="text-sm">Valid JSON</span>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center gap-2"
          >
            <Settings className="w-4 h-4" />
            Settings
          </button>
        </div>
      </div>

      {showSettings && (
        <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg flex-shrink-0">
          <h3 className="font-medium mb-3">Formatting Options</h3>
          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Indent Size</label>
              <input
                type="number"
                min="0"
                max="8"
                value={settings.indentSize}
                onChange={(e) => setSettings({...settings, indentSize: parseInt(e.target.value) || 0})}
                className="w-full px-3 py-1.5 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-tertiary text-primary border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Indent Type</label>
              <select
                value={settings.useTabs ? "tabs" : "spaces"}
                onChange={(e) => setSettings({...settings, useTabs: e.target.value === "tabs"})}
                className="w-full px-3 py-1.5 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-tertiary text-primary border-primary"
              >
                <option value="spaces">Spaces</option>
                <option value="tabs">Tabs</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Quote Style</label>
              <select
                value={settings.quoteStyle}
                onChange={(e) => setSettings({...settings, quoteStyle: e.target.value as "double" | "single"})}
                className="w-full px-3 py-1.5 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-tertiary text-primary border-primary"
              >
                <option value="double">Double Quotes</option>
                <option value="single">Single Quotes</option>
              </select>
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.sortKeys}
                  onChange={(e) => setSettings({...settings, sortKeys: e.target.checked})}
                  className="rounded focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm font-medium">Sort Keys</span>
              </label>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 flex min-h-0" ref={containerRef}>
        {/* Left Panel - Input */}
        <div className="flex flex-col min-h-0" style={{ width: `${leftPanelWidth}%` }}>
          <div className="flex items-center justify-between mb-2 flex-shrink-0 min-h-[32px]">
            <label className="block text-sm font-medium">Input</label>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={handleSampleData}
                className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
              >
                Sample Data
              </button>
              <button
                onClick={handleMinify}
                className="px-2 py-1 text-xs bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded hover:bg-purple-200 dark:hover:bg-purple-800 transition-colors"
              >
                Minify
              </button>
              <button
                onClick={() => setInput("")}
                className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Clear
              </button>
            </div>
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Paste your JSON here..."
            className={`flex-1 w-full px-3 py-2 font-mono text-sm border rounded focus:outline-none focus:ring-2 resize-none bg-tertiary text-primary border-primary ${
              error ? "border-red-500 focus:ring-red-500" : "focus:ring-blue-500"
            }`}
          />
        </div>

        {/* Resize Handle */}
        <div
          className="w-2 bg-gray-300 dark:bg-gray-600 cursor-col-resize hover:bg-blue-500 dark:hover:bg-blue-400 transition-colors flex-shrink-0 mx-1 rounded-sm"
          onMouseDown={handleMouseDown}
          title="Drag to resize panels"
          style={{ minWidth: '8px' }}
        />

        {/* Right Panel - Output */}
        <div className="flex flex-col min-h-0" style={{ width: `${100 - leftPanelWidth}%` }}>
          <div className="flex items-center justify-between mb-2 flex-shrink-0 min-h-[32px]">
            <label className="block text-sm font-medium">Formatted Output</label>
            <button
              onClick={() => handleCopy(output)}
              disabled={!output}
              className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Copy className="w-3 h-3" />
              Copy
            </button>
          </div>
          <div className="flex-1 w-full border rounded relative overflow-hidden border-primary bg-secondary">
            {parsedData !== null ? (
              <JsonViewer data={parsedData} />
            ) : (
              <div className="flex items-center justify-center h-full text-sm text-tertiary">
                Formatted JSON will appear here...
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 text-sm text-gray-500 dark:text-gray-400 flex-shrink-0">
        <div className="flex gap-6">
          <span>• Automatically validates and formats JSON</span>
          <span>• Supports custom indentation and quote styles</span>
          <span>• Real-time error detection and reporting</span>
        </div>
      </div>
    </div>
  );
}
