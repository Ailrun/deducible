import type { Expression, InternalProof, InternalProofLine, NaryExpressions, NaryOperator, Proof, ProofLine, Rule, RuleArgument } from './types';
import { ExpressionTypes, RuleTypes } from './types';

export const printInternalProof = (proof: InternalProof): string => {
  const lineTriples = proof.map(printInternalProofLine_);
  const expLength = Math.max(...lineTriples.map(v => v[0].length));
  const premiseLength = Math.max(...lineTriples.map(v => v[2].length));

  return lineTriples.map(v => `${v[2].padEnd(premiseLength)} |- ${v[0].padEnd(expLength)} | ${v[1]}\n`).join();
}

export const printInternalProofLine = (line: InternalProofLine): string => {
  const [lineExpr, lineRule, linePremises] = printInternalProofLine_(line);

  return `${linePremises} |- ${lineExpr} | ${lineRule}\n`;
}

const printInternalProofLine_ = (line: InternalProofLine): [string, string, string] =>
  [printExpression(line.expr), printRule(line.rule), line.premises.values().toArray().join(', ')];

export const printProof = (proof: Proof): string => {
  const linePairs = proof.map(printProofLine_);
  const expLength = Math.max(...linePairs.map(v => v[0].length));

  return linePairs.map(v => `${v[0].padEnd(expLength)} | ${v[1]}\n`).join();
}

export const printProofLine = (line: ProofLine): string =>
  printProofLine_(line).join(' | ') + '\n';

const printProofLine_ = (line: ProofLine): [string, string] =>
  [printExpression(line.expr), printRule(line.rule)];

export const printRule = (rule: Rule): string => {
  switch (rule.type) {
    case RuleTypes.PREMISE:
      return 'premise';
    case RuleTypes.INTRODUCTION:
      return `introduce ${rule.operator} with ${printRuleArguments(rule.ruleArguments)}`;
    case RuleTypes.ELIMINATION:
      return `eliminate ${rule.operator} with ${printRuleArguments(rule.ruleArguments)}`;
  }
};

const printRuleArguments = (args: readonly RuleArgument[]): string =>
  args.filter(v => v !== undefined).map(v => v.toString()).join(', ');

export const printExpression = (expr: Expression): string => printExpression_(expr, 0);

const printExpression_ = (expr: Expression, prec: number): string => {
  switch (expr.type) {
    case ExpressionTypes.PROPOSITION:
      return expr.identifier;
    case ExpressionTypes.NARY:
      return printNaryExpression(expr, prec);
  }
};

const negationPrecedence = [3, 4] as const;
const conjunctionPrecedence = [2, 3, 2] as const;
const disjunctionPrecedence = [1, 2, 1] as const;
const implicationPrecedence = [0, 1, 0] as const;

const printNaryExpression = (expr: NaryExpressions, prec: number): string => {
  switch (expr.operator) {
    case '~': return parenIf(prec > negationPrecedence[0], `${expr.operator} ${printExpression_(expr.operands[0], negationPrecedence[1])}`);
    case '/\\': return printBinaryExpression(expr.operator, conjunctionPrecedence, expr.operands, prec);
    case '\\/': return printBinaryExpression(expr.operator, disjunctionPrecedence, expr.operands, prec);
    case '->': return printBinaryExpression(expr.operator, implicationPrecedence, expr.operands, prec);;
  }
};

const printBinaryExpression = (
  op: NaryOperator<2>,
  opPrecs: readonly [number, number, number],
  exprs: [Expression, Expression],
  prec: number,
) =>
  parenIf(prec > opPrecs[0], `${printExpression_(exprs[0], opPrecs[1])} ${op} ${printExpression_(exprs[1], opPrecs[2])}`);

const parenIf = (cond: boolean, str: string) => cond ? `(${str})` : str;
