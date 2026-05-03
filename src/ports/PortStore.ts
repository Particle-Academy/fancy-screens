import type { PortRecord, PortSchema, PortDirection, PortState } from "../Screen.types";
import { validatePort } from "./validate";

type Listener = (state: PortState<unknown>) => void;

/**
 * Global, instance-per-system, key-keyed port store.
 *
 * Keys are `${screenId}.${portName}` — flat namespace so cross-screen
 * reads (e.g. `dashboard.user` from inside `reports`) work without
 * special wiring.
 *
 * Subscriptions fire per-key; multiple consumers of the same port get
 * independent unsubscribers but share the same record.
 */
export class PortStore {
  private records = new Map<string, PortRecord<unknown>>();
  private listeners = new Map<string, Set<Listener>>();

  static key(screenId: string, portName: string): string {
    return `${screenId}.${portName}`;
  }

  /**
   * Declare a port. Idempotent — calling twice with the same key updates
   * the schema/direction/default but preserves the current value.
   */
  declare(
    screenId: string,
    portName: string,
    opts: { schema?: PortSchema; direction?: PortDirection; defaultValue?: unknown },
  ): string {
    const key = PortStore.key(screenId, portName);
    const existing = this.records.get(key);
    if (existing) {
      existing.schema = opts.schema;
      existing.direction = opts.direction ?? existing.direction;
      // defaultValue updates apply only if the port hasn't been written yet.
      if (existing.state.value === undefined && opts.defaultValue !== undefined) {
        existing.state = { ...existing.state, value: opts.defaultValue };
        this.emit(key);
      }
      return key;
    }
    const record: PortRecord<unknown> = {
      schema: opts.schema,
      direction: opts.direction ?? "inout",
      defaultValue: opts.defaultValue,
      state: {
        value: opts.defaultValue,
        loading: false,
        error: null,
        version: 0,
      },
    };
    this.records.set(key, record);
    return key;
  }

  /** Tear down a port (e.g. on screen unmount). Drops listeners too. */
  remove(screenId: string, portName: string): void {
    const key = PortStore.key(screenId, portName);
    this.records.delete(key);
    this.listeners.delete(key);
  }

  /** Read by absolute key (`screenId.portName`). */
  get(key: string): PortState<unknown> | undefined {
    return this.records.get(key)?.state;
  }

  /**
   * Write a port value. Validates against the registered schema (if any);
   * on validation failure stores the error on the state and bumps version.
   */
  set(key: string, value: unknown): void {
    const record = this.records.get(key);
    if (!record) {
      throw new Error(`[fancy-screens] cannot write to undeclared port "${key}"`);
    }
    try {
      const validated = validatePort(value, record.schema);
      record.state = {
        value: validated,
        loading: false,
        error: null,
        version: record.state.version + 1,
      };
    } catch (e) {
      record.state = {
        value: record.state.value,
        loading: false,
        error: e instanceof Error ? e : new Error(String(e)),
        version: record.state.version + 1,
      };
    }
    this.emit(key);
  }

  /** Mark a port as loading or settle the loading flag without changing value. */
  setLoading(key: string, loading: boolean): void {
    const record = this.records.get(key);
    if (!record) return;
    if (record.state.loading === loading) return;
    record.state = { ...record.state, loading };
    this.emit(key);
  }

  /** Subscribe to a port. Returns an unsubscribe function. */
  subscribe(key: string, listener: Listener): () => void {
    let set = this.listeners.get(key);
    if (!set) {
      set = new Set();
      this.listeners.set(key, set);
    }
    set.add(listener);
    return () => {
      set?.delete(listener);
      if (set && set.size === 0) this.listeners.delete(key);
    };
  }

  /** All declared keys — used by the registry hook. */
  keys(): string[] {
    return Array.from(this.records.keys());
  }

  /** Snapshot of every port's state. Used by hibernation in 0.3.x. */
  snapshot(): Record<string, PortState<unknown>> {
    const out: Record<string, PortState<unknown>> = {};
    this.records.forEach((rec, key) => {
      out[key] = { ...rec.state };
    });
    return out;
  }

  private emit(key: string): void {
    const set = this.listeners.get(key);
    if (!set) return;
    const state = this.records.get(key)?.state;
    if (!state) return;
    set.forEach((l) => l(state));
  }
}
