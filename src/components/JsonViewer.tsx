import React, { useState, useCallback } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface JsonViewerProps {
  data: any;
  rootKey?: string;
}

interface JsonNodeProps {
  data: any;
  keyName?: string;
  isLast?: boolean;
  depth?: number;
}

const JsonNode: React.FC<JsonNodeProps> = ({ data, keyName, depth = 0 }) => {
  const { actualTheme } = useTheme();
  const [isCollapsed, setIsCollapsed] = useState(false);

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
      return <span style={{ color: getValueColor(value) }}>null</span>;
    }
    if (typeof value === 'string') {
      return <span style={{ color: getValueColor(value) }}>"{value}"</span>;
    }
    if (typeof value === 'number' || typeof value === 'boolean') {
      return <span style={{ color: getValueColor(value) }}>{String(value)}</span>;
    }
    return <span>{String(value)}</span>;
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
    return (
      <div>
        <div className="flex items-center">
          <button
            onClick={toggleCollapse}
            className="flex items-center justify-center w-4 h-4 mr-2 opacity-60 hover:opacity-100 transition-opacity cursor-pointer"
            style={{ background: 'none', border: 'none', padding: 0 }}
          >
            {isCollapsed ? (
              <ChevronRight className="w-3 h-3" style={{ color: actualTheme === 'dark' ? '#9ca3af' : '#6b7280' }} />
            ) : (
              <ChevronDown className="w-3 h-3" style={{ color: actualTheme === 'dark' ? '#9ca3af' : '#6b7280' }} />
            )}
          </button>
          {keyName && (
            <>
              <span style={{ color: getKeyColor() }}>"{keyName}"</span>
              <span style={{ color: getPunctuationColor() }}>: </span>
            </>
          )}
          <span style={{ color: getPunctuationColor() }}>[</span>
          {isCollapsed && (
            <span style={{ color: getCommentColor() }} className="ml-1">
              {info?.count} items
            </span>
          )}
          {!isCollapsed && data.length === 0 && (
            <span style={{ color: getPunctuationColor() }}>]</span>
          )}
        </div>

        {!isCollapsed && data.length > 0 && (
          <div>
            {data.map((item, index) => (
              <div key={index} style={{ marginLeft: '1rem' }}>
                <div className="flex items-center">
                  <JsonNode
                    data={item}
                    isLast={true}
                    depth={depth + 1}
                  />
                  {index < data.length - 1 && (
                    <span style={{ color: getPunctuationColor() }}>,</span>
                  )}
                </div>
              </div>
            ))}
            <div>
              <span style={{ color: getPunctuationColor() }}>]</span>
            </div>
          </div>
        )}

        {isCollapsed && (
          <span style={{ color: getPunctuationColor() }}>]</span>
        )}

      </div>
    );
  }

  if (data && typeof data === 'object') {
    const keys = Object.keys(data);
    const info = getCollectionInfo(data);
    
    return (
      <div>
        <div className="flex items-center">
          <button
            onClick={toggleCollapse}
            className="flex items-center justify-center w-4 h-4 mr-2 opacity-60 hover:opacity-100 transition-opacity cursor-pointer"
            style={{ background: 'none', border: 'none', padding: 0 }}
          >
            {isCollapsed ? (
              <ChevronRight className="w-3 h-3" style={{ color: actualTheme === 'dark' ? '#9ca3af' : '#6b7280' }} />
            ) : (
              <ChevronDown className="w-3 h-3" style={{ color: actualTheme === 'dark' ? '#9ca3af' : '#6b7280' }} />
            )}
          </button>
          {keyName && (
            <>
              <span style={{ color: getKeyColor() }}>"{keyName}"</span>
              <span style={{ color: getPunctuationColor() }}>: </span>
            </>
          )}
          <span style={{ color: getPunctuationColor() }}>{"{"}</span>
          {isCollapsed && (
            <span style={{ color: getCommentColor() }} className="ml-1">
              {info?.count} keys
            </span>
          )}
          {!isCollapsed && keys.length === 0 && (
            <span style={{ color: getPunctuationColor() }}>{"}"}</span>
          )}
        </div>

        {!isCollapsed && keys.length > 0 && (
          <div>
            {keys.map((key, index) => (
              <div key={key} style={{ marginLeft: '1rem' }}>
                <div className="flex items-center">
                  <JsonNode
                    data={data[key]}
                    keyName={key}
                    isLast={true}
                    depth={depth + 1}
                  />
                  {index < keys.length - 1 && (
                    <span style={{ color: getPunctuationColor() }}>,</span>
                  )}
                </div>
              </div>
            ))}
            <div>
              <span style={{ color: getPunctuationColor() }}>{"}"}</span>
            </div>
          </div>
        )}

        {isCollapsed && (
          <span style={{ color: getPunctuationColor() }}>{"}"}</span>
        )}

      </div>
    );
  }

  // Primitive values
  return (
    <div className="flex items-center">
      {keyName && (
        <>
          <span style={{ color: getKeyColor() }}>"{keyName}"</span>
          <span style={{ color: getPunctuationColor() }}>: </span>
        </>
      )}
      {renderPrimitiveValue(data)}
    </div>
  );
};

export const JsonViewer: React.FC<JsonViewerProps> = ({ data, rootKey }) => {
  return (
    <div className="font-mono text-sm p-3 h-full overflow-auto">
      <JsonNode data={data} keyName={rootKey} />
    </div>
  );
};
