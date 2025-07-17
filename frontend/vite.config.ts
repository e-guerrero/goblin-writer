// import { defineConfig } from 'vite'
// import react from '@vitejs/plugin-react'

// // https://vitejs.dev/config/
// export default defineConfig({
//   plugins: [react()],
// })

// https://vitejs.dev/config/
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import obfuscatorPlugin from "vite-plugin-javascript-obfuscator";

export default defineConfig({
  server: {
    host: "0.0.0.0",
    fs: {
      strict: false,
    },
  },
  plugins: [
    react(),
    obfuscatorPlugin({
      options: {
        compact: false, // Avoid double minification here
        controlFlowFlattening: true, // Converts the control flow to make the code harder to understand.
        controlFlowFlatteningThreshold: 0.75, // Sets the percentage of control flow flattening.
        deadCodeInjection: true, // Injects dead code to make the code harder to understand.
        deadCodeInjectionThreshold: 0.4, // Sets the percentage of dead code injection.
        debugProtection: false, // Protects the code from being debugged using developer tools.
        // debugProtectionInterval: 4000, // Time interval for the debug protection function.
        disableConsoleOutput: true, // Removes console outputs.
        identifierNamesGenerator: "hexadecimal", // Changes the identifier names to make them less readable.
        renameGlobals: false, // Renames global variables.
        selfDefending: true, // Adds self-defending code to prevent tampering.
        stringArray: true, // Collects all string literals and replaces them with references to an array.
        stringArrayEncoding: ["base64"], // Encodes the string array.
        // ...  [See more options](https://github.com/javascript-obfuscator/javascript-obfuscator)
      },
    }),
  ],
  build: {
    outDir: "dist",
    assetsDir: "",
    minify: "esbuild", // better for minification vs the js obfuscator
    sourcemap: false,
    rollupOptions: {
      output: {
        entryFileNames: "[name].[hash].js",
        chunkFileNames: "[name].[hash].js",
        assetFileNames: "[name].[hash].[ext]",
      },
    },
  },
});
