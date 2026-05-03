import type { PortSchema } from "../Screen.types";

/**
 * Duck-typed port validator.
 *
 * Accepts:
 *   - Zod schemas (anything with `.parse(value)`) — calls `.parse(value)`,
 *     letting Zod do the work and throwing its own errors.
 *   - Built-in descriptive forms (`{ kind: "string", ... }` etc.) — handled
 *     inline; fast, no deps.
 *   - undefined — returns the value unchanged (no schema = no validation).
 *
 * Returns the (possibly coerced) validated value. Throws on failure with
 * a helpful path; the caller stores the error on the PortState.
 */
export function validatePort(value: unknown, schema: PortSchema | undefined): unknown {
  if (!schema) return value;

  // Duck-typed: Zod and other parser-style validators.
  if (typeof (schema as { parse?: unknown }).parse === "function") {
    return (schema as { parse: (v: unknown) => unknown }).parse(value);
  }

  return run(value, schema, "");
}

function run(value: unknown, schema: PortSchema, path: string): unknown {
  // After the duck-typed branch we know schema has `kind`.
  const s = schema as Exclude<PortSchema, { parse: (v: unknown) => unknown }>;

  switch (s.kind) {
    case "any":
      return value;

    case "string": {
      if (typeof value !== "string") {
        throw err(path, `expected string, got ${typeOf(value)}`);
      }
      if (s.min !== undefined && value.length < s.min) {
        throw err(path, `string shorter than min ${s.min}`);
      }
      if (s.max !== undefined && value.length > s.max) {
        throw err(path, `string longer than max ${s.max}`);
      }
      return value;
    }

    case "number": {
      if (typeof value !== "number" || Number.isNaN(value)) {
        throw err(path, `expected number, got ${typeOf(value)}`);
      }
      if (s.min !== undefined && value < s.min) {
        throw err(path, `number below min ${s.min}`);
      }
      if (s.max !== undefined && value > s.max) {
        throw err(path, `number above max ${s.max}`);
      }
      return value;
    }

    case "boolean": {
      if (typeof value !== "boolean") {
        throw err(path, `expected boolean, got ${typeOf(value)}`);
      }
      return value;
    }

    case "array": {
      if (!Array.isArray(value)) {
        throw err(path, `expected array, got ${typeOf(value)}`);
      }
      return value.map((item, i) => run(item, s.of, `${path}[${i}]`));
    }

    case "object": {
      if (value === null || typeof value !== "object" || Array.isArray(value)) {
        throw err(path, `expected object, got ${typeOf(value)}`);
      }
      const out: Record<string, unknown> = {};
      const obj = value as Record<string, unknown>;
      for (const key of Object.keys(s.shape)) {
        const fieldSchema = normalizeShapeEntry(s.shape[key]);
        out[key] = run(obj[key], fieldSchema, path ? `${path}.${key}` : key);
      }
      return out;
    }
  }
}

function normalizeShapeEntry(entry: PortSchema | string): PortSchema {
  if (typeof entry !== "string") return entry;
  // String shorthands: "string" | "number" | "boolean" | "any"
  switch (entry) {
    case "string": return { kind: "string" };
    case "number": return { kind: "number" };
    case "boolean": return { kind: "boolean" };
    case "any": return { kind: "any" };
    default:
      throw new Error(`[fancy-screens] unknown shape shorthand "${entry}"`);
  }
}

function typeOf(v: unknown): string {
  if (v === null) return "null";
  if (Array.isArray(v)) return "array";
  return typeof v;
}

function err(path: string, msg: string): Error {
  return new Error(`[fancy-screens] port validation failed at ${path || "(root)"}: ${msg}`);
}
