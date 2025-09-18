import Parsimmon from 'parsimmon';

import * as types from './types';

const expressionToken = <T>(p: Parsimmon.Parser<T>): Parsimmon.Parser<T> => {
  return p.skip(Parsimmon.regexp(/ */));
};

const unaryOperator = (Parsimmon.string('~') as Parsimmon.Parser<types.NaryOperator<1>>)
  .thru(expressionToken)
  .desc('unary operator');
const binaryOperator = (Parsimmon.regexp(/\/\\|\\\/|->/) as Parsimmon.Parser<types.NaryOperator<2>>)
  .thru(expressionToken)
  .desc('binary operators');

const propositionExpression = Parsimmon.regexp(/[a-zA-Z_'][a-zA-Z0-9_']*/)
  .map((identifier): types.PropositionExpression => ({
    type: types.ExpressionTypes.PROPOSITION,
    identifier,
  }))
  .thru(expressionToken)
  .desc('proposition');

const referenceExpression = Parsimmon.digit.atLeast(1).tie()
  .map((lineNumberString): types.ReferenceExpression => ({
    type: types.ExpressionTypes.REFERENCE,
    lineNumber: parseInt(lineNumberString, 10),
  }))
  .thru(expressionToken)
  .desc('line reference');

const atomicExpression = Parsimmon.lazy(() => {
  return Parsimmon.alt(
    propositionExpression,
    referenceExpression,
    expression.wrap(Parsimmon.string('('), Parsimmon.string(')')),
  );
});

const unaryExpression = Parsimmon.alt(
  Parsimmon.seqMap(
    unaryOperator,
    atomicExpression,
    (operator, operand): types.NaryExpression<1> => ({
      type: types.ExpressionTypes.NARY,
      arity: 1,
      operator,
      operands: [operand],
    }),
  ),
  atomicExpression
)
  .thru(expressionToken);

const binaryExpression = Parsimmon.alt(
  Parsimmon.seqMap(
    unaryExpression,
    binaryOperator,
    unaryExpression,
    (operand0, operator, operand1): types.NaryExpression<2> => ({
      type: types.ExpressionTypes.NARY,
      arity: 2,
      operator,
      operands: [operand0, operand1],
    }),
  ),
  unaryExpression,
)
  .thru(expressionToken);

export const expression: Parsimmon.Parser<types.Expression> = Parsimmon.alt(
  binaryExpression,
)
  .thru(expressionToken);
