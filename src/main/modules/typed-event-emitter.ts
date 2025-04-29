/* eslint-disable @typescript-eslint/no-explicit-any */
import { EventEmitter } from "events";

/**
 * A type-safe event emitter class.
 * Wraps the Node.js EventEmitter to provide type checking for event names and arguments.
 * @template TEvents A record mapping event names to their argument tuple types.
 */
export class TypedEventEmitter<TEvents extends Record<string, any>> {
  private emitter = new EventEmitter();
  private emitterDestroyed = false;

  private assertNotDestroyed() {
    if (this.emitterDestroyed) {
      throw new Error("EventEmitter already destroyed!");
    }
  }

  public isEmitterDestroyed() {
    return this.emitterDestroyed;
  }

  /**
   * Emit an event with the specified name and arguments.
   * @template TEventName The name of the event to emit.
   * @param {TEventName} eventName The name of the event.
   * @param {TEvents[TEventName]} eventArg The arguments to pass to the event listeners.
   */
  emit<TEventName extends keyof TEvents & string>(eventName: TEventName, ...eventArg: TEvents[TEventName]) {
    this.assertNotDestroyed();

    this.emitter.emit(eventName, ...(eventArg as []));
  }

  /**
   * Add an event listener for the specified event.
   * @template TEventName The name of the event to listen for.
   * @param {TEventName} eventName The name of the event.
   * @param {(...eventArg: TEvents[TEventName]) => void} handler The callback function to execute when the event is emitted.
   */
  on<TEventName extends keyof TEvents & string>(
    eventName: TEventName,
    handler: (...eventArg: TEvents[TEventName]) => void
  ) {
    this.assertNotDestroyed();

    this.emitter.on(eventName, handler as any);
  }

  /**
   * Remove an event listener for the specified event.
   * @template TEventName The name of the event to remove the listener from.
   * @param {TEventName} eventName The name of the event.
   * @param {(...eventArg: TEvents[TEventName]) => void} handler The callback function to remove.
   */
  off<TEventName extends keyof TEvents & string>(
    eventName: TEventName,
    handler: (...eventArg: TEvents[TEventName]) => void
  ) {
    this.assertNotDestroyed();

    this.emitter.off(eventName, handler as any);
  }

  /**
   * Add an event listener that will only fire once for the specified event.
   * @template TEventName The name of the event to listen for.
   * @param {TEventName} eventName The name of the event.
   * @param {(...eventArg: TEvents[TEventName]) => void} handler The callback function to execute once when the event is emitted.
   */
  once<TEventName extends keyof TEvents & string>(
    eventName: TEventName,
    handler: (...eventArg: TEvents[TEventName]) => void
  ) {
    this.assertNotDestroyed();

    this.emitter.once(eventName, handler as any);
  }

  /**
   * Add an event listener and return a function to remove the listener.
   * This is useful for managing listener lifecycles, especially in frameworks like React.
   * @template TEventName The name of the event to listen for.
   * @param {TEventName} eventName The name of the event.
   * @param {(...eventArg: TEvents[TEventName]) => void} handler The callback function to execute when the event is emitted.
   * @returns {() => void} A function that, when called, will remove the event listener.
   */
  connect<TEventName extends keyof TEvents & string>(
    eventName: TEventName,
    handler: (...eventArg: TEvents[TEventName]) => void
  ): () => void {
    this.assertNotDestroyed();

    const disconnect = () => {
      this.off(eventName, handler as any);
    };

    this.on(eventName, handler as any);
    return disconnect;
  }

  /**
   * Removes all listeners and marks the emitter as destroyed.
   * Prevents further event emissions or listener additions/removals.
   */
  destroyEmitter() {
    this.assertNotDestroyed();

    this.emitterDestroyed = true;
    this.emitter.removeAllListeners();
  }
}
