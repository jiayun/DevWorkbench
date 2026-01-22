import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { Copy, Trash2, FileText } from 'lucide-react';

// 盤古之白：在中英文之間自動加上空白
const addPanguSpacing = (text: string): string => {
  // CJK 字元範圍（包含中日韓文字、注音、假名等）
  const CJK = '\\u2e80-\\u2eff\\u2f00-\\u2fdf\\u3040-\\u309f\\u30a0-\\u30ff\\u3100-\\u312f\\u3200-\\u32ff\\u3400-\\u4dbf\\u4e00-\\u9fff\\uf900-\\ufaff\\ufe30-\\ufe4f';

  // 規則 1: 中文字後接英數字 → 中間加空白
  // 規則 2: 英數字後接中文字 → 中間加空白
  return text
    .replace(new RegExp(`([${CJK}])([A-Za-z0-9])`, 'g'), '$1 $2')
    .replace(new RegExp(`([A-Za-z0-9])([${CJK}])`, 'g'), '$1 $2');
};

export const PanguSpacing: React.FC = () => {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');

  // 自動轉換
  const processText = useCallback(() => {
    if (!input) {
      setOutput('');
      return;
    }
    setOutput(addPanguSpacing(input));
  }, [input]);

  useEffect(() => {
    processText();
  }, [processText]);

  // 複製到剪貼簿
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(output);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // 清除輸入
  const clearInput = () => {
    setInput('');
    setOutput('');
  };

  // 載入範例
  const loadSample = () => {
    setInput(`你好world
測試123測試
React是一個JavaScript函式庫
這是2024年的MacBook Pro
5個steps完成setup
中文english中文
已經有空白 test 不會重複`);
  };

  // 統計資訊
  const inputLength = input.length;
  const outputLength = output.length;
  const addedSpaces = outputLength - inputLength;

  return (
    <div className="space-y-4">
      {/* 操作按鈕列 */}
      <div className="flex items-center justify-end space-x-2">
        <Button onClick={loadSample} variant="outline" size="sm">
          <FileText className="h-4 w-4 mr-2" />
          Load Sample
        </Button>
        <Button onClick={clearInput} variant="outline" size="sm" disabled={!input}>
          <Trash2 className="h-4 w-4 mr-2" />
          Clear
        </Button>
      </div>

      {/* 輸入區域 */}
      <div>
        <label className="text-sm font-medium mb-1 block">Input</label>
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="輸入中英文混合的文字..."
          className="font-mono"
          rows={8}
        />
        <div className="text-xs text-muted-foreground mt-1">
          {inputLength} characters
        </div>
      </div>

      {/* 輸出區域 */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-sm font-medium">Output</label>
          <Button
            onClick={copyToClipboard}
            variant="outline"
            size="sm"
            disabled={!output}
          >
            <Copy className="h-4 w-4 mr-2" />
            Copy
          </Button>
        </div>
        <Textarea
          value={output}
          readOnly
          className="font-mono bg-muted"
          rows={8}
        />
        <div className="text-xs text-muted-foreground mt-1">
          {outputLength} characters
          {addedSpaces > 0 && (
            <span className="text-green-600 dark:text-green-400 ml-2">
              (+{addedSpaces} spaces added)
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default PanguSpacing;
