interface AboutHighlightedTitleProps {
  text: string;
  highlights: string[];
}

export default function AboutHighlightedTitle({ text, highlights }: AboutHighlightedTitleProps) {
  if (!highlights.length) {
    return <>{text}</>;
  }

  const pattern = highlights
    .map((word) => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('|');
  const parts = text.split(new RegExp(`(${pattern})`, 'gi'));

  return (
    <>
      {parts.map((part, index) => {
        const isHighlight = highlights.some(
          (word) => word.toLowerCase() === part.toLowerCase()
        );

        if (isHighlight) {
          return (
            <span key={`${part}-${index}`} className="text-primary-700">
              {part}
            </span>
          );
        }

        return <span key={`${part}-${index}`}>{part}</span>;
      })}
    </>
  );
}
