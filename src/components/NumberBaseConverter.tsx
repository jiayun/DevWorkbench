import { useState, useEffect } from "react";
import { Copy, ChevronDown } from "lucide-react";

export function NumberBaseConverter() {
  const [values, setValues] = useState({
    binary: "",
    octal: "",
    decimal: "",
    hex: "",
  });
  const [customBase, setCustomBase] = useState(36);
  const [customValue, setCustomValue] = useState("");
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  // Convert decimal to other bases
  const convertFromDecimal = (decimal: number) => {
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
  };

  // Convert from any base to decimal
  const convertToDecimal = (value: string, base: number): number => {
    if (!value) return 0;
    const parsed = parseInt(value, base);
    return isNaN(parsed) ? 0 : parsed;
  };

  // Update all values when one changes
  const updateValues = (newValue: string, fromBase: number, fieldName: string) => {
    if (fieldName === lastUpdated) return;
    
    setLastUpdated(fieldName);
    const decimal = convertToDecimal(newValue, fromBase);
    const converted = convertFromDecimal(decimal);

    const newValues = {
      binary: fieldName === "binary" ? newValue : converted.binary,
      octal: fieldName === "octal" ? newValue : converted.octal,
      decimal: fieldName === "decimal" ? newValue : decimal.toString(),
      hex: fieldName === "hex" ? newValue : converted.hex,
    };

    setValues(newValues);
    setCustomValue(fieldName === "custom" ? newValue : converted.custom);
  };

  // Handle custom base change
  useEffect(() => {
    if (values.decimal) {
      const decimal = parseInt(values.decimal);
      if (!isNaN(decimal)) {
        setCustomValue(decimal.toString(customBase).toUpperCase());
      }
    }
  }, [customBase, values.decimal]);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const InputField = ({ 
    label, 
    value, 
    onChange, 
    placeholder = "",
    buttons = []
  }: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    buttons?: Array<{ label: string; onClick: () => void }>;
  }) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-300">{label}</label>
        <div className="flex space-x-2">
          {buttons.map((button, index) => (
            <button
              key={index}
              onClick={button.onClick}
              className="px-3 py-1 text-xs bg-gray-600 hover:bg-gray-500 text-white rounded transition-colors"
            >
              {button.label}
            </button>
          ))}
          <button
            onClick={() => copyToClipboard(value)}
            className="p-1 text-gray-400 hover:text-white transition-colors"
          >
            <Copy className="w-4 h-4" />
          </button>
        </div>
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
      />
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <p className="text-gray-400 text-sm mb-6">
        Enter your number in any of the text field. The other text fields will automatically be calculated.
      </p>

      <div className="space-y-4">
        <InputField
          label="Base 2 (Binary)"
          value={values.binary}
          onChange={(value) => updateValues(value, 2, "binary")}
          placeholder="10010001000101000000010110010010"
          buttons={[
            { label: "Clipboard", onClick: () => navigator.clipboard.readText().then(text => updateValues(text, 2, "binary")) },
            { label: "Clear", onClick: () => updateValues("", 2, "binary") }
          ]}
        />

        <InputField
          label="Base 8 (Octal)"
          value={values.octal}
          onChange={(value) => updateValues(value, 8, "octal")}
          placeholder="1114540322"
          buttons={[
            { label: "Clipboard", onClick: () => navigator.clipboard.readText().then(text => updateValues(text, 8, "octal")) },
            { label: "Clear", onClick: () => updateValues("", 8, "octal") }
          ]}
        />

        <InputField
          label="Base 10 (Decimal)"
          value={values.decimal}
          onChange={(value) => updateValues(value, 10, "decimal")}
          placeholder="1234567890"
          buttons={[
            { label: "Clipboard", onClick: () => navigator.clipboard.readText().then(text => updateValues(text, 10, "decimal")) },
            { label: "Clear", onClick: () => updateValues("", 10, "decimal") }
          ]}
        />

        <InputField
          label="Base 16 (Hex)"
          value={values.hex}
          onChange={(value) => updateValues(value.toUpperCase(), 16, "hex")}
          placeholder="499602D2"
          buttons={[
            { label: "Clipboard", onClick: () => navigator.clipboard.readText().then(text => updateValues(text, 16, "hex")) },
            { label: "Clear", onClick: () => updateValues("", 16, "hex") }
          ]}
        />

        {/* Custom Base Selector */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-300">Select base:</label>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <select
                  value={customBase}
                  onChange={(e) => setCustomBase(parseInt(e.target.value))}
                  className="appearance-none px-3 py-1 pr-8 bg-gray-600 border border-gray-500 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {Array.from({ length: 35 }, (_, i) => i + 2).map(base => (
                    <option key={base} value={base}>{base}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
              </div>
              <button
                onClick={() => navigator.clipboard.readText().then(text => updateValues(text, customBase, "custom"))}
                className="px-3 py-1 text-xs bg-gray-600 hover:bg-gray-500 text-white rounded transition-colors"
              >
                Clipboard
              </button>
              <button
                onClick={() => {
                  const decimal = Math.floor(Math.random() * 1000000);
                  updateValues(decimal.toString(customBase).toUpperCase(), customBase, "custom");
                }}
                className="px-3 py-1 text-xs bg-gray-600 hover:bg-gray-500 text-white rounded transition-colors"
              >
                Sample
              </button>
              <button
                onClick={() => setCustomValue("")}
                className="px-3 py-1 text-xs bg-gray-600 hover:bg-gray-500 text-white rounded transition-colors"
              >
                Clear
              </button>
              <button
                onClick={() => copyToClipboard(customValue)}
                className="p-1 text-gray-400 hover:text-white transition-colors"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>
          <input
            type="text"
            value={customValue}
            onChange={(e) => updateValues(e.target.value.toUpperCase(), customBase, "custom")}
            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
          />
        </div>
      </div>
    </div>
  );
}
