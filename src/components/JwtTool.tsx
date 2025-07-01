import React, { useState, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Copy, Key, Lock, Unlock, RefreshCw, Check, AlertCircle } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface JwtParts {
  header: Record<string, any>;
  payload: Record<string, any>;
  signature: string;
  isExpired: boolean;
  expiresAt: number | null;
  issuedAt: number | null;
}

interface VerifyResult {
  isValid: boolean;
  error: string | null;
  decodedHeader: Record<string, any> | null;
  decodedPayload: Record<string, any> | null;
}

interface KeyPair {
  privateKey: string;
  publicKey: string;
}

const ALGORITHMS = ['HS256', 'HS384', 'HS512', 'RS256', 'RS384', 'RS512'] as const;
type Algorithm = typeof ALGORITHMS[number];

const DEFAULT_PAYLOAD = {
  sub: '1234567890',
  name: 'John Doe',
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + 3600,
};

const SAMPLE_JWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

// JWT Token Syntax Highlighter Component
const JwtTokenHighlighter = ({ token, className = '' }: { token: string; className?: string }) => {
  if (!token.trim()) {
    return (
      <div className={`font-mono text-sm text-gray-500 dark:text-gray-400 ${className}`}>
        Paste your JWT token here...
      </div>
    );
  }

  const parts = token.split('.');
  if (parts.length !== 3) {
    return (
      <div className={`font-mono text-sm ${className}`}>
        {token}
      </div>
    );
  }

  return (
    <div className={`font-mono text-sm leading-relaxed ${className}`}>
      <span className="text-pink-400">{parts[0]}</span>
      <span className="text-gray-400">.</span>
      <span className="text-cyan-400">{parts[1]}</span>
      <span className="text-gray-400">.</span>
      <span className="text-yellow-400">{parts[2]}</span>
    </div>
  );
};

// JSON Syntax Highlighter Component
const JsonHighlighter = ({ json, className = '' }: { json: any; className?: string }) => {
  const jsonString = JSON.stringify(json, null, 2);
  
  return (
    <SyntaxHighlighter
      language="json"
      style={oneDark}
      className={className}
      customStyle={{
        background: 'transparent',
        padding: 0,
        margin: 0,
        fontSize: '0.875rem',
        lineHeight: '1.5',
      }}
      showLineNumbers={false}
    >
      {jsonString}
    </SyntaxHighlighter>
  );
};

// Verification Status Bar Component
const VerificationStatusBar = ({ isValid, error }: { isValid: boolean; error?: string | null }) => {
  if (isValid) {
    return (
      <div className="w-full bg-green-500 text-white px-4 py-3 rounded-lg flex items-center justify-center gap-2 font-medium">
        <Check className="w-5 h-5" />
        Signature Verified
      </div>
    );
  }

  return (
    <div className="w-full bg-red-500 text-white px-4 py-3 rounded-lg flex items-center justify-center gap-2 font-medium">
      <AlertCircle className="w-5 h-5" />
      {error || 'Signature Invalid'}
    </div>
  );
};

// Button component
const Button = ({ variant = 'default', size = 'default', className = '', children, ...props }: any) => {
  const baseStyles = 'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';
  const variants: Record<string, string> = {
    default: 'bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-600 dark:text-white dark:hover:bg-blue-700',
    outline: 'border border-gray-300 bg-white text-gray-900 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700',
    ghost: 'text-gray-900 hover:bg-gray-100 dark:text-gray-100 dark:hover:bg-gray-800'
  };
  const sizes: Record<string, string> = {
    default: 'h-10 py-2 px-4',
    sm: 'h-9 px-3 text-xs'
  };
  return (
    <button className={`${baseStyles} ${variants[variant] || variants.default} ${sizes[size] || sizes.default} ${className}`} {...props}>
      {children}
    </button>
  );
};

// Textarea component
const Textarea = ({ className = '', ...props }: any) => (
  <textarea
    className={`flex min-h-[80px] w-full rounded-md border border-gray-300 bg-white dark:bg-gray-800 px-3 py-2 text-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:placeholder:text-gray-400 resize-none ${className}`}
    {...props}
  />
);

