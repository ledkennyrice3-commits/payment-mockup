type BybitBackButtonProps = {
  onBack?: () => void;
  className?: string;
};

/** Native Bybit-style back chevron (shaft + 45° wings, round caps). */
export function BybitBackButton({ onBack, className }: BybitBackButtonProps) {
  return (
    <button
      type="button"
      onClick={onBack}
      className={`relative z-10 -ml-1 shrink-0 p-1 text-[#EAECEF] transition-opacity hover:opacity-80 focus:outline-none ${className ?? ""}`}
      aria-label="Go back"
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M20.5 12H5M5 12L12 19M5 12L12 5"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
