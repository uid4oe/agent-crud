import { Compass, Lightbulb, Pencil, Target, Loader2 } from "lucide-react";

interface WelcomeScreenProps {
  onNewChat: (initialMessage?: string) => void;
  isCreating: boolean;
}

const SUGGESTIONS = [
  {
    icon: Lightbulb,
    title: "Manage tasks",
    prompt: "Show all my tasks and summarize them",
  },
  {
    icon: Pencil,
    title: "Make notes",
    prompt: "Add a note about tomorrow's meeting",
  },
  {
    icon: Target,
    title: "Set goals",
    prompt: "Create a fitness goal to run 5K with milestones",
  },
  {
    icon: Compass,
    title: "Track wellness",
    prompt: "Show my wellness goals and their progress",
  },
];

export function WelcomeScreen({ onNewChat, isCreating }: WelcomeScreenProps) {
  return (
    <div className="flex-1 flex flex-col items-center pt-16 md:pt-24 p-6 md:p-8">
      <div className="w-full max-w-4xl flex flex-col items-center mb-12">
        <h1 className="text-5xl font-medium bg-gradient-to-r from-[#4285F4] via-[#9B72CB] to-[#D96570] text-transparent bg-clip-text leading-tight tracking-tight mt-10">
          Hello,
        </h1>
        <h1 className="text-4xl font-medium text-ink-faded leading-tight tracking-tight mt-1">
          How can I help you today?
        </h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl w-full">
        {SUGGESTIONS.map(({ icon: Icon, title, prompt }) => (
          <button
            key={title}
            onClick={() => onNewChat(prompt)}
            disabled={isCreating}
            className="flex flex-col items-start gap-3 p-5 bg-surface hover:bg-white rounded-3xl text-left transition-all duration-200 cursor-pointer w-full h-44 border border-transparent hover:border-gray-100 hover:shadow-[0_4px_12px_rgba(0,0,0,0.05)] hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-50 relative group"
          >
            <div className="flex flex-col flex-1 w-full justify-between h-full">
              <div>
                <div className="text-[16px] text-gray-900 font-medium mb-1.5">
                  {title}
                </div>
                <div className="text-[14px] text-gray-500 line-clamp-2 leading-relaxed">
                  {prompt}
                </div>
              </div>
              <div className="w-9 h-9 mt-4 self-end rounded-full bg-white group-hover:bg-surface transition-all duration-200 flex items-center justify-center shadow-sm">
                <Icon className="h-4 w-4 text-gray-700 group-hover:text-blue-600 transition-all duration-150" />
              </div>
            </div>
          </button>
        ))}
      </div>
      {/* Hidden button to use onNewChat safely if users type without clicking a card */}
      {isCreating && (
        <div className="fixed inset-0 bg-white/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      )}
    </div>
  );
}
