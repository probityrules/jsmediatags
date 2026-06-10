import * as esbuild from "esbuild";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, "..");
const entryPoint = resolve(rootDir, "src/jsmediatags.ts");
const watch = process.argv.includes("--watch");

const noopRegisterPath = resolve(rootDir, "src/registerNodeFileReaders.noop.ts");

const browserOnlyPlugin = {
  name: "browser-only",
  setup(build) {
    build.onResolve({ filter: /[/\\]registerNodeFileReaders(\.(ts|js))?$/ }, (args) => {
      if (args.path.endsWith(".noop.ts")) {
        return null;
      }

      return { path: noopRegisterPath };
    });

    build.onResolve({ filter: /^xhr2$/ }, () => ({
      path: "xhr2-browser-stub",
      namespace: "xhr2-browser-stub",
    }));

    build.onLoad({ filter: /.*/, namespace: "xhr2-browser-stub" }, () => ({
      contents: "module.exports = { XMLHttpRequest: globalThis.XMLHttpRequest };",
      loader: "js",
    }));
  },
};

const bundleOptions = {
  entryPoints: [entryPoint],
  bundle: true,
  platform: "browser",
  target: ["es2015"],
  legalComments: "none",
  plugins: [browserOnlyPlugin],
  logLevel: "info",
};

const iifeOptions = {
  ...bundleOptions,
  format: "iife",
  globalName: "jsmediatags",
};

mkdirSync(resolve(rootDir, "dist"), { recursive: true });

const devOutfile = resolve(rootDir, "dist/jsmediatags.js");
const minOutfile = resolve(rootDir, "dist/jsmediatags.min.js");
const browserCjsOutfile = resolve(rootDir, "dist/jsmediatags.browser.cjs");
const browserEsmOutfile = resolve(rootDir, "dist/jsmediatags.browser.mjs");

if (watch) {
  const devContext = await esbuild.context({
    ...iifeOptions,
    outfile: devOutfile,
    minify: false,
  });

  await devContext.watch();
  console.log("Watching for browser bundle changes...");
} else {
  await esbuild.build({
    ...iifeOptions,
    outfile: devOutfile,
    minify: false,
  });

  await esbuild.build({
    ...iifeOptions,
    outfile: minOutfile,
    minify: true,
  });

  await esbuild.build({
    ...bundleOptions,
    format: "cjs",
    outfile: browserCjsOutfile,
    minify: true,
  });

  await esbuild.build({
    ...bundleOptions,
    format: "esm",
    outfile: browserEsmOutfile,
    minify: true,
  });
}
