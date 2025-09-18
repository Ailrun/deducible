import * as types from './types';

export const expression = (expr0: types.Expression, expr1: types.Expression): boolean => {
  if (expr0.type !== expr1.type) {
    return false;
  }

  switch (expr0.type) {
    case types.ExpressionTypes.PROPOSITION:
      return expr0.identifier === (expr1 as types.PropositionExpression).identifier;
    case types.ExpressionTypes.REFERENCE:
      return expr0.lineNumber === (expr1 as types.ReferenceExpression).lineNumber;
    case types.ExpressionTypes.UNARY:
      /* This is necessary to be future-proof */
      /* eslint-disable-next-line @typescript-eslint/no-unnecessary-condition */
      return expr0.operator === (expr1 as types.NaryExpression<1>).operator
        && expr0.operands[0] === (expr1 as types.NaryExpression<1>).operands[0];
    case types.ExpressionTypes.BINARY:
      return expr0.operator === (expr1 as types.NaryExpression<2>).operator
        && expr0.operands[0] === (expr1 as types.NaryExpression<2>).operands[0]
        && expr0.operands[1] === (expr1 as types.NaryExpression<2>).operands[1];
  }
};
