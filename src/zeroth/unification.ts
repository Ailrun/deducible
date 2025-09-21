import assert from 'assert';

import * as equal from './equal';
import type { Expression } from './types';
import { ExpressionTypes } from './types';

export const isUnifiable = (
  sourceExpr: Expression,
  targetExpr: Expression,
): boolean => {
  const constraints: [string, Expression][] = [];

  const taskStack: [Expression, Expression][] = [[sourceExpr, targetExpr]];
  for (const [sExpr, tExpr] of taskStack) {
    if (!extractConstraint(sExpr, tExpr, constraints, taskStack))
      return false;
  }

  const constrainedAssignment: Record<string, Expression | undefined> = {};
  for (const [metaVar, expr] of constraints) {
    const assigned = constrainedAssignment[metaVar];
    if (assigned === undefined)
      constrainedAssignment[metaVar] = expr;
    else if (!equal.expression(assigned, expr))
      return false;
  }

  return true;
};

const extractConstraint = (
  sExpr: Expression,
  tExpr: Expression,
  constraints: [string, Expression][],
  taskStack: [Expression, Expression][],
): boolean => {
  switch (sExpr.type) {
    case ExpressionTypes.PROPOSITION:
      constraints.push([sExpr.identifier, tExpr]);
      return true;

    // case ExpressionTypes.REFERENCE:
    //   return tExpr.type === sExpr.type
    //     && sExpr.lineNumber === tExpr.lineNumber;

    case ExpressionTypes.NARY:
      if (tExpr.type !== sExpr.type
        || sExpr.operator !== tExpr.operator)
        return false;

      switch (sExpr.arity) {
        case 1:
          taskStack.push(
            [sExpr.operands[0], tExpr.operands[0]],
          );
          return true;
        case 2:
          assert(tExpr.operator === sExpr.operator);
          taskStack.push(
            [sExpr.operands[0], tExpr.operands[0]],
            [sExpr.operands[1], tExpr.operands[1]],
          );
          return true;
      }
  }
};
