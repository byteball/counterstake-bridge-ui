import { JsonRpcProviderWithFallback } from "./JsonRpcProviderWithFallback";

const mockSuccessResponse = (result = "0x1") => ({
  ok: true,
  json: async () => ({ jsonrpc: "2.0", id: 1, result }),
});

const mockErrorResponse = (status = 429) => ({
  ok: false,
  status,
  json: async () => ({}),
});

const mockRpcErrorResponse = (code = -32000, message = "execution reverted") => ({
  ok: true,
  json: async () => ({ jsonrpc: "2.0", id: 1, error: { code, message } }),
});

/** Create a provider with zero retry delays for fast tests */
function createProvider(urls, chainId = 1, options = {}) {
  return new JsonRpcProviderWithFallback(urls, chainId, {
    retryDelays: [0, 0, 0],
    ...options,
  });
}

beforeEach(() => {
  global.fetch = jest.fn();
  jest.spyOn(console, "log").mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("JsonRpcProviderWithFallback", () => {
  it("should return result from the first URL on success", async () => {
    global.fetch.mockResolvedValueOnce(mockSuccessResponse("0xabc"));

    const provider = createProvider(["https://rpc1.test", "https://rpc2.test"]);
    const result = await provider.send("eth_call", []);

    expect(result).toBe("0xabc");
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch.mock.calls[0][0]).toBe("https://rpc1.test");
  });

  it("should fallback to the second URL on 429", async () => {
    global.fetch
      .mockResolvedValueOnce(mockErrorResponse(429))
      .mockResolvedValueOnce(mockSuccessResponse("0xdef"));

    const provider = createProvider(["https://rpc1.test", "https://rpc2.test"]);
    const result = await provider.send("eth_call", []);

    expect(result).toBe("0xdef");
    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(global.fetch.mock.calls[1][0]).toBe("https://rpc2.test");
  });

  it("should fallback on 500 server error", async () => {
    global.fetch
      .mockResolvedValueOnce(mockErrorResponse(500))
      .mockResolvedValueOnce(mockSuccessResponse("0x1"));

    const provider = createProvider(["https://rpc1.test", "https://rpc2.test"]);
    const result = await provider.send("eth_call", []);

    expect(result).toBe("0x1");
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it("should fallback on network error", async () => {
    global.fetch
      .mockRejectedValueOnce(new Error("Failed to fetch"))
      .mockResolvedValueOnce(mockSuccessResponse("0x1"));

    const provider = createProvider(["https://rpc1.test", "https://rpc2.test"]);
    const result = await provider.send("eth_call", []);

    expect(result).toBe("0x1");
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it("should fallback on RPC-level error", async () => {
    global.fetch
      .mockResolvedValueOnce(mockRpcErrorResponse(-32005, "limit exceeded"))
      .mockResolvedValueOnce(mockSuccessResponse("0x1"));

    const provider = createProvider(["https://rpc1.test", "https://rpc2.test"]);
    const result = await provider.send("eth_call", []);

    expect(result).toBe("0x1");
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it("should retry after all URLs fail and succeed on retry", async () => {
    // First cycle: both fail. Retry cycle: first succeeds.
    global.fetch
      .mockResolvedValueOnce(mockErrorResponse(429))
      .mockResolvedValueOnce(mockErrorResponse(429))
      .mockResolvedValueOnce(mockSuccessResponse("0xretry"));

    const provider = createProvider(["https://rpc1.test", "https://rpc2.test"]);
    const result = await provider.send("eth_call", []);

    expect(result).toBe("0xretry");
    expect(global.fetch).toHaveBeenCalledTimes(3);
  });

  it("should throw after all retries are exhausted", async () => {
    // 2 URLs × (1 initial + 3 retries) = 8 calls
    for (let i = 0; i < 8; i++) {
      global.fetch.mockResolvedValueOnce(mockErrorResponse(429));
    }

    const provider = createProvider(["https://rpc1.test", "https://rpc2.test"]);

    await expect(provider.send("eth_call", [])).rejects.toThrow("HTTP 429");
    expect(global.fetch).toHaveBeenCalledTimes(8);
  });

  it("should respect custom maxRetries", async () => {
    // 1 URL × (1 initial + 1 retry) = 2 calls
    global.fetch
      .mockResolvedValueOnce(mockErrorResponse(429))
      .mockResolvedValueOnce(mockErrorResponse(429));

    const provider = createProvider(["https://rpc1.test"], 1, { maxRetries: 1 });

    await expect(provider.send("eth_call", [])).rejects.toThrow("HTTP 429");
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it("should remember the last working provider", async () => {
    global.fetch
      .mockResolvedValueOnce(mockErrorResponse(429))
      .mockResolvedValueOnce(mockSuccessResponse("0x1"))
      .mockResolvedValueOnce(mockSuccessResponse("0x2"));

    const provider = createProvider(["https://rpc1.test", "https://rpc2.test", "https://rpc3.test"]);

    await provider.send("eth_call", []);
    expect(global.fetch.mock.calls[1][0]).toBe("https://rpc2.test");

    // second call should start from rpc2 (the last working one)
    await provider.send("eth_blockNumber", []);
    expect(global.fetch.mock.calls[2][0]).toBe("https://rpc2.test");
  });

  it("should wrap around URLs when starting from a non-zero index", async () => {
    global.fetch
      .mockResolvedValueOnce(mockErrorResponse(429))   // rpc1 fails
      .mockResolvedValueOnce(mockSuccessResponse("0x1")) // rpc2 ok
      .mockResolvedValueOnce(mockErrorResponse(429))   // rpc2 fails
      .mockResolvedValueOnce(mockErrorResponse(503))   // rpc3 fails
      .mockResolvedValueOnce(mockSuccessResponse("0x2")); // rpc1 ok (wrapped around)

    const provider = createProvider(["https://rpc1.test", "https://rpc2.test", "https://rpc3.test"]);

    // first call: rpc1 fails -> rpc2 works, currentIndex = 1
    await provider.send("eth_call", []);

    // second call: starts at rpc2 (fails) -> rpc3 (fails) -> rpc1 (works)
    const result = await provider.send("eth_call", []);
    expect(result).toBe("0x2");
    expect(global.fetch.mock.calls[4][0]).toBe("https://rpc1.test");
  });

  it("should send correct JSON-RPC payload", async () => {
    global.fetch.mockResolvedValueOnce(mockSuccessResponse("0x1"));

    const provider = createProvider(["https://rpc1.test"]);
    await provider.send("eth_getBalance", ["0xabc", "latest"]);

    const body = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(body.jsonrpc).toBe("2.0");
    expect(body.method).toBe("eth_getBalance");
    expect(body.params).toEqual(["0xabc", "latest"]);
    expect(typeof body.id).toBe("number");
  });

  it("should handle timeout (abort)", async () => {
    global.fetch.mockImplementationOnce(() => new Promise((_, reject) => {
      const err = new Error("The operation was aborted");
      err.name = "AbortError";
      reject(err);
    })).mockResolvedValueOnce(mockSuccessResponse("0x1"));

    const provider = createProvider(["https://slow.test", "https://fast.test"]);
    const result = await provider.send("eth_call", []);

    expect(result).toBe("0x1");
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it("should retry full cycle with all URLs on each attempt", async () => {
    // 3 URLs × (1 initial + 1 retry) = 6 calls, last one succeeds
    global.fetch
      .mockResolvedValueOnce(mockErrorResponse(429)) // cycle 1: rpc1
      .mockResolvedValueOnce(mockErrorResponse(429)) // cycle 1: rpc2
      .mockResolvedValueOnce(mockErrorResponse(429)) // cycle 1: rpc3
      .mockResolvedValueOnce(mockErrorResponse(429)) // cycle 2: rpc1
      .mockResolvedValueOnce(mockErrorResponse(429)) // cycle 2: rpc2
      .mockResolvedValueOnce(mockSuccessResponse("0x1")); // cycle 2: rpc3

    const provider = createProvider(
      ["https://rpc1.test", "https://rpc2.test", "https://rpc3.test"],
      1,
      { maxRetries: 1 }
    );

    const result = await provider.send("eth_call", []);
    expect(result).toBe("0x1");
    expect(global.fetch).toHaveBeenCalledTimes(6);
    expect(global.fetch.mock.calls[5][0]).toBe("https://rpc3.test");
  });
});
