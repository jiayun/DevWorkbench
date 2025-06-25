import { useState } from "react";
import { Search, Binary } from "lucide-react";
import { NumberBaseConverter } from "./components/NumberBaseConverter";

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

function App() {
  const [selectedTool, setSelectedTool] = useState<Tool>(tools[0]);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTools = tools.filter(tool =>
    tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tool.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const SelectedComponent = selectedTool.component;

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      {/* Sidebar */}
      <div className="w-80 bg-gray-800 border-r border-gray-700 flex flex-col">
        {/* Search */}
        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search tools..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Tool List */}
        <div className="flex-1 overflow-y-auto">
          {filteredTools.map((tool) => {
            const IconComponent = tool.icon;
            return (
              <button
                key={tool.id}
                onClick={() => setSelectedTool(tool)}
                className={`w-full p-4 text-left hover:bg-gray-700 border-b border-gray-700 transition-colors ${
                  selectedTool.id === tool.id ? "bg-blue-600" : ""
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-500 rounded flex items-center justify-center">
                    <IconComponent className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-white truncate">{tool.name}</div>
                    <div className="text-sm text-gray-400 truncate">{tool.description}</div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700">
          <div className="text-xs text-gray-400">DevUtils.com 1.17.0 (1443)</div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
          <h1 className="text-xl font-semibold text-white">{selectedTool.name}</h1>
          <p className="text-sm text-gray-400 mt-1">{selectedTool.description}</p>
        </div>

        {/* Tool Content */}
        <div className="flex-1 p-6">
          <SelectedComponent />
        </div>
      </div>
    </div>
  );
}

export default App;
