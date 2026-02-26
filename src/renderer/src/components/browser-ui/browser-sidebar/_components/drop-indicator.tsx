import { DropIndicator as BaseDropIndicator } from "@atlaskit/pragmatic-drag-and-drop-react-drop-indicator/list-item";

export function DropIndicator({ isSpaceLight }: { isSpaceLight: boolean }) {
  return (
    <ol
      className="flex *:mx-2 relative h-0 -m-0.5"
      style={
        {
          "--ds-border-selected": isSpaceLight ? "#000" : "#fff"
        } as React.CSSProperties
      }
    >
      <BaseDropIndicator
        instruction={{
          axis: "vertical",
          operation: "reorder-after",
          blocked: false
        }}
        lineGap="0px"
        lineType="terminal-no-bleed"
      />
    </ol>
  );
}
