import { useState, useEffect, useCallback, useRef } from "react";
import { Copy, Clipboard, Shuffle, Trash2 } from "lucide-react";
import { Button, Input, Select, Card, Panel } from "./ui";

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
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <Card padding="lg">
        <p className="text-secondary text-sm leading-relaxed mb-6">
          Enter your number in any text field. The other fields will automatically be calculated.
        </p>

        <div className="grid gap-6">
          {/* Binary Input */}
          <Panel 
            title="Base 2 (Binary)" 
            padding="default"
            headerActions={
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigator.clipboard.readText()
                    .then(text => handleFieldChange('binary', text))
                    .catch(() => {})}
                >
                  <Clipboard className="w-3 h-3 mr-1" />
                  Paste
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearAll}
                >
                  <Trash2 className="w-3 h-3 mr-1" />
                  Clear
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(binaryValue)}
                  title="Copy"
                >
                  <Copy className="w-3 h-3" />
                </Button>
              </div>
            }
          >
            <Input
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
              className="font-mono"
            />
          </Panel>

          {/* Octal Input */}
          <Panel 
            title="Base 8 (Octal)" 
            padding="default"
            headerActions={
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigator.clipboard.readText()
                    .then(text => handleFieldChange('octal', text))
                    .catch(() => {})}
                >
                  <Clipboard className="w-3 h-3 mr-1" />
                  Paste
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearAll}
                >
                  <Trash2 className="w-3 h-3 mr-1" />
                  Clear
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(octalValue)}
                  title="Copy"
                >
                  <Copy className="w-3 h-3" />
                </Button>
              </div>
            }
          >
            <Input
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
              className="font-mono"
            />
          </Panel>

          {/* Decimal Input */}
          <Panel 
            title="Base 10 (Decimal)" 
            padding="default"
            headerActions={
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigator.clipboard.readText()
                    .then(text => handleFieldChange('decimal', text))
                    .catch(() => {})}
                >
                  <Clipboard className="w-3 h-3 mr-1" />
                  Paste
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearAll}
                >
                  <Trash2 className="w-3 h-3 mr-1" />
                  Clear
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(decimalValue)}
                  title="Copy"
                >
                  <Copy className="w-3 h-3" />
                </Button>
              </div>
            }
          >
            <Input
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
              className="font-mono"
            />
          </Panel>

          {/* Hex Input */}
          <Panel 
            title="Base 16 (Hexadecimal)" 
            padding="default"
            headerActions={
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigator.clipboard.readText()
                    .then(text => handleFieldChange('hex', text))
                    .catch(() => {})}
                >
                  <Clipboard className="w-3 h-3 mr-1" />
                  Paste
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearAll}
                >
                  <Trash2 className="w-3 h-3 mr-1" />
                  Clear
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(hexValue)}
                  title="Copy"
                >
                  <Copy className="w-3 h-3" />
                </Button>
              </div>
            }
          >
            <Input
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
              className="font-mono"
            />
          </Panel>

          {/* Custom Base Selector */}
          <Panel 
            title={`Custom Base (Base ${customBase})`}
            padding="default"
            headerActions={
              <div className="flex items-center gap-2">
                <Select
                  value={customBase.toString()}
                  onChange={(e) => setCustomBase(parseInt(e.target.value))}
                  options={Array.from({ length: 35 }, (_, i) => ({
                    value: (i + 2).toString(),
                    label: `Base ${i + 2}`
                  }))}
                  size="sm"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigator.clipboard.readText()
                    .then(text => handleFieldChange('custom', text))
                    .catch(() => {})}
                >
                  <Clipboard className="w-3 h-3 mr-1" />
                  Paste
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const decimal = Math.floor(Math.random() * 1000000);
                    handleFieldChange('custom', decimal.toString(customBase).toLowerCase());
                  }}
                >
                  <Shuffle className="w-3 h-3 mr-1" />
                  Sample
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearAll}
                >
                  <Trash2 className="w-3 h-3 mr-1" />
                  Clear
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(customValue)}
                  title="Copy"
                >
                  <Copy className="w-3 h-3" />
                </Button>
              </div>
            }
          >
            <Input
              ref={(el) => inputRefs.current['custom'] = el}
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
              className="font-mono"
            />
          </Panel>
        </div>
      </Card>
    </div>
  );
}
