import React, { useState, useRef } from "react";
import { Search, Binary, FileText, Hash, List, Shield, Braces, Fingerprint, KeySquare, Sun, Moon, Monitor } from "lucide-react";
import { NumberBaseConverter } from "./components/NumberBaseConverter";
import { Base64EncoderDecoder } from "./components/Base64EncoderDecoder";
import { Base58EncoderDecoder } from "./components/Base58EncoderDecoder";
import { MultiLineToJsonArray } from "./components/MultiLineToJsonArray";
import { HashGenerator } from "./components/HashGenerator";
import { JsonFormatter } from "./components/JsonFormatter";
import UuidGenerator from "./components/UuidGenerator";
import JwtTool from "./components/JwtTool";
import { ThemeProvider, useTheme } from "./contexts/ThemeContext";
import { Button } from "./components/ui";

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
  {
    id: "json-formatter",
    name: "JSON Formatter & Validator",
    description: "Format, validate, and beautify JSON with custom options",
    icon: Braces,
    component: JsonFormatter,
  },
  {
    id: "uuid-generator",
    name: "UUID Generator",
    description: "Generate and validate UUIDs with multiple versions and formats",
    icon: Fingerprint,
    component: UuidGenerator,
  },
  {
    id: "jwt-tool",
    name: "JWT Token Tool",
    description: "Decode, encode, and verify JSON Web Tokens with multiple algorithms",
    icon: KeySquare,
    component: JwtTool,
  },
];

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  
  const getThemeIcon = () => {
    switch (theme) {
      case 'light': return Sun;
      case 'dark': return Moon;
      case 'system': return Monitor;
      default: return Monitor;
    }
  };
  
  const cycleTheme = () => {
    const themes: Array<'light' | 'dark' | 'system'> = ['light', 'dark', 'system'];
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  };
  
  const Icon = getThemeIcon();
  
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={cycleTheme}
      className="h-8 w-8"
      title={`Current theme: ${theme}`}
    >
      <Icon className="h-4 w-4" />
    </Button>
  );
}

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
        {/* Header with Logo and Theme Toggle */}
        <div className="p-3 border-b border-primary">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-lg font-bold text-primary">DevWorkbench</h1>
            <ThemeToggle />
          </div>
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
        <div className="flex-1 overflow-y-auto px-3 py-2">
          {filteredTools.map((tool) => {
            const IconComponent = tool.icon;
            const isSelected = selectedTool.id === tool.id;
            return (
              <button
                key={tool.id}
                onClick={() => setSelectedTool(tool)}
                className={`w-full p-3 text-left transition-all duration-200 rounded-lg mb-2 group ${
                  isSelected 
                    ? "bg-blue-600 text-white shadow-md" 
                    : "hover:bg-tertiary hover:shadow-sm"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                    isSelected 
                      ? "bg-blue-700" 
                      : "bg-blue-500 group-hover:bg-blue-600"
                  }`}>
                    <IconComponent className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`font-medium truncate transition-colors ${
                      isSelected ? "text-white" : "text-primary"
                    }`}>{tool.name}</div>
                    <div className={`text-xs truncate mt-1 transition-colors ${
                      isSelected ? "text-blue-100" : "text-secondary"
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
        <div className="bg-secondary border-b border-primary px-6 py-5">
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0 w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
              <selectedTool.icon className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-primary truncate">{selectedTool.name}</h1>
              <p className="text-sm text-secondary mt-1">{selectedTool.description}</p>
            </div>
          </div>
        </div>

        {/* Tool Content */}
        <div className="flex-1 p-6 overflow-auto bg-primary">
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
