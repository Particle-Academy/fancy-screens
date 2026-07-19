import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  Screen,
  ScreenSwitcher,
} from "../dist/index.js";
import { FauxClientScreenThumbnail } from "../dist/react-fancy.js";

const screens = [
  {
    id: "overview",
    title: "Overview",
    kind: "dashboard",
    affordances: { close: false },
  },
  {
    id: "editor",
    title: "Editor",
    kind: "code",
  },
];

function render(node) {
  return renderToStaticMarkup(
    React.createElement(Screen.System, null, node),
  );
}

test("renders stable data handles and controlled selection", () => {
  const html = render(
    React.createElement(ScreenSwitcher, {
      screens,
      activeId: "editor",
      onSelect() {},
      onClose() {},
    }),
  );

  assert.match(html, /data-fancy-screens-switcher=""/);
  assert.match(html, /data-screen-id="editor"/);
  assert.match(html, /data-screen-kind="code"/);
  assert.match(html, /data-screen-action="activate"/);
  assert.match(html, /data-screen-action="close"/);
  assert.match(html, /data-screen-active="true"/);
  assert.doesNotMatch(
    html,
    /data-screen-id="overview"[^>]*data-screen-action="close"/,
  );
});

test("thumbnail mode works without the optional react-fancy adapter", () => {
  const html = render(
    React.createElement(ScreenSwitcher, {
      screens,
      showHeader: false,
      mode: "thumbnails",
      thumbnailVariant: "device",
    }),
  );

  assert.doesNotMatch(html, /data-fancy-screens-switcher-header/);
  assert.match(html, /data-fancy-screens-thumbnails=""/);
  assert.match(html, /data-thumbnail-variant="device"/);
  assert.doesNotMatch(html, /data-react-fancy-faux-client/);
});

test("react-fancy adapter renders FauxClient when explicitly imported", () => {
  const html = render(
    React.createElement(ScreenSwitcher, {
      screens,
      mode: "thumbnails",
      thumbnailFrame: FauxClientScreenThumbnail,
    }),
  );

  assert.match(html, /data-react-fancy-faux-client=""/);
});

test("core entrypoint does not import the optional react-fancy peer", async () => {
  const source = await readFile(new URL("../dist/index.js", import.meta.url), "utf8");
  assert.doesNotMatch(source, /@particle-academy\/react-fancy/);
});
