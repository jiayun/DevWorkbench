import { useState, useEffect, useCallback } from "react";
import { Copy, Settings, Clipboard, Shuffle, Trash2, ArrowUp, RotateCcw } from "lucide-react";

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
    <div className="w-full max-w-4xl mx-auto space-y-8">
      
      {/* Header Controls - Left/Right Layout */}
      <div className="flex justify-between items-center">
        {/* Mode Toggle */}
        <div className="flex rounded-lg p-1" style={{ backgroundColor: 'var(--color-tertiary-bg)' }}>
          <button
            onClick={() => {
              setIsEncodeMode(true);
              setLastManualModeChange(Date.now());
            }}
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
            onClick={() => {
              setIsEncodeMode(false);
              setLastManualModeChange(Date.now());
            }}
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
          <h3 className="text-lg font-semibold" style={{ color: 'var(--color-primary-text)' }}>Base58 Settings</h3>
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.autoDetect}
                onChange={(e) => setSettings(prev => ({ ...prev, autoDetect: e.target.checked }))}
                className="w-4 h-4 rounded focus:ring-2"
                style={{ 
                  accentColor: 'var(--color-blue-primary)',
                  backgroundColor: 'var(--color-secondary-bg)'
                }}
              />
              <span className="text-sm" style={{ color: 'var(--color-primary-text)' }}>
                Auto detect when input is a Base58 and switch to decode mode
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

      {/* Info Section */}
      <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--color-secondary-bg)', border: '1px solid var(--color-primary-border)' }}>
        <p className="text-sm" style={{ color: 'var(--color-secondary-text)' }}>
          <strong style={{ color: 'var(--color-primary-text)' }}>Base58</strong> is a binary-to-text encoding used in Bitcoin and IPFS. 
          It uses 58 characters (excludes 0, O, I, l to avoid confusion) and is designed to be more human-friendly than Base64.
        </p>
        <p className="text-xs mt-2" style={{ color: 'var(--color-tertiary-text)' }}>
          Common uses: Bitcoin addresses, IPFS hashes, short URLs, database keys
        </p>
      </div>

      {/* Input Section */}
      <section className="space-y-4">
        <div className="flex justify-between items-center gap-4">
          <h2 className="text-xl font-semibold" style={{ color: 'var(--color-primary-text)' }}>
            Input: {isEncodeMode ? "Text to encode" : "Base58 to decode"}
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
          placeholder={isEncodeMode ? "Enter text to encode..." : "Enter Base58 string to decode (e.g., Bitcoin address)..."}
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
            Output: {isEncodeMode ? "Base58 encoded" : "Decoded text"}
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
