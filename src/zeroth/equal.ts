import assert from 'assert';

import type { Expression } from './types';
import { ExpressionTypes } from './types';

export const expression = (expr0: Expression, expr1: Expression): boolean => {
  if (expr0.type !== expr1.type)
    return false;

  switch (expr0.type) {
    case ExpressionTypes.PROPOSITION:
      assert(expr0.type === expr1.type);
      return expr0.identifier === expr1.identifier;
    case ExpressionTypes.REFERENCE:
      assert(expr0.type === expr1.type);
      return expr0.lineNumber === expr1.lineNumber;
    case ExpressionTypes.NARY:
      assert(expr0.type === expr1.type);
      if (expr0.operator !== expr1.operator)
        return false;

      switch (expr0.arity) {
        case 1:
          return expression(expr0.operands[0], expr1.operands[0]);
        case 2:
          assert(expr0.operator === expr1.operator);
          return expression(expr0.operands[0], expr1.operands[0])
            && expression(expr0.operands[1], expr1.operands[1]);
      }
  }
};
