export function PinInCircle({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="34" height="34" viewBox="0 0 34 34" className={className}>
      <defs>
        <mask id="pin-mask">
          <rect width="34" height="34" fill="white" />
          <g
            transform="translate(5, 5)"
            fill="black"
            stroke="black"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="10.5" y="17" width="2" height="6" rx="1.5" />
            <path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z" />
          </g>
        </mask>
      </defs>
      <circle cx="17" cy="17" r="17" fill="currentColor" mask="url(#pin-mask)" />
    </svg>
  );
}
