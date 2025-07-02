import { useState, useEffect, useCallback, useRef } from "react";
import { Copy, Clipboard, Shuffle, Trash2 } from "lucide-react";

export function NumberBaseConverter() {
  const [binaryValue, setBinaryValue] = useState("");
  const [octalValue, setOctalValue] = useState("");
  const [decimalValue, setDecimalValue] = useState("");
  const [hexValue, setHexValue] = useState("");
  const [customBase, setCustomBase] = useState(36);
  const [customValue, setCustomValue] = useState("");
  
  const activeFieldRef = useRef<string | null>(null);
  const inputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});
  
  // Track the last field that was updated to prevent circular updates
  const lastUpdatedField = useRef<string | null>(null);

  // Convert decimal to other bases
  const convertFromDecimal = useCallback((decimal: number) => {
    if (isNaN(decimal) || decimal < 0) {
      return {
        binary: "",
        octal: "",
        hex: "",
        custom: "",
      };
    }

    return {
      binary: decimal.toString(2),
      octal: decimal.toString(8),
      hex: decimal.toString(16).toLowerCase(),
      custom: decimal.toString(customBase).toLowerCase(),
    };
  }, [customBase]);

  // Convert from any base to decimal
  const convertToDecimal = (value: string, base: number): number | null => {
    if (!value.trim()) return null;
    const parsed = parseInt(value, base);
    return isNaN(parsed) ? null : parsed;
  };

  // Simple field change handler - only updates the current field
  const handleFieldChange = (field: string, value: string) => {
    lastUpdatedField.current = field;
    
    switch (field) {
      case 'binary':
        setBinaryValue(value);
        break;
      case 'octal':
        setOctalValue(value);
        break;
      case 'decimal':
        setDecimalValue(value);
        break;
      case 'hex':
        setHexValue(value.toLowerCase());
        break;
      case 'custom':
        setCustomValue(value.toLowerCase());
        break;
    }
  };

  // Update other fields when binary changes
  useEffect(() => {
    if (lastUpdatedField.current === 'binary') {
      const decimal = convertToDecimal(binaryValue, 2);
      if (decimal !== null) {
        const converted = convertFromDecimal(decimal);
        // Only update fields that are NOT currently being edited
        if (activeFieldRef.current !== 'octal') setOctalValue(converted.octal);
        if (activeFieldRef.current !== 'decimal') setDecimalValue(decimal.toString());
        if (activeFieldRef.current !== 'hex') setHexValue(converted.hex);
        if (activeFieldRef.current !== 'custom') setCustomValue(converted.custom);
      } else if (binaryValue === '') {
        if (activeFieldRef.current !== 'octal') setOctalValue('');
        if (activeFieldRef.current !== 'decimal') setDecimalValue('');
        if (activeFieldRef.current !== 'hex') setHexValue('');
        if (activeFieldRef.current !== 'custom') setCustomValue('');
      }
    }
  }, [binaryValue, convertFromDecimal]);

  // Update other fields when octal changes
  useEffect(() => {
    if (lastUpdatedField.current === 'octal') {
      const decimal = convertToDecimal(octalValue, 8);
      if (decimal !== null) {
        const converted = convertFromDecimal(decimal);
        // Only update fields that are NOT currently being edited
        if (activeFieldRef.current !== 'binary') setBinaryValue(converted.binary);
        if (activeFieldRef.current !== 'decimal') setDecimalValue(decimal.toString());
        if (activeFieldRef.current !== 'hex') setHexValue(converted.hex);
        if (activeFieldRef.current !== 'custom') setCustomValue(converted.custom);
      } else if (octalValue === '') {
        if (activeFieldRef.current !== 'binary') setBinaryValue('');
        if (activeFieldRef.current !== 'decimal') setDecimalValue('');
        if (activeFieldRef.current !== 'hex') setHexValue('');
        if (activeFieldRef.current !== 'custom') setCustomValue('');
      }
    }
  }, [octalValue, convertFromDecimal]);

  // Update other fields when decimal changes
  useEffect(() => {
    if (lastUpdatedField.current === 'decimal') {
      const decimal = convertToDecimal(decimalValue, 10);
      if (decimal !== null) {
        const converted = convertFromDecimal(decimal);
        // Only update fields that are NOT currently being edited
        if (activeFieldRef.current !== 'binary') setBinaryValue(converted.binary);
        if (activeFieldRef.current !== 'octal') setOctalValue(converted.octal);
        if (activeFieldRef.current !== 'hex') setHexValue(converted.hex);
        if (activeFieldRef.current !== 'custom') setCustomValue(converted.custom);
      } else if (decimalValue === '') {
        if (activeFieldRef.current !== 'binary') setBinaryValue('');
        if (activeFieldRef.current !== 'octal') setOctalValue('');
        if (activeFieldRef.current !== 'hex') setHexValue('');
        if (activeFieldRef.current !== 'custom') setCustomValue('');
      }
    }
  }, [decimalValue, convertFromDecimal]);

  // Update other fields when hex changes
  useEffect(() => {
    if (lastUpdatedField.current === 'hex') {
      const decimal = convertToDecimal(hexValue, 16);
      if (decimal !== null) {
        const converted = convertFromDecimal(decimal);
        // Only update fields that are NOT currently being edited
        if (activeFieldRef.current !== 'binary') setBinaryValue(converted.binary);
        if (activeFieldRef.current !== 'octal') setOctalValue(converted.octal);
        if (activeFieldRef.current !== 'decimal') setDecimalValue(decimal.toString());
        if (activeFieldRef.current !== 'custom') setCustomValue(converted.custom);
      } else if (hexValue === '') {
        if (activeFieldRef.current !== 'binary') setBinaryValue('');
        if (activeFieldRef.current !== 'octal') setOctalValue('');
        if (activeFieldRef.current !== 'decimal') setDecimalValue('');
        if (activeFieldRef.current !== 'custom') setCustomValue('');
      }
    }
  }, [hexValue, convertFromDecimal]);

  // Update other fields when custom changes
  useEffect(() => {
    if (lastUpdatedField.current === 'custom') {
      const decimal = convertToDecimal(customValue, customBase);
      if (decimal !== null) {
        const converted = convertFromDecimal(decimal);
        // Only update fields that are NOT currently being edited
        if (activeFieldRef.current !== 'binary') setBinaryValue(converted.binary);
        if (activeFieldRef.current !== 'octal') setOctalValue(converted.octal);
        if (activeFieldRef.current !== 'decimal') setDecimalValue(decimal.toString());
        if (activeFieldRef.current !== 'hex') setHexValue(converted.hex);
      } else if (customValue === '') {
        if (activeFieldRef.current !== 'binary') setBinaryValue('');
        if (activeFieldRef.current !== 'octal') setOctalValue('');
        if (activeFieldRef.current !== 'decimal') setDecimalValue('');
        if (activeFieldRef.current !== 'hex') setHexValue('');
      }
    }
  }, [customValue, customBase, convertFromDecimal]);

  // Handle custom base change
  useEffect(() => {
    if (decimalValue && activeFieldRef.current !== 'custom') {
      const decimal = parseInt(decimalValue);
      if (!isNaN(decimal)) {
        setCustomValue(decimal.toString(customBase).toLowerCase());
      }
    }
  }, [customBase, decimalValue]);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const clearAll = () => {
    setBinaryValue("");
    setOctalValue("");
    setDecimalValue("");
    setHexValue("");
    setCustomValue("");
    activeFieldRef.current = null;
    lastUpdatedField.current = null;
  };


  return (
    <div className="w-full max-w-4xl space-y-6">
      <div className="space-y-6">
        {/* Binary Input */}
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-secondary-text)' }} htmlFor="binary">Base 2 (Binary)</label>
          <div className="flex items-center space-x-2">
            <input
              ref={(el) => inputRefs.current['binary'] = el}
              id="binary"
              name="binary"
              type="text"
              value={binaryValue}
              onChange={(e) => handleFieldChange('binary', e.target.value)}
              onFocus={() => {
                activeFieldRef.current = 'binary';
              }}
              onBlur={() => {
                if (activeFieldRef.current === 'binary') {
                  activeFieldRef.current = null;
                }
              }}
              placeholder="10010001000101000000010110010010"
              className="flex-grow p-3 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              style={{
                backgroundColor: 'var(--color-tertiary-bg)',
                borderColor: 'var(--color-primary-border)',
                color: 'var(--color-primary-text)',
                border: '1px solid var(--color-primary-border)'
              }}
            />
            <button
              className="p-3 rounded-lg flex items-center space-x-1.5 text-sm transition-colors"
              style={{
                backgroundColor: 'var(--color-tertiary-bg)',
                borderColor: 'var(--color-primary-border)',
                color: 'var(--color-primary-text)',
                border: '1px solid var(--color-primary-border)'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-primary-border)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--color-tertiary-bg)'}
              onClick={() => navigator.clipboard.readText()
                .then(text => handleFieldChange('binary', text))
                .catch(() => {})}
            >
              <Clipboard className="w-4 h-4" />
              <span>Paste</span>
            </button>
            <button
              className="p-3 rounded-lg flex items-center space-x-1.5 text-sm transition-colors"
              style={{
                backgroundColor: 'var(--color-tertiary-bg)',
                borderColor: 'var(--color-primary-border)',
                color: 'var(--color-primary-text)',
                border: '1px solid var(--color-primary-border)'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-primary-border)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--color-tertiary-bg)'}
              onClick={clearAll}
            >
              <Trash2 className="w-4 h-4" />
              <span>Clear</span>
            </button>
            <button
              className="p-3 rounded-lg flex items-center space-x-1.5 text-sm transition-colors"
              style={{
                backgroundColor: 'var(--color-tertiary-bg)',
                borderColor: 'var(--color-primary-border)',
                color: 'var(--color-primary-text)',
                border: '1px solid var(--color-primary-border)'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-primary-border)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--color-tertiary-bg)'}
              onClick={() => copyToClipboard(binaryValue)}
              title="Copy"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Octal Input */}
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-secondary-text)' }} htmlFor="octal">Base 8 (Octal)</label>
          <div className="flex items-center space-x-2">
            <input
              ref={(el) => inputRefs.current['octal'] = el}
              id="octal"
              name="octal"
              type="text"
              value={octalValue}
              onChange={(e) => handleFieldChange('octal', e.target.value)}
              onFocus={() => {
                activeFieldRef.current = 'octal';
              }}
              onBlur={() => {
                if (activeFieldRef.current === 'octal') {
                  activeFieldRef.current = null;
                }
              }}
              placeholder="1114540322"
              className="flex-grow p-3 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              style={{
                backgroundColor: 'var(--color-tertiary-bg)',
                borderColor: 'var(--color-primary-border)',
                color: 'var(--color-primary-text)',
                border: '1px solid var(--color-primary-border)'
              }}
            />
            <button
              className="p-3 rounded-lg flex items-center space-x-1.5 text-sm transition-colors"
              style={{
                backgroundColor: 'var(--color-tertiary-bg)',
                borderColor: 'var(--color-primary-border)',
                color: 'var(--color-primary-text)',
                border: '1px solid var(--color-primary-border)'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-primary-border)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--color-tertiary-bg)'}
              onClick={() => navigator.clipboard.readText()
                .then(text => handleFieldChange('octal', text))
                .catch(() => {})}
            >
              <Clipboard className="w-4 h-4" />
              <span>Paste</span>
            </button>
            <button
              className="p-3 rounded-lg flex items-center space-x-1.5 text-sm transition-colors"
              style={{
                backgroundColor: 'var(--color-tertiary-bg)',
                borderColor: 'var(--color-primary-border)',
                color: 'var(--color-primary-text)',
                border: '1px solid var(--color-primary-border)'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-primary-border)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--color-tertiary-bg)'}
              onClick={clearAll}
            >
              <Trash2 className="w-4 h-4" />
              <span>Clear</span>
            </button>
            <button
              className="p-3 rounded-lg flex items-center space-x-1.5 text-sm transition-colors"
              style={{
                backgroundColor: 'var(--color-tertiary-bg)',
                borderColor: 'var(--color-primary-border)',
                color: 'var(--color-primary-text)',
                border: '1px solid var(--color-primary-border)'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-primary-border)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--color-tertiary-bg)'}
              onClick={() => copyToClipboard(octalValue)}
              title="Copy"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Decimal Input */}
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-secondary-text)' }} htmlFor="decimal">Base 10 (Decimal)</label>
          <div className="flex items-center space-x-2">
            <input
              ref={(el) => inputRefs.current['decimal'] = el}
              id="decimal"
              name="decimal"
              type="text"
              value={decimalValue}
              onChange={(e) => handleFieldChange('decimal', e.target.value)}
              onFocus={() => {
                activeFieldRef.current = 'decimal';
              }}
              onBlur={() => {
                if (activeFieldRef.current === 'decimal') {
                  activeFieldRef.current = null;
                }
              }}
              placeholder="1234567890"
              className="flex-grow p-3 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              style={{
                backgroundColor: 'var(--color-tertiary-bg)',
                borderColor: 'var(--color-primary-border)',
                color: 'var(--color-primary-text)',
                border: '1px solid var(--color-primary-border)'
              }}
            />
            <button
              className="p-3 rounded-lg flex items-center space-x-1.5 text-sm transition-colors"
              style={{
                backgroundColor: 'var(--color-tertiary-bg)',
                borderColor: 'var(--color-primary-border)',
                color: 'var(--color-primary-text)',
                border: '1px solid var(--color-primary-border)'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-primary-border)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--color-tertiary-bg)'}
              onClick={() => navigator.clipboard.readText()
                .then(text => handleFieldChange('decimal', text))
                .catch(() => {})}
            >
              <Clipboard className="w-4 h-4" />
              <span>Paste</span>
            </button>
            <button
              className="p-3 rounded-lg flex items-center space-x-1.5 text-sm transition-colors"
              style={{
                backgroundColor: 'var(--color-tertiary-bg)',
                borderColor: 'var(--color-primary-border)',
                color: 'var(--color-primary-text)',
                border: '1px solid var(--color-primary-border)'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-primary-border)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--color-tertiary-bg)'}
              onClick={clearAll}
            >
              <Trash2 className="w-4 h-4" />
              <span>Clear</span>
            </button>
            <button
              className="p-3 rounded-lg flex items-center space-x-1.5 text-sm transition-colors"
              style={{
                backgroundColor: 'var(--color-tertiary-bg)',
                borderColor: 'var(--color-primary-border)',
                color: 'var(--color-primary-text)',
                border: '1px solid var(--color-primary-border)'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-primary-border)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--color-tertiary-bg)'}
              onClick={() => copyToClipboard(decimalValue)}
              title="Copy"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Hex Input */}
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-secondary-text)' }} htmlFor="hexadecimal">Base 16 (Hexadecimal)</label>
          <div className="flex items-center space-x-2">
            <input
              ref={(el) => inputRefs.current['hex'] = el}
              id="hexadecimal"
              name="hexadecimal"
              type="text"
              value={hexValue}
              onChange={(e) => handleFieldChange('hex', e.target.value)}
              onFocus={() => {
                activeFieldRef.current = 'hex';
              }}
              onBlur={() => {
                if (activeFieldRef.current === 'hex') {
                  activeFieldRef.current = null;
                }
              }}
              placeholder="499602d2"
              className="flex-grow p-3 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              style={{
                backgroundColor: 'var(--color-tertiary-bg)',
                borderColor: 'var(--color-primary-border)',
                color: 'var(--color-primary-text)',
                border: '1px solid var(--color-primary-border)'
              }}
            />
            <button
              className="p-3 rounded-lg flex items-center space-x-1.5 text-sm transition-colors"
              style={{
                backgroundColor: 'var(--color-tertiary-bg)',
                borderColor: 'var(--color-primary-border)',
                color: 'var(--color-primary-text)',
                border: '1px solid var(--color-primary-border)'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-primary-border)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--color-tertiary-bg)'}
              onClick={() => navigator.clipboard.readText()
                .then(text => handleFieldChange('hex', text))
                .catch(() => {})}
            >
              <Clipboard className="w-4 h-4" />
              <span>Paste</span>
            </button>
            <button
              className="p-3 rounded-lg flex items-center space-x-1.5 text-sm transition-colors"
              style={{
                backgroundColor: 'var(--color-tertiary-bg)',
                borderColor: 'var(--color-primary-border)',
                color: 'var(--color-primary-text)',
                border: '1px solid var(--color-primary-border)'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-primary-border)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--color-tertiary-bg)'}
              onClick={clearAll}
            >
              <Trash2 className="w-4 h-4" />
              <span>Clear</span>
            </button>
            <button
              className="p-3 rounded-lg flex items-center space-x-1.5 text-sm transition-colors"
              style={{
                backgroundColor: 'var(--color-tertiary-bg)',
                borderColor: 'var(--color-primary-border)',
                color: 'var(--color-primary-text)',
                border: '1px solid var(--color-primary-border)'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-primary-border)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--color-tertiary-bg)'}
              onClick={() => copyToClipboard(hexValue)}
              title="Copy"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Custom Base Selector */}
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-secondary-text)' }} htmlFor="customBaseValue">Custom Base</label>
          <div className="flex items-center space-x-2">
            <input
              ref={(el) => inputRefs.current['custom'] = el}
              id="customBaseValue"
              name="customBaseValue"
              type="text"
              value={customValue}
              onChange={(e) => handleFieldChange('custom', e.target.value)}
              onFocus={() => {
                activeFieldRef.current = 'custom';
              }}
              onBlur={() => {
                if (activeFieldRef.current === 'custom') {
                  activeFieldRef.current = null;
                }
              }}
              placeholder="Custom base value"
              className="flex-grow p-3 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              style={{
                backgroundColor: 'var(--color-tertiary-bg)',
                borderColor: 'var(--color-primary-border)',
                color: 'var(--color-primary-text)',
                border: '1px solid var(--color-primary-border)'
              }}
            />
            <span className="text-sm" style={{ color: 'var(--color-secondary-text)' }}>Base</span>
            <select
              value={customBase}
              onChange={(e) => setCustomBase(parseInt(e.target.value))}
              style={{ width: '80px' }}
            >
              {Array.from({ length: 35 }, (_, i) => {
                const base = i + 2;
                return (
                  <option key={base} value={base}>
                    {base}
                  </option>
                );
              })}
            </select>
            <button
              className="p-3 rounded-lg flex items-center space-x-1.5 text-sm transition-colors"
              style={{
                backgroundColor: 'var(--color-tertiary-bg)',
                borderColor: 'var(--color-primary-border)',
                color: 'var(--color-primary-text)',
                border: '1px solid var(--color-primary-border)'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-primary-border)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--color-tertiary-bg)'}
              onClick={() => navigator.clipboard.readText()
                .then(text => handleFieldChange('custom', text))
                .catch(() => {})}
            >
              <Clipboard className="w-4 h-4" />
              <span>Paste</span>
            </button>
            <button
              className="p-3 rounded-lg flex items-center space-x-1.5 text-sm transition-colors"
              style={{
                backgroundColor: 'var(--color-tertiary-bg)',
                borderColor: 'var(--color-primary-border)',
                color: 'var(--color-primary-text)',
                border: '1px solid var(--color-primary-border)'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-primary-border)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--color-tertiary-bg)'}
              onClick={() => {
                const decimal = Math.floor(Math.random() * 1000000);
                handleFieldChange('custom', decimal.toString(customBase).toLowerCase());
              }}
            >
              <Shuffle className="w-4 h-4" />
              <span>Sample</span>
            </button>
            <button
              className="p-3 rounded-lg flex items-center space-x-1.5 text-sm transition-colors"
              style={{
                backgroundColor: 'var(--color-tertiary-bg)',
                borderColor: 'var(--color-primary-border)',
                color: 'var(--color-primary-text)',
                border: '1px solid var(--color-primary-border)'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-primary-border)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--color-tertiary-bg)'}
              onClick={clearAll}
            >
              <Trash2 className="w-4 h-4" />
              <span>Clear</span>
            </button>
            <button
              className="p-3 rounded-lg flex items-center space-x-1.5 text-sm transition-colors"
              style={{
                backgroundColor: 'var(--color-tertiary-bg)',
                borderColor: 'var(--color-primary-border)',
                color: 'var(--color-primary-text)',
                border: '1px solid var(--color-primary-border)'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-primary-border)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--color-tertiary-bg)'}
              onClick={() => copyToClipboard(customValue)}
              title="Copy"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
