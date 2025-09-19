import { assert, expect, describe, it, test } from 'vitest';

import * as ze from './zeroth/parser';

it('qwdwq', () => {});

// const successTests = [
//   `
// A | premise
// A -> A | introduce -> with 1, 1
// `,
//   `
// A /\\ B | premise
// A | eliminate /\\ with 1
// A /\\ B -> A | introduce -> with 1, 2
// `,
//   `
// A | premise
// B | premise
// A /\\ B | introduce /\\ with 1, 2
// A -> A /\\ B | introduce -> with 1, 3
// B -> A -> A /\\ B | introduce -> with 2, 4
// `
// ];

// describe
//   ('Fully-specified correct proof test cases', () =>
//     test.each(successTests)('Fully-specified correct proofs pass %$', (str) => {
//       const prf = ze.parser.proof.parse(str);
//       assert(prf.kind === 'OK', 'parsing should succeed');
//       const proof = ze.checker.checkProof(prf.value);
//       expect(proof).not.toSatisfy(ze.checker.isCheckerError, 'proof check should not fail');
//     })
//   );
