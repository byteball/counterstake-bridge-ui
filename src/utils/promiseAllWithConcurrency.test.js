import { promiseAllWithConcurrency } from "./promiseAllWithConcurrency";

describe("promiseAllWithConcurrency", () => {
  it("should return results in the same order as tasks", async () => {
    const tasks = [
      () => Promise.resolve("a"),
      () => Promise.resolve("b"),
      () => Promise.resolve("c"),
    ];

    const results = await promiseAllWithConcurrency(tasks, 2);
    expect(results).toEqual(["a", "b", "c"]);
  });

  it("should respect concurrency limit", async () => {
    let running = 0;
    let maxRunning = 0;

    const createTask = (value) => () =>
      new Promise((resolve) => {
        running++;
        maxRunning = Math.max(maxRunning, running);
        setTimeout(() => {
          running--;
          resolve(value);
        }, 10);
      });

    const tasks = Array.from({ length: 10 }, (_, i) => createTask(i));
    const results = await promiseAllWithConcurrency(tasks, 3);

    expect(maxRunning).toBeLessThanOrEqual(3);
    expect(results).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });

  it("should handle empty task list", async () => {
    const results = await promiseAllWithConcurrency([], 5);
    expect(results).toEqual([]);
  });

  it("should handle concurrency greater than task count", async () => {
    const tasks = [
      () => Promise.resolve(1),
      () => Promise.resolve(2),
    ];

    const results = await promiseAllWithConcurrency(tasks, 100);
    expect(results).toEqual([1, 2]);
  });

  it("should reject if any task rejects", async () => {
    const tasks = [
      () => Promise.resolve("ok"),
      () => Promise.reject(new Error("fail")),
      () => Promise.resolve("ok"),
    ];

    await expect(promiseAllWithConcurrency(tasks, 2)).rejects.toThrow("fail");
  });

  it("should work with concurrency of 1 (sequential)", async () => {
    const order = [];

    const createTask = (value) => () =>
      new Promise((resolve) => {
        order.push(`start-${value}`);
        setTimeout(() => {
          order.push(`end-${value}`);
          resolve(value);
        }, 10);
      });

    const tasks = [createTask("a"), createTask("b"), createTask("c")];
    await promiseAllWithConcurrency(tasks, 1);

    expect(order).toEqual([
      "start-a", "end-a",
      "start-b", "end-b",
      "start-c", "end-c",
    ]);
  });
});
