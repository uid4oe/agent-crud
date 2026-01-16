import { ChatSidebar, MessageList, ChatInput, WelcomeScreen } from "../components/chat";
import { useChat } from "../hooks";

export function ChatPage() {
  const {
    conversations,
    messages,
    activeConversationId,
    setActiveConversationId,
    sendMessage,
    startNewConversation,
    removeConversation,
    isSending,
    isCreating,
  } = useChat();

  return (
    <div className="flex h-[calc(100vh-8rem)] border rounded-lg overflow-hidden bg-background">
      <ChatSidebar
        conversations={conversations}
        activeId={activeConversationId}
        onSelect={setActiveConversationId}
        onNew={startNewConversation}
        onDelete={removeConversation}
        isCreating={isCreating}
      />

      <div className="flex-1 flex flex-col">
        {activeConversationId ? (
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <MessageList messages={messages} isSending={isSending} />
            </div>
            <div className="p-4 border-t">
              <ChatInput onSend={sendMessage} disabled={isSending} autoFocus />
            </div>
          </>
        ) : (
          <WelcomeScreen onNewChat={startNewConversation} isCreating={isCreating} />
        )}
      </div>
    </div>
  );
}
