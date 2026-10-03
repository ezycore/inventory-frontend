// coding-standard: maintained
import { render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BarcodeScanner } from "../barcode-scanner";

/**
 * zxing decodes every video frame and calls back with whatever it sees. The
 * mock hands the test that callback, so a "frame" is one call to `frame()`.
 */
const zxing = vi.hoisted(() => ({
  decode: vi.fn(),
  onFrame: null as null | ((result: { getText: () => string } | null, err: unknown) => void),
}));

vi.mock("@zxing/browser", () => ({
  BrowserMultiFormatReader: class {
    static listVideoInputDevices = async () => [{ deviceId: "cam-1", label: "back camera" }];
    decodeFromVideoDevice = (
      _deviceId: string,
      _video: HTMLVideoElement,
      cb: NonNullable<typeof zxing.onFrame>,
    ) => {
      zxing.decode();
      zxing.onFrame = cb;
      return Promise.resolve({ stop: vi.fn() });
    };
  },
}));

let now = 0;
const frame = (code: string | null, at: number) => {
  now = at;
  zxing.onFrame!(code ? { getText: () => code } : null, code ? undefined : { name: "NotFoundException" });
};

beforeEach(() => {
  now = 0;
  zxing.decode.mockClear();
  zxing.onFrame = null;
  vi.spyOn(performance, "now").mockImplementation(() => now);
});

afterEach(() => vi.restoreAllMocks());

const started = () => waitFor(() => expect(zxing.onFrame).not.toBeNull());

describe("BarcodeScanner", () => {
  it("fires once for a code held in front of the camera", async () => {
    const onDetect = vi.fn();
    render(<BarcodeScanner onDetect={onDetect} />);
    await started();

    // Held in view for 5 s, decoded every ~100 ms.
    for (let t = 0; t <= 5000; t += 100) frame("8901234567890", t);

    expect(onDetect).toHaveBeenCalledTimes(1);
  });

  it("fires again once the code has been out of view for the debounce window", async () => {
    const onDetect = vi.fn();
    render(<BarcodeScanner onDetect={onDetect} duplicateDebounceMs={1000} />);
    await started();

    frame("8901234567890", 0);
    frame("8901234567890", 300);
    // Taken away: frames with nothing in them for 1.5 s.
    for (let t = 400; t <= 1800; t += 100) frame(null, t);
    frame("8901234567890", 1900);

    expect(onDetect).toHaveBeenCalledTimes(2);
  });

  it("fires immediately for a different code", async () => {
    const onDetect = vi.fn();
    render(<BarcodeScanner onDetect={onDetect} />);
    await started();

    frame("111", 0);
    frame("222", 50);

    expect(onDetect.mock.calls.map(([code]) => code)).toEqual(["111", "222"]);
  });

  it("keeps the camera running when the caller passes a new onDetect", async () => {
    const first = vi.fn();
    const second = vi.fn();
    const { rerender } = render(<BarcodeScanner onDetect={first} />);
    await started();

    rerender(<BarcodeScanner onDetect={second} />);
    frame("8901234567890", 0);

    expect(zxing.decode).toHaveBeenCalledTimes(1);
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledWith("8901234567890");
  });
});
