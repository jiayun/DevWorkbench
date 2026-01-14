import React, { useState, useCallback, useEffect } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface JsonViewerProps {
  data: any;
  rootKey?: string;
  searchQuery?: string;
  highlightPaths?: Set<string>;
  currentHighlightPath?: string;
  expandedPaths?: Set<string>;
}

interface JsonNodeProps {
  data: any;
  keyName?: string;
  isLast?: boolean;
  depth?: number;
  path?: string;
  searchQuery?: string;
  highlightPaths?: Set<string>;
  currentHighlightPath?: string;
  expandedPaths?: Set<string>;
}

const JsonNode: React.FC<JsonNodeProps> = ({
  data,
  keyName,
  depth = 0,
  path = "",
  searchQuery = "",
  highlightPaths,
  currentHighlightPath,
  expandedPaths
}) => {
  const { actualTheme } = useTheme();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Check if this path or any child path needs to be expanded
  const shouldForceExpand = expandedPaths && (
    expandedPaths.has(path) ||
    [...expandedPaths].some(p => p.startsWith(path + ".") || p.startsWith(path + "["))
  );

  // Auto-expand when search results require it
  useEffect(() => {
    if (shouldForceExpand && isCollapsed) {
      setIsCollapsed(false);
    }
  }, [shouldForceExpand, isCollapsed]);

  const isHighlighted = highlightPaths?.has(path);
  const isCurrentHighlight = currentHighlightPath === path;

  // Highlight matching text
  const highlightText = (text: string, color: string): React.ReactNode => {
    if (!searchQuery) return <span style={{ color }}>{text}</span>;

    const lowerText = text.toLowerCase();
    const lowerQuery = searchQuery.toLowerCase();
    const index = lowerText.indexOf(lowerQuery);

    if (index === -1) return <span style={{ color }}>{text}</span>;

    return (
      <span style={{ color }}>
        {text.substring(0, index)}
        <mark className="bg-yellow-300 dark:bg-yellow-600 px-0.5 rounded text-inherit">
          {text.substring(index, index + searchQuery.length)}
        </mark>
        {text.substring(index + searchQuery.length)}
      </span>
    );
  };

  const getValueColor = (value: any) => {
    if (actualTheme === 'dark') {
      if (value === null) return '#ff6b6b';
      if (typeof value === 'string') return '#a3e635';
      if (typeof value === 'number') return '#60a5fa';
      if (typeof value === 'boolean') return '#f59e0b';
      return '#e5e7eb';
    } else {
      if (value === null) return '#dc2626';
      if (typeof value === 'string') return '#16a34a';
      if (typeof value === 'number') return '#2563eb';
      if (typeof value === 'boolean') return '#d97706';
      return '#374151';
    }
  };

  const getKeyColor = () => {
    return actualTheme === 'dark' ? '#60a5fa' : '#2563eb';
  };

  const getPunctuationColor = () => {
    return actualTheme === 'dark' ? '#e5e7eb' : '#374151';
  };

  const getCommentColor = () => {
    return actualTheme === 'dark' ? '#9ca3af' : '#6b7280';
  };

  const renderPrimitiveValue = (value: any) => {
    if (value === null) {
      return highlightText("null", getValueColor(value));
    }
    if (typeof value === 'string') {
      return (
        <span style={{ color: getValueColor(value) }}>
          "{highlightText(value, getValueColor(value))}"
        </span>
      );
    }
    if (typeof value === 'number' || typeof value === 'boolean') {
      return highlightText(String(value), getValueColor(value));
    }
    return <span>{String(value)}</span>;
  };

  // Render key name with potential highlighting
  const renderKeyName = (key: string) => {
    return (
      <>
        <span style={{ color: getKeyColor() }}>"{highlightText(key, getKeyColor())}"</span>
        <span style={{ color: getPunctuationColor() }}>: </span>
      </>
    );
  };

  // Wrapper with highlight background for current result
  const wrapWithHighlight = (content: React.ReactNode) => {
    if (!isHighlighted) return content;

    const bgClass = isCurrentHighlight
      ? "bg-blue-100 dark:bg-blue-900 -mx-1 px-1 rounded"
      : "";

    return (
      <span className={bgClass} data-json-path={path}>
        {content}
      </span>
    );
  };

  const getCollectionInfo = (data: any) => {
    if (Array.isArray(data)) {
      return { type: 'array', count: data.length, preview: `[${data.length}]` };
    } else if (data && typeof data === 'object') {
      const keys = Object.keys(data);
      return { type: 'object', count: keys.length, preview: `{${keys.length}}` };
    }
    return null;
  };

  const toggleCollapse = useCallback(() => {
    setIsCollapsed(!isCollapsed);
  }, [isCollapsed]);

  if (Array.isArray(data)) {
    const info = getCollectionInfo(data);
    const highlightProps = isHighlighted ? { 'data-json-path': path } : {};
    const bgClass = isCurrentHighlight ? "bg-blue-100 dark:bg-blue-900 -mx-1 px-1 rounded" : "";

    if (isCollapsed) {
      return (
        <span className={`inline-flex items-center ${bgClass}`} {...highlightProps}>
          <button
            onClick={toggleCollapse}
            className="flex items-center justify-center w-4 h-4 mr-2 opacity-60 hover:opacity-100 transition-opacity cursor-pointer"
            style={{ background: 'none', border: 'none', padding: 0 }}
          >
            <ChevronRight className="w-3 h-3" style={{ color: actualTheme === 'dark' ? '#9ca3af' : '#6b7280' }} />
          </button>
          {keyName && renderKeyName(keyName)}
          <span style={{ color: getPunctuationColor() }}>[</span>
          <span style={{ color: getCommentColor() }} className="ml-1">
            {info?.count} items
          </span>
          <span style={{ color: getPunctuationColor() }}>]</span>
        </span>
      );
    }

    return (
      <div {...highlightProps} className={bgClass}>
        <div className="flex items-center">
          <button
            onClick={toggleCollapse}
            className="flex items-center justify-center w-4 h-4 mr-2 opacity-60 hover:opacity-100 transition-opacity cursor-pointer"
            style={{ background: 'none', border: 'none', padding: 0 }}
          >
            <ChevronDown className="w-3 h-3" style={{ color: actualTheme === 'dark' ? '#9ca3af' : '#6b7280' }} />
          </button>
          {keyName && renderKeyName(keyName)}
          <span style={{ color: getPunctuationColor() }}>[</span>
          {data.length === 0 && (
            <span style={{ color: getPunctuationColor() }}>]</span>
          )}
        </div>
        {data.length > 0 && (
          <>
            {data.map((item, index) => {
              const childPath = path ? `${path}[${index}]` : `[${index}]`;
              return (
                <div key={index} style={{ marginLeft: '1rem' }}>
                  <JsonNode
                    data={item}
                    isLast={true}
                    depth={depth + 1}
                    path={childPath}
                    searchQuery={searchQuery}
                    highlightPaths={highlightPaths}
                    currentHighlightPath={currentHighlightPath}
                    expandedPaths={expandedPaths}
                  />
                  {index < data.length - 1 && (
                    <span style={{ color: getPunctuationColor() }}>,</span>
                  )}
                </div>
              );
            })}
            <div>
              <span style={{ color: getPunctuationColor() }}>]</span>
            </div>
          </>
        )}
      </div>
    );
  }

  if (data && typeof data === 'object') {
    const keys = Object.keys(data);
    const info = getCollectionInfo(data);
    const highlightProps = isHighlighted ? { 'data-json-path': path } : {};
    const bgClass = isCurrentHighlight ? "bg-blue-100 dark:bg-blue-900 -mx-1 px-1 rounded" : "";

    if (isCollapsed) {
      return (
        <span className={`inline-flex items-center ${bgClass}`} {...highlightProps}>
          <button
            onClick={toggleCollapse}
            className="flex items-center justify-center w-4 h-4 mr-2 opacity-60 hover:opacity-100 transition-opacity cursor-pointer"
            style={{ background: 'none', border: 'none', padding: 0 }}
          >
            <ChevronRight className="w-3 h-3" style={{ color: actualTheme === 'dark' ? '#9ca3af' : '#6b7280' }} />
          </button>
          {keyName && renderKeyName(keyName)}
          <span style={{ color: getPunctuationColor() }}>{"{"}</span>
          <span style={{ color: getCommentColor() }} className="ml-1">
            {info?.count} keys
          </span>
          <span style={{ color: getPunctuationColor() }}>{"}"}</span>
        </span>
      );
    }

    return (
      <div {...highlightProps} className={bgClass}>
        <div className="flex items-center">
          <button
            onClick={toggleCollapse}
            className="flex items-center justify-center w-4 h-4 mr-2 opacity-60 hover:opacity-100 transition-opacity cursor-pointer"
            style={{ background: 'none', border: 'none', padding: 0 }}
          >
            <ChevronDown className="w-3 h-3" style={{ color: actualTheme === 'dark' ? '#9ca3af' : '#6b7280' }} />
          </button>
          {keyName && renderKeyName(keyName)}
          <span style={{ color: getPunctuationColor() }}>{"{"}</span>
          {keys.length === 0 && (
            <span style={{ color: getPunctuationColor() }}>{"}"}</span>
          )}
        </div>
        {keys.length > 0 && (
          <>
            {keys.map((key, index) => {
              const childPath = path ? `${path}.${key}` : key;
              return (
                <div key={key} style={{ marginLeft: '1rem' }}>
                  <JsonNode
                    data={data[key]}
                    keyName={key}
                    isLast={true}
                    depth={depth + 1}
                    path={childPath}
                    searchQuery={searchQuery}
                    highlightPaths={highlightPaths}
                    currentHighlightPath={currentHighlightPath}
                    expandedPaths={expandedPaths}
                  />
                  {index < keys.length - 1 && (
                    <span style={{ color: getPunctuationColor() }}>,</span>
                  )}
                </div>
              );
            })}
            <div>
              <span style={{ color: getPunctuationColor() }}>{"}"}</span>
            </div>
          </>
        )}
      </div>
    );
  }

  // Primitive values
  return wrapWithHighlight(
    <span className="inline">
      {keyName && renderKeyName(keyName)}
      {renderPrimitiveValue(data)}
    </span>
  );
};

export const JsonViewer: React.FC<JsonViewerProps> = ({
  data,
  rootKey,
  searchQuery,
  highlightPaths,
  currentHighlightPath,
  expandedPaths
}) => {
  return (
    <div className="font-mono text-sm p-3">
      <JsonNode
        data={data}
        keyName={rootKey}
        path=""
        searchQuery={searchQuery}
        highlightPaths={highlightPaths}
        currentHighlightPath={currentHighlightPath}
        expandedPaths={expandedPaths}
      />
    </div>
  );
};
