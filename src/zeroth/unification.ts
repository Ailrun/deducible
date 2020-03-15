import {
  BinaryExpression,
  Expression,
  ExpressionTypes,
  PropositionExpression,
  ReferenceExpression,
  UnaryExpression,
} from './types';

export const isNaivelyUnifiable = (
  sourceExpr: Expression,
  targetExpr: Expression,
): boolean => {
  const constraints: [string, Expression][] = [];
  const stack: [Expression, Expression][] = [[sourceExpr, targetExpr]];

  let stackEntry = stack.pop();
  while (stackEntry !== undefined) {
    const [sExpr, tExpr] = stackEntry;

    switch (sExpr.logicExpressionType) {
      case ExpressionTypes.PROPOSITION: {
        constraints.push([sExpr.identifier, tExpr]);
        break;
      }
      case ExpressionTypes.REFERENCE: {
        if (tExpr.logicExpressionType === sExpr.logicExpressionType
            && sExpr.lineNumber === tExpr.lineNumber) {
          break;
        }
        return false;
      }
      case ExpressionTypes.UNARY: {
        if (tExpr.logicExpressionType === sExpr.logicExpressionType
            /* This is necessary to be future-proof */
            /* eslint-disable-next-line @typescript-eslint/no-unnecessary-condition */
            && sExpr.operator === tExpr.operator) {
          stack.push([sExpr.operand, tExpr.operand]);
          break;
        }

        return false;
      }
      case ExpressionTypes.BINARY: {
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

  const constrainedAssignment: Record<string, Expression | undefined> = {};

  for (const [identifier, expr] of constraints) {
    const assigned = constrainedAssignment[identifier];
    if (assigned === undefined) {
      constrainedAssignment[identifier] = expr;
    } else if (!equal(assigned, expr)) {
      return false;
    }
  }

  return true;
};

export const equal = (expr0: Expression, expr1: Expression): boolean => {
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
