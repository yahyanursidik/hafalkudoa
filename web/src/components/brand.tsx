type BrandProps = {
  readonly className?: string;
};

export function Brand({ className = "" }: BrandProps) {
  return (
    <span className={`brand-lockup ${className}`.trim()} aria-label="Hafalku Doa">
      <span className="brand-mark" aria-hidden="true">
        <img src="/brand/doaku-logo.png" alt="" />
      </span>
      <span className="brand-name">
        <strong>Hafalku</strong>
        <span>Doa</span>
      </span>
    </span>
  );
}
