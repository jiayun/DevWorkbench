import { useState, useEffect, useCallback } from "react";
import { Copy, Clipboard, Trash2, RotateCcw, Clock, Calendar } from "lucide-react";
import { CronExpressionParser } from "cron-parser";
import cronstrue from "cronstrue";

interface CronExample {
  name: string;
  expression: string;
  description: string;
  category: string;
}

interface NextExecution {
  date: Date;
  formatted: string;
  relative: string;
}

const cronExamples: CronExample[] = [
  // Basic intervals
  { name: "Every minute", expression: "* * * * *", description: "Runs every minute", category: "Basic Intervals" },
  { name: "Every 5 minutes", expression: "*/5 * * * *", description: "Runs every 5 minutes", category: "Basic Intervals" },
  { name: "Every 15 minutes", expression: "*/15 * * * *", description: "Runs every 15 minutes", category: "Basic Intervals" },
  { name: "Every 30 minutes", expression: "*/30 * * * *", description: "Runs every 30 minutes", category: "Basic Intervals" },
  { name: "Every hour", expression: "0 * * * *", description: "Runs at the top of every hour", category: "Basic Intervals" },
  { name: "Every 2 hours", expression: "0 */2 * * *", description: "Runs every 2 hours", category: "Basic Intervals" },
  { name: "Daily", expression: "0 0 * * *", description: "Runs daily at midnight", category: "Basic Intervals" },
  
  // Work schedule
  { name: "Weekdays 9 AM", expression: "0 9 * * 1-5", description: "Monday to Friday at 9 AM", category: "Work Schedule" },
  { name: "Weekdays 6 PM", expression: "0 18 * * 1-5", description: "Monday to Friday at 6 PM", category: "Work Schedule" },
  { name: "Business hours", expression: "0 9-17/2 * * 1-5", description: "Every 2 hours from 9 AM to 5 PM on weekdays", category: "Work Schedule" },
  { name: "Lunch time", expression: "0 12 * * 1-5", description: "Weekdays at noon", category: "Work Schedule" },
  
  // Weekly schedule
  { name: "Every Monday", expression: "0 0 * * 1", description: "Every Monday at midnight", category: "Weekly" },
  { name: "Every Friday", expression: "0 0 * * 5", description: "Every Friday at midnight", category: "Weekly" },
  { name: "Weekends", expression: "0 0 * * 6,0", description: "Saturday and Sunday at midnight", category: "Weekly" },
  
  // Monthly schedule
  { name: "First day of month", expression: "0 0 1 * *", description: "First day of every month at midnight", category: "Monthly" },
  { name: "Last day of month", expression: "0 0 L * *", description: "Last day of every month at midnight", category: "Monthly" },
  { name: "15th of month", expression: "0 0 15 * *", description: "15th day of every month at midnight", category: "Monthly" },
  
  // Special times
  { name: "New Year", expression: "0 0 1 1 *", description: "January 1st at midnight every year", category: "Special" },
  { name: "Christmas", expression: "0 0 25 12 *", description: "December 25th at midnight every year", category: "Special" },
  
  // Common maintenance
  { name: "Nightly backup", expression: "0 2 * * *", description: "Daily backup at 2 AM", category: "Maintenance" },
  { name: "Weekend cleanup", expression: "0 3 * * 0", description: "Sunday cleanup at 3 AM", category: "Maintenance" },
  { name: "End of month report", expression: "0 23 L * *", description: "Generate report at 11 PM on last day of month", category: "Maintenance" },
];

