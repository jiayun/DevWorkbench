import { useState, useEffect } from "react";
import { Copy, Settings, Clipboard, Shuffle, Trash2, ArrowUp, RotateCcw } from "lucide-react";
import { Button, Textarea, Card, Panel } from "./ui";

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
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Header Controls */}
      <Card padding="lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Mode Toggle */}
            <div className="flex bg-tertiary rounded-lg p-1 border border-primary">
              <Button
                variant={isEncodeMode ? "default" : "ghost"}
                size="sm"
                onClick={() => setIsEncodeMode(true)}
                className="rounded-md"
              >
                Encode
              </Button>
              <Button
                variant={!isEncodeMode ? "default" : "ghost"}
                size="sm"
                onClick={() => setIsEncodeMode(false)}
                className="rounded-md"
              >
                Decode
              </Button>
            </div>
          </div>

          {/* Settings Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowSettings(!showSettings)}
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </Button>
        </div>

      </Card>

      {/* Settings Panel */}
      {showSettings && (
        <Card padding="lg">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-primary">Decoding Settings</h3>
            <div className="space-y-3">
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
            
            <Button
              variant="outline"
              size="sm"
              onClick={restoreDefaults}
              className="mt-4"
            >
              <RotateCcw className="w-3 h-3 mr-2" />
              Restore to Defaults
            </Button>
          </div>
        </Card>
      )}

      {/* Input/Output Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Input Section */}
        <Panel 
          title={`Input: ${isEncodeMode ? "Text to encode" : "Base64 to decode"}`}
          padding="default"
          headerActions={
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={pasteFromClipboard}
              >
                <Clipboard className="w-3 h-3 mr-1" />
                Paste
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={generateSample}
              >
                <Shuffle className="w-3 h-3 mr-1" />
                Sample
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={clearAll}
              >
                <Trash2 className="w-3 h-3 mr-1" />
                Clear
              </Button>
            </div>
          }
        >
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isEncodeMode ? "Enter text to encode..." : "Enter Base64 string to decode..."}
            className="font-mono min-h-[200px] resize-none"
            resizable={false}
          />
        </Panel>

        {/* Output Section */}
        <Panel 
          title={`Output: ${isEncodeMode ? "Base64 encoded" : "Decoded text"}`}
          padding="default"
          headerActions={
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(output)}
                disabled={!output}
              >
                <Copy className="w-3 h-3 mr-1" />
                Copy
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={useAsInput}
                disabled={!output}
                title="Use output as input"
              >
                <ArrowUp className="w-3 h-3 mr-1" />
                Use as Input
              </Button>
            </div>
          }
        >
          <Textarea
            value={output}
            readOnly
            placeholder="Output will appear here..."
            className="font-mono min-h-[200px] resize-none bg-secondary cursor-default"
            resizable={false}
          />
        </Panel>
      </div>
    </div>
  );
}
