import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Card, CardContent } from '@/components/ui';
import { Button } from '@/components/ui';
import { Input } from '@/components/ui';
import { AlertCircle, Copy, FileText, ChevronLeft, ChevronRight, Trash2, ClipboardPaste, Search, HelpCircle, Book } from 'lucide-react';

interface RegexMatch {
  full_match: string;
  start: number;
  end: number;
  groups: string[];
}

interface TestResult {
  matches: RegexMatch[];
  error: string | null;
}

// Check if running in Tauri environment
const isTauri = typeof window !== 'undefined' && '__TAURI__' in window;

// JavaScript fallback for regex testing
function testRegexJS(pattern: string, text: string, flags: string): TestResult {
  try {
    const regex = new RegExp(pattern, flags);
    const matches: RegexMatch[] = [];

    if (flags.includes('g')) {
      let match;
      while ((match = regex.exec(text)) !== null) {
        matches.push({
          full_match: match[0],
          start: match.index,
          end: match.index + match[0].length,
          groups: match.slice(1).map(g => g || '')
        });
        // Prevent infinite loop for zero-length matches
        if (match[0].length === 0) {
          regex.lastIndex++;
        }
      }
    } else {
      const match = regex.exec(text);
      if (match) {
        matches.push({
          full_match: match[0],
          start: match.index,
          end: match.index + match[0].length,
          groups: match.slice(1).map(g => g || '')
        });
      }
    }

    return { matches, error: null };
  } catch (e) {
    return { matches: [], error: `Invalid regex: ${(e as Error).message}` };
  }
}

const COMMON_PATTERNS = [
  { name: 'Email', pattern: '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}', description: 'Match email addresses' },
  { name: 'URL', pattern: 'https?://[^\\s/$.?#].[^\\s]*', description: 'Match HTTP/HTTPS URLs' },
  { name: 'IPv4', pattern: '\\b(?:[0-9]{1,3}\\.){3}[0-9]{1,3}\\b', description: 'Match IPv4 addresses' },
  { name: 'Phone (US)', pattern: '\\(?[0-9]{3}\\)?[-. ]?[0-9]{3}[-. ]?[0-9]{4}', description: 'Match US phone numbers' },
  { name: 'Date (YYYY-MM-DD)', pattern: '\\d{4}-\\d{2}-\\d{2}', description: 'Match dates in YYYY-MM-DD format' },
  { name: 'Time (HH:MM)', pattern: '\\b(?:[01]?[0-9]|2[0-3]):[0-5][0-9]\\b', description: 'Match time in 24-hour format' },
  { name: 'Hex Color', pattern: '#[0-9A-Fa-f]{6}\\b', description: 'Match hex color codes' },
  { name: 'Username', pattern: '^[a-zA-Z0-9_]{3,16}$', description: 'Match usernames (3-16 chars)' },
  { name: 'Credit Card', pattern: '\\b(?:\\d[ -]*?){13,16}\\b', description: 'Match credit card numbers' },
  { name: 'HTML Tag', pattern: '<([a-zA-Z][a-zA-Z0-9]*)\\b[^>]*>(.*?)</\\1>', description: 'Match HTML tags with content' },
];

const CHEAT_SHEET = [
  { category: 'Characters', items: [
    { pattern: '.', description: 'Any character except newline' },
    { pattern: '\\d', description: 'Digit (0-9)' },
    { pattern: '\\D', description: 'Non-digit' },
    { pattern: '\\w', description: 'Word character (a-z, A-Z, 0-9, _)' },
    { pattern: '\\W', description: 'Non-word character' },
    { pattern: '\\s', description: 'Whitespace' },
    { pattern: '\\S', description: 'Non-whitespace' },
  ]},
  { category: 'Anchors', items: [
    { pattern: '^', description: 'Start of string/line' },
    { pattern: '$', description: 'End of string/line' },
    { pattern: '\\b', description: 'Word boundary' },
    { pattern: '\\B', description: 'Non-word boundary' },
  ]},
  { category: 'Quantifiers', items: [
    { pattern: '*', description: '0 or more' },
    { pattern: '+', description: '1 or more' },
    { pattern: '?', description: '0 or 1' },
    { pattern: '{n}', description: 'Exactly n' },
    { pattern: '{n,}', description: 'n or more' },
    { pattern: '{n,m}', description: 'Between n and m' },
  ]},
  { category: 'Groups', items: [
    { pattern: '(abc)', description: 'Capture group' },
    { pattern: '(?:abc)', description: 'Non-capture group' },
    { pattern: '(?=abc)', description: 'Positive lookahead' },
    { pattern: '(?!abc)', description: 'Negative lookahead' },
    { pattern: '[abc]', description: 'Character class' },
    { pattern: '[^abc]', description: 'Negated class' },
  ]},
];

