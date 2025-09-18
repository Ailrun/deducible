export type Proof = [Expression, Rule][];

export type Rule =
  | PremiseRule
  // Loop through all arities and all nary operators of those arities
  | { [n in Arity]: { [op in NaryOperator<n>]: IntroductionRule<n, op> | EliminationRule<n, op>; }[NaryOperator<n>]; }[Arity]
  ;

export interface PremiseRule extends BaseRule {
  readonly type: RuleTypes.PREMISE;
}

export interface IntroductionRule<n extends Arity, op extends NaryOperator<n>> extends BaseRule {
  readonly type: RuleTypes.INTRODUCTION;
  readonly arguments:
  [n] extends [1]
  ? ([op] extends ['~']
    ? [RuleArgument]
    : never)
  : [n] extends [2]
  ? ([op] extends ['/\\']
    ? [RuleArgument, RuleArgument]
    : [op] extends ['\\/']
    ? [RuleArgument]
    : [op] extends ['->']
    ? [RuleArgument, RuleArgument]
    : never)
  : never;
}

export interface EliminationRule<n extends Arity, op extends NaryOperator<n>> extends BaseRule {
  readonly type: RuleTypes.ELIMINATION;
  readonly arguments:
  [n] extends [1]
  ? ([op] extends ['~']
    ? [RuleArgument, RuleArgument]
    : never)
  : [n] extends [2]
  ? ([op] extends ['/\\']
    ? [RuleArgument]
    : [op] extends ['\\/']
    ? [RuleArgument, RuleArgument, RuleArgument]
    : [op] extends ['->']
    ? [RuleArgument, RuleArgument]
    : never)
  : never;
}

export interface BaseRule {
  readonly type: RuleTypes;
}

export enum RuleTypes {
  PREMISE = 'ZEROTH_RULE_PREMISE',
  INTRODUCTION = 'ZEROTH_RULE_INTRODUCTION',
  ELIMINATION = 'ZEROTH_RULE_ELIMINATION',
}

export type RuleArgument = number | undefined;

export type Expression =
  | PropositionExpression
  | ReferenceExpression
  // Loop through all arities and all nary operators of those arities
  | { [n in Arity]: NaryExpression<n>; }[Arity]
  ;

export interface PropositionExpression extends BaseExpression {
  readonly type: ExpressionTypes.PROPOSITION;
  readonly identifier: string;
}

export interface ReferenceExpression extends BaseExpression {
  readonly type: ExpressionTypes.REFERENCE;
  readonly lineNumber: number;
}

export interface NaryExpression<n extends Arity> extends BaseExpression {
  readonly type: NaryBase<n, ExpressionTypes.UNARY, ExpressionTypes.BINARY>;
  readonly operator: NaryOperator<n>;
  readonly operands: NaryBase<n, [Expression], [Expression, Expression]>;
}

interface BaseExpression {
  readonly type: ExpressionTypes;
}

export enum ExpressionTypes {
  PROPOSITION = 'ZEROTH_EXPR_PROPOSITION',
  REFERENCE = 'ZEROTH_EXPR_REFERENCE',
  UNARY = 'ZEROTH_EXPR_UNARY',
  BINARY = 'ZEROTH_EXPR_BINARY',
}

export type NaryOperator<n extends Arity> =
  NaryBase<
    n,
    '~',
    '/\\' | '\\/' | '->'
  >;

type NaryBase<n extends Arity, unary, binary> =
  [n] extends [1]
  ? unary
  : [n] extends [2]
  ? binary
  : never;

export type Arity = 1 | 2;
