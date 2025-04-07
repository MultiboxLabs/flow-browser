import { EventEmitter } from "events";

export class TypedEventEmitter<TEvents extends Record<string, any>> {
  private emitter = new EventEmitter();
  private emitterDestroyed = false;

  private assertNotDestroyed() {
    if (this.emitterDestroyed) {
      throw new Error("EventEmitter already destroyed!");
    }
  }

  emit<TEventName extends keyof TEvents & string>(eventName: TEventName, ...eventArg: TEvents[TEventName]) {
    this.assertNotDestroyed();

    this.emitter.emit(eventName, ...(eventArg as []));
  }

  on<TEventName extends keyof TEvents & string>(
    eventName: TEventName,
    handler: (...eventArg: TEvents[TEventName]) => void
  ) {
    this.assertNotDestroyed();

    this.emitter.on(eventName, handler as any);
  }

  off<TEventName extends keyof TEvents & string>(
    eventName: TEventName,
    handler: (...eventArg: TEvents[TEventName]) => void
  ) {
    this.assertNotDestroyed();

    this.emitter.off(eventName, handler as any);
  }

  destroyEmitter() {
    this.assertNotDestroyed();

    this.emitterDestroyed = true;
    this.emitter.removeAllListeners();
  }
}