// Native Select Component
const NativeSelect = ({ value, onChange, children, className = '', ...props }: any) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    className={`h-10 w-full rounded-md border border-gray-300 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:text-gray-100 ${className}`}
    {...props}
  >
    {children}
  </select>
);

// Tabs components
const Tabs = ({ value, onValueChange, children, className = '' }: any) => {
  return (
    <div className={`w-full ${className}`}>
      {React.Children.map(children, (child: any) => {
        if (child.type === TabsList) {
          return React.cloneElement(child, { value, onValueChange });
        } else if (child.type === TabsContent) {
          return React.cloneElement(child, { activeValue: value });
        }
        return child;
      })}
    </div>
  );
};

const TabsList = ({ children, value, onValueChange }: any) => (
  <div className="inline-flex h-10 items-center justify-center rounded-md bg-gray-100 p-1 text-gray-500 dark:bg-gray-800 dark:text-gray-400 w-full">
    {React.Children.map(children, (child: any) => 
      React.cloneElement(child, { 
        active: value === child.props.value, 
        onValueChange 
      })
    )}
  </div>
);

const TabsTrigger = ({ value, children, active, onValueChange, className = '' }: any) => (
  <button
    className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 dark:ring-offset-gray-950 dark:focus-visible:ring-gray-800 flex-1 ${
      active 
        ? 'bg-white text-gray-950 shadow-sm dark:bg-gray-950 dark:text-gray-50' 
        : 'hover:bg-gray-200 dark:hover:bg-gray-700'
    } ${className}`}
    onClick={() => onValueChange(value)}
  >
    {children}
  </button>
);

const TabsContent = ({ value, children, activeValue }: any) => 
  activeValue === value ? <div className="mt-4">{children}</div> : null;

// Label component
const Label = ({ className = '', children, ...props }: any) => (
  <label className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${className}`} {...props}>
    {children}
  </label>
);

// Card components
const Card = ({ className = '', children }: any) => (
  <div className={`rounded-lg border border-gray-200 bg-white text-gray-950 shadow-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-50 ${className}`}>
    {children}
  </div>
);

const CardContent = ({ className = '', children }: any) => (
  <div className={`${className}`}>{children}</div>
);

