import { FauxClient } from "@particle-academy/react-fancy";
import type { ScreenThumbnailFrameProps } from "./ScreenSwitcher";

/**
 * Optional thumbnail-frame adapter. Import this entrypoint only when
 * `@particle-academy/react-fancy` is installed.
 */
export function FauxClientScreenThumbnail({
  variant,
  screen,
  active,
  children,
}: ScreenThumbnailFrameProps) {
  return (
    <FauxClient
      variant={variant}
      url={screen.title ?? screen.id}
      meta={screen.kind}
      width={960}
      scale="fit"
      data-fancy-screens-thumbnail-frame=""
      data-thumbnail-variant={variant}
      data-screen-active={active ? "true" : "false"}
      className={active ? "ring-2 ring-indigo-500 ring-offset-2" : undefined}
    >
      {children}
    </FauxClient>
  );
}

FauxClientScreenThumbnail.displayName = "FauxClientScreenThumbnail";

export type { ScreenThumbnailFrameProps, ScreenThumbnailVariant } from "./ScreenSwitcher";
