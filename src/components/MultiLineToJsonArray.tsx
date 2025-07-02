import { useState, useEffect } from "react";
import { Copy, Clipboard, FileText, Trash2, ArrowUp } from "lucide-react";

export function MultiLineToJsonArray() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [forceString, setForceString] = useState(false);
  const [skipEmpty, setSkipEmpty] = useState(true);

  // Data processing logic
  const processLines = (inputText: string): any[] => {
    const lines = inputText
      .split('\n')
      .map(line => line.trim()) // Remove leading/trailing whitespace
      .filter(line => skipEmpty ? line.length > 0 : true);

    if (forceString) {
      return lines;
    }

    // Smart type detection
    const hasNonNumber = lines.some(line => {
      if (line === '') return false;
      
      // Check if it's a valid number
      const num = Number(line);
      if (isNaN(num)) return true;
      
      // Check for leading zeros (should be treated as string)
      if (line.startsWith('0') && line.length > 1 && !line.includes('.')) {
        return true;
      }
      
      return false;
    });

    if (hasNonNumber) {
      return lines; // String array
    } else {
      return lines.map(line => line === '' ? '' : Number(line)); // Number array
    }
  };

  // Update output when input or settings change
  useEffect(() => {
    if (!input.trim()) {
      setOutput("");
      return;
    }

    try {
      const processedArray = processLines(input);
      const jsonString = JSON.stringify(processedArray);
      // Add space after commas for better readability
      const formattedJson = jsonString.replace(/,/g, ', ');
      setOutput(formattedJson);
    } catch (error) {
      setOutput("Error processing input");
    }
  }, [input, forceString, skipEmpty]);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const pasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setInput(text);
    } catch (err) {
      console.error('Failed to paste text: ', err);
    }
  };

  const generateSample = () => {
    setInput("apple\n  123  \n   banana   \n456\n\n  hello world  \n789");
  };

  const clearAll = () => {
    setInput("");
    setOutput("");
  };

  const useAsInput = () => {
    setInput(output);
  };

  return (
    <div className="w-full h-full">
      <div className="w-full px-4 py-6">
        {/* Settings Panel */}
        <div className="mb-6 p-4 bg-gray-700 rounded-lg">
          <div className="flex items-center space-x-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={forceString}
                onChange={(e) => setForceString(e.target.checked)}
                className="w-4 h-4 text-indigo-600 bg-gray-600 border-gray-500 rounded focus:ring-indigo-500"
              />
              <span className="text-sm text-gray-200">Force String Type - Always output string array</span>
            </label>
            
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={skipEmpty}
                onChange={(e) => setSkipEmpty(e.target.checked)}
                className="w-4 h-4 text-indigo-600 bg-gray-600 border-gray-500 rounded focus:ring-indigo-500"
              />
              <span className="text-sm text-gray-200">Skip Empty Lines - Ignore empty lines after trimming</span>
            </label>
          </div>
        </div>

        <div className="space-y-8">
          {/* Input Section */}
          <div className="bg-gray-700 p-6 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <label className="text-sm font-medium text-gray-300">
                Input: Multi-line text (each line becomes an array element)
              </label>
              <div className="flex items-center gap-2">
                <button
                  onClick={pasteFromClipboard}
                  className="px-3 py-2 text-xs bg-gray-600 hover:bg-gray-500 text-gray-200 rounded transition-colors flex items-center gap-1.5"
                >
                  <Clipboard className="w-3.5 h-3.5" />
                  Clipboard
                </button>
                <button
                  onClick={generateSample}
                  className="px-3 py-2 text-xs bg-gray-600 hover:bg-gray-500 text-gray-200 rounded transition-colors flex items-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5" />
                  Sample
                </button>
                <button
                  onClick={clearAll}
                  className="px-3 py-2 text-xs bg-gray-600 hover:bg-gray-500 text-gray-200 rounded transition-colors flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Clear
                </button>
              </div>
            </div>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter multi-line text here...&#10;Example:&#10;Apple&#10;123&#10;banana&#10;(Each line becomes an array element)"
              rows={8}
              className="w-full px-4 py-4 bg-gray-600 rounded text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm transition-colors resize-none"
            />
          </div>

          {/* Output Section */}
          <div className="bg-gray-700 p-6 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <label className="text-lg font-semibold text-gray-200">
                Output: JSON Array
              </label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => copyToClipboard(output)}
                  className="px-3 py-2 text-xs bg-indigo-600 hover:bg-indigo-700 text-white rounded transition-colors flex items-center gap-1.5"
                >
                  <Copy className="w-3.5 h-3.5" />
                  Copy
                </button>
                <button
                  onClick={useAsInput}
                  className="px-3 py-2 text-xs bg-gray-600 hover:bg-gray-500 text-gray-200 rounded transition-colors flex items-center gap-1.5"
                  disabled={!output}
                >
                  Use as Input
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <textarea
              value={output}
              readOnly
              placeholder="JSON array will appear here..."
              rows={6}
              className="w-full px-4 py-4 bg-gray-600 rounded text-gray-100 placeholder-gray-400 font-mono text-sm resize-none cursor-default"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
