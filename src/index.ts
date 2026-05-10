/**
 * @particle-academy/fancy-screens
 *
 * Containerized application surface for fancy components.
 *
 * v0.2.x — port store + <Screen> JSX-mode root + <Screen.Port> +
 * useScreenPort() + <Screen.System> + useScreens() registry hook.
 *
 * See https://github.com/Particle-Academy/fancy-screens for the layer
 * roadmap (lifecycle, hibernation, loading, layouts, schema, URL sync).
 */

export { Screen } from "./Screen";
export { ScreenSystem } from "./ScreenSystem";
export { useScreen } from "./Screen.context";
export { useScreenPort } from "./ports/usePort";
export { useScreens } from "./registry/useScreens";
export { useScreenSystem } from "./ports/PortStore.context";

export type {
  ScreenProps,
  ScreenBodyProps,
  ScreenPortProps,
  ScreenLifecycle,
  ScreenMeta,
  ScreenSystemProps,
  AgentScreenActivity,
  PortDirection,
  PortSchema,
  PortState,
  PortRecord,
} from "./Screen.types";
