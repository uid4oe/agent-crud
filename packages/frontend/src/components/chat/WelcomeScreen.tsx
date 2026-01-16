import { Plus, Bot } from "lucide-react";
import { Button } from "../ui/button";

interface WelcomeScreenProps {
  onNewChat: () => void;
  isCreating: boolean;
}

export function WelcomeScreen({ onNewChat, isCreating }: WelcomeScreenProps) {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center">
        <Bot className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-lg font-medium">AI Assistant</h2>
        <p className="text-sm text-muted-foreground mt-1 mb-4">Start a conversation to manage your tasks</p>
        <Button onClick={onNewChat} disabled={isCreating}>
          <Plus className="h-4 w-4 mr-2" />
          New Chat
        </Button>
      </div>
    </div>
  );
}
