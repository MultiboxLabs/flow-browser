/* eslint-disable @typescript-eslint/no-explicit-any */
export class Queue {
  private isRunning: boolean = false;
  private taskQueue: Array<{
    task: () => Promise<any>;
    resolve: (value: any) => void;
    reject: (error: any) => void;
  }> = [];

  /**
   * Add a task to the queue and process it when possible
   * @param task The async task to be executed
   * @returns Promise that resolves when this specific task completes
   */
  add<T>(task: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      // Add task to queue with its resolve/reject functions
      this.taskQueue.push({ task, resolve, reject });

      // Try to process queue if not already running
      // Don't await - we want add() to return immediately
      this.processQueue();
    });
  }

  private async processQueue(): Promise<void> {
    // If already running or no tasks, do nothing
    if (this.isRunning || this.taskQueue.length === 0) {
      return;
    }

    this.isRunning = true;

    try {
      // Get next task
      const nextItem = this.taskQueue[0];
      if (nextItem) {
        try {
          // Execute task and resolve with its result
          const result = await nextItem.task();
          nextItem.resolve(result);
        } catch (error) {
          // Propagate task error to original caller
          nextItem.reject(error);
        } finally {
          // Remove the completed/failed task
          this.taskQueue.shift();
        }
      }
    } finally {
      this.isRunning = false;

      // Process next task if any
      if (this.taskQueue.length > 0) {
        // Don't await - let it process independently
        this.processQueue();
      }
    }
  }

  /**
   * Get the number of tasks currently in the queue
   */
  get size(): number {
    return this.taskQueue.length;
  }

  /**
   * Check if the queue is currently processing a task
   */
  get running(): boolean {
    return this.isRunning;
  }

  /**
   * Clear all pending tasks from the queue
   * @param rejectRemaining Whether to reject remaining tasks with an error (default: true)
   */
  clear(rejectRemaining: boolean = true): void {
    if (rejectRemaining) {
      // Reject all pending tasks
      this.taskQueue.forEach(({ reject }) => {
        reject(new Error("Task cancelled - queue cleared"));
      });
    }
    this.taskQueue = [];
  }
}
