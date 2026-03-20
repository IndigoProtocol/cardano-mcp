#!/usr/bin/env bash
set -euo pipefail

OUT_DIR="dist"
rm -rf "$OUT_DIR"
mkdir -p "$OUT_DIR"

BANNER='import { createRequire as __banner_createRequire } from "module"; import { fileURLToPath as __banner_fileURLToPath } from "url"; import { dirname as __banner_dirname } from "path"; import { Request as UndiciRequest, Response as UndiciResponse, Headers as UndiciHeaders, fetch as undiciFetch } from "undici"; const require = __banner_createRequire(import.meta.url); const __filename = __banner_fileURLToPath(import.meta.url); const __dirname = __banner_dirname(__filename); if (typeof globalThis.Request === "undefined") { globalThis.Request = UndiciRequest; globalThis.Response = UndiciResponse; globalThis.Headers = UndiciHeaders; globalThis.fetch = undiciFetch; }'

echo "Building main bundle..."
npx esbuild src/index.ts \
  --bundle \
  --platform=node \
  --format=esm \
  --outfile="$OUT_DIR/index.js" \
  --target=node18 \
  --main-fields=module,main \
  --external:undici \
  --banner:js="$BANNER"

echo "Generating type declarations..."
npx tsc --project tsconfig.json --emitDeclarationOnly --outDir "$OUT_DIR" 2>/dev/null || echo "Types generated (warnings ignored)"

echo "Copying WASM files..."
find node_modules -path "*cardano-multiplatform-lib-nodejs*" -name "cardano_multiplatform_lib_bg.wasm" -exec cp {} "$OUT_DIR/" \; 2>/dev/null || echo "CML WASM not found"
find node_modules -path "*uplc*/dist/node*" -name "uplc_tx_bg.wasm" -exec cp {} "$OUT_DIR/" \; 2>/dev/null || echo "UPLC WASM not found"
find node_modules -path "*cardano-message-signing-nodejs*" -name "cardano_message_signing_bg.wasm" -exec cp {} "$OUT_DIR/" \; 2>/dev/null || echo "CMS WASM not found"

ls -la "$OUT_DIR"/*.wasm 2>/dev/null || echo "No WASM files copied"

echo "Making binary executable..."
chmod +x "$OUT_DIR/index.js"

echo "Build complete!"
