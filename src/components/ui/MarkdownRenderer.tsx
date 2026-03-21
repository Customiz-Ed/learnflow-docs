import { useMemo, useState, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import "highlight.js/styles/github-dark.css";

interface MarkdownRendererProps {
  content: string;
}

const sanitizeSchema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    code: [...(defaultSchema.attributes?.code || []), ["className"]],
    span: [...(defaultSchema.attributes?.span || []), ["className"]],
    div: [...(defaultSchema.attributes?.div || []), ["className"]],
  },
};

function extractText(node: ReactNode): string {
  if (typeof node === "string") return node;
  if (typeof node === "number") return String(node);
  if (!node || typeof node === "boolean") return "";
  if (Array.isArray(node)) return node.map(extractText).join("");
  if (typeof node === "object" && "props" in node) {
    const maybeChildren = (node as { props?: { children?: ReactNode } }).props?.children;
    return extractText(maybeChildren);
  }
  return "";
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  const [expandedMobile, setExpandedMobile] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const isLongContent = useMemo(() => {
    const lines = content.split(/\r?\n/).length;
    return lines > 28 || content.length > 1800;
  }, [content]);

  const isCollapsedOnMobile = isLongContent && !expandedMobile;

  const copyCode = async (raw: string) => {
    const normalized = raw.replace(/\n$/, "");
    try {
      await navigator.clipboard.writeText(normalized);
      setCopied(normalized);
      window.setTimeout(() => setCopied(null), 1400);
    } catch {
      setCopied(null);
    }
  };

  return (
    <div className="space-y-3">
      <div
        className={`relative overflow-hidden ${
          isCollapsedOnMobile ? "max-h-[22rem] md:max-h-none" : "max-h-none"
        }`}
      >
        <div className="prose prose-slate max-w-none text-sm leading-6 text-foreground prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-code:text-foreground prose-pre:bg-slate-900 prose-pre:text-slate-100 prose-li:text-foreground prose-a:text-primary hover:prose-a:text-primary/80">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeHighlight, [rehypeSanitize, sanitizeSchema]]}
            components={{
              h1: ({ children, ...props }) => (
                <h1 className="mt-6 text-2xl font-bold tracking-tight" {...props}>
                  {children}
                </h1>
              ),
              h2: ({ children, ...props }) => (
                <h2 className="mt-5 text-xl font-semibold tracking-tight" {...props}>
                  {children}
                </h2>
              ),
              h3: ({ children, ...props }) => (
                <h3 className="mt-4 text-lg font-semibold" {...props}>
                  {children}
                </h3>
              ),
              ul: ({ children, ...props }) => (
                <ul className="my-3 list-disc pl-6 marker:text-foreground/70" {...props}>
                  {children}
                </ul>
              ),
              ol: ({ children, ...props }) => (
                <ol className="my-3 list-decimal pl-6 marker:text-foreground/70" {...props}>
                  {children}
                </ol>
              ),
              li: ({ children, ...props }) => (
                <li className="my-1" {...props}>
                  {children}
                </li>
              ),
              a: ({ href, children, ...props }) => {
                const isExternal = Boolean(href && /^https?:\/\//i.test(href));
                return (
                  <a
                    href={href}
                    target={isExternal ? "_blank" : undefined}
                    rel={isExternal ? "noopener noreferrer nofollow" : undefined}
                    {...props}
                  >
                    {children}
                  </a>
                );
              },
              pre: ({ children, ...props }) => {
                const rawCode = extractText(children);
                const isCopied = copied === rawCode.replace(/\n$/, "");

                return (
                  <div className="group relative my-4">
                    <button
                      type="button"
                      onClick={() => void copyCode(rawCode)}
                      className="absolute right-2 top-2 rounded bg-slate-800 px-2 py-1 text-xs text-slate-100 opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100"
                    >
                      {isCopied ? "Copied" : "Copy"}
                    </button>
                    <pre className="overflow-x-auto rounded-lg p-4" {...props}>
                      {children}
                    </pre>
                  </div>
                );
              },
              code: ({ className, children, ...props }) => {
                if (className) {
                  return (
                    <code className={className} {...props}>
                      {children}
                    </code>
                  );
                }

                return (
                  <code
                    className="rounded bg-slate-200 px-1 py-0.5 text-[0.9em] dark:bg-slate-800"
                    {...props}
                  >
                    {children}
                  </code>
                );
              },
            }}
          >
            {content}
          </ReactMarkdown>
        </div>

        {isCollapsedOnMobile && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-background to-transparent md:hidden" />
        )}
      </div>

      {isLongContent && (
        <button
          type="button"
          onClick={() => setExpandedMobile((prev) => !prev)}
          className="text-sm font-medium text-primary hover:text-primary/80 md:hidden"
        >
          {expandedMobile ? "Show less" : "Show full content"}
        </button>
      )}
    </div>
  );
}
