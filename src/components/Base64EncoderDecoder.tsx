import { useState, useEffect } from "react";
import { Copy, Settings, Clipboard, Shuffle, Trash2, ArrowUp, RotateCcw } from "lucide-react";

export function Base64EncoderDecoder() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [isEncodeMode, setIsEncodeMode] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState({
    removeDataUri: true,
    removeNullBytes: true
  });



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
      removeDataUri: true,
      removeNullBytes: true
    });
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8">
      
      {/* Header Controls - Left/Right Layout */}
      <div className="flex justify-between items-center">
        {/* Mode Toggle */}
        <div className="flex rounded-lg p-1" style={{ backgroundColor: 'var(--color-tertiary-bg)' }}>
          <button
            onClick={() => setIsEncodeMode(true)}
            className={`px-6 py-2 rounded-md font-semibold focus:outline-none transition-colors duration-150 ${
              isEncodeMode 
                ? 'text-white' 
                : 'hover:text-white'
            }`}
            style={{
              backgroundColor: isEncodeMode ? 'var(--color-blue-primary)' : 'transparent',
              color: isEncodeMode ? 'white' : 'var(--color-secondary-text)'
            }}
          >
            Encode
          </button>
          <button
            onClick={() => setIsEncodeMode(false)}
            className={`px-6 py-2 rounded-md font-semibold focus:outline-none transition-colors duration-150 ${
              !isEncodeMode 
                ? 'text-white' 
                : 'hover:text-white'
            }`}
            style={{
              backgroundColor: !isEncodeMode ? 'var(--color-blue-primary)' : 'transparent',
              color: !isEncodeMode ? 'white' : 'var(--color-secondary-text)'
            }}
          >
            Decode
          </button>
        </div>

        {/* Settings Button */}
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="p-3 rounded-full transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2"
          style={{ 
            color: 'var(--color-secondary-text)',
            backgroundColor: showSettings ? 'var(--color-tertiary-bg)' : 'transparent'
          }}
          title="Settings"
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-tertiary-bg)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = showSettings ? 'var(--color-tertiary-bg)' : 'transparent'}
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="space-y-4 p-4 rounded-lg" style={{ backgroundColor: 'var(--color-tertiary-bg)' }}>
          <h3 className="text-lg font-semibold" style={{ color: 'var(--color-primary-text)' }}>Decoding Settings</h3>
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.removeDataUri}
                onChange={(e) => setSettings(prev => ({ ...prev, removeDataUri: e.target.checked }))}
                className="w-4 h-4 rounded focus:ring-2"
                style={{ 
                  accentColor: 'var(--color-blue-primary)',
                  backgroundColor: 'var(--color-secondary-bg)'
                }}
              />
              <span className="text-sm" style={{ color: 'var(--color-primary-text)' }}>
                Auto remove "data:...;base64," from the input when decoding
              </span>
            </label>
            
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.removeNullBytes}
                onChange={(e) => setSettings(prev => ({ ...prev, removeNullBytes: e.target.checked }))}
                className="w-4 h-4 rounded focus:ring-2"
                style={{ 
                  accentColor: 'var(--color-blue-primary)',
                  backgroundColor: 'var(--color-secondary-bg)'
                }}
              />
              <span className="text-sm" style={{ color: 'var(--color-primary-text)' }}>
                Auto remove null byte ("\0") at the end of decoded string
              </span>
            </label>
          </div>
          
          <button
            onClick={restoreDefaults}
            className="px-4 py-2 rounded-lg font-medium transition-colors duration-150 focus:outline-none focus:ring-2 border text-sm"
            style={{ 
              backgroundColor: 'var(--color-secondary-bg)',
              borderColor: 'var(--color-primary-border)',
              color: 'var(--color-primary-text)'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-tertiary-bg)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--color-secondary-bg)'}
          >
            <RotateCcw className="w-3 h-3 mr-2 inline" />
            Restore to Defaults
          </button>
        </div>
      )}

      {/* Input Section */}
      <section className="space-y-4">
        <div className="flex justify-between items-center gap-4">
          <h2 className="text-xl font-semibold" style={{ color: 'var(--color-primary-text)' }}>
            Input: {isEncodeMode ? "Text to encode" : "Base64 to decode"}
          </h2>
          <div className="flex gap-2">
            <button
              onClick={pasteFromClipboard}
              className="px-4 py-2 rounded-lg font-medium transition-colors duration-150 focus:outline-none text-sm"
              style={{ 
                backgroundColor: 'var(--color-tertiary-bg)',
                color: 'var(--color-secondary-text)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-primary-border)';
                e.currentTarget.style.color = 'var(--color-primary-text)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-tertiary-bg)';
                e.currentTarget.style.color = 'var(--color-secondary-text)';
              }}
            >
              <Clipboard className="w-4 h-4 mr-2 inline" />
              Paste
            </button>
            <button
              onClick={generateSample}
              className="px-4 py-2 rounded-lg font-medium transition-colors duration-150 focus:outline-none text-sm"
              style={{ 
                backgroundColor: 'var(--color-tertiary-bg)',
                color: 'var(--color-secondary-text)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-primary-border)';
                e.currentTarget.style.color = 'var(--color-primary-text)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-tertiary-bg)';
                e.currentTarget.style.color = 'var(--color-secondary-text)';
              }}
            >
              <Shuffle className="w-4 h-4 mr-2 inline" />
              Sample
            </button>
            <button
              onClick={clearAll}
              className="px-4 py-2 rounded-lg font-medium transition-colors duration-150 focus:outline-none text-sm"
              style={{ 
                backgroundColor: 'var(--color-tertiary-bg)',
                color: 'var(--color-secondary-text)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-primary-border)';
                e.currentTarget.style.color = 'var(--color-primary-text)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-tertiary-bg)';
                e.currentTarget.style.color = 'var(--color-secondary-text)';
              }}
            >
              <Trash2 className="w-4 h-4 mr-2 inline" />
              Clear
            </button>
          </div>
        </div>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={isEncodeMode ? "Enter text to encode..." : "Enter Base64 string to decode..."}
          className="w-full p-4 rounded-lg font-mono text-sm focus:ring-2 focus:outline-none resize-none"
          style={{ 
            backgroundColor: 'var(--color-secondary-bg)',
            borderColor: 'var(--color-primary-border)',
            color: 'var(--color-primary-text)',
            border: '1px solid var(--color-primary-border)',
            height: '320px',
            minHeight: '320px'
          }}
          onFocus={(e) => e.currentTarget.style.borderColor = 'var(--color-blue-primary)'}
          onBlur={(e) => e.currentTarget.style.borderColor = 'var(--color-primary-border)'}
        />
      </section>

      {/* Output Section */}
      <section className="space-y-4">
        <div className="flex justify-between items-center gap-4">
          <h2 className="text-xl font-semibold" style={{ color: 'var(--color-primary-text)' }}>
            Output: {isEncodeMode ? "Base64 encoded" : "Decoded text"}
          </h2>
          <div className="flex gap-2">
            <button
              onClick={() => copyToClipboard(output)}
              disabled={!output}
              className="px-4 py-2 rounded-lg font-medium transition-colors duration-150 focus:outline-none text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ 
                backgroundColor: 'var(--color-tertiary-bg)',
                color: 'var(--color-secondary-text)'
              }}
              onMouseEnter={(e) => {
                if (!e.currentTarget.disabled) {
                  e.currentTarget.style.backgroundColor = 'var(--color-primary-border)';
                  e.currentTarget.style.color = 'var(--color-primary-text)';
                }
              }}
              onMouseLeave={(e) => {
                if (!e.currentTarget.disabled) {
                  e.currentTarget.style.backgroundColor = 'var(--color-tertiary-bg)';
                  e.currentTarget.style.color = 'var(--color-secondary-text)';
                }
              }}
            >
              <Copy className="w-4 h-4 mr-2 inline" />
              Copy
            </button>
            <button
              onClick={useAsInput}
              disabled={!output}
              className="px-4 py-2 rounded-lg font-medium transition-colors duration-150 focus:outline-none text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ 
                backgroundColor: 'var(--color-tertiary-bg)',
                color: 'var(--color-secondary-text)'
              }}
              onMouseEnter={(e) => {
                if (!e.currentTarget.disabled) {
                  e.currentTarget.style.backgroundColor = 'var(--color-primary-border)';
                  e.currentTarget.style.color = 'var(--color-primary-text)';
                }
              }}
              onMouseLeave={(e) => {
                if (!e.currentTarget.disabled) {
                  e.currentTarget.style.backgroundColor = 'var(--color-tertiary-bg)';
                  e.currentTarget.style.color = 'var(--color-secondary-text)';
                }
              }}
              title="Use output as input"
            >
              <ArrowUp className="w-4 h-4 mr-2 inline" />
              Use as Input
            </button>
          </div>
        </div>
        <div
          className="w-full p-4 rounded-lg font-mono text-sm border"
          style={{ 
            backgroundColor: 'var(--color-secondary-bg)',
            borderColor: 'var(--color-primary-border)',
            color: output ? 'var(--color-primary-text)' : 'var(--color-secondary-text)',
            display: 'flex',
            alignItems: output ? 'flex-start' : 'center',
            justifyContent: output ? 'flex-start' : 'center',
            textAlign: output ? 'left' : 'center',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all',
            height: '320px',
            minHeight: '320px'
          }}
        >
          {output || "Output will appear here..."}
        </div>
      </section>
    </div>
  );
}
