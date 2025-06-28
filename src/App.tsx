import React, { useState, useRef } from "react";
import { Search, Binary, FileText, Hash, List, Shield } from "lucide-react";
import { NumberBaseConverter } from "./components/NumberBaseConverter";
import { Base64EncoderDecoder } from "./components/Base64EncoderDecoder";
import { Base58EncoderDecoder } from "./components/Base58EncoderDecoder";
import { MultiLineToJsonArray } from "./components/MultiLineToJsonArray";
import { HashGenerator } from "./components/HashGenerator";
import { ThemeProvider } from "./contexts/ThemeContext";

type Tool = {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  component: React.ComponentType;
};

const tools: Tool[] = [
  {
    id: "number-base-converter",
    name: "Number Base Converter",
    description: "Convert between binary, octal, decimal, hex, and other number bases",
    icon: Binary,
    component: NumberBaseConverter,
  },
  {
    id: "base64-encoder-decoder",
    name: "Base64 String Encode/Decode",
    description: "Encode or decode a string using Base64",
    icon: FileText,
    component: Base64EncoderDecoder,
  },
  {
    id: "base58-encoder-decoder",
    name: "Base58 String Encode/Decode",
    description: "Encode or decode a string using Base58 (Bitcoin/IPFS format)",
    icon: Hash,
    component: Base58EncoderDecoder,
  },
  {
    id: "multiline-to-json-array",
    name: "Multi-line to JSON Array",
    description: "Convert multi-line text to JSON array with auto-trim and smart type detection",
    icon: List,
    component: MultiLineToJsonArray,
  },
  {
    id: "hash-generator",
    name: "Hash Generator",
    description: "Generate MD5/SHA1/SHA2 hash from a string or file",
    icon: Shield,
    component: HashGenerator,
  },
];

function AppContent() {
  const [selectedTool, setSelectedTool] = useState<Tool>(tools[0]);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTools = tools.filter(tool =>
    tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tool.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const SelectedComponent = selectedTool.component;

  const [sidebarWidth, setSidebarWidth] = useState(280);
  const [isResizing, setIsResizing] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startWidth, setStartWidth] = useState(280);
  const sidebarRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsResizing(true);
    setStartX(e.clientX);
    setStartWidth(sidebarWidth);
    e.preventDefault();
    e.stopPropagation();
  };

  const handleMouseMove = React.useCallback((e: MouseEvent) => {
    if (!isResizing) return;
    
    const deltaX = e.clientX - startX;
    const newWidth = startWidth + deltaX;
    
    if (newWidth >= 200 && newWidth <= 800) {
      setSidebarWidth(newWidth);
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
    <div className="flex h-screen bg-primary text-primary">
      {/* Sidebar Container */}
      <div 
        className="flex"
        style={{ width: sidebarWidth }}
      >
        {/* Sidebar */}
        <div 
          ref={sidebarRef}
          className="bg-secondary border-r border-primary flex flex-col flex-1 overflow-hidden"
        >
        {/* Search */}
        <div className="p-3">
          <div className="relative">
            <Search className="absolute top-1/2 transform -translate-y-1/2 text-tertiary w-4 h-4 z-10" style={{ left: '12px' }} />
            <input
              type="text"
              placeholder="Search tools..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-3 py-2 bg-tertiary border border-primary rounded-lg text-primary placeholder-tertiary focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
              style={{ paddingLeft: '44px' }}
            />
          </div>
        </div>

        {/* Tool List */}
        <div className="flex-1 overflow-y-auto px-3">
          {filteredTools.map((tool) => {
            const IconComponent = tool.icon;
            return (
              <button
                key={tool.id}
                onClick={() => setSelectedTool(tool)}
                className={`w-full p-3 text-left hover:bg-tertiary border-b border-primary transition-colors rounded-lg mb-1 overflow-hidden ${
                  selectedTool.id === tool.id ? "bg-blue-600 text-white" : ""
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                    <IconComponent className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0 overflow-hidden">
                    <div className={`font-medium truncate ${
                      selectedTool.id === tool.id ? "text-white" : "text-primary"
                    }`}>{tool.name}</div>
                    <div className={`text-sm truncate ${
                      selectedTool.id === tool.id ? "text-blue-100" : "text-secondary"
                    }`}>{tool.description}</div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        </div>
        
        {/* Resize Handle - Invisible until hover */}
        <div
          style={{
            width: '4px',
            backgroundColor: 'transparent',
            cursor: 'col-resize',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            position: 'relative'
          }}
          onMouseDown={handleMouseDown}
          title="Drag to resize sidebar"
          onMouseEnter={(e) => {
            const indicator = e.currentTarget.querySelector('.resize-indicator') as HTMLElement;
            if (indicator) {
              indicator.style.backgroundColor = '#3b82f6';
              indicator.style.opacity = '1';
            }
          }}
          onMouseLeave={(e) => {
            const indicator = e.currentTarget.querySelector('.resize-indicator') as HTMLElement;
            if (indicator) {
              indicator.style.backgroundColor = 'transparent';
              indicator.style.opacity = '0';
            }
          }}
        >
          <div
            className="resize-indicator"
            style={{
              width: '2px',
              height: '100%',
              backgroundColor: 'transparent',
              opacity: '0',
              transition: 'all 0.2s ease'
            }}
          ></div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0" style={{ minWidth: '400px' }}>
        {/* Header */}
        <div className="bg-secondary border-b border-primary px-8 py-6">
          <h1 className="text-xl font-semibold text-primary">{selectedTool.name}</h1>
          <p className="text-sm text-secondary mt-1">{selectedTool.description}</p>
        </div>

        {/* Tool Content */}
        <div className="flex-1 p-4 overflow-auto">
          <SelectedComponent />
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;
