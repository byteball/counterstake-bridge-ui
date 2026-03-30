import { ethers } from "ethers";

/** @type {number} Timeout for a single RPC request in milliseconds */
const REQUEST_TIMEOUT = 10000;

/** @type {number} Maximum number of full cycles through all URLs before giving up */
const DEFAULT_MAX_RETRIES = 3;

/** @type {number[]} Delay in ms before each retry cycle (index 0 = after first full failure) */
const DEFAULT_RETRY_DELAYS = [1000, 3000, 5000];

/**
 * JSON-RPC provider with automatic fallback across multiple RPC endpoints.
 *
 * Uses its own `fetch` instead of ethers' built-in `fetchJson` to avoid
 * uncontrolled retries on rate-limit (429) and server errors.
 *
 * On failure the provider immediately tries the next URL in the list.
 * If all URLs fail, it waits and retries the full cycle up to `maxRetries` times.
 * The last successful URL is remembered — subsequent requests start from it
 * and wrap around cyclically if it becomes unavailable.
 *
 * @extends ethers.providers.StaticJsonRpcProvider
 *
 * @example
 * const provider = new JsonRpcProviderWithFallback(
 *   ["https://primary.rpc", "https://backup.rpc"],
 *   1 // Ethereum mainnet chainId
 * );
 * const block = await provider.getBlockNumber();
 */
export class JsonRpcProviderWithFallback extends ethers.providers.StaticJsonRpcProvider {
  /** @type {number} Index of the last URL that responded successfully */
  _currentIndex = 0;
  /** @type {number} Auto-incrementing JSON-RPC request id */
  _requestId = 1;

  /**
   * @param {string[]}  urls              - RPC endpoint URLs ordered by priority (first = preferred)
   * @param {number}    chainId           - EVM chain id (avoids extra `eth_chainId` calls)
   * @param {Object}    [options]         - Optional retry configuration
   * @param {number}    [options.maxRetries=3]       - Max retry cycles after all URLs fail
   * @param {number[]}  [options.retryDelays=[1000, 3000, 5000]] - Delay before each retry in ms
   */
  constructor(urls, chainId, options = {}) {
    super(urls[0], chainId);
    this._urls = urls;
    this._maxRetries = options.maxRetries ?? DEFAULT_MAX_RETRIES;
    this._retryDelays = options.retryDelays ?? DEFAULT_RETRY_DELAYS;
  }

  /**
   * Send a JSON-RPC request, falling back to the next URL on any error.
   * If all URLs fail, retries the full cycle after a delay (up to `maxRetries` times).
   *
   * @param   {string} method - JSON-RPC method name (e.g. `"eth_call"`)
   * @param   {Array}  params - JSON-RPC method parameters
   * @returns {Promise<any>} Decoded `result` field from the JSON-RPC response
   * @throws  {Error} If every URL fails on every retry cycle
   */
  async send(method, params) {
    let lastError;

    for (let retry = 0; retry <= this._maxRetries; retry++) {
      if (retry > 0) {
        const delay = this._retryDelays[retry - 1] || this._retryDelays[this._retryDelays.length - 1];
        console.log(`All RPC URLs failed, retrying in ${delay}ms (attempt ${retry}/${this._maxRetries})...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }

      const startIndex = this._currentIndex;

      for (let attempt = 0; attempt < this._urls.length; attempt++) {
        const index = (startIndex + attempt) % this._urls.length;
        const url = this._urls[index];

        try {
          const result = await this._fetchRpc(url, method, params);
          this._currentIndex = index;
          return result;
        } catch (e) {
          lastError = e;

          if (attempt < this._urls.length - 1) {
            console.log(`RPC ${url} failed (${e.status || e.code || e.message}), trying next...`);
          }
        }
      }
    }

    throw lastError;
  }

  /**
   * Execute a single JSON-RPC call via `fetch`.
   *
   * @param   {string} url    - RPC endpoint URL
   * @param   {string} method - JSON-RPC method name
   * @param   {Array}  params - JSON-RPC method parameters
   * @returns {Promise<any>} Decoded `result` field from the JSON-RPC response
   * @throws  {Error} On HTTP error, RPC error, network failure, or timeout
   * @private
   */
  async _fetchRpc(url, method, params) {
    const id = this._requestId++;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    let response;
    try {
      response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id, method, params }),
        signal: controller.signal,
      });
    } catch (e) {
      clearTimeout(timeout);

      if (e.name === "AbortError") {
        const err = new Error(`Request to ${url} timed out`);
        err.code = "TIMEOUT";
        throw err;
      }

      throw e;
    }

    clearTimeout(timeout);

    if (!response.ok) {
      const err = new Error(`HTTP ${response.status} from ${url}`);
      err.status = response.status;
      throw err;
    }

    const json = await response.json();

    if (json.error) {
      const err = new Error(json.error.message || "RPC error");
      err.code = json.error.code;
      throw err;
    }

    return json.result;
  }
}
