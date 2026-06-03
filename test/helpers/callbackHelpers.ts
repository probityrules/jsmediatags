import type { CallbackType } from "../../src/FlowTypes";

export function throwOnError<T>(
  onSuccess: (value: T) => void
): CallbackType<T> {
  return {
    onSuccess,
    onError: () => {
      throw new Error();
    },
  };
}

export function throwOnSuccess(onError: (error: unknown) => void): {
  onSuccess: () => void;
  onError: (error: unknown) => void;
} {
  return {
    onSuccess: () => {
      throw new Error();
    },
    onError: onError,
  };
}
