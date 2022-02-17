# Creating a wasm package

To create a wasm package you can do the following:

**0. Prerequisites**

This needs wasm-pack installed to work

**1. Create a rust crate**

```bash
cargo init --lib /path/to/my-wasm-package
```

**2. Add it to the workspace**

In the workspace folder:

```toml
# ./Cargo.toml

[workspace]
members = [
    ...
    "/path/to/my-wasm-package",
    ...
]
```

Also be sure to add it to the root `lerna.json`

```json
{
  "packages": ["/path/to/my-wasm-package"],
  "version": "0.0.0",
  "npmClient": "yarn",
  "useWorkspaces": true
}
```

and the `workspaces` key of the root `package.json`

````json
{
  ...
  "workspaces": [
    "/path/to/my-wasm-package"
  ]
}
```

**3. Add wasm-bindgen to the crate**

```toml
# /path/to/my-wasm-package/Cargo.toml

[dependencies]
wasm-bindgen = "0.2.79"

[lib]
crate-type = ["cdylib", "rlib"]

...

````

**4. Add the wasm_bindgen annotation on the fns you want to expose**

```rust
// /path/to/my-wasm-package/src/lib.rs
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn add(a: u64, b: u64) -> u64 {
    return a + b;
}
```

**5. Add the following package.json**

```json
{
  "name": "hydra-math-sdk",
  "version": "0.1.0",
  "license": "UNLICENSED",
  "files": [
    "./.pkg/node/index_bg.wasm",
    "./.pkg/node/index_bg.wasm.d.ts",
    "./.pkg/node/index.js",
    "./.pkg/node/index.d.ts",
    "./.pkg/web/index_bg.wasm",
    "./.pkg/web/index_bg.wasm.d.ts",
    "./.pkg/web/index.js",
    "./.pkg/web/index.d.ts"
  ],
  "browser": "./.pkg/web/index.js",
  "main": "./.pkg/node/index.js",
  "types": "./.pkg/web/index.d.ts",
  "scripts": {
    "build": "wasm-pack build -d .pkg/web --target web --out-name index; wasm-pack build -d .pkg/node --target nodejs --out-name index"
  },
  "sideEffects": false
}
```

**6. Build your wasm package**

```bash
cd /path/to/my-wasm-package
yarn build
```

**7. Link your package**

We are using yarn workspaces so running install should create a symlink within the root `node_modules` folder.

```bash
yarn install
```

You may want to install your package in your destination by using a `*` version. Here we have added `my-wasm-package` to an app.

```json
{
  "name":"my-app",
  "dependencies": {
    ...
    "my-wasm-package": "*",
    "react": "^17.0.2",
    ...
  }
}
```

**8. Now you can use it in your ts**

```ts
// in the some-consumer module
import * as myWasmPackage from "my-wasm-package";

// Note we need calls to wasm to be async when used in a browser context
async function add(a: number, b: number) {
  // In node wasm is synchronous so we check to see
  // if there is a default function and if so we run it
  // The default function loads the wasm file when in browser
  if (typeof wasm.default !== "object") {
    await wasm.default();
  }
  return wasm.add(BigInt(a), BigInt(b)).toString();
}
```
