/**
 * @type {import('rollup').RollupOptions}
 */
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";
import dts from "rollup-plugin-dts";
import peerDepsExternal from "rollup-plugin-peer-deps-external";
import terser from "@rollup/plugin-terser";
import { readFileSync } from "fs";

const packageFile = JSON.parse(readFileSync(new URL("./package.json", import.meta.url)));

export default [
  {
    input: "src/index.ts",
    output: [
      {
        file: packageFile.module,
        format: "esm",
        sourcemap: true,
      },
    ],
    plugins: [
      peerDepsExternal(),
      resolve(),
      commonjs(),
      typescript({ tsconfig: "./tsconfig.json" }),
      terser({ maxWorkers: 4 }),
    ],
    external: ["immer", "react", "use-immer"],
    onwarn: (warning, warn) => {
      if (warning.code === "EMPTY_BUNDLE") return;
      warn(warning);
    },
  },
  {
    input: packageFile.types,
    output: [{ file: packageFile.types, format: "esm" }],
    plugins: [dts()],
  },
];
