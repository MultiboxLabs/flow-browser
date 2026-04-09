interface SuccessfulPromptResult<Result> {
  success: true;
  result: Result;
}

interface FailedPromptResult {
  success: false;
}

export type PromptResult<Result> = SuccessfulPromptResult<Result> | FailedPromptResult;

// Extendable Prompt States //
type NormalOrPromise<T> = T | PromiseLike<T>;

interface BasePromptState<Result> {
  id: string;
  tabId: number;
  resolver: (value: NormalOrPromise<PromptResult<Result>>) => void;
}

// Main Prompt States //
interface TextPromptState extends BasePromptState<string | null> {
  type: "prompt";
  message: string;
  defaultValue: string;
}

// Combined Prompt States //
export type PromptState = TextPromptState;
