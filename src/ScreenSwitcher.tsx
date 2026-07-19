import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { useScreens } from "./registry/useScreens";
import type { ScreenMeta } from "./Screen.types";

export type ScreenThumbnailVariant = "browser" | "device" | "bare";

export interface ScreenSwitcherAffordances {
  /** Kind-chip text. Set to false to omit the chip. */
  kind?: string | false;
  /** Human-facing title. Set to false to omit it. */
  title?: string | false;
  /** Accessible label for activation. */
  activate?: string;
  /** Accessible label for close. Set to false to make the item non-closable. */
  close?: string | false;
}

export interface ScreenSwitcherItem {
  id: string;
  title?: string;
  kind?: string;
  thumbnail?: ReactNode;
  affordances?: ScreenSwitcherAffordances;
}

export interface ScreenThumbnailFrameProps {
  variant: ScreenThumbnailVariant;
  screen: ScreenSwitcherItem;
  active: boolean;
  children: ReactNode;
}

export interface ScreenSwitcherHeaderContext {
  screens: ScreenSwitcherItem[];
  activeId: string | null;
  select: (id: string) => void;
  close?: (id: string) => void;
  defaultHeader: ReactNode;
}

export interface ScreenSwitcherProps {
  /**
   * Optional enriched screen data. When omitted, the switcher maps the
   * enclosing Screen.System registry returned by useScreens().
   */
  screens?: readonly ScreenSwitcherItem[];
  /** Controlled active screen id. */
  activeId?: string | null;
  /** Initial selection for uncontrolled usage. */
  defaultActiveId?: string | null;
  onSelect?: (id: string) => void;
  onClose?: (id: string) => void;
  /** Hide the header without removing thumbnail previews. */
  showHeader?: boolean;
  /** Replace the default header with a node or render function. */
  header?: ReactNode | ((context: ScreenSwitcherHeaderContext) => ReactNode);
  mode?: "tabs" | "thumbnails";
  thumbnailVariant?: ScreenThumbnailVariant;
  renderThumbnail?: (screen: ScreenSwitcherItem) => ReactNode;
  /**
   * Frame adapter for thumbnail mode. The core fallback has no dependencies;
   * use the optional `fancy-screens/react-fancy` adapter for FauxClient.
   */
  thumbnailFrame?: (props: ScreenThumbnailFrameProps) => ReactNode;
  empty?: ReactNode;
  className?: string;
  headerClassName?: string;
  thumbnailsClassName?: string;
}

const styles: Record<string, CSSProperties> = {
  root: { minWidth: 0 },
  header: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    overflowX: "auto",
    padding: "4px 0 10px",
  },
  item: {
    display: "inline-flex",
    alignItems: "stretch",
    flex: "0 0 auto",
    overflow: "hidden",
    border: "1px solid var(--fancy-screens-border, #d4d4d8)",
    borderRadius: 999,
    background: "var(--fancy-screens-surface, #fff)",
    color: "var(--fancy-screens-text, #27272a)",
  },
  itemActive: {
    borderColor: "var(--fancy-screens-accent, #4f46e5)",
    background: "var(--fancy-screens-accent, #4f46e5)",
    color: "var(--fancy-screens-accent-text, #fff)",
  },
  activate: {
    display: "inline-flex",
    alignItems: "center",
    gap: 7,
    border: 0,
    padding: "7px 10px",
    background: "transparent",
    color: "inherit",
    cursor: "pointer",
    font: "inherit",
  },
  kind: {
    borderRadius: 999,
    padding: "2px 6px",
    background: "color-mix(in srgb, currentColor 12%, transparent)",
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
  },
  title: { fontSize: 13, fontWeight: 600 },
  close: {
    border: 0,
    borderLeft: "1px solid color-mix(in srgb, currentColor 18%, transparent)",
    padding: "0 9px",
    background: "transparent",
    color: "inherit",
    cursor: "pointer",
    font: "inherit",
  },
  thumbnails: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 14,
  },
  thumbnailButton: {
    minWidth: 0,
    border: 0,
    padding: 0,
    background: "transparent",
    color: "inherit",
    cursor: "pointer",
    textAlign: "inherit",
  },
  fallbackFrame: {
    overflow: "hidden",
    minHeight: 140,
    border: "1px solid var(--fancy-screens-border, #d4d4d8)",
    borderRadius: 14,
    background: "var(--fancy-screens-surface, #fff)",
  },
  fallbackFrameActive: {
    outline: "2px solid var(--fancy-screens-accent, #4f46e5)",
    outlineOffset: 2,
  },
  fallbackBar: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    borderBottom: "1px solid var(--fancy-screens-border, #d4d4d8)",
    padding: "7px 10px",
    fontSize: 11,
    color: "var(--fancy-screens-muted, #71717a)",
  },
  fallbackBody: { minHeight: 110, padding: 12 },
};

function registryItem(screen: ScreenMeta): ScreenSwitcherItem {
  return { id: screen.id, title: screen.title };
}

function affordancesFor(screen: ScreenSwitcherItem): Required<ScreenSwitcherAffordances> {
  const title = screen.affordances?.title ?? screen.title ?? screen.id;
  const kind = screen.affordances?.kind ?? screen.kind ?? false;
  return {
    kind,
    title,
    activate:
      screen.affordances?.activate ??
      `Activate ${typeof title === "string" ? title : screen.id}`,
    close:
      screen.affordances?.close ??
      `Close ${typeof title === "string" ? title : screen.id}`,
  };
}

