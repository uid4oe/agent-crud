import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function MarkdownContent({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h1: ({ children }) => <h1 className="text-xl font-medium mt-6 mb-3 first:mt-0 text-ink">{children}</h1>,
        h2: ({ children }) => <h2 className="text-lg font-medium mt-5 mb-2 text-ink">{children}</h2>,
        h3: ({ children }) => <h3 className="text-base font-medium mt-4 mb-2 text-ink">{children}</h3>,
        p: ({ children }) => <p className="mb-4 last:mb-0 text-ink text-[15px] leading-relaxed">{children}</p>,
        ul: ({ children }) => <ul className="list-disc list-inside mb-4 space-y-1 text-ink text-[15px] leading-relaxed marker:text-gray-400">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal list-inside mb-4 space-y-1 text-ink text-[15px] leading-relaxed marker:text-gray-400">{children}</ol>,
        li: ({ children }) => <li className="pl-1">{children}</li>,
        code: ({ className, children }) => {
          const isInline = !className;
          if (isInline) {
            return (
              <code className="px-1.5 py-0.5 rounded-md bg-surface text-ink text-sm font-mono tracking-tight">
                {children}
              </code>
            );
          }
          return (
            <div className="my-4 rounded-xl bg-surface text-ink overflow-hidden border border-gray-100">
              <div className="px-4 py-2 bg-surface-code text-xs font-medium text-gray-500 flex justify-between items-center">
                <span>Code</span>
              </div>
              <code className="block p-4 text-sm font-mono overflow-x-auto whitespace-pre">
                {children}
              </code>
            </div>
          );
        },
        pre: ({ children }) => <pre className="my-0">{children}</pre>,
        a: ({ href, children }) => (
          <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
            {children}
          </a>
        ),
        blockquote: ({ children }) => (
          <blockquote className="border-l-4 border-gray-200 pl-4 py-1 my-4 text-gray-600 italic bg-gray-50 rounded-r-lg">
            {children}
          </blockquote>
        ),
        table: ({ children }) => (
          <div className="overflow-x-auto my-4 rounded-xl border border-gray-200">
            <table className="min-w-full text-sm border-collapse text-left">{children}</table>
          </div>
        ),
        thead: ({ children }) => <thead className="bg-surface border-b border-gray-200">{children}</thead>,
        th: ({ children }) => <th className="px-4 py-3 font-medium text-gray-600">{children}</th>,
        td: ({ children }) => <td className="px-4 py-3 border-b border-gray-100 last:border-0">{children}</td>,
        hr: () => <hr className="my-6 border-gray-200" />,
        strong: ({ children }) => <strong className="font-semibold text-ink">{children}</strong>,
        em: ({ children }) => <em className="italic">{children}</em>,
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
