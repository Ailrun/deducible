import {
  ZerothLogicBinaryExpression,
  ZerothLogicExpression,
  ZerothLogicExpressionTypes,
  ZerothLogicPropositionExpression,
  ZerothLogicReferenceExpression,
  ZerothLogicUnaryExpression,
} from './types';

export const isNaivelyUnifiable = (
  sourceExpr: ZerothLogicExpression,
  targetExpr: ZerothLogicExpression,
): boolean => {
  const constraints: [string, ZerothLogicExpression][] = [];
  const stack: [ZerothLogicExpression, ZerothLogicExpression][] = [[sourceExpr, targetExpr]];

  let stackEntry = stack.pop();
  while (stackEntry !== undefined) {
    const [sExpr, tExpr] = stackEntry;

    switch (sExpr.logicExpressionType) {
      case ZerothLogicExpressionTypes.PROPOSITION: {
        constraints.push([sExpr.identifier, tExpr]);
        break;
      }
      case ZerothLogicExpressionTypes.REFERENCE: {
        if (tExpr.logicExpressionType === sExpr.logicExpressionType
            && sExpr.lineNumber === tExpr.lineNumber) {
          break;
        }
        return false;
      }
      case ZerothLogicExpressionTypes.UNARY: {
        if (tExpr.logicExpressionType === sExpr.logicExpressionType
            /* This is necessary to be future-proof */
            /* eslint-disable-next-line @typescript-eslint/no-unnecessary-condition */
            && sExpr.operator === tExpr.operator) {
          stack.push([sExpr.operand, tExpr.operand]);
          break;
        }

        return false;
      }
      case ZerothLogicExpressionTypes.BINARY: {
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

  const constrainedAssignment: Record<string, ZerothLogicExpression | undefined> = {};

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

export const equal = (expr0: ZerothLogicExpression, expr1: ZerothLogicExpression): boolean => {
  if (expr0.logicExpressionType !== expr1.logicExpressionType) {
    return false;
  }

  switch (expr0.logicExpressionType) {
    case ZerothLogicExpressionTypes.PROPOSITION:
      return expr0.identifier === (expr1 as ZerothLogicPropositionExpression).identifier;
    case ZerothLogicExpressionTypes.REFERENCE:
      return expr0.lineNumber === (expr1 as ZerothLogicReferenceExpression).lineNumber;
    case ZerothLogicExpressionTypes.UNARY:
      /* This is necessary to be future-proof */
      /* eslint-disable-next-line @typescript-eslint/no-unnecessary-condition */
      return expr0.operator === (expr1 as ZerothLogicUnaryExpression).operator
        && expr0.operand === (expr1 as ZerothLogicUnaryExpression).operand;
    case ZerothLogicExpressionTypes.BINARY:
      return expr0.operator === (expr1 as ZerothLogicBinaryExpression).operator
        && expr0.operands[0] === (expr1 as ZerothLogicBinaryExpression).operands[0]
        && expr0.operands[1] === (expr1 as ZerothLogicBinaryExpression).operands[1];
  }
};
