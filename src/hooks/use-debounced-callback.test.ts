import { act, renderHook } from "@testing-library/react";
import { useDebouncedCallback } from "@/hooks/use-debounced-callback";

describe("useDebouncedCallback", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("invokes once with latest args after the delay", () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useDebouncedCallback(callback, 400));
    const [schedule] = result.current;

    act(() => {
      schedule("first");
      schedule("second");
    });

    expect(callback).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(400);
    });

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith("second");
  });

  it("flush clears the timer and invokes with latest args", () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useDebouncedCallback(callback, 400));
    const [schedule, flush] = result.current;

    act(() => {
      schedule("pending");
      flush();
    });

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith("pending");

    act(() => {
      vi.advanceTimersByTime(400);
    });

    expect(callback).toHaveBeenCalledTimes(1);
  });
});
