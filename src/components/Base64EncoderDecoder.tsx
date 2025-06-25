import { useState, useEffect, useCallback } from "react";
import { Copy, Settings } from "lucide-react";

export function Base64EncoderDecoder() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [isEncodeMode, setIsEncodeMode] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState({
    autoDetect: true,
    removeDataUri: true,
    removeNullBytes: true
  });

  // Base64 validation regex
  const isValidBase64 = useCallback((str: string): boolean => {
    if (!str || str.length === 0) return false;
    // Remove whitespace and check if it's valid Base64
    const cleanStr = str.replace(/\s/g, '');
    try {
      // Check if it's valid Base64 format
      const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
      if (!base64Regex.test(cleanStr)) return false;
      
      // Try to decode it
      atob(cleanStr);
      return true;
    } catch {
      return false;
    }
  }, []);

  // Track manual mode changes to prevent auto-switching immediately after
  const [lastManualModeChange, setLastManualModeChange] = useState<number>(0);

  // Auto-detect and switch mode (but not immediately after manual change)
  useEffect(() => {
    if (settings.autoDetect && input.trim()) {
      const now = Date.now();
      // Don't auto-switch for 1 second after manual mode change
      if (now - lastManualModeChange > 1000) {
        const isBase64Input = isValidBase64(input.trim());
        if (isBase64Input && isEncodeMode) {
          setIsEncodeMode(false);
        } else if (!isBase64Input && !isEncodeMode) {
          setIsEncodeMode(true);
        }
      }
    }
  }, [input, settings.autoDetect, isValidBase64, isEncodeMode, lastManualModeChange]);

  // Encoding/Decoding logic
  useEffect(() => {
    if (!input.trim()) {
      setOutput("");
      return;
    }

    try {
      if (isEncodeMode) {
        // Encode text to Base64
        const encoded = btoa(unescape(encodeURIComponent(input)));
        setOutput(encoded);
      } else {
        // Decode Base64 to text
        let processedInput = input.trim();
        
        // Remove data URI prefix if enabled
        if (settings.removeDataUri) {
          const dataUriMatch = processedInput.match(/^data:[^;]*;base64,(.+)$/);
          if (dataUriMatch) {
            processedInput = dataUriMatch[1];
          }
        }

        const decoded = decodeURIComponent(escape(atob(processedInput)));
        
        // Remove null bytes if enabled
        let finalOutput = decoded;
        if (settings.removeNullBytes) {
          finalOutput = decoded.replace(/\0+$/, '');
        }
        
        setOutput(finalOutput);
      }
    } catch (error) {
      setOutput("Invalid input for " + (isEncodeMode ? "encoding" : "decoding"));
    }
  }, [input, isEncodeMode, settings.removeDataUri, settings.removeNullBytes]);

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
    if (isEncodeMode) {
      setInput("Hello, World! This is a sample text for Base64 encoding.");
    } else {
      setInput("SGVsbG8sIFdvcmxkISBUaGlzIGlzIGEgc2FtcGxlIHRleHQgZm9yIEJhc2U2NCBlbmNvZGluZy4=");
    }
  };

  const clearAll = () => {
    setInput("");
    setOutput("");
  };

  const useAsInput = () => {
    setInput(output);
  };

  const restoreDefaults = () => {
    setSettings({
      autoDetect: true,
      removeDataUri: true,
      removeNullBytes: true
    });
  };

  return (
    <div className="w-full h-full">
      <div className="w-full px-4 py-6">
        {/* Header Controls */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            {/* Mode Toggle */}
            <div className="flex bg-tertiary rounded-lg p-1 border border-primary">
              <button
                onClick={() => {
                  setIsEncodeMode(true);
                  setLastManualModeChange(Date.now());
                }}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  isEncodeMode
                    ? "bg-blue-600 text-white"
                    : "text-secondary hover:text-primary"
                }`}
              >
                Encode
              </button>
              <button
                onClick={() => {
                  setIsEncodeMode(false);
                  setLastManualModeChange(Date.now());
                }}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  !isEncodeMode
                    ? "bg-blue-600 text-white"
                    : "text-secondary hover:text-primary"
                }`}
              >
                Decode
              </button>
            </div>
          </div>

          {/* Settings Button */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 text-tertiary hover:text-primary hover:bg-tertiary rounded-md transition-colors"
            title="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="mb-6 p-4 bg-tertiary rounded-lg border border-primary">
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.autoDetect}
                  onChange={(e) => setSettings(prev => ({ ...prev, autoDetect: e.target.checked }))}
                  className="w-4 h-4 text-blue-600 bg-secondary border-primary rounded focus:ring-blue-500"
                />
                <span className="text-sm text-primary">Auto detect when input is a Base64 and decodeable to UTF8</span>
              </label>
              
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.removeDataUri}
                  onChange={(e) => setSettings(prev => ({ ...prev, removeDataUri: e.target.checked }))}
                  className="w-4 h-4 text-blue-600 bg-secondary border-primary rounded focus:ring-blue-500"
                />
                <span className="text-sm text-primary">Auto remove "data:...;base64," from the input when decoding</span>
              </label>
              
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.removeNullBytes}
                  onChange={(e) => setSettings(prev => ({ ...prev, removeNullBytes: e.target.checked }))}
                  className="w-4 h-4 text-blue-600 bg-secondary border-primary rounded focus:ring-blue-500"
                />
                <span className="text-sm text-primary">Auto remove null byte ("\0") at the end of decoded string</span>
              </label>
            </div>
            
            <button
              onClick={restoreDefaults}
              className="mt-4 px-3 py-2 text-xs bg-secondary hover:bg-hover border border-primary text-primary rounded-lg transition-colors"
            >
              Restore to Defaults
            </button>
          </div>
        )}

        <div className="space-y-6">
          {/* Input Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-secondary">
                Input: {isEncodeMode ? "Text to encode" : "Base64 to decode"}
              </label>
              <div className="flex items-center gap-2">
                <button
                  onClick={pasteFromClipboard}
                  className="px-3 py-2 text-xs bg-tertiary hover:bg-secondary border border-primary text-primary rounded-lg transition-colors"
                >
                  Clipboard
                </button>
                <button
                  onClick={generateSample}
                  className="px-3 py-2 text-xs bg-tertiary hover:bg-secondary border border-primary text-primary rounded-lg transition-colors"
                >
                  Sample
                </button>
                <button
                  onClick={clearAll}
                  className="px-3 py-2 text-xs bg-tertiary hover:bg-secondary border border-primary text-primary rounded-lg transition-colors"
                >
                  Clear
                </button>
              </div>
            </div>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isEncodeMode ? "Enter text to encode..." : "Enter Base64 string to decode..."}
              className="w-full h-32 px-4 py-3 bg-tertiary border border-primary rounded-lg text-primary placeholder-tertiary focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm transition-colors resize-none"
            />
          </div>

          {/* Output Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-secondary">
                Output: {isEncodeMode ? "Base64 encoded" : "Decoded text"}
              </label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => copyToClipboard(output)}
                  className="px-3 py-2 text-xs bg-tertiary hover:bg-secondary border border-primary text-primary rounded-lg transition-colors flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" />
                  Copy
                </button>
                <button
                  onClick={useAsInput}
                  className="px-3 py-2 text-xs bg-tertiary hover:bg-secondary border border-primary text-primary rounded-lg transition-colors"
                  disabled={!output}
                >
                  Use as Input ↑
                </button>
              </div>
            </div>
            <textarea
              value={output}
              readOnly
              placeholder="Output will appear here..."
              className="w-full h-32 px-4 py-3 bg-secondary border border-primary rounded-lg text-primary placeholder-tertiary font-mono text-sm resize-none cursor-default"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
