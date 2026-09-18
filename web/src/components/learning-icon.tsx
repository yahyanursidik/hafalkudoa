export type LearningIconName =
  | "arrowLeft"
  | "arrowRight"
  | "book"
  | "collection"
  | "color"
  | "focus"
  | "help"
  | "order"
  | "repeat"
  | "steps"
  | "textLarge"
  | "textMedium"
  | "textSmall"
  | "try";

type LearningIconProps = {
  readonly name: LearningIconName;
  readonly className?: string;
};

export function LearningIcon({ name, className = "" }: LearningIconProps) {
  const commonProps = {
    "aria-hidden": true,
    className: `learning-icon ${className}`.trim(),
    focusable: false,
    viewBox: "0 0 24 24",
  };

  switch (name) {
    case "arrowLeft":
      return <svg {...commonProps}><path d="m14.5 5-7 7 7 7M8 12h9" /></svg>;
    case "arrowRight":
      return <svg {...commonProps}><path d="m9.5 5 7 7-7 7M16 12H7" /></svg>;
    case "book":
      return <svg {...commonProps}><path d="M5 4.5h11.5A2.5 2.5 0 0 1 19 7v12H7A2 2 0 0 0 5 21V6.5a2 2 0 0 1 2-2Zm0 0V19" /><path d="M9 9h6M9 13h6" /></svg>;
    case "collection":
      return <svg {...commonProps}><path d="M6.5 5.5h11A1.5 1.5 0 0 1 19 7v11a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 18V7a1.5 1.5 0 0 1 1.5-1.5Z" /><path d="M8.5 9h7M8.5 12.5h7M8.5 16h4" /><path d="M4 8v11a1.5 1.5 0 0 0 1.5 1.5H15" /></svg>;
    case "color":
      return <svg {...commonProps}><path d="M12 4.5C7.6 4.5 4.5 7.8 4.5 12c0 4.1 2.8 7.5 6.3 7.5h1.1c.9 0 1.4-.8 1.1-1.5-.3-.7.2-1.5 1-1.5h.8c2.6 0 4.7-2.1 4.7-4.7 0-4.1-3.2-7.3-7.5-7.3Z" /><path d="M8 10h.01M11 7.5h.01M15.5 9h.01M8.5 14h.01" /></svg>;
    case "focus":
      return <svg {...commonProps}><path d="M8 4.5H5.5V8M16 4.5h2.5V8M8 19.5H5.5V16M16 19.5h2.5V16" /><path d="M9 9h6v6H9z" /></svg>;
    case "help":
      return <svg {...commonProps}><path d="M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z" /><path d="M9.8 9.3a2.35 2.35 0 1 1 3.5 2.05c-.82.45-1.3.95-1.3 1.95M12 16.7h.01" /></svg>;
    case "order":
      return <svg {...commonProps}><path d="M8 6h10M8 12h7M8 18h10" /><path d="m4 8-2-2 2-2M2 6h4M4 16l2 2-2 2M6 18H2" /></svg>;
    case "repeat":
      return <svg {...commonProps}><path d="M18 8.5A7 7 0 1 0 19 14m-1-5.5V4m0 4.5h-4.5" /></svg>;
    case "steps":
      return <svg {...commonProps}><path d="M5 18.5h14M5 12h9M5 5.5h4" /><path d="M17 9.5v5M14.5 12h5" /></svg>;
    case "textLarge":
      return <svg {...commonProps}><path d="m5.5 18 4-12 4 12M7.1 13h4.8M15.5 9h3M17 9v9" /></svg>;
    case "textMedium":
      return <svg {...commonProps}><path d="m6 18 4-12 4 12M7.6 13h4.8M16 11h2.5M17.25 11v7" /></svg>;
    case "textSmall":
      return <svg {...commonProps}><path d="m6.5 18 4-12 4 12M8.1 13h4.8M16.5 13h2M17.5 13v5" /></svg>;
    case "try":
      return <svg {...commonProps}><path d="M4.5 12a7.5 7.5 0 0 1 14.3-3M19.5 5.5v4h-4" /><path d="M19.5 12a7.5 7.5 0 0 1-14.3 3M4.5 18.5v-4h4" /></svg>;
  }
}
