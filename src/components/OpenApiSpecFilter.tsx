import React, { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { Copy, Download, FileUp, Search, Check, X, ChevronDown, Filter } from "lucide-react";
import { open } from '@tauri-apps/plugin-dialog';
import { readTextFile } from '@tauri-apps/plugin-fs';
import { JsonViewer } from "./JsonViewer";
import { Button } from "./ui";

// Types
interface OpenApiSpec {
  openapi: string;
  swagger?: string; // For Swagger 2.0 specs
  info: { title: string; version: string; [key: string]: unknown };
  paths: Record<string, PathItem>;
  components?: {
    schemas?: Record<string, unknown>;
    parameters?: Record<string, unknown>;
    responses?: Record<string, unknown>;
    requestBodies?: Record<string, unknown>;
    securitySchemes?: Record<string, unknown>;
    headers?: Record<string, unknown>;
    examples?: Record<string, unknown>;
    links?: Record<string, unknown>;
    callbacks?: Record<string, unknown>;
  };
  servers?: unknown[];
  tags?: Array<{ name: string; description?: string }>;
  security?: unknown[];
  externalDocs?: unknown;
  [key: string]: unknown;
}

interface PathItem {
  get?: OperationObject;
  post?: OperationObject;
  put?: OperationObject;
  delete?: OperationObject;
  patch?: OperationObject;
  options?: OperationObject;
  head?: OperationObject;
  trace?: OperationObject;
  parameters?: unknown[];
  $ref?: string;
  summary?: string;
  description?: string;
  servers?: unknown[];
}

interface OperationObject {
  operationId?: string;
  summary?: string;
  description?: string;
  tags?: string[];
  parameters?: unknown[];
  requestBody?: unknown;
  responses?: Record<string, unknown>;
  security?: unknown[];
  [key: string]: unknown;
}

interface EndpointInfo {
  path: string;
  method: string;
  operationId?: string;
  summary?: string;
  tags?: string[];
  selected: boolean;
}

interface CollectedRefs {
  schemas: Set<string>;
  parameters: Set<string>;
  responses: Set<string>;
  requestBodies: Set<string>;
  securitySchemes: Set<string>;
  headers: Set<string>;
  examples: Set<string>;
  links: Set<string>;
  callbacks: Set<string>;
}

// HTTP method colors (inline styles for consistent display)
const METHOD_STYLES: Record<string, { bg: string; text: string }> = {
  GET: { bg: "#dbeafe", text: "#1e40af" },      // 藍色
  POST: { bg: "#dcfce7", text: "#166534" },     // 綠色
  PUT: { bg: "#ffedd5", text: "#c2410c" },      // 橘色
  DELETE: { bg: "#fee2e2", text: "#dc2626" },   // 紅色
  PATCH: { bg: "#f3e8ff", text: "#7c3aed" },    // 紫色
  OPTIONS: { bg: "#f3f4f6", text: "#374151" },  // 灰色
  HEAD: { bg: "#f3f4f6", text: "#374151" },     // 灰色
  TRACE: { bg: "#f3f4f6", text: "#374151" },    // 灰色
};

const HTTP_METHODS = ["get", "post", "put", "delete", "patch", "options", "head", "trace"];

// Parse OpenAPI spec and extract endpoints
function parseOpenApiSpec(jsonContent: string): { spec: OpenApiSpec; endpoints: EndpointInfo[] } {
  const spec = JSON.parse(jsonContent) as OpenApiSpec;

  // Validate OpenAPI spec
  if (!spec.openapi && !spec.swagger) {
    throw new Error("Invalid OpenAPI specification: missing 'openapi' or 'swagger' field");
  }
  if (!spec.paths) {
    throw new Error("Invalid OpenAPI specification: missing 'paths' field");
  }

  const endpoints: EndpointInfo[] = [];

  for (const [path, pathItem] of Object.entries(spec.paths)) {
    if (!pathItem || typeof pathItem !== "object") continue;

    for (const method of HTTP_METHODS) {
      const operation = pathItem[method as keyof PathItem] as OperationObject | undefined;
      if (operation && typeof operation === "object") {
        endpoints.push({
          path,
          method: method.toUpperCase(),
          operationId: operation.operationId,
          summary: operation.summary,
          tags: operation.tags,
          selected: false,
        });
      }
    }
  }

  // Sort endpoints by path, then by method
  endpoints.sort((a, b) => {
    const pathCompare = a.path.localeCompare(b.path);
    if (pathCompare !== 0) return pathCompare;
    return HTTP_METHODS.indexOf(a.method.toLowerCase()) - HTTP_METHODS.indexOf(b.method.toLowerCase());
  });

  return { spec, endpoints };
}

// Recursively collect $ref references
function collectRefs(obj: unknown, collected: CollectedRefs, spec: OpenApiSpec, visited: Set<string> = new Set()): void {
  if (!obj || typeof obj !== "object") return;

  // Handle $ref
  if ("$ref" in obj && typeof (obj as Record<string, unknown>).$ref === "string") {
    const refPath = (obj as Record<string, unknown>).$ref as string;

    // Only process internal references
    const match = refPath.match(/^#\/components\/(\w+)\/(.+)$/);
    if (match) {
      const [, componentType, componentName] = match;
      const setKey = componentType as keyof CollectedRefs;

      // Avoid circular references
      const refKey = `${componentType}/${componentName}`;
      if (collected[setKey] && !visited.has(refKey)) {
        visited.add(refKey);
        collected[setKey].add(componentName);

        // Recursively collect refs from the referenced component
        const component = spec.components?.[componentType as keyof typeof spec.components]?.[componentName];
        if (component) {
          collectRefs(component, collected, spec, visited);
        }
      }
    }
    return;
  }

  // Recursively process arrays and objects
  if (Array.isArray(obj)) {
    for (const item of obj) {
      collectRefs(item, collected, spec, visited);
    }
  } else {
    for (const value of Object.values(obj)) {
      collectRefs(value, collected, spec, visited);
    }
  }
}

// Generate filtered OpenAPI spec
function generateFilteredSpec(originalSpec: OpenApiSpec, selectedEndpoints: EndpointInfo[]): OpenApiSpec {
  if (selectedEndpoints.length === 0) {
    return {
      openapi: originalSpec.openapi,
      info: originalSpec.info,
      paths: {},
    };
  }

  // Initialize ref collector
  const collected: CollectedRefs = {
    schemas: new Set(),
    parameters: new Set(),
    responses: new Set(),
    requestBodies: new Set(),
    securitySchemes: new Set(),
    headers: new Set(),
    examples: new Set(),
    links: new Set(),
    callbacks: new Set(),
  };

  // Build filtered paths
  const filteredPaths: Record<string, PathItem> = {};

  for (const endpoint of selectedEndpoints) {
    const pathItem = originalSpec.paths[endpoint.path];
    if (!pathItem) continue;

    const method = endpoint.method.toLowerCase() as keyof PathItem;
    const operation = pathItem[method];
    if (!operation) continue;

    // Initialize path if not exists
    if (!filteredPaths[endpoint.path]) {
      filteredPaths[endpoint.path] = {};

      // Copy path-level properties
      if (pathItem.parameters) {
        filteredPaths[endpoint.path].parameters = pathItem.parameters;
        collectRefs(pathItem.parameters, collected, originalSpec);
      }
      if (pathItem.summary) {
        filteredPaths[endpoint.path].summary = pathItem.summary;
      }
      if (pathItem.description) {
        filteredPaths[endpoint.path].description = pathItem.description;
      }
      if (pathItem.servers) {
        filteredPaths[endpoint.path].servers = pathItem.servers;
      }
    }

    // Add operation
    (filteredPaths[endpoint.path] as Record<string, unknown>)[method] = operation;

    // Collect refs from operation
    collectRefs(operation, collected, originalSpec);
  }

  // Build filtered components
  const filteredComponents: NonNullable<OpenApiSpec["components"]> = {};
  const componentTypes: Array<keyof CollectedRefs> = [
    "schemas", "parameters", "responses", "requestBodies",
    "securitySchemes", "headers", "examples", "links", "callbacks"
  ];

  for (const type of componentTypes) {
    if (collected[type].size > 0 && originalSpec.components?.[type]) {
      filteredComponents[type] = {};
      for (const name of collected[type]) {
        const component = originalSpec.components[type]?.[name];
        if (component) {
          filteredComponents[type]![name] = component;
        }
      }
    }
  }

  // Build final spec
  const filteredSpec: OpenApiSpec = {
    openapi: originalSpec.openapi,
    info: originalSpec.info,
    paths: filteredPaths,
  };

  // Add optional fields
  if (Object.keys(filteredComponents).length > 0) {
    filteredSpec.components = filteredComponents;
  }
  if (originalSpec.servers) {
    filteredSpec.servers = originalSpec.servers;
  }

  // Filter tags - only keep used ones
  if (originalSpec.tags) {
    const usedTags = new Set<string>();
    for (const endpoint of selectedEndpoints) {
      endpoint.tags?.forEach(tag => usedTags.add(tag));
    }
    const filteredTags = originalSpec.tags.filter(tag => usedTags.has(tag.name));
    if (filteredTags.length > 0) {
      filteredSpec.tags = filteredTags;
    }
  }

  if (originalSpec.externalDocs) {
    filteredSpec.externalDocs = originalSpec.externalDocs;
  }

  return filteredSpec;
}

export function OpenApiSpecFilter() {
  // State
  const [spec, setSpec] = useState<OpenApiSpec | null>(null);
  const [endpoints, setEndpoints] = useState<EndpointInfo[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTag, setFilterTag] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showTagFilter, setShowTagFilter] = useState(false);

  // Resizable panel state
  const [leftPanelWidth, setLeftPanelWidth] = useState(50);
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Get available tags
  const availableTags = useMemo(() => {
    const tags = new Set<string>();
    endpoints.forEach(ep => ep.tags?.forEach(tag => tags.add(tag)));
    return Array.from(tags).sort();
  }, [endpoints]);

  // Filter endpoints
  const filteredEndpoints = useMemo(() => {
    return endpoints.filter(ep => {
      // Search filter
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery ||
        ep.path.toLowerCase().includes(searchLower) ||
        ep.method.toLowerCase().includes(searchLower) ||
        ep.operationId?.toLowerCase().includes(searchLower) ||
        ep.summary?.toLowerCase().includes(searchLower);

      // Tag filter
      const matchesTag = !filterTag || ep.tags?.includes(filterTag);

      return matchesSearch && matchesTag;
    });
  }, [endpoints, searchQuery, filterTag]);

  // Generate filtered spec
  const filteredSpec = useMemo(() => {
    if (!spec) return null;
    const selected = endpoints.filter(ep => ep.selected);
    return generateFilteredSpec(spec, selected);
  }, [spec, endpoints]);

  // Statistics
  const selectedCount = endpoints.filter(ep => ep.selected).length;
  const totalCount = endpoints.length;

  // Handlers
  const handleFileLoad = async () => {
    try {
      const selected = await open({
        multiple: false,
        directory: false,
        filters: [{ name: "JSON", extensions: ["json"] }],
      });

      if (selected && typeof selected === "string") {
        const content = await readTextFile(selected);
        const { spec: parsedSpec, endpoints: parsedEndpoints } = parseOpenApiSpec(content);

        setSpec(parsedSpec);
        setEndpoints(parsedEndpoints);
        setError(null);
        setFileName(selected.split("/").pop() || selected.split("\\").pop() || "Unknown");
        setSearchQuery("");
        setFilterTag("");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setSpec(null);
      setEndpoints([]);
      setFileName(null);
    }
  };

  const toggleEndpoint = (index: number) => {
    setEndpoints(prev => {
      const newEndpoints = [...prev];
      // Find the actual index in the full list
      const endpoint = filteredEndpoints[index];
      const actualIndex = prev.findIndex(
        ep => ep.path === endpoint.path && ep.method === endpoint.method
      );
      if (actualIndex !== -1) {
        newEndpoints[actualIndex] = { ...newEndpoints[actualIndex], selected: !newEndpoints[actualIndex].selected };
      }
      return newEndpoints;
    });
  };

  const selectAll = () => {
    setEndpoints(prev => prev.map(ep => {
      // Only select endpoints that match current filters
      const matchesSearch = !searchQuery ||
        ep.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ep.method.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ep.operationId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ep.summary?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTag = !filterTag || ep.tags?.includes(filterTag);

      if (matchesSearch && matchesTag) {
        return { ...ep, selected: true };
      }
      return ep;
    }));
  };

  const deselectAll = () => {
    setEndpoints(prev => prev.map(ep => {
      // Only deselect endpoints that match current filters
      const matchesSearch = !searchQuery ||
        ep.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ep.method.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ep.operationId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ep.summary?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTag = !filterTag || ep.tags?.includes(filterTag);

      if (matchesSearch && matchesTag) {
        return { ...ep, selected: false };
      }
      return ep;
    }));
  };

  const copyToClipboard = async () => {
    if (!filteredSpec) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(filteredSpec, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const downloadJson = () => {
    if (!filteredSpec) return;
    const blob = new Blob([JSON.stringify(filteredSpec, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName ? `filtered-${fileName}` : "filtered-openapi.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Resizable panel handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsResizing(true);
    e.preventDefault();
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing || !containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const newWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;
    setLeftPanelWidth(Math.max(25, Math.min(75, newWidth)));
  }, [isResizing]);

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    } else {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, handleMouseMove, handleMouseUp]);

  return (
    <div className="w-full h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <Button onClick={handleFileLoad} variant="default">
            <FileUp className="w-4 h-4 mr-2" />
            Load File
          </Button>
          {fileName && (
            <span className="text-sm" style={{ color: "var(--color-secondary-text)" }}>
              {fileName}
              {spec && (
                <span className="ml-2 text-xs" style={{ color: "var(--color-tertiary-text)" }}>
                  (OpenAPI {spec.openapi || spec.swagger})
                </span>
              )}
            </span>
          )}
        </div>
        {error && (
          <div className="flex items-center gap-2 text-red-500 text-sm">
            <X className="w-4 h-4" />
            {error}
          </div>
        )}
      </div>

      {/* Main Content */}
      <div
        ref={containerRef}
        className="flex-1 flex min-h-0 rounded-lg overflow-hidden"
        style={{ border: "1px solid var(--color-primary-border)" }}
      >
        {/* Left Panel - Endpoint Selection */}
        <div
          className="flex flex-col"
          style={{
            width: `${leftPanelWidth}%`,
            backgroundColor: "var(--color-secondary-bg)",
          }}
        >
          {/* Filter Controls */}
          <div className="p-4 border-b" style={{ borderColor: "var(--color-primary-border)" }}>
            <div className="flex gap-3 mb-4">
              <Button onClick={selectAll} variant="secondary" size="sm" disabled={!spec}>
                <Check className="w-3 h-3 mr-1" />
                Select All
              </Button>
              <Button onClick={deselectAll} variant="secondary" size="sm" disabled={!spec}>
                <X className="w-3 h-3 mr-1" />
                Deselect All
              </Button>
              {availableTags.length > 0 && (
                <div className="relative">
                  <Button
                    onClick={() => setShowTagFilter(!showTagFilter)}
                    variant={filterTag ? "default" : "secondary"}
                    size="sm"
                  >
                    <Filter className="w-3 h-3 mr-1" />
                    {filterTag || "Filter by Tag"}
                    <ChevronDown className="w-3 h-3 ml-1" />
                  </Button>
                  {showTagFilter && (
                    <div
                      className="absolute z-10 mt-1 w-48 rounded-md shadow-lg"
                      style={{
                        backgroundColor: "var(--color-secondary-bg)",
                        border: "1px solid var(--color-primary-border)",
                      }}
                    >
                      <div className="py-1">
                        <button
                          className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                          onClick={() => { setFilterTag(""); setShowTagFilter(false); }}
                        >
                          All Tags
                        </button>
                        {availableTags.map(tag => (
                          <button
                            key={tag}
                            className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                            onClick={() => { setFilterTag(tag); setShowTagFilter(false); }}
                          >
                            {tag}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 pointer-events-none"
                style={{ color: "var(--color-secondary-text)" }}
              />
              <input
                type="text"
                placeholder="Search endpoints..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{
                  backgroundColor: "var(--color-tertiary-bg)",
                  border: "1px solid var(--color-primary-border)",
                  color: "var(--color-primary-text)",
                  paddingLeft: "2.5rem",
                }}
              />
            </div>
          </div>

          {/* Endpoint List */}
          <div className="flex-1 overflow-auto p-3">
            {!spec ? (
              <div className="flex items-center justify-center h-full text-sm" style={{ color: "var(--color-secondary-text)" }}>
                Load an OpenAPI spec file to get started
              </div>
            ) : filteredEndpoints.length === 0 ? (
              <div className="flex items-center justify-center h-full text-sm" style={{ color: "var(--color-secondary-text)" }}>
                No endpoints match your search
              </div>
            ) : (
              filteredEndpoints.map((endpoint, index) => {
                const methodStyle = METHOD_STYLES[endpoint.method] || METHOD_STYLES.GET;
                return (
                  <div
                    key={`${endpoint.path}-${endpoint.method}`}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-md cursor-pointer transition-colors"
                    style={{ backgroundColor: endpoint.selected ? "var(--color-tertiary-bg)" : "transparent" }}
                    onClick={() => toggleEndpoint(index)}
                    onMouseEnter={(e) => {
                      if (!endpoint.selected) {
                        e.currentTarget.style.backgroundColor = "var(--color-hover-bg)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!endpoint.selected) {
                        e.currentTarget.style.backgroundColor = "transparent";
                      }
                    }}
                  >
                    {/* Custom Checkbox */}
                    <div
                      className="w-5 h-5 rounded-sm flex items-center justify-center flex-shrink-0 cursor-pointer"
                      style={{
                        backgroundColor: endpoint.selected ? "#3b82f6" : "#1f2937",
                        border: `2px solid ${endpoint.selected ? "#3b82f6" : "#ffffff"}`,
                        minWidth: "20px",
                        minHeight: "20px",
                      }}
                    >
                      {endpoint.selected && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                    </div>
                    {/* HTTP Method Badge */}
                    <span
                      className="px-2 py-0.5 rounded text-xs font-mono font-semibold flex-shrink-0"
                      style={{
                        backgroundColor: methodStyle.bg,
                        color: methodStyle.text,
                        minWidth: "60px",
                        textAlign: "center",
                      }}
                    >
                      {endpoint.method}
                    </span>
                    {/* Path */}
                    <span className="font-mono text-sm truncate flex-1" style={{ color: "var(--color-primary-text)" }}>
                      {endpoint.path}
                    </span>
                    {/* Summary */}
                    {endpoint.summary && (
                      <span className="text-xs truncate max-w-[200px] flex-shrink-0" style={{ color: "var(--color-tertiary-text)" }}>
                        {endpoint.summary}
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Statistics */}
          {spec && (
            <div
              className="px-4 py-2 text-sm border-t"
              style={{
                borderColor: "var(--color-primary-border)",
                color: "var(--color-secondary-text)",
              }}
            >
              Selected: {selectedCount} / {totalCount} endpoints
              {filterTag && <span className="ml-2">(filtered by: {filterTag})</span>}
            </div>
          )}
        </div>

        {/* Resize Handle */}
        <div
          className="w-2 cursor-col-resize flex items-center justify-center hover:bg-blue-500 transition-colors"
          style={{ backgroundColor: "var(--color-primary-border)" }}
          onMouseDown={handleMouseDown}
        >
          <div className="w-0.5 h-8 rounded-full bg-gray-400" />
        </div>

        {/* Right Panel - Output */}
        <div
          className="flex flex-col"
          style={{
            width: `${100 - leftPanelWidth}%`,
            backgroundColor: "var(--color-tertiary-bg)",
          }}
        >
          {/* Output Header */}
          <div
            className="flex items-center justify-between p-4 border-b"
            style={{ borderColor: "var(--color-primary-border)" }}
          >
            <span className="text-sm font-medium" style={{ color: "var(--color-primary-text)" }}>
              Filtered OpenAPI Spec
              {filteredSpec && (
                <span className="ml-2 text-xs" style={{ color: "var(--color-tertiary-text)" }}>
                  ({Object.keys(filteredSpec.paths).length} paths)
                </span>
              )}
            </span>
            <div className="flex gap-2">
              <Button
                onClick={copyToClipboard}
                variant="secondary"
                size="sm"
                disabled={!filteredSpec || selectedCount === 0}
              >
                {copied ? <Check className="w-4 h-4 mr-1 text-green-500" /> : <Copy className="w-4 h-4 mr-1" />}
                {copied ? "Copied!" : "Copy"}
              </Button>
              <Button
                onClick={downloadJson}
                variant="secondary"
                size="sm"
                disabled={!filteredSpec || selectedCount === 0}
              >
                <Download className="w-4 h-4 mr-1" />
                Download
              </Button>
            </div>
          </div>

          {/* Output Content */}
          <div
            className="flex-1 overflow-auto"
            style={{ backgroundColor: "var(--color-tertiary-bg)" }}
          >
            {!spec ? (
              <div className="flex items-center justify-center h-full text-sm" style={{ color: "var(--color-secondary-text)" }}>
                Load an OpenAPI spec file to get started
              </div>
            ) : selectedCount === 0 ? (
              <div className="flex items-center justify-center h-full text-sm" style={{ color: "var(--color-secondary-text)" }}>
                Select endpoints to generate filtered spec
              </div>
            ) : (
              <JsonViewer data={filteredSpec} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
