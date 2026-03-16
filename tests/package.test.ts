import { describe, expect, it } from "vitest";
import { addressVersion, mainNetworkId, testNetworkId } from "../src/index.js";

describe("package exports", () => {
  it("exports Neo N3 network constants", () => {
    expect(mainNetworkId()).toBe(860833102);
    expect(testNetworkId()).toBe(894710606);
    expect(addressVersion()).toBe(53);
  });
});
