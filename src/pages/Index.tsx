import { useEffect, useRef } from 'react';
import { useChat } from '@/hooks/useChat';
import { ChatHeader } from '@/components/ChatHeader';
import { ChatMessage } from '@/components/ChatMessage';
import { ChatInput } from '@/components/ChatInput';
import { WelcomeScreen } from '@/components/WelcomeScreen';
import { Toaster } from '@/components/ui/sonner';

const Index = () => {
  const { messages, isLoading, sendMessage, clearMessages } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex h-screen flex-col bg-background">
      <ChatHeader onClear={clearMessages} hasMessages={messages.length > 0} />

      <main className="flex flex-1 flex-col overflow-hidden">
        {messages.length === 0 ? (
          <WelcomeScreen onSelectPrompt={sendMessage} />
        ) : (
          <div className="flex-1 overflow-y-auto">
            <div className="mx-auto max-w-3xl divide-y divide-border">
              {messages.map((message, index) => (
                <ChatMessage key={index} message={message} />
              ))}
              {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
                <div className="flex gap-3 p-4 bg-muted/50">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <div className="h-4 w-4 animate-pulse-glow rounded-full bg-primary-foreground" />
                  </div>
                  <div className="flex items-center">
                    <p className="text-sm text-muted-foreground">StudyBuddy is thinking...</p>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>
        )}

        <ChatInput onSend={sendMessage} isLoading={isLoading} />
      </main>

      <Toaster position="top-center" />
    </div>
  );
};

export default Index;
