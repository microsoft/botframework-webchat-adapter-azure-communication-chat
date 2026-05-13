import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';

/**
 * Guards against a regression introduced by TypeScript 5.x emit of async arrow
 * functions with inline default parameters.
 *
 * TS 5.x emits such functions as:
 *   const f = (a_1, ..., ...args_1) => __awaiter(this, [a_1, ..., ...args_1], void 0,
 *     function* (a, ..., x = 0) { ... });
 *
 * That emit caused the `iteration` value captured by `pollForMessages`'s recursive
 * setTimeout closure to not propagate correctly, breaking the fast-poll branch.
 * Defaulting `iteration` inside the body keeps TypeScript on the simpler emit:
 *   const f = (a, ..., x) => __awaiter(this, void 0, void 0, function* () { ... });
 *
 * This test reads the compiled output and asserts the simpler shape is preserved.
 * Requires `tsc` (or `npm run build`) to have produced `dist-esm/` first.
 */
describe('compiled emit shape for pollForMessages', () => {
  const compiledPath = resolve(
    __dirname,
    '../../../dist-esm/src/ingress/subscribeNewMessageAndThreadUpdate.js'
  );

  if (!existsSync(compiledPath)) {
    test.skip('dist-esm not present - run `tsc` or `npm run build` first', () => {
      // intentionally empty
    });
    return;
  }

  const compiled = readFileSync(compiledPath, 'utf8');

  test('pollForMessages does not use the TS 5.x (...args_N) rest-wrapper emit', () => {
    const decl = compiled.match(/const pollForMessages = \([^)]*\)/);
    expect(decl).not.toBeNull();
    expect(decl![0]).not.toMatch(/\.\.\.args_\d+/);
  });

  test('pollForMessages forwards arguments to the simple __awaiter form (no args array)', () => {
    // The broken emit wraps the call: __awaiter(this, [delaytm_1, ..., ...args_1], void 0, function* (...))
    // The simple emit:                __awaiter(this, void 0, void 0, function* () { ... })
    const callPattern =
      /pollForMessages = \([^)]*\) => __awaiter\(this, void 0, void 0, function\* \(\)/;
    expect(compiled).toMatch(callPattern);
  });
});
