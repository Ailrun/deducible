export type Expression =
  | PropositionExpression
  | ReferenceExpression
  | UnaryExpression
  | BinaryExpression
;

export interface PropositionExpression extends BaseExpression {
  readonly logicExpressionType: ExpressionTypes.PROPOSITION;
  readonly identifier: string;
}

export interface ReferenceExpression extends BaseExpression {
  readonly logicExpressionType: ExpressionTypes.REFERENCE;
  readonly lineNumber: number;
}

export interface UnaryExpression extends BaseExpression {
  readonly logicExpressionType: ExpressionTypes.UNARY;
  readonly operator: UnaryOperator;
  readonly operand: Expression;
}

export interface BinaryExpression extends BaseExpression {
  readonly logicExpressionType: ExpressionTypes.BINARY;
  readonly operator: BinaryOperator;
  readonly operands: [Expression, Expression];
}

interface BaseExpression {
  readonly logicExpressionType: ExpressionTypes;
}

export enum ExpressionTypes {
  PROPOSITION = 'LOGIC_PROPOSITION',
  REFERENCE = 'LOGIC_REFERENCE',
  UNARY = 'LOGIC_UNARY',
  BINARY = 'LOGIC_BINARY',
}

export type UnaryOperator = '~';

export type BinaryOperator = '/\\' | '\\/' | '->';
