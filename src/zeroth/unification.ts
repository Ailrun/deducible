import * as equal from './equal';
import * as types from './types';

const extractConstraint = (
  sExpr: types.Expression,
  tExpr: types.Expression,
  constraints: [string, types.Expression][],
  taskStack: [types.Expression, types.Expression][],
): boolean => {
  switch (sExpr.type) {
    case types.ExpressionTypes.PROPOSITION:
      constraints.push([sExpr.identifier, tExpr]);
      return true;

    case types.ExpressionTypes.REFERENCE:
      return tExpr.type === sExpr.type
        && sExpr.lineNumber === tExpr.lineNumber;

    case types.ExpressionTypes.UNARY:
      if (tExpr.type !== sExpr.type
        /* This is necessary to be future-proof,
           e.g. to be safe after we introduce other unary operators
           than "~" */
        /* eslint-disable-next-line @typescript-eslint/no-unnecessary-condition */
        || sExpr.operator !== tExpr.operator)
        return false;

      taskStack.push(
        [sExpr.operands[0], tExpr.operands[0]],
      );
      return true;

    case types.ExpressionTypes.BINARY:
      if (tExpr.type !== sExpr.type
        || sExpr.operator !== tExpr.operator)
        return false;

      taskStack.push(
        [sExpr.operands[0], tExpr.operands[0]],
        [sExpr.operands[1], tExpr.operands[1]],
      );
      return true;
  }
};

export const isUnifiable = (
  sourceExpr: types.Expression,
  targetExpr: types.Expression,
): boolean => {
  const constraints: [string, types.Expression][] = [];
  const taskStack: [types.Expression, types.Expression][] = [[sourceExpr, targetExpr]];

  /* Generate constraints by looping through tasks */
  for (const [sExpr, tExpr] of taskStack) {
    if (!extractConstraint(sExpr, tExpr, constraints, taskStack))
      return false;
  }

  const constrainedAssignment: Record<string, types.Expression | undefined> = {};

  for (const [metaVar, expr] of constraints) {
    const assigned = constrainedAssignment[metaVar];
    if (assigned === undefined)
      constrainedAssignment[metaVar] = expr;
    else if (!equal.expression(assigned, expr))
      return false;
  }

  return true;
};
