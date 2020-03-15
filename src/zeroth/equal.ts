import {
  BinaryExpression,
  Expression,
  ExpressionTypes,
  PropositionExpression,
  ReferenceExpression,
  UnaryExpression,
} from './types';

export const expression = (expr0: Expression, expr1: Expression): boolean => {
  if (expr0.logicExpressionType !== expr1.logicExpressionType) {
    return false;
  }

  switch (expr0.logicExpressionType) {
    case ExpressionTypes.PROPOSITION:
      return expr0.identifier === (expr1 as PropositionExpression).identifier;
    case ExpressionTypes.REFERENCE:
      return expr0.lineNumber === (expr1 as ReferenceExpression).lineNumber;
    case ExpressionTypes.UNARY:
      /* This is necessary to be future-proof */
      /* eslint-disable-next-line @typescript-eslint/no-unnecessary-condition */
      return expr0.operator === (expr1 as UnaryExpression).operator
        && expr0.operand === (expr1 as UnaryExpression).operand;
    case ExpressionTypes.BINARY:
      return expr0.operator === (expr1 as BinaryExpression).operator
        && expr0.operands[0] === (expr1 as BinaryExpression).operands[0]
        && expr0.operands[1] === (expr1 as BinaryExpression).operands[1];
  }
};
