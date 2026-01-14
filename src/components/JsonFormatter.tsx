import { useState, useEffect, useRef, useCallback, useDeferredValue } from "react";
import { Copy, Settings, Check, X, Search, ChevronUp, ChevronDown } from "lucide-react";
import { JsonViewer } from './JsonViewer';

interface SearchResult {
  path: string;
  pathParts: string[];
  matchType: "key" | "value" | "both";
  matchedKey?: string;
  matchedValue?: string;
}

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

  // Search state
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [currentResultIndex, setCurrentResultIndex] = useState(0);
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const jsonViewerContainerRef = useRef<HTMLDivElement>(null);

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

  // Search JSON recursively
  const searchJson = useCallback((data: unknown, query: string, currentPath: string[] = []): SearchResult[] => {
    const results: SearchResult[] = [];
    const lowerQuery = query.toLowerCase();

    if (data === null || data === undefined) {
      if ("null".includes(lowerQuery)) {
        results.push({
          path: currentPath.join(".") || "(root)",
          pathParts: [...currentPath],
          matchType: "value",
          matchedValue: "null"
        });
      }
      return results;
    }

    if (Array.isArray(data)) {
      data.forEach((item, index) => {
        const newPath = [...currentPath, `[${index}]`];
        results.push(...searchJson(item, query, newPath));
      });
    } else if (typeof data === "object") {
      Object.entries(data as Record<string, unknown>).forEach(([key, value]) => {
        const newPath = [...currentPath, key];
        const pathStr = newPath.map((p, i) => p.startsWith("[") ? p : (i === 0 ? p : "." + p)).join("");

        const keyMatches = key.toLowerCase().includes(lowerQuery);
        let valueMatches = false;
        let valueStr = "";

        if (typeof value === "string") {
          valueStr = value;
          valueMatches = value.toLowerCase().includes(lowerQuery);
        } else if (typeof value === "number" || typeof value === "boolean") {
          valueStr = String(value);
          valueMatches = valueStr.toLowerCase().includes(lowerQuery);
        } else if (value === null) {
          valueStr = "null";
          valueMatches = "null".includes(lowerQuery);
        }

        if (keyMatches || valueMatches) {
          results.push({
            path: pathStr,
            pathParts: newPath,
            matchType: keyMatches && valueMatches ? "both" : keyMatches ? "key" : "value",
            matchedKey: keyMatches ? key : undefined,
            matchedValue: valueMatches ? valueStr : undefined
          });
        }

        if (typeof value === "object" && value !== null) {
          results.push(...searchJson(value, query, newPath));
        }
      });
    } else {
      const valueStr = String(data);
      if (valueStr.toLowerCase().includes(lowerQuery)) {
        results.push({
          path: currentPath.map((p, i) => p.startsWith("[") ? p : (i === 0 ? p : "." + p)).join("") || "(root)",
          pathParts: currentPath,
          matchType: "value",
          matchedValue: valueStr
        });
      }
    }

    return results;
  }, []);

  // Search effect
  useEffect(() => {
    if (!deferredSearchQuery.trim() || !parsedData) {
      setSearchResults([]);
      setCurrentResultIndex(0);
      setExpandedPaths(new Set());
      return;
    }

    const results = searchJson(parsedData, deferredSearchQuery.trim());
    setSearchResults(results);
    setCurrentResultIndex(0);

    // Calculate paths to expand (all parent paths of results)
    const paths = new Set<string>();
    results.forEach(r => {
      let acc = "";
      r.pathParts.forEach((part, i) => {
        if (i === 0) {
          acc = part;
        } else {
          acc = part.startsWith("[") ? acc + part : acc + "." + part;
        }
        paths.add(acc);
      });
    });
    setExpandedPaths(paths);
  }, [deferredSearchQuery, parsedData, searchJson]);

  // Navigate to search result
  const navigateToResult = useCallback((index: number) => {
    if (searchResults.length === 0) return;
    const safeIndex = ((index % searchResults.length) + searchResults.length) % searchResults.length;
    setCurrentResultIndex(safeIndex);

    // Scroll to result within the JSON viewer container
    setTimeout(() => {
      const path = searchResults[safeIndex].path;
      const element = document.querySelector(`[data-json-path="${CSS.escape(path)}"]`) as HTMLElement | null;
      const container = jsonViewerContainerRef.current;

      if (element && container) {
        const elementRect = element.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();

        // Scroll to show the element near the top of visible area (with 20px padding)
        const scrollTop = container.scrollTop + elementRect.top - containerRect.top - 20;
        container.scrollTo({ top: Math.max(0, scrollTop), behavior: "smooth" });
      }
    }, 50);
  }, [searchResults]);

  // Auto-scroll to first result when search results change
  useEffect(() => {
    if (searchResults.length > 0 && currentResultIndex === 0) {
      // Delay to allow DOM to update with expanded paths
      setTimeout(() => {
        const path = searchResults[0].path;
        const element = document.querySelector(`[data-json-path="${CSS.escape(path)}"]`) as HTMLElement | null;
        const container = jsonViewerContainerRef.current;

        if (element && container) {
          const elementRect = element.getBoundingClientRect();
          const containerRect = container.getBoundingClientRect();
          const scrollTop = container.scrollTop + elementRect.top - containerRect.top - 20;
          container.scrollTo({ top: Math.max(0, scrollTop), behavior: "smooth" });
        }
      }, 100);
    }
  }, [searchResults]);

  // Keyboard shortcuts for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+F or Cmd+F to open search
      if ((e.ctrlKey || e.metaKey) && e.key === "f") {
        e.preventDefault();
        setShowSearch(true);
        setShowSettings(false);
        // Focus will be handled by the separate useEffect
        return;
      }

      if (!showSearch) return;

      if (e.key === "Enter" && !e.metaKey && !e.ctrlKey && searchResults.length > 0) {
        e.preventDefault();
        navigateToResult(e.shiftKey ? currentResultIndex - 1 : currentResultIndex + 1);
      }

      if (e.key === "F3" && searchResults.length > 0) {
        e.preventDefault();
        navigateToResult(e.shiftKey ? currentResultIndex - 1 : currentResultIndex + 1);
      }

      if (e.key === "Escape") {
        setShowSearch(false);
        setSearchQuery("");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showSearch, searchResults, currentResultIndex, navigateToResult]);

  // Focus search input when opening
  useEffect(() => {
    if (showSearch && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [showSearch]);

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
    <div className="w-full h-full flex flex-col overflow-hidden">
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
            onClick={() => {
              setShowSearch(!showSearch);
              if (!showSearch) setShowSettings(false);
            }}
            className={`px-3 py-1.5 text-sm rounded transition-colors flex items-center gap-2 ${
              showSearch
                ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
                : "bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}
          >
            <Search className="w-4 h-4" />
            Search
          </button>
          <button
            onClick={() => {
              setShowSettings(!showSettings);
              if (!showSettings) setShowSearch(false);
            }}
            className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center gap-2"
          >
            <Settings className="w-4 h-4" />
            Settings
          </button>
        </div>
      </div>

      {showSearch && (
        <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search
                className="absolute top-1/2 transform -translate-y-1/2 w-4 h-4 pointer-events-none"
                style={{ color: "var(--color-secondary-text)", left: "12px" }}
              />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search keys and values..."
                className="w-full rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{
                  backgroundColor: "var(--color-tertiary-bg)",
                  border: "1px solid var(--color-primary-border)",
                  color: "var(--color-primary-text)",
                  paddingLeft: "40px",
                  paddingRight: "16px",
                  paddingTop: "10px",
                  paddingBottom: "10px",
                }}
              />
            </div>
            {searchResults.length > 0 && (
              <>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => navigateToResult(currentResultIndex - 1)}
                    className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    title="Previous match (Shift+Enter)"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => navigateToResult(currentResultIndex + 1)}
                    className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    title="Next match (Enter)"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>
                <span className="text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                  {currentResultIndex + 1} / {searchResults.length} matches
                </span>
              </>
            )}
            {searchQuery && searchResults.length === 0 && parsedData && (
              <span className="text-sm text-gray-500 dark:text-gray-400">No matches found</span>
            )}
          </div>
          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            Press Enter for next, Shift+Enter for previous, Esc to close
          </div>
        </div>
      )}

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
          <div className="flex-1 min-h-0 relative">
            <div ref={jsonViewerContainerRef} className="border rounded overflow-auto border-primary bg-secondary" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
              {parsedData !== null ? (
                <JsonViewer
                  data={parsedData}
                  searchQuery={deferredSearchQuery}
                  highlightPaths={new Set(searchResults.map(r => r.path))}
                  currentHighlightPath={searchResults[currentResultIndex]?.path}
                  expandedPaths={expandedPaths}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-sm text-tertiary">
                  Formatted JSON will appear here...
                </div>
              )}
            </div>
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
