/**
 * Run an array of async task factories with limited concurrency.
 *
 * Unlike `Promise.all`, which starts every promise immediately, this function
 * keeps at most `concurrency` tasks running at the same time. New tasks are
 * started as earlier ones finish, preserving the original result order.
 *
 * @param {Array<() => Promise<T>>} tasks       - Factory functions that return promises
 * @param {number}                  concurrency  - Maximum number of tasks running in parallel
 * @returns {Promise<T[]>} Results in the same order as `tasks`
 *
 * @example
 * const results = await promiseAllWithConcurrency(
 *   urls.map(url => () => fetch(url)),
 *   5
 * );
 */
export async function promiseAllWithConcurrency(tasks, concurrency) {
  const results = new Array(tasks.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < tasks.length) {
      const index = nextIndex++;
      results[index] = await tasks[index]();
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, tasks.length) }, () => worker()));

  return results;
}
