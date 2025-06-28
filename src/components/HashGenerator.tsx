import { useState, useEffect } from "react";
import { Copy } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";

interface HashResults {
  md2: string;
  md4: string;
  md5: string;
  sha1: string;
  sha224: string;
  sha256: string;
  sha384: string;
  sha512: string;
  keccak256: string;
}

export function HashGenerator() {
  const [input, setInput] = useState("");
  const [results, setResults] = useState<HashResults>({
    md2: "",
    md4: "",
    md5: "",
    sha1: "",
    sha224: "",
    sha256: "",
    sha384: "",
    sha512: "",
    keccak256: "",
  });
  const [isLowercase, setIsLowercase] = useState(false);
  const [inputInfo, setInputInfo] = useState("0 bytes (string)");

  // Generate hashes whenever input or case preference changes
  useEffect(() => {
    const generateHashes = async () => {
      if (!input.trim()) {
        setResults({
          md2: "",
          md4: "",
          md5: "",
          sha1: "",
          sha224: "",
          sha256: "",
          sha384: "",
          sha512: "",
          keccak256: "",
        });
        setInputInfo("0 bytes (string)");
        return;
      }

      try {
        const byteLength = new TextEncoder().encode(input).length;
        setInputInfo(`${byteLength} bytes (string)`);
        
        const hashResults = await invoke<Record<string, string>>("hash_string", {
          input,
          lowercase: isLowercase,
        });
        
        setResults({
          md2: hashResults.md2 || "",
          md4: hashResults.md4 || "",
          md5: hashResults.md5 || "",
          sha1: hashResults.sha1 || "",
          sha224: hashResults.sha224 || "",
          sha256: hashResults.sha256 || "",
          sha384: hashResults.sha384 || "",
          sha512: hashResults.sha512 || "",
          keccak256: hashResults.keccak256 || "",
        });
      } catch (error) {
        console.error("Error generating hashes:", error);
      }
    };

    generateHashes();
  }, [input, isLowercase]);

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
    setInput("testeee1");
  };

  const clearAll = () => {
    setInput("");
  };

  const handleFileLoad = async () => {
    // File loading functionality can be implemented later
    console.log("Load file functionality to be implemented");
  };

  const hashAlgorithms = [
    { name: "MD2", key: "md2" as keyof HashResults },
    { name: "MD4", key: "md4" as keyof HashResults },
    { name: "MD5", key: "md5" as keyof HashResults },
    { name: "SHA1", key: "sha1" as keyof HashResults },
    { name: "SHA224", key: "sha224" as keyof HashResults },
    { name: "SHA256", key: "sha256" as keyof HashResults },
    { name: "SHA384", key: "sha384" as keyof HashResults },
    { name: "SHA512", key: "sha512" as keyof HashResults },
    { name: "Keccak-256", key: "keccak256" as keyof HashResults },
  ];

  return (
    <div className="w-full h-full">
      <div className="w-full px-4 py-6">
        {/* Header Controls */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <span className="text-sm text-secondary">Input:</span>
            <div className="flex gap-2">
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
                onClick={handleFileLoad}
                className="px-3 py-2 text-xs bg-tertiary hover:bg-secondary border border-primary text-primary rounded-lg transition-colors"
              >
                Load file...
              </button>
              <button
                onClick={clearAll}
                className="px-3 py-2 text-xs bg-tertiary hover:bg-secondary border border-primary text-primary rounded-lg transition-colors"
              >
                Clear
              </button>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <span className="text-sm text-secondary">{inputInfo}</span>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isLowercase}
                onChange={(e) => setIsLowercase(e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-secondary border-primary rounded focus:ring-blue-500"
              />
              <span className="text-sm text-primary">lowercased</span>
            </label>
          </div>
        </div>

        {/* Input Area */}
        <div className="mb-6">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter text to hash..."
            className="w-full h-32 px-4 py-3 bg-tertiary border border-primary rounded-lg text-primary placeholder-tertiary focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm transition-colors resize-none"
          />
        </div>

        {/* Hash Results */}
        <div className="space-y-3">
          {hashAlgorithms.map((algo) => (
            <div key={algo.key} className="flex items-center gap-3">
              <div className="w-24 text-sm font-medium text-secondary text-right">
                {algo.name}:
              </div>
              <div className="flex-1 flex items-center gap-2">
                <input
                  type="text"
                  value={results[algo.key]}
                  readOnly
                  className="flex-1 px-3 py-2 bg-secondary border border-primary rounded-lg text-primary font-mono text-sm cursor-default"
                  placeholder="Hash will appear here..."
                />
                <button
                  onClick={() => copyToClipboard(results[algo.key])}
                  className="p-2 text-tertiary hover:text-primary hover:bg-tertiary rounded-md transition-colors"
                  disabled={!results[algo.key]}
                  title="Copy to clipboard"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
