import Parsimmon from 'parsimmon';

import { types } from './';

const expressionToken = <T>(p: Parsimmon.Parser<T>): Parsimmon.Parser<T> => {
  return p.skip(Parsimmon.regexp(/ */));
};

const unaryOperator = (Parsimmon.string('~') as Parsimmon.Parser<types.UnaryOperator>)
  .thru(expressionToken)
  .desc('unary operator');
const binaryOperator = (Parsimmon.regexp(/\/\\|\\\/|->/) as Parsimmon.Parser<types.BinaryOperator>)
  .thru(expressionToken)
  .desc('binary operators');

const propositionExpression = Parsimmon.regexp(/[a-zA-Z_'][a-zA-Z0-9_']*/)
  .map((identifier): types.PropositionExpression => ({
    logicExpressionType: types.ExpressionTypes.PROPOSITION,
    identifier,
  }))
  .thru(expressionToken)
  .desc('proposition');

const referenceExpression = Parsimmon.digit.atLeast(1).tie()
  .map((lineNumberString): types.ReferenceExpression => ({
    logicExpressionType: types.ExpressionTypes.REFERENCE,
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
    (operator, operand): types.UnaryExpression => ({
      logicExpressionType: types.ExpressionTypes.UNARY,
      operator,
      operand,
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
    (operand0, operator, operand1): types.BinaryExpression => ({
      logicExpressionType: types.ExpressionTypes.BINARY,
      operator,
      operands: [operand0, operand1],
    }),
  ),
  unaryExpression,
)
  .thru(expressionToken);

const expression: Parsimmon.Parser<types.Expression> = Parsimmon.alt(
  binaryExpression,
)
  .thru(expressionToken);
