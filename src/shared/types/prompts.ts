/** `Omit<T, K>` on a union uses `keyof T` as key intersection; omit each member instead. */
type DistributiveOmit<T, K extends keyof T> = T extends T ? Omit<T, K> : never;

// Prompt Result Types //
interface SuccessfulPromptResult<Result> {
  success: true;
  result: Result;
}

interface FailedPromptResult {
  success: false;
}

export type PromptResult<Result> = SuccessfulPromptResult<Result> | FailedPromptResult;

// Extendable Prompt States //
interface BasePromptState<Result> {
  id: string;
  tabId: number;
  promise: Promise<PromptResult<Result>>;
  resolver: (value: PromptResult<Result>) => void;
}

// Main Prompt States //
interface TextPromptState extends BasePromptState<string | null> {
  type: "prompt";
  message: string;
  defaultValue: string;
}

interface ConfirmPromptState extends BasePromptState<boolean> {
  type: "confirm";
  message: string;
}

interface AlertPromptState extends BasePromptState<void> {
  type: "alert";
  message: string;
}

// Combined Prompt States //
export type PromptState = TextPromptState | ConfirmPromptState | AlertPromptState;

// Renderer Types //
export type ActivePrompt = DistributiveOmit<PromptState, "promise" | "resolver">;