export default function JwtTool() {
  const {} = useTheme();
  const [mode, setMode] = useState<'decode' | 'encode' | 'verify'>('decode');
  const [inputToken, setInputToken] = useState('');
  const [decodedData, setDecodedData] = useState<JwtParts | null>(null);
  const [decodeError, setDecodeError] = useState<string | null>(null);
  
  // Resizable panels state
  const [horizontalSplitPosition, setHorizontalSplitPosition] = useState(50); // percentage
  const [verticalSplit1Position, setVerticalSplit1Position] = useState(33); // percentage for header
  const [verticalSplit2Position, setVerticalSplit2Position] = useState(67); // percentage for payload
  const [isResizingHorizontal, setIsResizingHorizontal] = useState(false);
  const [isResizingVertical1, setIsResizingVertical1] = useState(false);
  const [isResizingVertical2, setIsResizingVertical2] = useState(false);
  
  // Encode state
  const [payloadJson, setPayloadJson] = useState(JSON.stringify(DEFAULT_PAYLOAD, null, 2));
  const [algorithm, setAlgorithm] = useState<Algorithm>('HS256');
  const [secret, setSecret] = useState('your-256-bit-secret');
  const [encodedToken, setEncodedToken] = useState('');
  const [encodeError, setEncodeError] = useState<string | null>(null);
  
  // Verify state
  const [verifyToken, setVerifyToken] = useState('');
  const [verifySecret, setVerifySecret] = useState('');
  const [verifyAlgorithm, setVerifyAlgorithm] = useState<Algorithm>('HS256');
  const [verifyResult, setVerifyResult] = useState<VerifyResult | null>(null);
  
  // RSA Key pair state
  const [keyPair, setKeyPair] = useState<KeyPair | null>(null);
  const [keySize, setKeySize] = useState<'2048' | '3072' | '4096'>('2048');
  
  // Copy state
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = useCallback(async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, []);

  const handleDecode = useCallback(async () => {
    if (!inputToken.trim()) {
      setDecodedData(null);
      setDecodeError(null);
      return;
    }

    try {
      const result = await invoke<JwtParts>('decode_jwt', { token: inputToken });
      setDecodedData(result);
      setDecodeError(null);
    } catch (error) {
      setDecodedData(null);
      setDecodeError(error as string);
    }
  }, [inputToken]);

  const handleEncode = useCallback(async () => {
    try {
      const payload = JSON.parse(payloadJson);
      const token = await invoke<string>('encode_jwt', {
        payload,
        secret,
        algorithm,
      });
      setEncodedToken(token);
      setEncodeError(null);
    } catch (error) {
      setEncodedToken('');
      setEncodeError(error as string);
    }
  }, [payloadJson, secret, algorithm]);

  const handleVerify = useCallback(async () => {
    if (!verifyToken.trim() || !verifySecret.trim()) {
      setVerifyResult(null);
      return;
    }

    try {
      const result = await invoke<VerifyResult>('verify_jwt', {
        token: verifyToken,
        secret: verifySecret,
        algorithm: verifyAlgorithm,
      });
      setVerifyResult(result);
    } catch (error) {
      setVerifyResult({
        isValid: false,
        error: error as string,
        decodedHeader: null,
        decodedPayload: null,
      });
    }
  }, [verifyToken, verifySecret, verifyAlgorithm]);

  const generateKeyPair = useCallback(async () => {
    try {
      const pair = await invoke<KeyPair>('generate_rsa_keypair', {
        keySize: parseInt(keySize),
      });
      setKeyPair(pair);
      // Auto-fill secret with private key for RS algorithms
      if (algorithm.startsWith('RS')) {
        setSecret(pair.privateKey);
      }
    } catch (error) {
      console.error('Failed to generate key pair:', error);
    }
  }, [keySize, algorithm]);

  const generateSecret = useCallback(async () => {
    try {
      const newSecret = await invoke<string>('generate_jwt_secret', { length: 64 });
      setSecret(newSecret);
    } catch (error) {
      console.error('Failed to generate secret:', error);
    }
  }, []);

  const formatDate = (timestamp: number | null) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp * 1000);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  const getExpiryStatus = (expiresAt: number | null, isExpired: boolean) => {
    if (!expiresAt) return null;
    if (isExpired) {
      return <span className="text-red-500 flex items-center gap-1"><AlertCircle className="w-4 h-4" /> Expired</span>;
    }
    const now = Date.now() / 1000;
    const timeLeft = expiresAt - now;
    if (timeLeft < 3600) {
      return <span className="text-yellow-500">Expires soon</span>;
    }
    return <span className="text-green-500">Valid</span>;
  };

  // Resizable panel handlers
  const handleHorizontalMouseDown = useCallback((e: React.MouseEvent) => {
    setIsResizingHorizontal(true);
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleVertical1MouseDown = useCallback((e: React.MouseEvent) => {
    setIsResizingVertical1(true);
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleVertical2MouseDown = useCallback((e: React.MouseEvent) => {
    setIsResizingVertical2(true);
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    e.preventDefault();
    
    if (isResizingHorizontal) {
      const container = document.querySelector('.jwt-container') as HTMLElement;
      if (container) {
        const rect = container.getBoundingClientRect();
        const newPosition = ((e.clientX - rect.left) / rect.width) * 100;
        const clampedPosition = Math.max(20, Math.min(80, newPosition));
        setHorizontalSplitPosition(clampedPosition);
      }
    }
    
    if (isResizingVertical1) {
      const rightPanel = document.querySelector('.jwt-right-panel') as HTMLElement;
      if (rightPanel) {
        const rect = rightPanel.getBoundingClientRect();
        const newPosition = ((e.clientY - rect.top) / rect.height) * 100;
        const clampedPosition = Math.max(10, Math.min(45, newPosition));
        setVerticalSplit1Position(clampedPosition);
      }
    }
    
    if (isResizingVertical2) {
      const rightPanel = document.querySelector('.jwt-right-panel') as HTMLElement;
      if (rightPanel) {
        const rect = rightPanel.getBoundingClientRect();
        const newPosition = ((e.clientY - rect.top) / rect.height) * 100;
        const clampedPosition = Math.max(55, Math.min(90, newPosition));
        setVerticalSplit2Position(clampedPosition);
      }
    }
  }, [isResizingHorizontal, isResizingVertical1, isResizingVertical2]);

  const handleMouseUp = useCallback(() => {
    setIsResizingHorizontal(false);
    setIsResizingVertical1(false);
    setIsResizingVertical2(false);
  }, []);

  React.useEffect(() => {
    const isResizing = isResizingHorizontal || isResizingVertical1 || isResizingVertical2;
    
    if (isResizing) {
      // Add event listeners to document
      document.addEventListener('mousemove', handleMouseMove, { passive: false });
      document.addEventListener('mouseup', handleMouseUp, { passive: false });
      
      // Set cursor style
      document.body.style.cursor = isResizingHorizontal ? 'col-resize' : 'row-resize';
      document.body.style.userSelect = 'none';
      document.body.style.pointerEvents = 'none';
      
      // Allow interaction with the splitter
      const splitters = document.querySelectorAll('.jwt-splitter');
      splitters.forEach(splitter => {
        (splitter as HTMLElement).style.pointerEvents = 'auto';
      });
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      document.body.style.pointerEvents = '';
    };
  }, [isResizingHorizontal, isResizingVertical1, isResizingVertical2, handleMouseMove, handleMouseUp]);

  useEffect(() => {
    if (mode === 'decode') {
      handleDecode();
    }
  }, [inputToken, mode, handleDecode]);

  useEffect(() => {
    if (mode === 'verify') {
      handleVerify();
    }
  }, [verifyToken, verifySecret, verifyAlgorithm, mode, handleVerify]);

  return (
    <div className="flex h-full jwt-container">
      {/* Left Panel */}
      <div 
        className="flex flex-col overflow-hidden" 
        style={{ width: `${horizontalSplitPosition}%` }}
      >
        <Tabs value={mode} onValueChange={(v: string) => setMode(v as any)} className="flex-1 flex flex-col">
          <TabsList>
            <TabsTrigger value="decode" className="flex items-center gap-2">
              <Unlock className="w-4 h-4" />
              Decode
            </TabsTrigger>
            <TabsTrigger value="encode" className="flex items-center gap-2">
              <Lock className="w-4 h-4" />
              Encode
            </TabsTrigger>
            <TabsTrigger value="verify" className="flex items-center gap-2">
              <Check className="w-4 h-4" />
              Verify
            </TabsTrigger>
          </TabsList>

          <TabsContent value="decode" className="flex-1 flex flex-col">
            <div className="space-y-4 flex-1 flex flex-col">
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    const text = await navigator.clipboard.readText();
                    setInputToken(text);
                  }}
                  className="px-3 py-1.5 text-xs"
                >
                  Clipboard
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setInputToken(SAMPLE_JWT)}
                  className="px-3 py-1.5 text-xs"
                >
                  Sample
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setInputToken('')}
                  className="px-3 py-1.5 text-xs"
                >
                  Clear
                </Button>
              </div>
              <div className="flex-1 relative">
                <Textarea
                  placeholder="Paste your JWT token here..."
                  value={inputToken}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInputToken(e.target.value)}
                  className="flex-1 font-mono text-sm min-h-[200px] bg-transparent relative z-10"
                  style={{ color: inputToken ? 'transparent' : undefined }}
                />
                {inputToken && (
                  <div className="absolute inset-0 p-3 pointer-events-none z-0 overflow-auto">
                    <JwtTokenHighlighter token={inputToken} className="min-h-[200px] whitespace-pre-wrap break-all" />
                  </div>
                )}
              </div>
              {decodeError && (
                <div className="text-red-500 text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {decodeError}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="encode" className="flex-1 flex flex-col">
            <div className="space-y-4 h-full flex flex-col">
              <div>
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Algorithm</Label>
                <div className="flex gap-2 mt-2">
                  <NativeSelect 
                    value={algorithm} 
                    onChange={(v: string) => setAlgorithm(v as Algorithm)}
                    className="w-32"
                  >
                    {ALGORITHMS.map((alg) => (
                      <option key={alg} value={alg}>
                        {alg}
                      </option>
                    ))}
                  </NativeSelect>
                  {algorithm.startsWith('RS') && (
                    <div className="flex gap-2">
                      <NativeSelect 
                        value={keySize} 
                        onChange={(v: string) => setKeySize(v as any)}
                        className="w-24"
                      >
                        <option value="2048">2048</option>
                        <option value="3072">3072</option>
                        <option value="4096">4096</option>
                      </NativeSelect>
                      <Button variant="outline" size="sm" onClick={generateKeyPair}>
                        <Key className="w-4 h-4 mr-2" />
                        Generate RSA Keys
                      </Button>
                    </div>
                  )}
                  {algorithm.startsWith('HS') && (
                    <Button variant="outline" size="sm" onClick={generateSecret}>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Generate Secret
                    </Button>
                  )}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {algorithm.startsWith('RS') ? 'Private Key' : 'Secret'}
                </Label>
                <Textarea
                  placeholder={algorithm.startsWith('RS') ? '-----BEGIN RSA PRIVATE KEY-----' : 'your-secret-key'}
                  value={secret}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setSecret(e.target.value)}
                  className="mt-2 font-mono text-sm min-h-[100px]"
                />
              </div>

              <div className="flex-1">
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Payload (JSON)</Label>
                <Textarea
                  placeholder="JWT payload..."
                  value={payloadJson}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setPayloadJson(e.target.value)}
                  className="mt-2 font-mono text-sm h-full min-h-[200px]"
                />
              </div>

              <Button onClick={handleEncode} className="w-full">
                <Lock className="w-4 h-4 mr-2" />
                Encode JWT
              </Button>

              {encodeError && (
                <div className="text-red-500 text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {encodeError}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="verify" className="flex-1 flex flex-col">
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">JWT Token</Label>
                <Textarea
                  placeholder="Paste JWT token to verify..."
                  value={verifyToken}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setVerifyToken(e.target.value)}
                  className="mt-2 font-mono text-sm min-h-[120px]"
                />
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Algorithm</Label>
                <div className="mt-2">
                  <NativeSelect 
                    value={verifyAlgorithm} 
                    onChange={(v: string) => setVerifyAlgorithm(v as Algorithm)}
                    className="w-40"
                  >
                    {ALGORITHMS.map((alg) => (
                      <option key={alg} value={alg}>
                        {alg}
                      </option>
                    ))}
                  </NativeSelect>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {verifyAlgorithm.startsWith('RS') ? 'Public Key' : 'Secret'}
                </Label>
                <Textarea
                  placeholder={verifyAlgorithm.startsWith('RS') ? '-----BEGIN RSA PUBLIC KEY-----' : 'your-secret-key'}
                  value={verifySecret}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setVerifySecret(e.target.value)}
                  className="mt-2 font-mono text-sm min-h-[120px]"
                />
              </div>

              <Button onClick={handleVerify} className="w-full mt-4">
                <Check className="w-4 h-4 mr-2" />
                Verify JWT
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Horizontal Splitter */}
      <div
        className="w-1 bg-gray-300 dark:bg-gray-600 hover:bg-blue-500 dark:hover:bg-blue-400 cursor-col-resize transition-colors flex-shrink-0 jwt-splitter"
        onMouseDown={handleHorizontalMouseDown}
        style={{ minWidth: '4px', cursor: 'col-resize' }}
      />

      {/* Right Panel */}
      <div 
        className="flex flex-col overflow-hidden jwt-right-panel" 
        style={{ width: `${100 - horizontalSplitPosition}%` }}
      >
        {mode === 'decode' && decodedData && (
          <>
            {/* Header Section */}
            <div 
              className="overflow-hidden" 
              style={{ height: `${verticalSplit1Position}%` }}
            >
              <Card className="h-full flex flex-col">
                <CardContent className="p-4 flex flex-col h-full">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">Header</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(JSON.stringify(decodedData.header, null, 2), 'header')}
                    >
                      {copiedField === 'header' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                  <div className="flex-1 overflow-auto">
                    <JsonHighlighter json={decodedData.header} />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Vertical Splitter 1 */}
            <div
              className="h-1 bg-gray-300 dark:bg-gray-600 hover:bg-blue-500 dark:hover:bg-blue-400 cursor-row-resize transition-colors flex-shrink-0 jwt-splitter"
              onMouseDown={handleVertical1MouseDown}
              style={{ minHeight: '4px', cursor: 'row-resize' }}
            />

            {/* Payload Section */}
            <div 
              className="overflow-hidden" 
              style={{ height: `${verticalSplit2Position - verticalSplit1Position}%` }}
            >
              <Card className="h-full flex flex-col">
                <CardContent className="p-4 flex flex-col h-full">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">Payload</h3>
                    <div className="flex items-center gap-2">
                      {getExpiryStatus(decodedData.expiresAt, decodedData.isExpired)}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(JSON.stringify(decodedData.payload, null, 2), 'payload')}
                      >
                        {copiedField === 'payload' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                  <div className="flex-1 overflow-auto">
                    <JsonHighlighter json={decodedData.payload} />
                  </div>
                  {(decodedData.issuedAt || decodedData.expiresAt) && (
                    <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700 space-y-2">
                      {decodedData.issuedAt && (
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-gray-500 dark:text-gray-400 font-medium">Issued At:</span>
                          <span className="text-gray-900 dark:text-gray-100 font-mono">{formatDate(decodedData.issuedAt)}</span>
                        </div>
                      )}
                      {decodedData.expiresAt && (
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-gray-500 dark:text-gray-400 font-medium">Expires At:</span>
                          <span className="text-gray-900 dark:text-gray-100 font-mono">{formatDate(decodedData.expiresAt)}</span>
                          {getExpiryStatus(decodedData.expiresAt, decodedData.isExpired) && (
                            <span className="ml-2">
                              {getExpiryStatus(decodedData.expiresAt, decodedData.isExpired)}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Vertical Splitter 2 */}
            <div
              className="h-1 bg-gray-300 dark:bg-gray-600 hover:bg-blue-500 dark:hover:bg-blue-400 cursor-row-resize transition-colors flex-shrink-0 jwt-splitter"
              onMouseDown={handleVertical2MouseDown}
              style={{ minHeight: '4px', cursor: 'row-resize' }}
            />

            {/* Signature Section */}
            <div 
              className="overflow-hidden" 
              style={{ height: `${100 - verticalSplit2Position}%` }}
            >
              <Card className="h-full flex flex-col">
                <CardContent className="p-4 flex flex-col h-full">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">Signature</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(decodedData.signature, 'signature')}
                    >
                      {copiedField === 'signature' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                  <div className="text-sm font-mono break-all overflow-auto flex-1">
                    {decodedData.signature}
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}

        {mode === 'encode' && encodedToken && (
          <div className="flex-1 flex flex-col">
            <Card className="flex-1">
              <CardContent className="p-4 flex flex-col h-full">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">Encoded JWT</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(encodedToken, 'encoded')}
                  >
                    {copiedField === 'encoded' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
                <Textarea
                  value={encodedToken}
                  readOnly
                  className="font-mono text-sm flex-1"
                />
              </CardContent>
            </Card>
          </div>
        )}

        {mode === 'encode' && keyPair && (
          <Card>
            <CardContent className="p-4">
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">Private Key</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(keyPair.privateKey, 'privateKey')}
                    >
                      {copiedField === 'privateKey' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                  <Textarea
                    value={keyPair.privateKey}
                    readOnly
                    className="font-mono text-xs h-32"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">Public Key</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(keyPair.publicKey, 'publicKey')}
                    >
                      {copiedField === 'publicKey' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                  <Textarea
                    value={keyPair.publicKey}
                    readOnly
                    className="font-mono text-xs h-32"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {mode === 'verify' && verifyResult && (
          <div className="flex-1 flex flex-col space-y-4">
            <VerificationStatusBar 
              isValid={verifyResult.isValid} 
              error={verifyResult.error} 
            />
            
            <Card className="flex-1">
              <CardContent className="p-4 flex flex-col h-full">
                <div className="flex-1 overflow-auto space-y-4">
                  {verifyResult.decodedHeader && (
                    <div>
                      <h4 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">Header</h4>
                      <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
                        <JsonHighlighter json={verifyResult.decodedHeader} />
                      </div>
                    </div>
                  )}

                  {verifyResult.decodedPayload && (
                    <div>
                      <h4 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">Payload</h4>
                      <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
                        <JsonHighlighter json={verifyResult.decodedPayload} />
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
