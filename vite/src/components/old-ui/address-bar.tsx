import React, { memo, useRef } from "react";

interface AddressBarProps {
  url: string;
  onChange: (url: string) => void;
  onSubmit: () => void;
}

const AddressBar: React.FC<AddressBarProps> = ({ url, onChange, onSubmit }) => {
  // Log for debugging
  console.log("AddressBar render:", { url });

  const inputRef = useRef<HTMLInputElement>(null);

  const handleFocus = () => {
    setTimeout(() => {
      inputRef.current?.setSelectionRange(0, inputRef.current?.value.length);
    }, 10);
  };

  const handleBlur = () => {
    inputRef.current?.setSelectionRange(0, 0);
  };

  return (
    <div className="flex-1 h-full leading-0">
      <input
        ref={inputRef}
        className="w-full h-full bg-background text-foreground border border-input rounded-full px-2 outline-none focus:ring-2 focus:ring-ring/50"
        value={url}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            onSubmit();
          }
        }}
        onFocus={handleFocus}
        onBlur={handleBlur}
        spellCheck="false"
      />
    </div>
  );
};

// Use memo to prevent unnecessary re-renders
export default memo(AddressBar);
