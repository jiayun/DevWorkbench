import { useState, useEffect, useCallback } from "react";
import { Copy, Clipboard, Trash2, RotateCcw, Plus, X } from "lucide-react";

interface TimeInfo {
  unixTime: number;
  localTime: string;
  utcTime: string;
  relative: string;
  dayOfYear: number;
  weekOfYear: number;
  isLeapYear: boolean;
  otherFormats: {
    fullDate: string;
    shortDate: string;
    isoDate: string;
    dateTime: string;
    timeOnly: string;
    monthYear: string;
  };
}

interface TimezoneInfo {
  name: string;
  timezone: string;
  time: string;
}

export function UnixTimeConverter() {
  const [input, setInput] = useState("");
  const [timeInfo, setTimeInfo] = useState<TimeInfo | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const [timezones, setTimezones] = useState<TimezoneInfo[]>([]);
  const [newTimezone, setNewTimezone] = useState("");

  // Common timezones
  const commonTimezones = [
    { name: "New York", timezone: "America/New_York" },
    { name: "Los Angeles", timezone: "America/Los_Angeles" },
    { name: "London", timezone: "Europe/London" },
    { name: "Paris", timezone: "Europe/Paris" },
    { name: "Tokyo", timezone: "Asia/Tokyo" },
    { name: "Sydney", timezone: "Australia/Sydney" },
    { name: "Hong Kong", timezone: "Asia/Hong_Kong" },
    { name: "Singapore", timezone: "Asia/Singapore" },
    { name: "Shanghai", timezone: "Asia/Shanghai" },
    { name: "Dubai", timezone: "Asia/Dubai" },
    { name: "Mumbai", timezone: "Asia/Kolkata" },
    { name: "Moscow", timezone: "Europe/Moscow" },
    { name: "Berlin", timezone: "Europe/Berlin" },
    { name: "São Paulo", timezone: "America/Sao_Paulo" },
    { name: "Mexico City", timezone: "America/Mexico_City" },
    { name: "Cairo", timezone: "Africa/Cairo" },
    { name: "Johannesburg", timezone: "Africa/Johannesburg" },
    { name: "Auckland", timezone: "Pacific/Auckland" },
    { name: "Seoul", timezone: "Asia/Seoul" },
    { name: "Taipei", timezone: "Asia/Taipei" },
  ];

  // Calculate relative time
  const getRelativeTime = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp * 1000;
    const absDiff = Math.abs(diff);
    
    const seconds = Math.floor(absDiff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const months = Math.floor(days / 30);
    const years = Math.floor(days / 365);
    
    const suffix = diff < 0 ? "in the future" : "ago";
    
    if (years > 0) return `${years} year${years > 1 ? 's' : ''} ${suffix}`;
    if (months > 0) return `${months} month${months > 1 ? 's' : ''} ${suffix}`;
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ${suffix}`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ${suffix}`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ${suffix}`;
    return `${seconds} second${seconds > 1 ? 's' : ''} ${suffix}`;
  };

  // Calculate day of year
  const getDayOfYear = (date: Date): number => {
    const start = new Date(date.getFullYear(), 0, 1);
    const diff = date.getTime() - start.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;
  };

  // Calculate week of year
  const getWeekOfYear = (date: Date): number => {
    const start = new Date(date.getFullYear(), 0, 1);
    const days = getDayOfYear(date);
    const dayOfWeek = start.getDay();
    return Math.ceil((days + dayOfWeek) / 7);
  };

  // Check if leap year
  const isLeapYear = (year: number): boolean => {
    return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
  };

  // Update timezones when timeInfo changes
  useEffect(() => {
    if (timeInfo && timezones.length > 0) {
      setTimezones(prevTimezones => 
        prevTimezones.map(tz => ({
          ...tz,
          time: formatTimeForTimezone(timeInfo.unixTime, tz.timezone)
        }))
      );
    }
  }, [timeInfo]);

  // Format time for specific timezone
  const formatTimeForTimezone = (unixTime: number, timezone: string): string => {
    try {
      const date = new Date(unixTime * 1000);
      return date.toLocaleString('en-US', {
        timeZone: timezone,
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZoneName: 'short'
      });
    } catch (error) {
      return "Invalid timezone";
    }
  };

  // Add timezone
  const addTimezone = () => {
    if (!newTimezone.trim()) return;
    
    const selectedTz = commonTimezones.find(tz => 
      tz.name.toLowerCase().includes(newTimezone.toLowerCase()) ||
      tz.timezone.toLowerCase().includes(newTimezone.toLowerCase())
    );
    
    if (selectedTz) {
      const newTz: TimezoneInfo = {
        name: selectedTz.name,
        timezone: selectedTz.timezone,
        time: timeInfo ? formatTimeForTimezone(timeInfo.unixTime, selectedTz.timezone) : ""
      };
      
      // Check if timezone already exists
      if (!timezones.some(tz => tz.timezone === selectedTz.timezone)) {
        setTimezones([...timezones, newTz]);
      }
    }
    setNewTimezone("");
  };

  // Remove timezone
  const removeTimezone = (index: number) => {
    setTimezones(timezones.filter((_, i) => i !== index));
  };

  // Parse input and convert to unix timestamp
  const parseInput = (value: string): number | null => {
    if (!value.trim()) return null;
    
    // Try to parse as number (unix timestamp or milliseconds)
    const num = parseInt(value);
    if (!isNaN(num)) {
      // If it's a very large number, assume it's milliseconds
      if (num > 10000000000) {
        return Math.floor(num / 1000);
      }
      return num;
    }
    
    // Try to parse as ISO 8601 or other date formats
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      return Math.floor(date.getTime() / 1000);
    }
    
    return null;
  };

  // Convert unix timestamp to TimeInfo
  const convertToTimeInfo = useCallback((unixTime: number): TimeInfo => {
    const date = new Date(unixTime * 1000);
    
    return {
      unixTime,
      localTime: date.toLocaleString('en-US', { 
        weekday: 'short', 
        year: 'numeric', 
        month: 'short', 
        day: '2-digit', 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit',
        timeZoneName: 'short'
      }),
      utcTime: date.toISOString(),
      relative: getRelativeTime(unixTime),
      dayOfYear: getDayOfYear(date),
      weekOfYear: getWeekOfYear(date),
      isLeapYear: isLeapYear(date.getFullYear()),
      otherFormats: {
        fullDate: date.toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        }),
        shortDate: date.toLocaleDateString('en-US', { 
          month: '2-digit', 
          day: '2-digit', 
          year: 'numeric' 
        }),
        isoDate: date.toISOString().split('T')[0],
        dateTime: date.toLocaleString('en-US', { 
          month: '2-digit', 
          day: '2-digit', 
          year: 'numeric',
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        timeOnly: date.toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit',
          hour12: true 
        }),
        monthYear: date.toLocaleDateString('en-US', { 
          month: 'long', 
          year: 'numeric' 
        })
      }
    };
  }, []);

  // Handle input change
  useEffect(() => {
    if (!input.trim()) {
      setTimeInfo(null);
      setError("");
      return;
    }

    const timestamp = parseInput(input);
    if (timestamp === null) {
      setError("Invalid input format");
      setTimeInfo(null);
      return;
    }

    try {
      const info = convertToTimeInfo(timestamp);
      setTimeInfo(info);
      setError("");
    } catch (err) {
      setError("Invalid timestamp");
      setTimeInfo(null);
    }
  }, [input, convertToTimeInfo]);

  // Copy to clipboard
  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Paste from clipboard
  const pasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setInput(text);
    } catch (err) {
      console.error('Failed to paste:', err);
    }
  };

  // Set current time
  const setCurrentTime = () => {
    const now = Math.floor(Date.now() / 1000);
    setInput(now.toString());
  };

  // Clear input
  const clearInput = () => {
    setInput("");
    setTimeInfo(null);
    setError("");
  };

  // Sample data
  const setSampleData = () => {
    const sampleTimestamp = 1751852217; // July 7, 2025
    setInput(sampleTimestamp.toString());
  };

  const InfoField = ({ label, value, copyValue }: { label: string; value: string; copyValue?: string }) => (
    <div className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: 'var(--color-tertiary-bg)' }}>
      <div className="flex-1">
        <div className="text-sm font-medium mb-1" style={{ color: 'var(--color-secondary-text)' }}>
          {label}:
        </div>
        <div className="text-sm" style={{ color: 'var(--color-primary-text)' }}>
          {value}
        </div>
      </div>
      <button
        onClick={() => copyToClipboard(copyValue || value, label)}
        className="ml-2 p-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        title={`Copy ${label}`}
      >
        <Copy className="w-4 h-4" style={{ color: 'var(--color-secondary-text)' }} />
      </button>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="text-sm" style={{ color: 'var(--color-secondary-text)' }}>
        Convert Unix timestamps to human-readable dates and display detailed time information.
      </div>

      {/* Input Section */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-primary-text)' }}>
            Input
          </label>
          <div className="flex gap-2 mb-2">
            <button
              onClick={setCurrentTime}
              className="px-3 py-1.5 text-sm font-medium rounded-md transition-colors"
              style={{ 
                backgroundColor: 'var(--color-secondary-bg)', 
                color: 'var(--color-primary-text)',
                border: '1px solid var(--color-primary-border)'
              }}
            >
              Now
            </button>
            <button
              onClick={pasteFromClipboard}
              className="px-3 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center gap-1"
              style={{ 
                backgroundColor: 'var(--color-secondary-bg)', 
                color: 'var(--color-primary-text)',
                border: '1px solid var(--color-primary-border)'
              }}
            >
              <Clipboard className="w-4 h-4" />
              Clipboard
            </button>
            <button
              onClick={clearInput}
              className="px-3 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center gap-1"
              style={{ 
                backgroundColor: 'var(--color-secondary-bg)', 
                color: 'var(--color-primary-text)',
                border: '1px solid var(--color-primary-border)'
              }}
            >
              <Trash2 className="w-4 h-4" />
              Clear
            </button>
            <button
              onClick={setSampleData}
              className="px-3 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center gap-1"
              style={{ 
                backgroundColor: 'var(--color-secondary-bg)', 
                color: 'var(--color-primary-text)',
                border: '1px solid var(--color-primary-border)'
              }}
            >
              <RotateCcw className="w-4 h-4" />
              Sample
            </button>
          </div>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter Unix timestamp, milliseconds, or ISO 8601 date..."
            className="w-full p-3 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            style={{ 
              backgroundColor: 'var(--color-tertiary-bg)', 
              borderColor: 'var(--color-primary-border)', 
              color: 'var(--color-primary-text)' 
            }}
          />
          {error && (
            <div className="mt-2 text-sm text-red-500">{error}</div>
          )}
        </div>
      </div>

      {/* Time Information */}
      {timeInfo && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-4">
            <InfoField label="Local" value={timeInfo.localTime} />
            <InfoField label="UTC (ISO 8601)" value={timeInfo.utcTime} />
            <InfoField label="Relative" value={timeInfo.relative} />
            <InfoField label="Unix time" value={timeInfo.unixTime.toString()} />
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            <InfoField label="Day of year" value={timeInfo.dayOfYear.toString()} />
            <InfoField label="Week of year" value={timeInfo.weekOfYear.toString()} />
            <InfoField label="Is leap year" value={timeInfo.isLeapYear.toString()} />
            
            <div className="space-y-2">
              <div className="text-sm font-medium" style={{ color: 'var(--color-secondary-text)' }}>
                Other formats (local):
              </div>
              <div className="space-y-2">
                <InfoField label="Full date" value={timeInfo.otherFormats.fullDate} />
                <InfoField label="Short date" value={timeInfo.otherFormats.shortDate} />
                <InfoField label="ISO date" value={timeInfo.otherFormats.isoDate} />
                <InfoField label="Date time" value={timeInfo.otherFormats.dateTime} />
                <InfoField label="Time only" value={timeInfo.otherFormats.timeOnly} />
                <InfoField label="Month year" value={timeInfo.otherFormats.monthYear} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Other Timezones */}
      {timeInfo && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold" style={{ color: 'var(--color-primary-text)' }}>
              Other Timezones
            </h3>
            <div className="flex items-center gap-2">
              <select
                value={newTimezone}
                onChange={(e) => setNewTimezone(e.target.value)}
                className="px-3 py-1.5 text-sm rounded-md border focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{ 
                  backgroundColor: 'var(--color-tertiary-bg)', 
                  borderColor: 'var(--color-primary-border)', 
                  color: 'var(--color-primary-text)' 
                }}
              >
                <option value="">Select a timezone...</option>
                {commonTimezones
                  .filter(tz => !timezones.some(existing => existing.timezone === tz.timezone))
                  .map(tz => (
                    <option key={tz.timezone} value={tz.name}>
                      {tz.name} ({tz.timezone})
                    </option>
                  ))
                }
              </select>
              <button
                onClick={addTimezone}
                disabled={!newTimezone.trim()}
                className="px-3 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center gap-1 disabled:opacity-50"
                style={{ 
                  backgroundColor: 'var(--color-blue-primary)', 
                  color: 'white'
                }}
              >
                <Plus className="w-4 h-4" />
                Add
              </button>
            </div>
          </div>

          {timezones.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {timezones.map((tz, index) => (
                <div
                  key={`${tz.timezone}-${index}`}
                  className="flex items-center justify-between p-3 rounded-lg"
                  style={{ backgroundColor: 'var(--color-tertiary-bg)' }}
                >
                  <div className="flex-1">
                    <div className="text-sm font-medium mb-1" style={{ color: 'var(--color-secondary-text)' }}>
                      {tz.name}:
                    </div>
                    <div className="text-sm" style={{ color: 'var(--color-primary-text)' }}>
                      {tz.time}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => copyToClipboard(tz.time, tz.name)}
                      className="p-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                      title={`Copy ${tz.name} time`}
                    >
                      <Copy className="w-4 h-4" style={{ color: 'var(--color-secondary-text)' }} />
                    </button>
                    <button
                      onClick={() => removeTimezone(index)}
                      className="p-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                      title="Remove timezone"
                    >
                      <X className="w-4 h-4" style={{ color: 'var(--color-secondary-text)' }} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {timezones.length === 0 && (
            <div className="text-center py-8" style={{ color: 'var(--color-secondary-text)' }}>
              <p className="text-sm">No timezones added yet.</p>
              <p className="text-xs mt-1">Select a timezone from the dropdown above to get started.</p>
            </div>
          )}
        </div>
      )}

      {/* Success message */}
      {copied && (
        <div className="fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg">
          Copied {copied} to clipboard!
        </div>
      )}
    </div>
  );
}
