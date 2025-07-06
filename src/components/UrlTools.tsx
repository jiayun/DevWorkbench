import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@radix-ui/react-tabs";
import { Link, FileCode, Hammer, Copy, Check, RefreshCw } from "lucide-react";
import { Button } from "./ui";
import { invoke } from "@tauri-apps/api/core";

interface UrlParts {
  protocol: string;
  username: string;
  password: string;
  hostname: string;
  port: string;
  pathname: string;
  search: string;
  hash: string;
}

interface QueryParams {
  [key: string]: string | string[];
}

export const UrlTools: React.FC = () => {
  const [activeTab, setActiveTab] = useState("encode-decode");
  
  // Encode/Decode tab state
  const [encodeInput, setEncodeInput] = useState("");
  const [encodeOutput, setEncodeOutput] = useState("");
  const [encodeMode, setEncodeMode] = useState<"encode" | "decode">("encode");
  const [autoDetect, setAutoDetect] = useState(true);
  const [encodeCopied, setEncodeCopied] = useState(false);
  
  // Parser tab state
  const [parserInput, setParserInput] = useState("");
  const [parsedUrl, setParsedUrl] = useState<UrlParts | null>(null);
  const [queryParams, setQueryParams] = useState<QueryParams | null>(null);
  const [parserError, setParserError] = useState("");
  const [parserCopied, setParserCopied] = useState(false);
  
  // Builder tab state
  const [builderParts, setBuilderParts] = useState<UrlParts>({
    protocol: "https",
    username: "",
    password: "",
    hostname: "",
    port: "",
    pathname: "",
    search: "",
    hash: ""
  });
  const [builtUrl, setBuiltUrl] = useState("");
  const [builderCopied, setBuilderCopied] = useState(false);

  // Auto-detect encode/decode mode
  const detectMode = (input: string) => {
    if (!autoDetect) return;
    
    // Check if input contains encoded characters
    if (/%[0-9A-Fa-f]{2}/.test(input)) {
      setEncodeMode("decode");
    } else {
      setEncodeMode("encode");
    }
  };

  // Handle encode/decode
  const handleEncodeDecode = async () => {
    try {
      const result = await invoke<string>("process_url_encode_decode", {
        input: encodeInput,
        mode: encodeMode
      });
      setEncodeOutput(result);
    } catch (error) {
      setEncodeOutput(`Error: ${error}`);
    }
  };

  // Handle URL parsing
  const handleParse = async () => {
    try {
      setParserError("");
      const result = await invoke<{ parts: UrlParts; params: QueryParams }>("parse_url", {
        url: parserInput
      });
      setParsedUrl(result.parts);
      setQueryParams(result.params);
    } catch (error) {
      setParserError(`Error: ${error}`);
      setParsedUrl(null);
      setQueryParams(null);
    }
  };

  // Handle URL building
  const handleBuild = async () => {
    try {
      const result = await invoke<string>("build_url", {
        parts: builderParts
      });
      setBuiltUrl(result);
    } catch (error) {
      setBuiltUrl(`Error: ${error}`);
    }
  };

  // Copy to clipboard
  const copyToClipboard = async (text: string, setCopied: (value: boolean) => void) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  // Sample URLs
  const sampleUrls = [
    "https://example.com/path/to/page?name=John&age=30#section",
    "https://api.github.com/repos/user/repo?sort=created&direction=desc",
    "https://www.google.com/search?q=hello+world&hl=en"
  ];

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="encode-decode" className="flex items-center gap-2">
            <Link className="h-4 w-4" />
            Encode/Decode
          </TabsTrigger>
          <TabsTrigger value="parser" className="flex items-center gap-2">
            <FileCode className="h-4 w-4" />
            Parser
          </TabsTrigger>
          <TabsTrigger value="builder" className="flex items-center gap-2">
            <Hammer className="h-4 w-4" />
            Builder
          </TabsTrigger>
        </TabsList>

        {/* Encode/Decode Tab */}
        <TabsContent value="encode-decode" className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={autoDetect}
                  onChange={(e) => setAutoDetect(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <span className="text-sm">Auto-detect mode</span>
              </label>
              
              {!autoDetect && (
                <div className="flex gap-2">
                  <Button
                    variant={encodeMode === "encode" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setEncodeMode("encode")}
                  >
                    Encode
                  </Button>
                  <Button
                    variant={encodeMode === "decode" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setEncodeMode("decode")}
                  >
                    Decode
                  </Button>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Input {autoDetect && encodeMode === "decode" ? "(Encoded)" : "(Plain)"}
              </label>
              <textarea
                value={encodeInput}
                onChange={(e) => {
                  setEncodeInput(e.target.value);
                  detectMode(e.target.value);
                }}
                placeholder={encodeMode === "encode" 
                  ? "Enter text or URL to encode..." 
                  : "Enter encoded text or URL to decode..."}
                className="w-full h-32 p-3 border rounded-lg font-mono text-sm resize-none"
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleEncodeDecode} className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4" />
                {encodeMode === "encode" ? "Encode" : "Decode"}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  const sample = encodeMode === "encode" 
                    ? "Hello World! Special chars: @#$%^&*()"
                    : "Hello%20World%21%20Special%20chars%3A%20%40%23%24%25%5E%26%2A%28%29";
                  setEncodeInput(sample);
                  detectMode(sample);
                }}
              >
                Sample
              </Button>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">
                  Output {autoDetect && encodeMode === "encode" ? "(Encoded)" : "(Decoded)"}
                </label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(encodeOutput, setEncodeCopied)}
                  disabled={!encodeOutput}
                >
                  {encodeCopied ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <textarea
                value={encodeOutput}
                readOnly
                placeholder="Output will appear here..."
                className="w-full h-32 p-3 border rounded-lg font-mono text-sm resize-none bg-gray-50"
              />
            </div>
          </div>
        </TabsContent>

        {/* Parser Tab */}
        <TabsContent value="parser" className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">URL to Parse</label>
              <textarea
                value={parserInput}
                onChange={(e) => setParserInput(e.target.value)}
                placeholder="Enter URL to parse..."
                className="w-full h-24 p-3 border rounded-lg font-mono text-sm resize-none"
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleParse} className="flex items-center gap-2">
                <FileCode className="h-4 w-4" />
                Parse URL
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  const sample = sampleUrls[Math.floor(Math.random() * sampleUrls.length)];
                  setParserInput(sample);
                }}
              >
                Sample URL
              </Button>
            </div>

            {parserError && (
              <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                {parserError}
              </div>
            )}

            {parsedUrl && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">URL Components</h3>
                  <div className="p-4 bg-gray-50 rounded-lg space-y-2 font-mono text-sm">
                    {parsedUrl.protocol && (
                      <div><span className="text-gray-500">Protocol:</span> {parsedUrl.protocol}</div>
                    )}
                    {parsedUrl.username && (
                      <div><span className="text-gray-500">Username:</span> {parsedUrl.username}</div>
                    )}
                    {parsedUrl.password && (
                      <div><span className="text-gray-500">Password:</span> {"*".repeat(parsedUrl.password.length)}</div>
                    )}
                    {parsedUrl.hostname && (
                      <div><span className="text-gray-500">Hostname:</span> {parsedUrl.hostname}</div>
                    )}
                    {parsedUrl.port && (
                      <div><span className="text-gray-500">Port:</span> {parsedUrl.port}</div>
                    )}
                    {parsedUrl.pathname && (
                      <div><span className="text-gray-500">Path:</span> {parsedUrl.pathname}</div>
                    )}
                    {parsedUrl.search && (
                      <div><span className="text-gray-500">Query:</span> {parsedUrl.search}</div>
                    )}
                    {parsedUrl.hash && (
                      <div><span className="text-gray-500">Hash:</span> {parsedUrl.hash}</div>
                    )}
                  </div>
                </div>

                {queryParams && Object.keys(queryParams).length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium">Query Parameters (JSON)</h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(JSON.stringify(queryParams, null, 2), setParserCopied)}
                      >
                        {parserCopied ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <pre className="p-4 bg-gray-50 rounded-lg font-mono text-sm overflow-x-auto">
                      {JSON.stringify(queryParams, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Builder Tab */}
        <TabsContent value="builder" className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Build URL from Components</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm text-gray-600">Protocol</label>
                <select
                  value={builderParts.protocol}
                  onChange={(e) => setBuilderParts({...builderParts, protocol: e.target.value})}
                  className="w-full p-2 border rounded-lg"
                >
                  <option value="https">https://</option>
                  <option value="http">http://</option>
                  <option value="ftp">ftp://</option>
                  <option value="file">file://</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-gray-600">Hostname</label>
                <input
                  type="text"
                  value={builderParts.hostname}
                  onChange={(e) => setBuilderParts({...builderParts, hostname: e.target.value})}
                  placeholder="example.com"
                  className="w-full p-2 border rounded-lg"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm text-gray-600">Port (optional)</label>
                <input
                  type="text"
                  value={builderParts.port}
                  onChange={(e) => setBuilderParts({...builderParts, port: e.target.value})}
                  placeholder="8080"
                  className="w-full p-2 border rounded-lg"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm text-gray-600">Path</label>
                <input
                  type="text"
                  value={builderParts.pathname}
                  onChange={(e) => setBuilderParts({...builderParts, pathname: e.target.value})}
                  placeholder="/api/v1/users"
                  className="w-full p-2 border rounded-lg"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm text-gray-600">Username (optional)</label>
                <input
                  type="text"
                  value={builderParts.username}
                  onChange={(e) => setBuilderParts({...builderParts, username: e.target.value})}
                  placeholder="user"
                  className="w-full p-2 border rounded-lg"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm text-gray-600">Password (optional)</label>
                <input
                  type="password"
                  value={builderParts.password}
                  onChange={(e) => setBuilderParts({...builderParts, password: e.target.value})}
                  placeholder="password"
                  className="w-full p-2 border rounded-lg"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-gray-600">Query Parameters (key=value, one per line)</label>
              <textarea
                value={builderParts.search}
                onChange={(e) => setBuilderParts({...builderParts, search: e.target.value})}
                placeholder="page=1&#10;limit=10&#10;sort=name"
                className="w-full h-24 p-3 border rounded-lg font-mono text-sm resize-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-gray-600">Hash/Fragment (optional)</label>
              <input
                type="text"
                value={builderParts.hash}
                onChange={(e) => setBuilderParts({...builderParts, hash: e.target.value})}
                placeholder="section-1"
                className="w-full p-2 border rounded-lg"
              />
            </div>

            <Button onClick={handleBuild} className="flex items-center gap-2">
              <Hammer className="h-4 w-4" />
              Build URL
            </Button>

            {builtUrl && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Built URL</label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(builtUrl, setBuilderCopied)}
                  >
                    {builderCopied ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg font-mono text-sm break-all">
                  {builtUrl}
                </div>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
