import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Copy, FileText, Hash, Type, BarChart3 } from 'lucide-react';

const TextUtilities: React.FC = () => {
  const [activeTab, setActiveTab] = useState('html-entities');
  
  // HTML Entities state
  const [htmlInput, setHtmlInput] = useState('');
  const [htmlOutput, setHtmlOutput] = useState('');
  const [htmlMode, setHtmlMode] = useState<'encode' | 'decode'>('encode');
  
  // Unicode state
  const [unicodeInput, setUnicodeInput] = useState('');
  const [unicodeOutput, setUnicodeOutput] = useState('');
  const [unicodeMode, setUnicodeMode] = useState<'to-unicode' | 'from-unicode'>('to-unicode');
  const [unicodeFormat, setUnicodeFormat] = useState<'U+' | '\\u' | '&#x'>('U+');
  
  // Case Conversion state
  const [caseInput, setCaseInput] = useState('');
  const [caseOutput, setCaseOutput] = useState('');
  const [caseType, setCaseType] = useState<'camel' | 'pascal' | 'snake' | 'kebab' | 'constant'>('camel');
  
  // Text Statistics state
  const [statsInput, setStatsInput] = useState('');
  const [stats, setStats] = useState({
    characters: 0,
    charactersNoSpaces: 0,
    words: 0,
    lines: 0,
    paragraphs: 0
  });

  // HTML Entities functions
  const htmlEntities: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '¢': '&cent;',
    '£': '&pound;',
    '¥': '&yen;',
    '€': '&euro;',
    '©': '&copy;',
    '®': '&reg;',
    '™': '&trade;',
    '§': '&sect;',
    '¶': '&para;',
    '•': '&bull;',
    '…': '&hellip;',
    '–': '&ndash;',
    '—': '&mdash;',
    '«': '&laquo;',
    '»': '&raquo;',
    '¿': '&iquest;',
    '¡': '&iexcl;',
    '×': '&times;',
    '÷': '&divide;',
    '°': '&deg;',
    '±': '&plusmn;',
    '¼': '&frac14;',
    '½': '&frac12;',
    '¾': '&frac34;',
    'À': '&Agrave;',
    'É': '&Eacute;',
    'Ñ': '&Ntilde;',
    'Ö': '&Ouml;',
    'Ü': '&Uuml;',
    'ß': '&szlig;',
    'à': '&agrave;',
    'é': '&eacute;',
    'ñ': '&ntilde;',
    'ö': '&ouml;',
    'ü': '&uuml;'
  };

  const reverseHtmlEntities = Object.fromEntries(
    Object.entries(htmlEntities).map(([char, entity]) => [entity, char])
  );

  const encodeHtmlEntities = (text: string): string => {
    return text.replace(/[&<>"'¢£¥€©®™§¶•…–—«»¿¡×÷°±¼½¾ÀÉÑÖÜßàéñöü]/g, (match) => {
      return htmlEntities[match] || match;
    });
  };

  const decodeHtmlEntities = (text: string): string => {
    // Decode named entities
    let decoded = text.replace(/&[a-zA-Z]+;/g, (match) => {
      return reverseHtmlEntities[match] || match;
    });
    
    // Decode numeric entities (decimal)
    decoded = decoded.replace(/&#(\d+);/g, (_match, num) => {
      return String.fromCharCode(parseInt(num, 10));
    });
    
    // Decode numeric entities (hexadecimal)
    decoded = decoded.replace(/&#x([0-9a-fA-F]+);/g, (_match, hex) => {
      return String.fromCharCode(parseInt(hex, 16));
    });
    
    return decoded;
  };

  const handleHtmlConversion = useCallback(() => {
    if (htmlMode === 'encode') {
      setHtmlOutput(encodeHtmlEntities(htmlInput));
    } else {
      setHtmlOutput(decodeHtmlEntities(htmlInput));
    }
  }, [htmlInput, htmlMode]);

  // Unicode functions
  const toUnicode = (text: string, format: string): string => {
    const result: string[] = [];
    
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const code = char.charCodeAt(0);
      
      // Check for surrogate pairs (emoji and other characters beyond U+FFFF)
      if (code >= 0xD800 && code <= 0xDBFF && i + 1 < text.length) {
        const lowSurrogate = text.charCodeAt(i + 1);
        if (lowSurrogate >= 0xDC00 && lowSurrogate <= 0xDFFF) {
          // Calculate the actual code point
          const highBits = (code - 0xD800) * 0x400;
          const lowBits = lowSurrogate - 0xDC00;
          const codePoint = highBits + lowBits + 0x10000;
          
          if (format === 'U+') {
            result.push(`U+${codePoint.toString(16).toUpperCase()}`);
          } else if (format === '\\u') {
            // For \u format, we need to output the surrogate pair
            result.push(`\\u${code.toString(16).padStart(4, '0')}\\u${lowSurrogate.toString(16).padStart(4, '0')}`);
          } else { // &#x
            result.push(`&#x${codePoint.toString(16).toUpperCase()};`);
          }
          i++; // Skip the low surrogate
          continue;
        }
      }
      
      // Regular character
      if (format === 'U+') {
        result.push(`U+${code.toString(16).toUpperCase().padStart(4, '0')}`);
      } else if (format === '\\u') {
        result.push(`\\u${code.toString(16).padStart(4, '0')}`);
      } else { // &#x
        result.push(`&#x${code.toString(16).toUpperCase()};`);
      }
    }
    
    return result.join(' ');
  };

  const fromUnicode = (text: string): string => {
    // Handle U+ format
    let result = text.replace(/U\+([0-9a-fA-F]+)/g, (_match, hex) => {
      const codePoint = parseInt(hex, 16);
      // Use String.fromCodePoint for proper handling of values > U+FFFF
      return String.fromCodePoint(codePoint);
    });
    
    // Handle \u format (including surrogate pairs)
    result = result.replace(/\\u([0-9a-fA-F]{4})\\u([0-9a-fA-F]{4})/g, (_match, high, low) => {
      const highCode = parseInt(high, 16);
      const lowCode = parseInt(low, 16);
      
      // Check if this is a valid surrogate pair
      if (highCode >= 0xD800 && highCode <= 0xDBFF && lowCode >= 0xDC00 && lowCode <= 0xDFFF) {
        // Calculate the actual code point
        const highBits = (highCode - 0xD800) * 0x400;
        const lowBits = lowCode - 0xDC00;
        const codePoint = highBits + lowBits + 0x10000;
        return String.fromCodePoint(codePoint);
      }
      
      // Not a surrogate pair, return as two separate characters
      return String.fromCharCode(highCode) + String.fromCharCode(lowCode);
    });
    
    // Handle remaining single \u codes
    result = result.replace(/\\u([0-9a-fA-F]{4})/g, (_match, hex) => {
      return String.fromCharCode(parseInt(hex, 16));
    });
    
    // Handle &#x format
    result = result.replace(/&#x([0-9a-fA-F]+);/g, (_match, hex) => {
      const codePoint = parseInt(hex, 16);
      return String.fromCodePoint(codePoint);
    });
    
    return result;
  };

  const handleUnicodeConversion = useCallback(() => {
    if (unicodeMode === 'to-unicode') {
      setUnicodeOutput(toUnicode(unicodeInput, unicodeFormat));
    } else {
      setUnicodeOutput(fromUnicode(unicodeInput));
    }
  }, [unicodeInput, unicodeMode, unicodeFormat]);

  // Case Conversion functions
  const toCamelCase = (str: string): string => {
    return str
      .replace(/[^a-zA-Z0-9]+(.)/g, (_match, chr) => chr.toUpperCase())
      .replace(/^[A-Z]/, (match) => match.toLowerCase());
  };

  const toPascalCase = (str: string): string => {
    return str
      .replace(/[^a-zA-Z0-9]+(.)/g, (_match, chr) => chr.toUpperCase())
      .replace(/^[a-z]/, (match) => match.toUpperCase());
  };

  const toSnakeCase = (str: string): string => {
    return str
      .replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)
      .replace(/^_/, '')
      .replace(/[^a-zA-Z0-9]+/g, '_')
      .replace(/_+/g, '_')
      .toLowerCase();
  };

  const toKebabCase = (str: string): string => {
    return str
      .replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)
      .replace(/^-/, '')
      .replace(/[^a-zA-Z0-9]+/g, '-')
      .replace(/-+/g, '-')
      .toLowerCase();
  };

  const toConstantCase = (str: string): string => {
    return toSnakeCase(str).toUpperCase();
  };

  const handleCaseConversion = useCallback(() => {
    let result = '';
    switch (caseType) {
      case 'camel':
        result = toCamelCase(caseInput);
        break;
      case 'pascal':
        result = toPascalCase(caseInput);
        break;
      case 'snake':
        result = toSnakeCase(caseInput);
        break;
      case 'kebab':
        result = toKebabCase(caseInput);
        break;
      case 'constant':
        result = toConstantCase(caseInput);
        break;
    }
    setCaseOutput(result);
  }, [caseInput, caseType]);

  // Text Statistics functions
  const calculateStats = useCallback(() => {
    const text = statsInput;
    
    // Characters
    const characters = text.length;
    const charactersNoSpaces = text.replace(/\s/g, '').length;
    
    // Words
    const words = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
    
    // Lines
    const lines = text === '' ? 0 : text.split('\n').length;
    
    // Paragraphs (separated by double newlines)
    const paragraphs = text.trim() === '' ? 0 : text.trim().split(/\n\s*\n/).filter(p => p.trim() !== '').length;
    
    setStats({
      characters,
      charactersNoSpaces,
      words,
      lines,
      paragraphs
    });
  }, [statsInput]);

  // Copy to clipboard
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Sample data
  const loadHtmlSample = () => {
    setHtmlInput('Hello & welcome to <DevWorkbench>! "Special" characters: © 2024 • Price: €50');
  };

  const loadUnicodeSample = () => {
    setUnicodeInput('Hello 世界! 😊 Unicode: ñ é ü');
  };

  const loadCaseSample = () => {
    setCaseInput('convert_this_text TO different-cases');
  };

  const loadStatsSample = () => {
    setStatsInput(`This is a sample text for statistics.
It has multiple lines.

And even multiple paragraphs!
Total words: quite a few.`);
  };

  // Auto-convert on input change
  React.useEffect(() => {
    handleHtmlConversion();
  }, [handleHtmlConversion]);

  React.useEffect(() => {
    handleUnicodeConversion();
  }, [handleUnicodeConversion]);

  React.useEffect(() => {
    handleCaseConversion();
  }, [handleCaseConversion]);

  React.useEffect(() => {
    calculateStats();
  }, [calculateStats]);

  const tabs = [
    { id: 'html-entities', name: 'HTML Entities', icon: FileText },
    { id: 'unicode', name: 'Unicode', icon: Hash },
    { id: 'case-conversion', name: 'Case Convert', icon: Type },
    { id: 'statistics', name: 'Statistics', icon: BarChart3 }
  ];

  return (
    <div className="space-y-4">
          {/* Tab Navigation */}
          <div className="flex space-x-1 bg-muted p-1 rounded-lg">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.name}
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          {activeTab === 'html-entities' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Select
                  value={htmlMode}
                  onChange={(e) => setHtmlMode(e.target.value as 'encode' | 'decode')}
                  className="w-32"
                  options={[
                    { value: 'encode', label: 'Encode' },
                    { value: 'decode', label: 'Decode' }
                  ]}
                />
                <Button onClick={loadHtmlSample} variant="outline" size="sm">
                  Load Sample
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Input</label>
                  <Textarea
                    value={htmlInput}
                    onChange={(e) => setHtmlInput(e.target.value)}
                    placeholder={htmlMode === 'encode' ? 'Enter text to encode...' : 'Enter HTML entities to decode...'}
                    className="font-mono"
                    rows={6}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-sm font-medium">Output</label>
                    <Button
                      onClick={() => copyToClipboard(htmlOutput)}
                      variant="outline"
                      size="sm"
                      disabled={!htmlOutput}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </Button>
                  </div>
                  <Textarea
                    value={htmlOutput}
                    readOnly
                    className="font-mono bg-muted"
                    rows={6}
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'unicode' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Select
                    value={unicodeMode}
                    onChange={(e) => setUnicodeMode(e.target.value as 'to-unicode' | 'from-unicode')}
                    className="w-40"
                    options={[
                      { value: 'to-unicode', label: 'To Unicode' },
                      { value: 'from-unicode', label: 'From Unicode' }
                    ]}
                  />
                  {unicodeMode === 'to-unicode' && (
                    <Select
                      value={unicodeFormat}
                      onChange={(e) => setUnicodeFormat(e.target.value as 'U+' | '\\u' | '&#x')}
                      className="w-32"
                      options={[
                        { value: 'U+', label: 'U+' },
                        { value: '\\u', label: '\\u' },
                        { value: '&#x', label: '&#x' }
                      ]}
                    />
                  )}
                </div>
                <Button onClick={loadUnicodeSample} variant="outline" size="sm">
                  Load Sample
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Input</label>
                  <Textarea
                    value={unicodeInput}
                    onChange={(e) => setUnicodeInput(e.target.value)}
                    placeholder={unicodeMode === 'to-unicode' ? 'Enter text to convert...' : 'Enter Unicode codes...'}
                    className="font-mono"
                    rows={6}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-sm font-medium">Output</label>
                    <Button
                      onClick={() => copyToClipboard(unicodeOutput)}
                      variant="outline"
                      size="sm"
                      disabled={!unicodeOutput}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </Button>
                  </div>
                  <Textarea
                    value={unicodeOutput}
                    readOnly
                    className="font-mono bg-muted"
                    rows={6}
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'case-conversion' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Select
                  value={caseType}
                  onChange={(e) => setCaseType(e.target.value as 'camel' | 'pascal' | 'snake' | 'kebab' | 'constant')}
                  className="w-48"
                  options={[
                    { value: 'camel', label: 'camelCase' },
                    { value: 'pascal', label: 'PascalCase' },
                    { value: 'snake', label: 'snake_case' },
                    { value: 'kebab', label: 'kebab-case' },
                    { value: 'constant', label: 'CONSTANT_CASE' }
                  ]}
                />
                <Button onClick={loadCaseSample} variant="outline" size="sm">
                  Load Sample
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Input</label>
                  <Textarea
                    value={caseInput}
                    onChange={(e) => setCaseInput(e.target.value)}
                    placeholder="Enter text to convert..."
                    className="font-mono"
                    rows={6}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-sm font-medium">Output</label>
                    <Button
                      onClick={() => copyToClipboard(caseOutput)}
                      variant="outline"
                      size="sm"
                      disabled={!caseOutput}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </Button>
                  </div>
                  <Textarea
                    value={caseOutput}
                    readOnly
                    className="font-mono bg-muted"
                    rows={6}
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'statistics' && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <Button onClick={loadStatsSample} variant="outline" size="sm">
                  Load Sample
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Text to Analyze</label>
                  <Textarea
                    value={statsInput}
                    onChange={(e) => setStatsInput(e.target.value)}
                    placeholder="Enter text to analyze..."
                    className="font-mono"
                    rows={8}
                  />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="bg-muted p-4 rounded-lg">
                    <div className="font-semibold text-sm text-muted-foreground">Characters</div>
                    <div className="text-2xl font-mono">{stats.characters}</div>
                  </div>
                  <div className="bg-muted p-4 rounded-lg">
                    <div className="font-semibold text-sm text-muted-foreground">Characters (no spaces)</div>
                    <div className="text-2xl font-mono">{stats.charactersNoSpaces}</div>
                  </div>
                  <div className="bg-muted p-4 rounded-lg">
                    <div className="font-semibold text-sm text-muted-foreground">Words</div>
                    <div className="text-2xl font-mono">{stats.words}</div>
                  </div>
                  <div className="bg-muted p-4 rounded-lg">
                    <div className="font-semibold text-sm text-muted-foreground">Lines</div>
                    <div className="text-2xl font-mono">{stats.lines}</div>
                  </div>
                  <div className="bg-muted p-4 rounded-lg">
                    <div className="font-semibold text-sm text-muted-foreground">Paragraphs</div>
                    <div className="text-2xl font-mono">{stats.paragraphs}</div>
                  </div>
                </div>
              </div>
            </div>
          )}
    </div>
  );
};

export default TextUtilities;