export default function RegexTester() {
  const [pattern, setPattern] = useState('');
  const [testText, setTestText] = useState('');
  const [outputFormat, setOutputFormat] = useState('$0\\n');
  const [globalMatch, setGlobalMatch] = useState(true);
  const [ignoreCase, setIgnoreCase] = useState(false);
  const [multiline, setMultiline] = useState(false);
  const [dotAll, setDotAll] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const [matchSearch, setMatchSearch] = useState('');
  const [showCheatSheet, setShowCheatSheet] = useState(false);
  const textDisplayRef = useRef<HTMLDivElement>(null);

  // Real-time regex testing with debounce
  useEffect(() => {
    if (!pattern || !testText) {
      setTestResult(null);
      return;
    }

    const timer = setTimeout(async () => {
      const flags = `${globalMatch ? 'g' : ''}${ignoreCase ? 'i' : ''}${multiline ? 'm' : ''}${dotAll ? 's' : ''}`;

      if (isTauri) {
        try {
          const result = await invoke<TestResult>('test_regex', {
            pattern,
            text: testText,
            flags
          });
          setTestResult(result);
        } catch (error) {
          setTestResult({ matches: [], error: error?.toString() || 'Failed to test regex' });
        }
      } else {
        // Use JavaScript fallback
        const result = testRegexJS(pattern, testText, flags);
        setTestResult(result);
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [pattern, testText, globalMatch, ignoreCase, multiline, dotAll]);

  // Reset current match index when matches change
  useEffect(() => {
    setCurrentMatchIndex(0);
  }, [testResult?.matches.length]);

  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
  }, []);

  const pasteFromClipboard = useCallback(async (setter: (value: string) => void) => {
    try {
      const text = await navigator.clipboard.readText();
      setter(text);
    } catch {
      // Clipboard access denied
    }
  }, []);

  const handleSampleData = () => {
    setPattern('[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}');
    setTestText(`Here are some emails:
john.doe@example.com
jane_smith@company.co.uk
invalid-email@
another@test.org
not_an_email_at_all
admin@localhost`);
  };

  const handleClear = () => {
    setPattern('');
    setTestText('');
    setTestResult(null);
  };

  // Navigate to previous/next match
  const goToPrevMatch = () => {
    if (testResult && testResult.matches.length > 0) {
      setCurrentMatchIndex((prev) =>
        prev <= 0 ? testResult.matches.length - 1 : prev - 1
      );
    }
  };

  const goToNextMatch = () => {
    if (testResult && testResult.matches.length > 0) {
      setCurrentMatchIndex((prev) =>
        prev >= testResult.matches.length - 1 ? 0 : prev + 1
      );
    }
  };

  // Filter matches by search
  const filteredMatches = useMemo(() => {
    if (!testResult || !testResult.matches.length) return [];
    if (!matchSearch) return testResult.matches;
    return testResult.matches.filter(m =>
      m.full_match.toLowerCase().includes(matchSearch.toLowerCase())
    );
  }, [testResult, matchSearch]);

  // Generate formatted output
  const formattedOutput = useMemo(() => {
    if (!testResult || testResult.error || !testResult.matches.length) return '';

    return testResult.matches.map(match => {
      let output = outputFormat;
      // Replace $0 with full match
      output = output.replace(/\$0/g, match.full_match);
      // Replace $1, $2, etc. with capture groups
      match.groups.forEach((group, i) => {
        output = output.replace(new RegExp(`\\$${i + 1}`, 'g'), group || '');
      });
      // Handle escape sequences
      output = output.replace(/\\n/g, '\n').replace(/\\t/g, '\t');
      return output;
    }).join('');
  }, [testResult, outputFormat]);

  // Highlighted text with inline highlighting (like DevUtils)
  const highlightedTextContent = useMemo(() => {
    if (!testResult || testResult.matches.length === 0 || testResult.error) {
      return <span>{testText}</span>;
    }

    const matches = [...testResult.matches].sort((a, b) => a.start - b.start);
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;

    matches.forEach((match, index) => {
      if (match.start > lastIndex) {
        parts.push(
          <span key={`text-${index}`}>
            {testText.substring(lastIndex, match.start)}
          </span>
        );
      }
      parts.push(
        <span
          key={`match-${index}`}
          onClick={() => setCurrentMatchIndex(index)}
          style={{
            backgroundColor: index === currentMatchIndex ? '#22c55e' : '#16a34a',
            color: index === currentMatchIndex ? '#000' : '#fff',
            padding: '0 2px',
            borderRadius: '2px',
            cursor: 'pointer',
            fontWeight: index === currentMatchIndex ? 600 : 400,
          }}
        >
          {match.full_match}
        </span>
      );
      lastIndex = match.end;
    });

    if (lastIndex < testText.length) {
      parts.push(
        <span key="text-end">
          {testText.substring(lastIndex)}
        </span>
      );
    }

    return <>{parts}</>;
  }, [testText, testResult, currentMatchIndex]);

  const matchCount = testResult?.matches.length || 0;

  return (
    <div className="w-full max-w-6xl mx-auto space-y-4">
      {/* Cheat Sheet Panel */}
      {showCheatSheet && (
        <Card>
          <CardContent className="py-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {CHEAT_SHEET.map((section) => (
                <div key={section.category}>
                  <h3 className="font-semibold text-sm mb-2 text-gray-700 dark:text-gray-300">
                    {section.category}
                  </h3>
                  <div className="space-y-1">
                    {section.items.map((item) => (
                      <button
                        key={item.pattern}
                        onClick={() => setPattern(prev => prev + item.pattern)}
                        className="w-full text-left px-2 py-1 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 rounded flex items-center gap-2"
                        title={item.description}
                      >
                        <code className="font-mono text-blue-600 dark:text-blue-400 min-w-[40px]">
                          {item.pattern}
                        </code>
                        <span className="text-gray-500 dark:text-gray-400 truncate">
                          {item.description}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* RegExp Input */}
      <Card>
        <CardContent className="py-4 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[60px]">RegExp:</span>
            <Button variant="outline" size="sm" onClick={() => pasteFromClipboard(setPattern)}>
              <ClipboardPaste className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleSampleData}>
              <FileText className="w-4 h-4 mr-1" />
              Sample
            </Button>
            <Button variant="outline" size="sm" onClick={handleClear}>
              <Trash2 className="w-4 h-4 mr-1" />
              Clear
            </Button>
            <div className="flex items-center gap-3 ml-4 text-sm">
              <label className="flex items-center gap-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={globalMatch}
                  onChange={(e) => setGlobalMatch(e.target.checked)}
                  className="h-3 w-3"
                />
                <span className="text-gray-600 dark:text-gray-400">g</span>
              </label>
              <label className="flex items-center gap-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={ignoreCase}
                  onChange={(e) => setIgnoreCase(e.target.checked)}
                  className="h-3 w-3"
                />
                <span className="text-gray-600 dark:text-gray-400">i</span>
              </label>
              <label className="flex items-center gap-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={multiline}
                  onChange={(e) => setMultiline(e.target.checked)}
                  className="h-3 w-3"
                />
                <span className="text-gray-600 dark:text-gray-400">m</span>
              </label>
              <label className="flex items-center gap-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={dotAll}
                  onChange={(e) => setDotAll(e.target.checked)}
                  className="h-3 w-3"
                />
                <span className="text-gray-600 dark:text-gray-400">s</span>
              </label>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <select
                onChange={(e) => {
                  const p = COMMON_PATTERNS.find(p => p.name === e.target.value);
                  if (p) setPattern(p.pattern);
                }}
                className="px-2 py-1 text-sm bg-transparent border border-gray-300 dark:border-gray-600 rounded"
                value=""
              >
                <option value="">Common patterns</option>
                {COMMON_PATTERNS.map((p) => (
                  <option key={p.name} value={p.name}>{p.name}</option>
                ))}
              </select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCheatSheet(!showCheatSheet)}
              >
                <Book className="w-4 h-4 mr-1" />
                Cheat Sheet
              </Button>
            </div>
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Enter your regex pattern (e.g., [a-z]+)"
              value={pattern}
              onChange={(e) => setPattern(e.target.value)}
              className="font-mono text-base flex-1"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => copyToClipboard(pattern)}
              disabled={!pattern}
              title="Copy pattern"
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          {testResult?.error && (
            <div className="flex items-center gap-2 text-red-500 text-sm">
              <AlertCircle className="h-4 w-4" />
              {testResult.error}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main Content: Text + Matches */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[40px]">Text:</span>
            <Button variant="outline" size="sm" onClick={() => pasteFromClipboard(setTestText)}>
              <ClipboardPaste className="w-4 h-4" />
            </Button>
            <div className="ml-auto flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7"
                onClick={goToPrevMatch}
                disabled={matchCount === 0}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium min-w-[80px] text-center">
                {matchCount > 0 ? `${matchCount} match${matchCount !== 1 ? 'es' : ''}` : 'No matches'}
              </span>
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7"
                onClick={goToNextMatch}
                disabled={matchCount === 0}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
            {/* Left: Text Input with Highlighting - Overlay technique */}
            <div className="relative" style={{ minHeight: '250px' }}>
              {/* Base layer - textarea for editing */}
              <textarea
                value={testText}
                onChange={(e) => setTestText(e.target.value)}
                placeholder="Enter text to test against your regex pattern..."
                className="absolute inset-0 w-full h-full rounded-lg border border-gray-600 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                  fontSize: '14px',
                  lineHeight: '21px',
                  padding: '12px',
                  margin: 0,
                  boxSizing: 'border-box',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  overflowWrap: 'break-word',
                  backgroundColor: '#1a1a2e',
                  color: 'transparent',
                  WebkitTextFillColor: 'transparent',
                  caretColor: '#fff',
                }}
              />
              {/* Overlay layer - shows highlighted content (pointer-events: none) */}
              <div
                ref={textDisplayRef}
                className="absolute inset-0 rounded-lg overflow-hidden pointer-events-none"
                style={{
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                  fontSize: '14px',
                  lineHeight: '21px',
                  padding: '12px',
                  margin: 0,
                  boxSizing: 'border-box',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  overflowWrap: 'break-word',
                  color: '#e0e0e0',
                }}
              >
                {highlightedTextContent}
              </div>
            </div>

            {/* Right: Matches List - takes 1 column on md+ */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <Input
                  placeholder="Search matches..."
                  value={matchSearch}
                  onChange={(e) => setMatchSearch(e.target.value)}
                  className="text-sm h-8"
                />
              </div>
              <div className="space-y-1 max-h-[280px] overflow-y-auto">
              {filteredMatches.length === 0 ? (
                <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                  {testResult?.error ? 'Invalid pattern' : matchCount === 0 ? 'No matches found' : 'No results'}
                </div>
              ) : (
                filteredMatches.map((match, index) => {
                  const originalIndex = testResult?.matches.indexOf(match) || 0;
                  return (
                    <button
                      key={index}
                      onClick={() => setCurrentMatchIndex(originalIndex)}
                      className={`w-full text-left p-2 rounded text-sm transition-colors ${
                        originalIndex === currentMatchIndex
                          ? 'bg-green-100 dark:bg-green-900'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <ChevronRight className="w-3 h-3 text-gray-400 flex-shrink-0" />
                        <span className="font-mono truncate flex-1 min-w-0">"{match.full_match}"</span>
                        <span className="text-xs text-gray-400 flex-shrink-0 whitespace-nowrap">
                          {`{${match.start}, ${match.end}}`}
                        </span>
                      </div>
                      {match.groups.length > 0 && (
                        <div className="ml-5 mt-1 text-xs text-gray-500">
                          Groups: {match.groups.map((g, i) => `$${i+1}="${g}"`).join(', ')}
                        </div>
                      )}
                    </button>
                  );
                })
              )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Output Section */}
      <Card>
        <CardContent className="py-4 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[55px]">Output:</span>
            <Input
              value={outputFormat}
              onChange={(e) => setOutputFormat(e.target.value)}
              placeholder="$0\n"
              className="font-mono text-sm w-32 h-8"
            />
            <button
              className="text-gray-400 hover:text-gray-600"
              title="Use $0 for full match, $1, $2... for capture groups. Use \n for newline, \t for tab."
            >
              <HelpCircle className="w-4 h-4" />
            </button>
            <Button
              variant="outline"
              size="sm"
              className="ml-auto"
              onClick={() => copyToClipboard(formattedOutput)}
              disabled={!formattedOutput}
            >
              <Copy className="w-4 h-4 mr-1" />
              Copy
            </Button>
          </div>
          <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg font-mono text-sm min-h-[80px] max-h-[200px] overflow-auto whitespace-pre-wrap">
            {formattedOutput || <span className="text-gray-400">Output will appear here...</span>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
