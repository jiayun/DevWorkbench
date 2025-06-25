import { useState, useEffect, useCallback, useRef } from "react";
import { Copy, ChevronDown } from "lucide-react";

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
    <div className="w-full h-full">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <p className="text-secondary text-sm leading-relaxed mb-8">
          Enter your number in any of the text field. The other text fields will automatically be calculated.
        </p>

        <div className="space-y-8">
          {/* Binary Input */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-secondary">Base 2 (Binary)</label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigator.clipboard.readText()
                    .then(text => handleFieldChange('binary', text))
                    .catch(() => {})}
                  className="px-3 py-2 text-xs bg-tertiary hover:bg-secondary border border-primary text-primary rounded-lg transition-colors"
                >
                  Clipboard
                </button>
                <button
                  onClick={clearAll}
                  className="px-3 py-2 text-xs bg-tertiary hover:bg-secondary border border-primary text-primary rounded-lg transition-colors"
                >
                  Clear
                </button>
                <button
                  onClick={() => copyToClipboard(binaryValue)}
                  className="p-1.5 text-tertiary hover:text-primary hover:bg-tertiary rounded-md transition-colors"
                  title="Copy"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>
            <input
              ref={(el) => inputRefs.current['binary'] = el}
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
              className="w-full px-4 py-3 bg-tertiary border border-primary rounded-lg text-primary placeholder-tertiary focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm transition-colors"
            />
          </div>

          {/* Octal Input */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-secondary">Base 8 (Octal)</label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigator.clipboard.readText()
                    .then(text => handleFieldChange('octal', text))
                    .catch(() => {})}
                  className="px-3 py-2 text-xs bg-tertiary hover:bg-secondary border border-primary text-primary rounded-lg transition-colors"
                >
                  Clipboard
                </button>
                <button
                  onClick={clearAll}
                  className="px-3 py-2 text-xs bg-tertiary hover:bg-secondary border border-primary text-primary rounded-lg transition-colors"
                >
                  Clear
                </button>
                <button
                  onClick={() => copyToClipboard(octalValue)}
                  className="p-1.5 text-tertiary hover:text-primary hover:bg-tertiary rounded-md transition-colors"
                  title="Copy"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>
            <input
              ref={(el) => inputRefs.current['octal'] = el}
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
              className="w-full px-4 py-3 bg-tertiary border border-primary rounded-lg text-primary placeholder-tertiary focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm transition-colors"
            />
          </div>

          {/* Decimal Input */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-secondary">Base 10 (Decimal)</label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigator.clipboard.readText()
                    .then(text => handleFieldChange('decimal', text))
                    .catch(() => {})}
                  className="px-3 py-2 text-xs bg-tertiary hover:bg-secondary border border-primary text-primary rounded-lg transition-colors"
                >
                  Clipboard
                </button>
                <button
                  onClick={clearAll}
                  className="px-3 py-2 text-xs bg-tertiary hover:bg-secondary border border-primary text-primary rounded-lg transition-colors"
                >
                  Clear
                </button>
                <button
                  onClick={() => copyToClipboard(decimalValue)}
                  className="p-1.5 text-tertiary hover:text-primary hover:bg-tertiary rounded-md transition-colors"
                  title="Copy"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>
            <input
              ref={(el) => inputRefs.current['decimal'] = el}
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
              className="w-full px-4 py-3 bg-tertiary border border-primary rounded-lg text-primary placeholder-tertiary focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm transition-colors"
            />
          </div>

          {/* Hex Input */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-secondary">Base 16 (Hex)</label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigator.clipboard.readText()
                    .then(text => handleFieldChange('hex', text))
                    .catch(() => {})}
                  className="px-3 py-2 text-xs bg-tertiary hover:bg-secondary border border-primary text-primary rounded-lg transition-colors"
                >
                  Clipboard
                </button>
                <button
                  onClick={clearAll}
                  className="px-3 py-2 text-xs bg-tertiary hover:bg-secondary border border-primary text-primary rounded-lg transition-colors"
                >
                  Clear
                </button>
                <button
                  onClick={() => copyToClipboard(hexValue)}
                  className="p-1.5 text-tertiary hover:text-primary hover:bg-tertiary rounded-md transition-colors"
                  title="Copy"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>
            <input
              ref={(el) => inputRefs.current['hex'] = el}
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
              className="w-full px-4 py-3 bg-tertiary border border-primary rounded-lg text-primary placeholder-tertiary focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm transition-colors"
            />
          </div>

          {/* Custom Base Selector */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-secondary">Select base:</label>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <select
                    value={customBase}
                    onChange={(e) => setCustomBase(parseInt(e.target.value))}
                    className="appearance-none px-3 py-1.5 pr-8 bg-tertiary border border-primary rounded-md text-primary text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  >
                    {Array.from({ length: 35 }, (_, i) => i + 2).map(base => (
                      <option key={base} value={base} className="bg-tertiary text-primary">
                        {base}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-tertiary pointer-events-none" />
                </div>
                <button
                  onClick={() => navigator.clipboard.readText()
                    .then(text => handleFieldChange('custom', text))
                    .catch(() => {})}
                  className="px-3 py-2 text-xs bg-tertiary hover:bg-secondary border border-primary text-primary rounded-lg transition-colors"
                >
                  Clipboard
                </button>
                <button
                  onClick={() => {
                    const decimal = Math.floor(Math.random() * 1000000);
                    handleFieldChange('custom', decimal.toString(customBase).toLowerCase());
                  }}
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
                <button
                  onClick={() => copyToClipboard(customValue)}
                  className="p-1.5 text-tertiary hover:text-primary hover:bg-tertiary rounded-md transition-colors"
                  title="Copy"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>
            <input
              ref={(el) => inputRefs.current['custom'] = el}
              type="text"
              value={customValue}
              onChange={(e) => handleFieldChange('custom', e.target.value)}
              onFocus={() => {
                activeFieldRef.current = 'custom';
              }}
              onBlur={() => {
                // Simple blur handler
                if (activeFieldRef.current === 'custom') {
                  activeFieldRef.current = null;
                }
              }}
              placeholder="Custom base value"
              className="w-full px-4 py-3 bg-tertiary border border-primary rounded-lg text-primary placeholder-tertiary focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm transition-colors"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
