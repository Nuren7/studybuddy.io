import { cn } from '@/lib/utils';
import { Bot, User, FileText } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import type { Message } from '@/hooks/useChat';

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isAssistant = message.role === 'assistant';

  return (
    <div
      className={cn(
        'flex gap-3 p-4 animate-fade-in',
        isAssistant ? 'bg-muted/50' : 'bg-transparent'
      )}
    >
      <div
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
          isAssistant
            ? 'bg-primary text-primary-foreground'
            : 'bg-secondary text-secondary-foreground'
        )}
      >
        {isAssistant ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
      </div>
      <div className="flex-1 space-y-2 overflow-hidden">
        <p className="text-xs font-medium text-muted-foreground">
          {isAssistant ? 'Assistant' : 'You'}
        </p>
        
        {message.attachments && message.attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {message.attachments.map((attachment, index) => (
              <div
                key={index}
                className="flex items-center gap-2 rounded-lg bg-secondary/50 px-3 py-1.5 text-xs"
              >
                <FileText className="h-3 w-3 text-primary" />
                <span className="max-w-[150px] truncate">{attachment.name}</span>
              </div>
            ))}
          </div>
        )}
        
        <div className="prose prose-sm prose-invert max-w-none">
          <ReactMarkdown
            components={{
              p: ({ children }) => <p className="mb-2 last:mb-0 text-foreground">{children}</p>,
              ul: ({ children }) => <ul className="mb-2 ml-4 list-disc text-foreground">{children}</ul>,
              ol: ({ children }) => <ol className="mb-2 ml-4 list-decimal text-foreground">{children}</ol>,
              li: ({ children }) => <li className="mb-1 text-foreground">{children}</li>,
              strong: ({ children }) => <strong className="font-semibold text-primary">{children}</strong>,
              code: ({ children, className }) => {
                const isInline = !className;
                return isInline ? (
                  <code className="rounded bg-secondary px-1.5 py-0.5 font-mono text-sm text-foreground">
                    {children}
                  </code>
                ) : (
                  <code className="block rounded-lg bg-secondary p-3 font-mono text-sm text-foreground overflow-x-auto">
                    {children}
                  </code>
                );
              },
              pre: ({ children }) => <pre className="mb-2 overflow-x-auto">{children}</pre>,
              h1: ({ children }) => <h1 className="mb-2 text-lg font-bold text-foreground">{children}</h1>,
              h2: ({ children }) => <h2 className="mb-2 text-base font-bold text-foreground">{children}</h2>,
              h3: ({ children }) => <h3 className="mb-2 text-sm font-bold text-foreground">{children}</h3>,
              blockquote: ({ children }) => (
                <blockquote className="border-l-2 border-primary pl-4 italic text-muted-foreground">
                  {children}
                </blockquote>
              ),
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
