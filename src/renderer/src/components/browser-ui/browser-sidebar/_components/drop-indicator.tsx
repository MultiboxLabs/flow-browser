import { DropIndicator as BaseDropIndicator } from "@atlaskit/pragmatic-drag-and-drop-react-drop-indicator/list-item";

export function DropIndicator({
  isSpaceLight,
  showTerminal = true
}: {
  isSpaceLight: boolean;
  showTerminal?: boolean;
}) {
  return (
    <ol
      className="flex *:mx-2 relative h-0 -mx-0.5 my-1"
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
        lineType={showTerminal ? "terminal-no-bleed" : "no-terminal"}
      />
    </ol>
  );
}