function DefaultThumbnailFrame({
  variant,
  screen,
  active,
  children,
}: ScreenThumbnailFrameProps) {
  return (
    <div
      data-fancy-screens-thumbnail-frame=""
      data-thumbnail-variant={variant}
      style={{
        ...styles.fallbackFrame,
        ...(active ? styles.fallbackFrameActive : null),
      }}
    >
      {variant === "browser" ? (
        <div style={styles.fallbackBar}>
          <span aria-hidden="true">● ● ●</span>
          <span>{screen.title ?? screen.id}</span>
        </div>
      ) : null}
      <div style={styles.fallbackBody}>{children}</div>
    </div>
  );
}

export function ScreenSwitcher({
  screens: providedScreens,
  activeId,
  defaultActiveId,
  onSelect,
  onClose,
  showHeader = true,
  header,
  mode = "tabs",
  thumbnailVariant = "browser",
  renderThumbnail,
  thumbnailFrame = DefaultThumbnailFrame,
  empty = null,
  className,
  headerClassName,
  thumbnailsClassName,
}: ScreenSwitcherProps) {
  const registeredScreens = useScreens();
  const screens = useMemo(
    () =>
      providedScreens
        ? Array.from(providedScreens)
        : registeredScreens.map(registryItem),
    [providedScreens, registeredScreens],
  );
  const controlled = activeId !== undefined;
  const [internalActiveId, setInternalActiveId] = useState<string | null>(
    defaultActiveId ?? screens[0]?.id ?? null,
  );
  const selectedId = controlled ? activeId ?? null : internalActiveId;

  useEffect(() => {
    if (controlled) return;
    if (internalActiveId && screens.some((screen) => screen.id === internalActiveId)) {
      return;
    }
    setInternalActiveId(screens[0]?.id ?? null);
  }, [controlled, internalActiveId, screens]);

  const select = (id: string) => {
    if (!controlled) setInternalActiveId(id);
    onSelect?.(id);
  };

  if (screens.length === 0) return <>{empty}</>;

  const defaultHeader = (
    <nav
      aria-label="Screens"
      data-fancy-screens-switcher-header=""
      className={headerClassName}
      style={headerClassName ? undefined : styles.header}
    >
      {screens.map((screen) => {
        const active = screen.id === selectedId;
        const affordances = affordancesFor(screen);
        return (
          <div
            key={screen.id}
            data-fancy-screens-switcher-item=""
            data-screen-id={screen.id}
            data-screen-kind={screen.kind}
            data-screen-active={active ? "true" : "false"}
            style={{ ...styles.item, ...(active ? styles.itemActive : null) }}
          >
            <button
              type="button"
              data-screen-action="activate"
              data-screen-id={screen.id}
              aria-label={affordances.activate}
              aria-pressed={active}
              onClick={() => select(screen.id)}
              style={styles.activate}
            >
              {affordances.kind !== false ? (
                <span data-screen-affordance="kind" style={styles.kind}>
                  {affordances.kind}
                </span>
              ) : null}
              {affordances.title !== false ? (
                <span data-screen-affordance="title" style={styles.title}>
                  {affordances.title}
                </span>
              ) : null}
            </button>
            {onClose && affordances.close !== false ? (
              <button
                type="button"
                data-screen-action="close"
                data-screen-id={screen.id}
                aria-label={affordances.close}
                title={affordances.close}
                onClick={() => onClose(screen.id)}
                style={styles.close}
              >
                ×
              </button>
            ) : null}
          </div>
        );
      })}
    </nav>
  );

  const headerContext: ScreenSwitcherHeaderContext = {
    screens,
    activeId: selectedId,
    select,
    close: onClose,
    defaultHeader,
  };
  const renderedHeader =
    typeof header === "function" ? header(headerContext) : header ?? defaultHeader;

  return (
    <div
      data-fancy-screens-switcher=""
      data-screen-switcher-mode={mode}
      className={className}
      style={className ? undefined : styles.root}
    >
      {showHeader ? renderedHeader : null}
      {mode === "thumbnails" ? (
        <div
          data-fancy-screens-thumbnails=""
          className={thumbnailsClassName}
          style={thumbnailsClassName ? undefined : styles.thumbnails}
        >
          {screens.map((screen) => {
            const active = screen.id === selectedId;
            const content =
              renderThumbnail?.(screen) ??
              screen.thumbnail ??
              screen.title ??
              screen.id;
            return (
              <button
                key={screen.id}
                type="button"
                data-screen-action="activate"
                data-screen-id={screen.id}
                data-screen-kind={screen.kind}
                data-screen-active={active ? "true" : "false"}
                aria-label={`Activate ${screen.title ?? screen.id}`}
                aria-pressed={active}
                onClick={() => select(screen.id)}
                style={styles.thumbnailButton}
              >
                {thumbnailFrame({
                  variant: thumbnailVariant,
                  screen,
                  active,
                  children: content,
                })}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

ScreenSwitcher.displayName = "ScreenSwitcher";
