import { equal, types } from './';

export const isNaivelyUnifiable = (
  sourceExpr: types.Expression,
  targetExpr: types.Expression,
): boolean => {
  const constraints: [string, types.Expression][] = [];
  const stack: [types.Expression, types.Expression][] = [[sourceExpr, targetExpr]];

  let stackEntry = stack.pop();
  while (stackEntry !== undefined) {
    const [sExpr, tExpr] = stackEntry;

    switch (sExpr.logicExpressionType) {
      case types.ExpressionTypes.PROPOSITION: {
        constraints.push([sExpr.identifier, tExpr]);
        break;
      }
      case types.ExpressionTypes.REFERENCE: {
        if (tExpr.logicExpressionType === sExpr.logicExpressionType
            && sExpr.lineNumber === tExpr.lineNumber) {
          break;
        }
        return false;
      }
      case types.ExpressionTypes.UNARY: {
        if (tExpr.logicExpressionType === sExpr.logicExpressionType
            /* This is necessary to be future-proof */
            /* eslint-disable-next-line @typescript-eslint/no-unnecessary-condition */
            && sExpr.operator === tExpr.operator) {
          stack.push([sExpr.operand, tExpr.operand]);
          break;
        }

        return false;
      }
      case types.ExpressionTypes.BINARY: {
        if (tExpr.logicExpressionType === sExpr.logicExpressionType
            && sExpr.operator === tExpr.operator) {
          stack.push([sExpr.operands[0], tExpr.operands[0]]);
          stack.push([sExpr.operands[1], tExpr.operands[1]]);
          break;
        }

        return false;
      }
    }

    stackEntry = stack.pop();
  }

  const constrainedAssignment: Record<string, types.Expression | undefined> = {};

  for (const [identifier, expr] of constraints) {
    const assigned = constrainedAssignment[identifier];
    if (assigned === undefined) {
      constrainedAssignment[identifier] = expr;
    } else if (!equal.expression(assigned, expr)) {
      return false;
    }
  }

  return true;
};
