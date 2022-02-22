
const ts = require('typescript')
const node = ts.createSourceFile(
    'x.ts',
    fs.readFileSync('./sdks/hydra-ts/codegen/types/hydra_liquidity_pools.ts', 'utf8'),
    ts.ScriptTarget.Latest
);

console.log(node)