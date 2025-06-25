import { useState, useEffect, useCallback } from "react";
import { Copy, Settings, Hash } from "lucide-react";

export function Base58EncoderDecoder() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [isEncodeMode, setIsEncodeMode] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState({
    autoDetect: true,
  });

  // Base58 alphabet (Bitcoin/IPFS standard)
  const BASE58_ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

  // Base58 validation
  const isValidBase58 = useCallback((str: string): boolean => {
    if (!str || str.length === 0) return false;
    // Check if all characters are in Base58 alphabet
    const cleanStr = str.replace(/\s/g, '');
    for (let i = 0; i < cleanStr.length; i++) {
      if (BASE58_ALPHABET.indexOf(cleanStr[i]) === -1) {
        return false;
      }
    }
    return cleanStr.length > 0;
  }, []);

  // Base58 encode function
  const encodeBase58 = useCallback((input: Uint8Array): string => {
    if (input.length === 0) return "";

    // Count leading zeros
    let leadingZeros = 0;
    for (let i = 0; i < input.length && input[i] === 0; i++) {
      leadingZeros++;
    }

    // Convert to BigInt
    let num = BigInt(0);
    for (let i = 0; i < input.length; i++) {
      num = num * 256n + BigInt(input[i]);
    }

    // Convert to Base58
    let result = "";
    if (num === 0n) {
      result = BASE58_ALPHABET[0];
    } else {
      while (num > 0n) {
        const remainder = num % 58n;
        result = BASE58_ALPHABET[Number(remainder)] + result;
        num = num / 58n;
      }
    }

    // Add leading '1's for leading zeros
    const leadingOnes = BASE58_ALPHABET[0].repeat(leadingZeros);
    return leadingOnes + result;
  }, []);

  // Base58 decode function
  const decodeBase58 = useCallback((str: string): Uint8Array => {
    if (!str) return new Uint8Array(0);

    // Count leading '1's
    let leadingOnes = 0;
    for (let i = 0; i < str.length && str[i] === BASE58_ALPHABET[0]; i++) {
      leadingOnes++;
    }

    // Convert from Base58 to BigInt
    let num = BigInt(0);
    for (let i = 0; i < str.length; i++) {
      const char = str[i];
      const value = BASE58_ALPHABET.indexOf(char);
      if (value === -1) {
        throw new Error(`Invalid Base58 character: ${char}`);
      }
      num = num * 58n + BigInt(value);
    }

    // Convert BigInt to bytes
    const bytes: number[] = [];
    while (num > 0n) {
      bytes.unshift(Number(num % 256n));
      num = num / 256n;
    }

    // Add leading zeros for leading '1's
    const leadingZeros = new Array(leadingOnes).fill(0);
    return new Uint8Array([...leadingZeros, ...bytes]);
  }, []);

  // Track manual mode changes to prevent auto-switching immediately after
  const [lastManualModeChange, setLastManualModeChange] = useState<number>(0);

  // Auto-detect and switch mode (but not immediately after manual change)
  useEffect(() => {
    if (settings.autoDetect && input.trim()) {
      const now = Date.now();
      // Don't auto-switch for 1 second after manual mode change
      if (now - lastManualModeChange > 1000) {
        const isBase58Input = isValidBase58(input.trim());
        if (isBase58Input && isEncodeMode) {
          setIsEncodeMode(false);
        } else if (!isBase58Input && !isEncodeMode) {
          setIsEncodeMode(true);
        }
      }
    }
  }, [input, settings.autoDetect, isValidBase58, isEncodeMode, lastManualModeChange]);

  // Encoding/Decoding logic
  useEffect(() => {
    if (!input.trim()) {
      setOutput("");
      return;
    }

    try {
      if (isEncodeMode) {
        // Encode text to Base58
        const textEncoder = new TextEncoder();
        const bytes = textEncoder.encode(input);
        const encoded = encodeBase58(bytes);
        setOutput(encoded);
      } else {
        // Decode Base58 to text
        const processedInput = input.trim().replace(/\s/g, '');
        const decoded = decodeBase58(processedInput);
        const textDecoder = new TextDecoder();
        const decodedText = textDecoder.decode(decoded);
        setOutput(decodedText);
      }
    } catch (error) {
      setOutput("Invalid input for " + (isEncodeMode ? "encoding" : "decoding"));
    }
  }, [input, isEncodeMode, encodeBase58, decodeBase58]);

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
      setInput("Hello, World! This is a sample text for Base58 encoding.");
    } else {
      // Sample Bitcoin address
      setInput("1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa");
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
                <span className="text-sm text-primary">Auto detect when input is a Base58 and switch to decode mode</span>
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

        {/* Info Section */}
        <div className="mb-6 p-4 bg-secondary rounded-lg border border-primary">
          <p className="text-sm text-secondary">
            <strong className="text-primary">Base58</strong> is a binary-to-text encoding used in Bitcoin and IPFS. 
            It uses 58 characters (excludes 0, O, I, l to avoid confusion) and is designed to be more human-friendly than Base64.
          </p>
          <p className="text-xs text-tertiary mt-2">
            Common uses: Bitcoin addresses, IPFS hashes, short URLs, database keys
          </p>
        </div>

        <div className="space-y-6">
          {/* Input Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-secondary">
                Input: {isEncodeMode ? "Text to encode" : "Base58 to decode"}
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
              placeholder={isEncodeMode ? "Enter text to encode..." : "Enter Base58 string to decode (e.g., Bitcoin address)..."}
              className="w-full h-32 px-4 py-3 bg-tertiary border border-primary rounded-lg text-primary placeholder-tertiary focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm transition-colors resize-none"
            />
          </div>

          {/* Output Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-secondary">
                Output: {isEncodeMode ? "Base58 encoded" : "Decoded text"}
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
