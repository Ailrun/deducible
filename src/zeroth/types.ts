export type Proof = ProofLine[];

export type ProofLine = [Expression, Rule];

export type InternalProof = InternalProofLine[];

export type InternalProofLine = [Expression, Rule, Set<number>];

export type Rule =
  | PremiseRule
  | IntroductionRules
  | EliminationRules
  ;

export type IntroductionRules = {
    // Loop through all arities and all nary operators of those arities
    [n in Arity]: { [op in NaryOperator<n>]: IntroductionRule<n, op>; }[NaryOperator<n>];
  }[Arity];

export type EliminationRules = {
    // Loop through all arities and all nary operators of those arities
    [n in Arity]: { [op in NaryOperator<n>]: EliminationRule<n, op>; }[NaryOperator<n>];
  }[Arity];

export interface PremiseRule extends BaseRule {
  readonly type: RuleTypes.PREMISE;
}

export interface IntroductionRule<n extends Arity, op extends NaryOperator<n>> extends BaseRule {
  readonly type: RuleTypes.INTRODUCTION;
  readonly arity: n;
  readonly operator: op;
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
  readonly arity: n;
  readonly operator: op;
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
  readonly type: ExpressionTypes.NARY;
  readonly arity: n;
  readonly operator: NaryOperator<n>;
  readonly operands: NaryBase<n, [Expression], [Expression, Expression]>;
}

interface BaseExpression {
  readonly type: ExpressionTypes;
}

export enum ExpressionTypes {
  PROPOSITION = 'ZEROTH_EXPR_PROPOSITION',
  REFERENCE = 'ZEROTH_EXPR_REFERENCE',
  NARY = 'ZEROTH_EXPR_NARY',
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
