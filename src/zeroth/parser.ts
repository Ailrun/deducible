import Parsimmon from 'parsimmon';

import {
  ZerothLogicBinaryExpression,
  ZerothLogicBinaryOperator,
  ZerothLogicExpression,
  ZerothLogicExpressionTypes,
  ZerothLogicPropositionExpression,
  ZerothLogicReferenceExpression,
  ZerothLogicUnaryExpression,
  ZerothLogicUnaryOperator,
} from './types';

const expressionToken = <T>(p: Parsimmon.Parser<T>): Parsimmon.Parser<T> => {
  return p.skip(Parsimmon.regexp(/ */));
};

const unaryOperator = (Parsimmon.string('~') as Parsimmon.Parser<ZerothLogicUnaryOperator>)
  .thru(expressionToken)
  .desc('unary operator');
const binaryOperator = (Parsimmon.regexp(/\/\\|\\\/|->/) as Parsimmon.Parser<ZerothLogicBinaryOperator>)
  .thru(expressionToken)
  .desc('binary operators');

const propositionExpression = Parsimmon.regexp(/[a-zA-Z_'][a-zA-Z0-9_']*/)
  .map((identifier): ZerothLogicPropositionExpression => ({
    logicExpressionType: ZerothLogicExpressionTypes.PROPOSITION,
    identifier,
  }))
  .thru(expressionToken)
  .desc('proposition');

const referenceExpression = Parsimmon.digit.atLeast(1).tie()
  .map((lineNumberString): ZerothLogicReferenceExpression => ({
    logicExpressionType: ZerothLogicExpressionTypes.REFERENCE,
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
    (operator, operand): ZerothLogicUnaryExpression => ({
      logicExpressionType: ZerothLogicExpressionTypes.UNARY,
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
    (operand0, operator, operand1): ZerothLogicBinaryExpression => ({
      logicExpressionType: ZerothLogicExpressionTypes.BINARY,
      operator,
      operands: [operand0, operand1],
    }),
  ),
  unaryExpression,
)
  .thru(expressionToken);

const expression: Parsimmon.Parser<ZerothLogicExpression> = Parsimmon.alt(
  binaryExpression,
)
  .thru(expressionToken);
