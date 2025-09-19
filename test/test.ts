import * as ze from '../src/zeroth/index.js';

const successTests: Array<string> = [
  `
A | premise
A -> A | introduce -> with 1, 1
`,
  `
A /\\ B | premise
A | eliminate /\\ with 1
A /\\ B -> A | introduce -> with 1, 2
`,
  `
A | premise
B | premise
A /\\ B | introduce /\\ with 1, 2
A -> A /\\ B | introduce -> with 1, 3
B -> A -> A /\\ B | introduce -> with 2, 4
`
];

const successTestOne = (i: number) => {
  const prf = ze.parser.proof.parse(successTests[i]);
  console.assert(prf.kind === 'OK', 'with', prf);
  const proof = ze.checker.checkProof(prf.value);
  console.assert(!ze.checker.isCheckerError(proof), 'with', proof);
  if (!ze.checker.isCheckerError(proof)) {
    console.log(`  - Success test ${i} : PASSED`);
  } else {
    console.log(`  - Success test ${i} : FAILED`);
  };
};

const bar = '============================================================';
let beginMessage = 'BEGINNING OF TESTS';
beginMessage = beginMessage.padStart((((57 - beginMessage.length) / 2) | 0) + beginMessage.length).padEnd(58);
let endMessage = 'END OF TESTS';
endMessage = endMessage.padStart((((57 - endMessage.length) / 2) | 0) + endMessage.length).padEnd(58);

const test = () => {
  console.log(`${bar}\n|${beginMessage}|\n${bar}\n`);
  console.log(`Success Tests:`);
  successTests.keys().forEach((i) => successTestOne(i));
  console.log(`\n${bar}\n|${endMessage}|\n${bar}`);
};

test();
