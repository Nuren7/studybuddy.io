import { MessageSquare, FileText, Code, Sparkles } from 'lucide-react';

const features = [
  {
    icon: MessageSquare,
    title: 'Ask Anything',
    description: 'Get answers on any topic',
    prompt: 'What are the most effective ways to learn a new programming language?',
  },
  {
    icon: FileText,
    title: 'Analyze Documents',
    description: 'Upload and analyze text files',
    prompt: 'I want to upload a document for analysis',
  },
  {
    icon: Code,
    title: 'Help with Code',
    description: 'Debug, explain, or write code',
    prompt: 'Help me write a Python function that sorts a list of dictionaries by a specific key',
  },
  {
    icon: Sparkles,
    title: 'Creative Writing',
    description: 'Generate stories, emails, and more',
    prompt: 'Write me a short creative story about a robot learning to paint',
  },
];

interface WelcomeScreenProps {
  onSelectPrompt: (prompt: string) => void;
}

export function WelcomeScreen({ onSelectPrompt }: WelcomeScreenProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center p-8">
      <div className="max-w-2xl text-center">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Welcome to <span className="gradient-text">StudyBuddy</span>
        </h2>
        <p className="mt-3 text-muted-foreground">
          Your AI assistant for any task. Ask questions, analyze documents, get coding help, and more.
        </p>
      </div>

      <div className="mt-10 grid w-full max-w-2xl gap-4 sm:grid-cols-2">
        {features.map((feature) => (
          <button
            key={feature.title}
            onClick={() => onSelectPrompt(feature.prompt)}
            className="group flex flex-col items-start gap-3 rounded-xl border border-border bg-card p-4 text-left transition-all hover:border-primary/50 hover:bg-muted/50 hover:glow-sm"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
              <feature.icon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-medium text-foreground">{feature.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {feature.description}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
