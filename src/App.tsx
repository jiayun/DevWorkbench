import React, { useState, useRef } from "react";
import { Search, Binary } from "lucide-react";
import { NumberBaseConverter } from "./components/NumberBaseConverter";
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
    description: "Convert between binary, octal, decimal, hex",
    icon: Binary,
    component: NumberBaseConverter,
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

  const [sidebarWidth, setSidebarWidth] = useState(320);
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsResizing(true);
    e.preventDefault();
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizing) return;
    
    const newWidth = e.clientX;
    if (newWidth >= 240 && newWidth <= 600) {
      setSidebarWidth(newWidth);
    }
  };

  const handleMouseUp = () => {
    setIsResizing(false);
  };

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
  }, [isResizing]);

  return (
    <div className="flex h-screen bg-primary text-primary">
      {/* Sidebar */}
      <div 
        ref={sidebarRef}
        className="bg-secondary border-r border-primary flex flex-col relative"
        style={{ width: sidebarWidth }}
      >
        {/* Search */}
        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-tertiary w-4 h-4 z-10" />
            <input
              type="text"
              placeholder="Search tools..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-tertiary border border-primary rounded-lg text-primary placeholder-tertiary focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>
        </div>

        {/* Tool List */}
        <div className="flex-1 overflow-y-auto px-2">
          {filteredTools.map((tool) => {
            const IconComponent = tool.icon;
            return (
              <button
                key={tool.id}
                onClick={() => setSelectedTool(tool)}
                className={`w-full p-4 text-left hover:bg-tertiary border-b border-primary transition-colors rounded-lg mb-1 ${
                  selectedTool.id === tool.id ? "bg-blue-600 text-white" : ""
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                    <IconComponent className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
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

        {/* Resize Handle */}
        <div
          className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-blue-500 transition-colors group bg-gray-600"
          onMouseDown={handleMouseDown}
          title="Drag to resize sidebar"
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="bg-secondary border-b border-primary px-8 py-6">
          <h1 className="text-xl font-semibold text-primary">{selectedTool.name}</h1>
          <p className="text-sm text-secondary mt-1">{selectedTool.description}</p>
        </div>

        {/* Tool Content */}
        <div className="flex-1 p-8 overflow-auto">
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
