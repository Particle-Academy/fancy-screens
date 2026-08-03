/**
 * @particle-academy/fancy-screens
 *
 * Cross-surface coordination layer for Human+ apps. Provides:
 *   - <Screen> + <Screen.System> — addressable surfaces + a global registry
 *   - useScreens() — agent-introspectable list of every mounted surface
 *   - useRegisterStore() — attach a Zustand store to the enclosing <Screen>
 *   - <Screen schema={...}> + registerSchemaComponent — agent-emitted JSON UI
 *
 * State management is Zustand. fancy-screens DOES NOT implement its own
 * pub/sub store anymore — it tracks the Zustand stores you bring so they're
 * enumerable from the screen registry. See /docs/human-plus-ux for the
 * "agent emits a page" walkthrough.
 *
 * Migrating from 0.3.x (Ports → Zustand): the docs include a migration map.
 */

export { Screen } from "./Screen";
export { ScreenSystem } from "./ScreenSystem";
export { useScreen } from "./Screen.context";
export { useScreens } from "./registry/useScreens";
export { useScreenSystem } from "./ScreenSystem.context";
export { useRegisterStore } from "./useRegisterStore";
export { ScreenSwitcher } from "./ScreenSwitcher";
export {
  registerSchemaComponent,
  registerSchemaComponents,
  unregisterSchemaComponent,
  listSchemaComponents,
  renderSchema,
} from "./schema";

export type {
  ScreenProps,
  ScreenBodyProps,
  ScreenLifecycle,
  ScreenMeta,
  ScreenSystemProps,
  ScreenSchema,
  AgentScreenActivity,
  RegisteredStore,
} from "./Screen.types";
export type {
  ScreenSwitcherProps,
  ScreenSwitcherItem,
  ScreenSwitcherAffordances,
  ScreenSwitcherHeaderContext,
  ScreenThumbnailFrameProps,
  ScreenThumbnailVariant,
} from "./ScreenSwitcher";

// Document form — the flat, addressable normal form of a ScreenSchema.
// See .ai/plans/screens-cms-schema-reconciliation.md in the envelope.
export { toDocTree, fromDocTree, addressableIds, TEXT_NODE_TYPE } from "./doc";
export type { ScreenDoc, ScreenDocNode, ToDocTreeOptions } from "./doc";