export function CronJobParser() {
  const [input, setInput] = useState("");
  const [description, setDescription] = useState("");
  const [nextExecutions, setNextExecutions] = useState<NextExecution[]>([]);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState("All");

  const categories = ["All", ...Array.from(new Set(cronExamples.map(ex => ex.category)))];

  const filteredExamples = selectedCategory === "All" 
    ? cronExamples 
    : cronExamples.filter(ex => ex.category === selectedCategory);

  // Get relative time
  const getRelativeTime = (date: Date): string => {
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    
    if (diff < 0) return "Past due";
    
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `in ${days} day${days > 1 ? 's' : ''}`;
    if (hours > 0) return `in ${hours} hour${hours > 1 ? 's' : ''}`;
    if (minutes > 0) return `in ${minutes} minute${minutes > 1 ? 's' : ''}`;
    return `in ${seconds} second${seconds > 1 ? 's' : ''}`;
  };

  // Generate custom description for cron expression
  const generateDescription = (expression: string): string => {
    try {
      // Generate description in English
      let desc = cronstrue.toString(expression, { 
        throwExceptionOnParseError: false,
        verbose: false,
        dayOfWeekStartIndexZero: true
      });
      
      // Manual fix for common patterns
      if (expression.includes("1-5")) {
        desc = desc.replace(/Sunday through Thursday/g, "Monday through Friday");
      }
      
      return desc;
    } catch (err) {
      return "Unable to parse description";
    }
  };

  // Parse and analyze cron expression
  const analyzeCronExpression = useCallback((expression: string) => {
    if (!expression.trim()) {
      setDescription("");
      setNextExecutions([]);
      setError("");
      return;
    }

    try {
      // Parse cron expression
      const interval = CronExpressionParser.parse(expression);
      
      // Generate human-readable description
      const desc = generateDescription(expression);
      setDescription(desc);
      
      // Get next 10 executions
      const executions: NextExecution[] = [];
      for (let i = 0; i < 10; i++) {
        const next = interval.next();
        executions.push({
          date: next.toDate(),
          formatted: next.toDate().toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            weekday: 'short'
          }),
          relative: getRelativeTime(next.toDate())
        });
      }
      setNextExecutions(executions);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid cron expression");
      setDescription("");
      setNextExecutions([]);
    }
  }, []);

  // Handle input change
  useEffect(() => {
    analyzeCronExpression(input);
  }, [input, analyzeCronExpression]);

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

  // Clear input
  const clearInput = () => {
    setInput("");
    setDescription("");
    setNextExecutions([]);
    setError("");
  };

  // Set sample data
  const setSampleData = () => {
    setInput("0 9 * * 1-5");
  };

  // Select example
  const selectExample = (example: CronExample) => {
    setInput(example.expression);
  };

  return (
    <div className="space-y-6">
      <div className="text-sm" style={{ color: 'var(--color-secondary-text)' }}>
        Parse cron expressions, view execution times, and browse comprehensive example collections.
      </div>

      {/* Input Section */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-primary-text)' }}>
            Cron Expression
          </label>
          <div className="flex gap-2 mb-2">
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
              Paste
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
            placeholder="Enter cron expression, e.g.: 0 9 * * 1-5"
            className="w-full p-3 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors font-mono"
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

      {/* Description */}
      {description && (
        <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--color-tertiary-bg)' }}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium mb-1" style={{ color: 'var(--color-secondary-text)' }}>
                Description:
              </div>
              <div className="text-sm" style={{ color: 'var(--color-primary-text)' }}>
                {description}
              </div>
            </div>
            <button
              onClick={() => copyToClipboard(description, "描述")}
              className="ml-2 p-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              title="Copy description"
            >
              <Copy className="w-4 h-4" style={{ color: 'var(--color-secondary-text)' }} />
            </button>
          </div>
        </div>
      )}

      {/* Next Executions */}
      {nextExecutions.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2" style={{ color: 'var(--color-primary-text)' }}>
            <Clock className="w-5 h-5" />
            Next Execution Times
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {nextExecutions.map((execution, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 rounded-lg"
                style={{ backgroundColor: 'var(--color-tertiary-bg)' }}
              >
                <div className="flex-1">
                  <div className="text-sm font-medium" style={{ color: 'var(--color-primary-text)' }}>
                    {execution.formatted}
                  </div>
                  <div className="text-xs mt-1" style={{ color: 'var(--color-secondary-text)' }}>
                    {execution.relative}
                  </div>
                </div>
                <button
                  onClick={() => copyToClipboard(execution.formatted, `執行時間 ${index + 1}`)}
                  className="ml-2 p-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  title="Copy time"
                >
                  <Copy className="w-4 h-4" style={{ color: 'var(--color-secondary-text)' }} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Examples Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center gap-2" style={{ color: 'var(--color-primary-text)' }}>
            <Calendar className="w-5 h-5" />
            Example Collections
          </h3>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-1.5 text-sm rounded-md border focus:outline-none focus:ring-2 focus:ring-blue-500"
            style={{ 
              backgroundColor: 'var(--color-tertiary-bg)', 
              borderColor: 'var(--color-primary-border)', 
              color: 'var(--color-primary-text)' 
            }}
          >
            {categories.map(category => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3" style={{ gap: '2rem' }}>
          {filteredExamples.map((example, index) => (
            <div
              key={index}
              className="p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:border-blue-500 hover:shadow-md"
              style={{ 
                backgroundColor: 'var(--color-tertiary-bg)',
                borderColor: 'var(--color-primary-border)'
              }}
              onClick={() => selectExample(example)}
            >
              <div className="font-medium text-sm mb-1" style={{ color: 'var(--color-primary-text)' }}>
                {example.name}
              </div>
              <div className="text-xs font-mono mb-2 p-2 rounded border" style={{ 
                backgroundColor: 'var(--color-secondary-bg)', 
                borderColor: 'var(--color-primary-border)',
                color: 'var(--color-primary-text)' 
              }}>
                {example.expression}
              </div>
              <div className="text-xs" style={{ color: 'var(--color-secondary-text)' }}>
                {example.description}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Success message */}
      {copied && (
        <div className="fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg">
          Copied {copied} to clipboard!
        </div>
      )}
    </div>
  );
}
