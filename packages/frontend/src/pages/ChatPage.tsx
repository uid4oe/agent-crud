import { useCallback, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MessageList, ChatInput, WelcomeScreen, CardActionsProvider } from "../components/chat";
import { EntityPanelProvider, useEntityPanel } from "../components/chat/EntityPanelContext";
import { EntityPanel } from "../components/chat/EntityPanel";
import { EntityPanelDrawer } from "../components/chat/EntityPanelDrawer";
import { DemoController } from "../components/chat/DemoController";
import { useChat, detectDomainFromContent } from "../hooks";
import { useDemoMode } from "../hooks/useDemoMode";
import { useIsMobile } from "../hooks/useIsMobile";
import { cn } from "../lib/utils";
import { ROUTES } from "../config";

function ChatPageInner() {
  const { conversationId } = useParams<{ conversationId?: string }>();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { isOpen: isPanelOpen, openPanel, closePanel, highlightEntity } = useEntityPanel();

  const handleConversationChange = useCallback(
    (id: string | null) => {
      if (id) {
        navigate(`${ROUTES.CHAT}/${id}`);
      } else {
        closePanel();
        navigate(ROUTES.CHAT);
      }
    },
    [navigate, closePanel]
  );

  const {
    messages,
    activeConversationId,
    sendMessage,
    startNewConversation,
    isSending,
    isCreating,
  } = useChat({
    initialConversationId: conversationId,
    onConversationChange: handleConversationChange,
    onEntitiesDetected: (domain, entityIds) => {
      openPanel(domain);
      if (entityIds.length > 0) {
        highlightEntity(entityIds[0]);
      }
    },
  });

  const demo = useDemoMode({
    sendMessage,
    startNewConversation,
    isSending: isSending || isCreating,
    activeConversationId,
  });

  // On load / refresh: scan last model message to restore panel
  const hasRestoredPanel = useRef(false);
  useEffect(() => {
    if (hasRestoredPanel.current || !messages?.length || isPanelOpen) return;
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i];
      if (msg.role === "model" && msg.content) {
        const domain = detectDomainFromContent(msg.content);
        if (domain) {
          openPanel(domain);
        }
        hasRestoredPanel.current = true;
        break;
      }
    }
  }, [messages, isPanelOpen, openPanel]);

  return (
    <div className="flex h-full w-full bg-surface relative">
      {/* Chat column */}
      <div className="flex-1 flex flex-col min-w-0 h-full gap-4 bg-white">
        <div className="flex-1 overflow-y-auto w-full">
          {activeConversationId ? (
            <div className={cn(
              "mx-auto px-4 md:px-6 py-4 transition-[max-width] duration-300 ease-out",
              isPanelOpen ? "max-w-lg" : "max-w-3xl"
            )}>
              <MessageList
                messages={messages}
                isSending={isSending}
              />
            </div>
          ) : (
            <div className="h-full">
              <WelcomeScreen onNewChat={startNewConversation} isCreating={isCreating} />
            </div>
          )}
        </div>

        {/* Chat Input Area */}
        <div className={cn(
          "shrink-0 px-4 md:px-6 pb-3 mx-auto w-full transition-[max-width] duration-300 ease-out",
          isPanelOpen ? "max-w-lg" : "max-w-3xl"
        )}>
          <ChatInput
            onSend={activeConversationId ? sendMessage : startNewConversation}
            disabled={isSending || isCreating || demo.isActive}
            autoFocus
          />
        </div>
      </div>

      {/* Entity Panel — desktop: side panel, mobile: drawer */}
      {isMobile ? <EntityPanelDrawer /> : <EntityPanel />}

      {/* Demo Mode Controller */}
      <DemoController
        isActive={demo.isActive}
        isPaused={demo.isPaused}
        currentStep={demo.currentStep}
        totalSteps={demo.totalSteps}
        currentPrompt={demo.currentPrompt}
        onStart={demo.start}
        onStop={demo.stop}
        onPause={demo.pause}
        onResume={demo.resume}
        onSkip={demo.skipToNext}
      />
    </div>
  );
}

export function ChatPage() {
  return (
    <EntityPanelProvider>
      <CardActionsProvider>
        <ChatPageInner />
      </CardActionsProvider>
    </EntityPanelProvider>
  );
}
