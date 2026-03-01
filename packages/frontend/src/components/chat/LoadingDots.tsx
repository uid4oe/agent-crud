export function LoadingDots() {
  return (
    <div className="flex gap-1 items-center py-2">
      <span className="h-2 w-2 rounded-full bg-gray-400 animate-typing-dot" style={{ animationDelay: "0ms" }} />
      <span className="h-2 w-2 rounded-full bg-gray-400 animate-typing-dot" style={{ animationDelay: "160ms" }} />
      <span className="h-2 w-2 rounded-full bg-gray-400 animate-typing-dot" style={{ animationDelay: "320ms" }} />
    </div>
  );
}
