interface MarkdownRendererProps {
  content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  const lines = content.split(/\r?\n/);

  return (
    <div className="space-y-2 text-sm leading-6 text-foreground">
      {lines.map((rawLine, index) => {
        const line = rawLine.trim();

        if (!line) return <div key={index} className="h-2" />;
        if (line.startsWith("### ")) return <h3 key={index} className="text-base font-semibold">{line.slice(4)}</h3>;
        if (line.startsWith("## ")) return <h2 key={index} className="text-lg font-semibold">{line.slice(3)}</h2>;
        if (line.startsWith("# ")) return <h1 key={index} className="text-xl font-bold">{line.slice(2)}</h1>;
        if (line.startsWith("- ")) return <li key={index} className="ml-4 list-disc">{line.slice(2)}</li>;

        return <p key={index}>{line}</p>;
      })}
    </div>
  );
}
