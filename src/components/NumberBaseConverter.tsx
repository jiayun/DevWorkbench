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
      hex: decimal.toString(16).toUpperCase(),
      custom: decimal.toString(customBase).toUpperCase(),
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
        setHexValue(value.toUpperCase());
        break;
      case 'custom':
        setCustomValue(value.toUpperCase());
        break;
    }
  };

  // Update other fields when binary changes
  useEffect(() => {
    if (lastUpdatedField.current === 'binary' && activeFieldRef.current === 'binary') {
      const decimal = convertToDecimal(binaryValue, 2);
      if (decimal !== null) {
        const converted = convertFromDecimal(decimal);
        setOctalValue(converted.octal);
        setDecimalValue(decimal.toString());
        setHexValue(converted.hex);
        setCustomValue(converted.custom);
      } else if (binaryValue === '') {
        setOctalValue('');
        setDecimalValue('');
        setHexValue('');
        setCustomValue('');
      }
    }
  }, [binaryValue, convertFromDecimal]);

  // Update other fields when octal changes
  useEffect(() => {
    if (lastUpdatedField.current === 'octal' && activeFieldRef.current === 'octal') {
      const decimal = convertToDecimal(octalValue, 8);
      if (decimal !== null) {
        const converted = convertFromDecimal(decimal);
        setBinaryValue(converted.binary);
        setDecimalValue(decimal.toString());
        setHexValue(converted.hex);
        setCustomValue(converted.custom);
      } else if (octalValue === '') {
        setBinaryValue('');
        setDecimalValue('');
        setHexValue('');
        setCustomValue('');
      }
    }
  }, [octalValue, convertFromDecimal]);

  // Update other fields when decimal changes
  useEffect(() => {
    if (lastUpdatedField.current === 'decimal' && activeFieldRef.current === 'decimal') {
      const decimal = convertToDecimal(decimalValue, 10);
      if (decimal !== null) {
        const converted = convertFromDecimal(decimal);
        setBinaryValue(converted.binary);
        setOctalValue(converted.octal);
        setHexValue(converted.hex);
        setCustomValue(converted.custom);
      } else if (decimalValue === '') {
        setBinaryValue('');
        setOctalValue('');
        setHexValue('');
        setCustomValue('');
      }
    }
  }, [decimalValue, convertFromDecimal]);

  // Update other fields when hex changes
  useEffect(() => {
    if (lastUpdatedField.current === 'hex' && activeFieldRef.current === 'hex') {
      const decimal = convertToDecimal(hexValue, 16);
      if (decimal !== null) {
        const converted = convertFromDecimal(decimal);
        setBinaryValue(converted.binary);
        setOctalValue(converted.octal);
        setDecimalValue(decimal.toString());
        setCustomValue(converted.custom);
      } else if (hexValue === '') {
        setBinaryValue('');
        setOctalValue('');
        setDecimalValue('');
        setCustomValue('');
      }
    }
  }, [hexValue, convertFromDecimal]);

  // Update other fields when custom changes
  useEffect(() => {
    if (lastUpdatedField.current === 'custom' && activeFieldRef.current === 'custom') {
      const decimal = convertToDecimal(customValue, customBase);
      if (decimal !== null) {
        const converted = convertFromDecimal(decimal);
        setBinaryValue(converted.binary);
        setOctalValue(converted.octal);
        setDecimalValue(decimal.toString());
        setHexValue(converted.hex);
      } else if (customValue === '') {
        setBinaryValue('');
        setOctalValue('');
        setDecimalValue('');
        setHexValue('');
      }
    }
  }, [customValue, customBase, convertFromDecimal]);

  // Handle custom base change
  useEffect(() => {
    if (decimalValue && activeFieldRef.current !== 'custom') {
      const decimal = parseInt(decimalValue);
      if (!isNaN(decimal)) {
        setCustomValue(decimal.toString(customBase).toUpperCase());
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

  const InputField = ({ 
    label, 
    value, 
    fieldName,
    base,
    placeholder = "",
    buttons = []
  }: {
    label: string;
    value: string;
    fieldName: string;
    base: number;
    placeholder?: string;
    buttons?: Array<{ label: string; onClick: () => void }>;
  }) => (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-secondary">{label}</label>
        <div className="flex items-center gap-2">
          {buttons.map((button, index) => (
            <button
              key={index}
              onClick={button.onClick}
              className="px-3 py-1.5 text-xs bg-tertiary hover:bg-secondary border border-primary text-primary rounded-md transition-colors"
            >
              {button.label}
            </button>
          ))}
          <button
            onClick={() => copyToClipboard(value)}
            className="p-1.5 text-tertiary hover:text-primary hover:bg-tertiary rounded-md transition-colors"
            title="Copy"
          >
            <Copy className="w-4 h-4" />
          </button>
        </div>
      </div>
      <input
        ref={(el) => inputRefs.current[fieldName] = el}
        type="text"
        value={value}
        onChange={(e) => handleFieldChange(fieldName, e.target.value)}
        onFocus={() => {
          activeFieldRef.current = fieldName;
        }}
        onBlur={() => {
          // Simple blur handler
          if (activeFieldRef.current === fieldName) {
            activeFieldRef.current = null;
          }
        }}
        placeholder={placeholder}
        className="w-full px-4 py-3 bg-tertiary border border-primary rounded-lg text-primary placeholder-tertiary focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm transition-colors"
      />
    </div>
  );

  return (
    <div className="w-full h-full">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <p className="text-secondary text-sm leading-relaxed mb-8">
          Enter your number in any of the text field. The other text fields will automatically be calculated.
        </p>

        <div className="space-y-6">
          <InputField
            label="Base 2 (Binary)"
            value={binaryValue}
            fieldName="binary"
            base={2}
            placeholder="10010001000101000000010110010010"
            buttons={[
              { 
                label: "Clipboard", 
                onClick: () => navigator.clipboard.readText()
                  .then(text => handleFieldChange('binary', text))
                  .catch(() => {}) 
              },
              { label: "Clear", onClick: clearAll }
            ]}
          />

          <InputField
            label="Base 8 (Octal)"
            value={octalValue}
            fieldName="octal"
            base={8}
            placeholder="1114540322"
            buttons={[
              { 
                label: "Clipboard", 
                onClick: () => navigator.clipboard.readText()
                  .then(text => handleFieldChange('octal', text))
                  .catch(() => {}) 
              },
              { label: "Clear", onClick: clearAll }
            ]}
          />

          <InputField
            label="Base 10 (Decimal)"
            value={decimalValue}
            fieldName="decimal"
            base={10}
            placeholder="1234567890"
            buttons={[
              { 
                label: "Clipboard", 
                onClick: () => navigator.clipboard.readText()
                  .then(text => handleFieldChange('decimal', text))
                  .catch(() => {}) 
              },
              { label: "Clear", onClick: clearAll }
            ]}
          />

          <InputField
            label="Base 16 (Hex)"
            value={hexValue}
            fieldName="hex"
            base={16}
            placeholder="499602D2"
            buttons={[
              { 
                label: "Clipboard", 
                onClick: () => navigator.clipboard.readText()
                  .then(text => handleFieldChange('hex', text))
                  .catch(() => {}) 
              },
              { label: "Clear", onClick: clearAll }
            ]}
          />

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
                  className="px-3 py-1.5 text-xs bg-tertiary hover:bg-secondary border border-primary text-primary rounded-md transition-colors"
                >
                  Clipboard
                </button>
                <button
                  onClick={() => {
                    const decimal = Math.floor(Math.random() * 1000000);
                    handleFieldChange('custom', decimal.toString(customBase).toUpperCase());
                  }}
                  className="px-3 py-1.5 text-xs bg-tertiary hover:bg-secondary border border-primary text-primary rounded-md transition-colors"
                >
                  Sample
                </button>
                <button
                  onClick={clearAll}
                  className="px-3 py-1.5 text-xs bg-tertiary hover:bg-secondary border border-primary text-primary rounded-md transition-colors"
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
              onChange={(e) => handleFieldChange('custom', e.target.value.toUpperCase())}
              onFocus={() => {
                activeFieldRef.current = 'custom';
              }}
              onBlur={() => {
                // Simple blur handler
                if (activeFieldRef.current === 'custom') {
                  activeFieldRef.current = null;
                }
              }}
              className="w-full px-4 py-3 bg-tertiary border border-primary rounded-lg text-primary placeholder-tertiary focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm transition-colors"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
