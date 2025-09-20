import { assert, expect, describe, it } from 'vitest';

import * as ze from '@/zeroth';

describe.concurrent('Fully-specified correct proof test cases', () => {
  it.each([
    // implication (->) test
    `
A      | premise
A -> A | introduce -> with 1, 1
`,
    // and (/\\) test
    `
A            | premise
A /\\ A      | introduce /\\ with 1, 1
A -> A /\\ A | introduce -> with 1, 2
`,
    `
A /\\ B      | premise
A            | eliminate /\\ with 1
A /\\ B -> A | introduce -> with 1, 2
`,
    `
A /\\ B      | premise
B            | eliminate /\\ with 1
A /\\ B -> B | introduce -> with 1, 2
`,
    `
A                 | premise
B                 | premise
A /\\ B           | introduce /\\ with 1, 2
A -> A /\\ B      | introduce -> with 1, 3
B -> A -> A /\\ B | introduce -> with 2, 4
`,
    // or (\\/) test
    `
A            | premise
A \\/ B      | introduce \\/ with 1
A -> A \\/ B | introduce -> with 1, 2
`,
    `
B            | premise
A \\/ B      | introduce \\/ with 1
B -> A \\/ B | introduce -> with 1, 2
`,
    `
A \\/ B            | premise
A                  | premise
B \\/ A            | introduce \\/ with 2
B                  | premise
B \\/ A            | introduce \\/ with 4
B \\/ A            | eliminate \\/ with 1, 3, 5
A \\/ B -> B \\/ A | introduce -> with 1, 6
`,
  ])('test %$', (str) => {
    const prf = ze.parser.proof.parse(str);
    assert(prf.kind === 'OK', 'incorrect syntax in the test case');
    expect(() => ze.checker.checkProof(prf.value), 'correct proof check').not.toThrow();
  })
});

describe.concurrent('Partially-specified correct proof test cases', () => {
  it.each([
    // implication (->) test
    `
A      | premise
A -> A | introduce -> with
`,
    // and (/\\) test
    `
A            | premise
A /\\ A      | introduce /\\ with
A -> A /\\ A | introduce -> with
`,
    `
A /\\ B      | premise
A            | eliminate /\\ with 1
A /\\ B -> A | introduce -> with
`,
    `
A /\\ B      | premise
B            | eliminate /\\ with 1
A /\\ B -> B | introduce -> with
`,
    `
A                 | premise
B                 | premise
A /\\ B           | introduce /\\ with
A -> A /\\ B      | introduce -> with
B -> A -> A /\\ B | introduce -> with
`,
    // or (\\/) test
    `
A            | premise
A \\/ B      | introduce \\/ with
A -> A \\/ B | introduce -> with
`,
    `
B            | premise
A \\/ B      | introduce \\/ with
B -> A \\/ B | introduce -> with
`,
    `
A \\/ B            | premise
A                  | premise
B \\/ A            | introduce \\/ with
B                  | premise
B \\/ A            | introduce \\/ with 4
B \\/ A            | eliminate \\/ with 1
A \\/ B -> B \\/ A | introduce -> with 1, 6
`,
  ])('test %$', (str) => {
    const prf = ze.parser.proof.parse(str);
    assert(prf.kind === 'OK', 'incorrect syntax in the test case');
    expect(() => ze.checker.checkProof(prf.value), 'correct proof check').not.toThrow();
  })
});

describe.concurrent('Wrong proof test cases', () => {
  it.each([
    // incomplete proof
    `
A | premise
`,
    `
A       | premise
A /\\ A | introduce /\\ with
`,
    // implication (->) test
    `
A -> A | introduce -> with
`,
    // and (/\\) test
    `
A /\\ A      | introduce /\\ with
`,
    `
A            | premise
B /\\ C      | introduce /\\ with
A -> B /\\ C | introduce -> with
`,
    `
A /\\ B      | premise
C            | eliminate /\\ with 1
A /\\ B -> C | introduce -> with
`,
    // or (\\/) test
    `
A            | premise
B \\/ C      | introduce \\/ with
A -> B \\/ C | introduce -> with
`,
    `
A \\/ B            | premise
A                  | premise
C \\/ A            | introduce \\/ with
B                  | premise
B \\/ C            | introduce \\/ with 4
B \\/ A            | eliminate \\/ with 1
A \\/ B -> B \\/ A | introduce -> with 1, 6
`,
  ])('test %$', (str) => {
    const prf = ze.parser.proof.parse(str);
    assert(prf.kind === 'OK', 'incorrect syntax in the test case');
    expect(() => ze.checker.checkProof(prf.value), 'wrong proof check').toThrow(ze.checker.CheckError);
  })
});
