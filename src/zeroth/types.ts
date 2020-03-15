export type ZerothLogicExpression =
  | ZerothLogicPropositionExpression
  | ZerothLogicReferenceExpression
  | ZerothLogicUnaryExpression
  | ZerothLogicBinaryExpression
;

export interface ZerothLogicPropositionExpression extends ZerothLogicBaseExpression {
  readonly logicExpressionType: ZerothLogicExpressionTypes.PROPOSITION;
  readonly identifier: string;
}

export interface ZerothLogicReferenceExpression extends ZerothLogicBaseExpression {
  readonly logicExpressionType: ZerothLogicExpressionTypes.REFERENCE;
  readonly lineNumber: number;
}

export interface ZerothLogicUnaryExpression extends ZerothLogicBaseExpression {
  readonly logicExpressionType: ZerothLogicExpressionTypes.UNARY;
  readonly operator: ZerothLogicUnaryOperator;
  readonly operand: ZerothLogicExpression;
}

export interface ZerothLogicBinaryExpression extends ZerothLogicBaseExpression {
  readonly logicExpressionType: ZerothLogicExpressionTypes.BINARY;
  readonly operator: ZerothLogicBinaryOperator;
  readonly operands: [ZerothLogicExpression, ZerothLogicExpression];
}

interface ZerothLogicBaseExpression {
  readonly logicExpressionType: ZerothLogicExpressionTypes;
}

export enum ZerothLogicExpressionTypes {
  PROPOSITION = 'LOGIC_PROPOSITION',
  REFERENCE = 'LOGIC_REFERENCE',
  UNARY = 'LOGIC_UNARY',
  BINARY = 'LOGIC_BINARY',
}

export type ZerothLogicUnaryOperator = '~';

export type ZerothLogicBinaryOperator = '/\\' | '\\/' | '->';
