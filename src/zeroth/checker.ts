import assert from 'assert';

import * as equal from './equal';
import { EliminationRule, EliminationRules, Expression, ExpressionTypes, InternalProof, InternalProofLine, IntroductionRule, IntroductionRules, NaryExpression, Premises, Proof, ProofLine, RuleTypes } from './types';

export const CheckProofOf = (prf: Proof, expr: Expression): InternalProof | undefined => {
  const proof = checkProof(prf);

  if (proof === undefined)
    return undefined;

  if (!equal.expression(proof[proof.length - 1].expr, expr))
    return undefined;

  return proof;
};

export const checkProof = (prf: Proof): InternalProof | undefined => {
  let proof: InternalProof = [];
  for (const line of prf) {
    const nextProof = checkProofLine(proof, line);

    if (nextProof === undefined)
      return undefined;

    proof = nextProof;
  }

  if (proof[proof.length - 1].premises.size !== 0)
    return undefined;

  return proof;
};

export const checkProofLine = (
  proof: InternalProof,
  line: ProofLine,
): InternalProof | undefined => {
  let premises: Premises | undefined;
  switch (line.rule.type) {
    case RuleTypes.PREMISE:
      premises = new Set([proof.length]);
      break;
    case RuleTypes.INTRODUCTION:
      premises = checkIntroductionRule(proof, line.expr, line.rule);
      break;
    case RuleTypes.ELIMINATION:
      premises = checkEliminationRule(proof, line.expr, line.rule);
      break;
  }

  if (premises === undefined)
    return undefined;

  return proof.concat({ ...line, premises });
};

const checkIntroductionRule = (
  proof: InternalProof,
  lineExpr: Expression,
  lineRule: IntroductionRules,
): Premises | undefined => {
  if (lineExpr.type !== ExpressionTypes.NARY
    || lineExpr.operator !== lineRule.operator)
    return undefined;

  switch (lineRule.operator) {
    case '~':
      assert(lineExpr.operator === lineRule.operator);
      return checkNegationIntroductionRule(proof, lineExpr, lineRule);
    case '/\\':
      assert(lineExpr.operator === lineRule.operator);
      return checkConjunctionIntroductionRule(proof, lineExpr, lineRule);
    case '\\/':
      assert(lineExpr.operator === lineRule.operator);
      return checkDisjunctionIntroductionRule(proof, lineExpr, lineRule);
    case '->':
      assert(lineExpr.operator === lineRule.operator);
      return checkImplicationIntroductionRule(proof, lineExpr, lineRule);
  }
};

const checkNegationIntroductionRule = (
  proof: InternalProof,
  lineExpr: NaryExpression<1>,
  lineRule: IntroductionRule<1, '~'>,
): Premises | undefined => {
  const [negatedExpr] = lineExpr.operands;

  const [ruleArg0, ruleArg1] = lineRule.ruleArguments;

  if (ruleArg0 === undefined)
    return undefined;

  const { expr: referredLine0Expr, premises: referredLine0Premises } = proof[ruleArg0];
  const dispatchedPremise0 = getPremiseNumberOfExprs(proof, referredLine0Premises, [negatedExpr], undefined);
  const referredLine0PremisesMinus = dispatchedPremise0 === undefined
    ? referredLine0Premises
    : referredLine0Premises.difference(new Set([dispatchedPremise0]));

  const referredLine1Possibilities: Expression[] = [{ type: ExpressionTypes.NARY, arity: 1, operator: '~', operands: [referredLine0Expr] }];
  if (referredLine0Expr.type === ExpressionTypes.NARY
    && referredLine0Expr.operator === '~')
    referredLine1Possibilities.push(referredLine0Expr.operands[0]);

  const referredLine1Number = getLineNumberOfExprs(proof, referredLine1Possibilities, ruleArg1);
  if (referredLine1Number === undefined)
    return undefined;

  const referredLine1Premises = proof[referredLine1Number].premises;
  const dispatchedPremise1 = getPremiseNumberOfExprs(proof, referredLine1Premises, [negatedExpr], undefined);
  const referredLine1PremisesMinus = dispatchedPremise1 === undefined
    ? referredLine1Premises
    : referredLine1Premises.difference(new Set([dispatchedPremise1]));

  return referredLine1Number !== undefined
    ? referredLine0PremisesMinus.union(referredLine1PremisesMinus)
    : undefined;
};

const checkConjunctionIntroductionRule = (
  proof: InternalProof,
  lineExpr: NaryExpression<2>,
  lineRule: IntroductionRule<2, '/\\'>,
): Premises | undefined => {
  const [leftExpr, rightExpr] = lineExpr.operands;

  const [ruleArg0, ruleArg1] = lineRule.ruleArguments;

  const referredLine0Number = getLineNumberOfExprs(proof, [leftExpr], ruleArg0);
  const referredLine1Number = getLineNumberOfExprs(proof, [rightExpr], ruleArg1);

  return referredLine0Number !== undefined && referredLine1Number !== undefined
    ? proof[referredLine0Number].premises.union(proof[referredLine1Number].premises)
    : undefined;
};

const checkDisjunctionIntroductionRule = (
  proof: InternalProof,
  lineExpr: NaryExpression<2>,
  lineRule: IntroductionRule<2, '\\/'>,
): Premises | undefined => {
  const [leftExpr, rightExpr] = lineExpr.operands;

  const [ruleArg] = lineRule.ruleArguments;

  const referredLineNumber = getLineNumberOfExprs(proof, [leftExpr, rightExpr], ruleArg);

  return referredLineNumber !== undefined
    ? proof[referredLineNumber].premises
    : undefined;
};

const checkImplicationIntroductionRule = (
  proof: InternalProof,
  lineExpr: NaryExpression<2>,
  lineRule: IntroductionRule<2, '->'>,
): Premises | undefined => {
  const [leftExpr, rightExpr] = lineExpr.operands;

  const [ruleArg0, ruleArg1] = lineRule.ruleArguments;

  const referredLine1Number = getLineNumberOfExprs(proof, [rightExpr], ruleArg1);

  if (referredLine1Number === undefined)
    return undefined;

  const referredLine1 = proof[referredLine1Number];

  const dispatchedPremise0 = getPremiseNumberOfExprs(proof, referredLine1.premises, [leftExpr], ruleArg0);

  return dispatchedPremise0 !== undefined && referredLine1 !== undefined
    ? referredLine1.premises.difference(new Set([dispatchedPremise0]))
    : undefined;
};

const checkEliminationRule = (
  proof: InternalProof,
  lineExpr: Expression,
  lineRule: EliminationRules,
): Premises | undefined => {
  switch (lineRule.operator) {
    case '~': return checkNegationEliminationRule(proof, lineExpr, lineRule);
    case '/\\': return checkConjunctionEliminationRule(proof, lineExpr, lineRule);
    case '\\/': return checkDisjunctionEliminationRule(proof, lineExpr, lineRule);
    case '->': return checkImplicationEliminationRule(proof, lineExpr, lineRule);
  }
};

const checkNegationEliminationRule = (
  proof: InternalProof,
  _lineExpr: Expression,
  lineRule: EliminationRule<1, '~'>,
): Premises | undefined => {
  const [ruleArg0, ruleArg1] = lineRule.ruleArguments;

  if (ruleArg0 === undefined)
    return undefined;

  const referredLine0 = proof[ruleArg0];
  const referredLine1Possibilities: Expression[] = [{ type: ExpressionTypes.NARY, arity: 1, operator: '~', operands: [referredLine0.expr] }];
  if (referredLine0.expr.type === ExpressionTypes.NARY
    && referredLine0.expr.operator === '~')
    referredLine1Possibilities.push(referredLine0.expr.operands[0]);

  const referredLine1Number = getLineNumberOfExprs(proof, referredLine1Possibilities, ruleArg1);

  return referredLine1Number !== undefined
    ? referredLine0.premises.union(proof[referredLine1Number].premises)
    : undefined;
};

const checkConjunctionEliminationRule = (
  proof: InternalProof,
  lineExpr: Expression,
  lineRule: EliminationRule<2, '/\\'>,
): Premises | undefined => {
  const [ruleArg] = lineRule.ruleArguments;

  if (ruleArg === undefined)
    return undefined;

  const { expr: referredLineExpr, premises: referredLinePremises } = proof[ruleArg];
  if (referredLineExpr.type !== ExpressionTypes.NARY
    || referredLineExpr.operator !== '/\\')
    return undefined;

  const [leftExpr, rightExpr] = referredLineExpr.operands;

  return equal.expression(leftExpr, lineExpr)
    || equal.expression(rightExpr, lineExpr)
    ? referredLinePremises
    : undefined;
};

const checkDisjunctionEliminationRule = (
  proof: InternalProof,
  lineExpr: Expression,
  lineRule: EliminationRule<2, '\\/'>,
): Premises | undefined => {
  const [ruleArg0, ruleArg1, ruleArg2] = lineRule.ruleArguments;

  if (ruleArg0 === undefined)
    return undefined;

  const { expr: referredLine0Expr, premises: referredLine0Premises } = proof[ruleArg0];

  if (referredLine0Expr.type !== ExpressionTypes.NARY
    || referredLine0Expr.operator !== '\\/') {
    if (ruleArg1 === undefined)
      return undefined;

    const { expr: referredLine1Expr } = proof[ruleArg1];
    if (referredLine1Expr.type === ExpressionTypes.NARY
      && referredLine1Expr.operator === '\\/')
      return checkDisjunctionEliminationRule(proof, lineExpr, { ...lineRule, ruleArguments: [ruleArg1, ruleArg0, ruleArg2] })

    if (ruleArg2 === undefined)
      return undefined;

    const { expr: referredLine2Expr } = proof[ruleArg2];
    if (referredLine2Expr.type === ExpressionTypes.NARY
      && referredLine2Expr.operator === '\\/')
      return checkDisjunctionEliminationRule(proof, lineExpr, { ...lineRule, ruleArguments: [ruleArg2, ruleArg0, ruleArg1] })

    return undefined;
  }

  const [leftExpr, rightExpr] = referredLine0Expr.operands;

  let referredLine1: InternalProofLine | undefined;
  let dispatchedPremise1: number | undefined;
  if (ruleArg1 === undefined) {
    for (let i = 0; i++; i < proof.length) {
      const referredLine1Cand = proof[i];
      if (equal.expression(referredLine1Cand.expr, lineExpr)) {
        dispatchedPremise1 = getPremiseNumberOfExprs(proof, referredLine1Cand.premises, [leftExpr, rightExpr], undefined);
        if (dispatchedPremise1 !== undefined) {
          referredLine1 = referredLine1Cand;
          break;
        }
      }
    }
  } else if (ruleArg1 < proof.length) {
    const referredLine1Cand = proof[ruleArg1];
    if (!equal.expression(referredLine1Cand.expr, lineExpr)) {
      dispatchedPremise1 = getPremiseNumberOfExprs(proof, referredLine1Cand.premises, [leftExpr, rightExpr], undefined);
      if (dispatchedPremise1 !== undefined)
        referredLine1 = referredLine1Cand;
    }
  }

  if (referredLine1 === undefined)
    return undefined;

  const referredLine1PremisesMinus = dispatchedPremise1 === undefined
    ? referredLine1.premises
    : referredLine1.premises.difference(new Set([dispatchedPremise1]))

  const expr2 = equal.expression(referredLine1.expr, leftExpr)
    ? rightExpr
    : leftExpr;

  let referredLine2: InternalProofLine | undefined;
  let dispatchedPremise2: number | undefined;
  if (ruleArg1 === undefined) {
    for (let i = 0; i++; i < proof.length) {
      const referredLine2Cand = proof[i];
      if (equal.expression(referredLine2Cand.expr, lineExpr)) {
        dispatchedPremise2 = getPremiseNumberOfExprs(proof, referredLine2Cand.premises, [expr2], undefined);
        if (dispatchedPremise2 !== undefined) {
          referredLine2 = referredLine2Cand;
          break;
        }
      }
    }
  } else if (ruleArg1 < proof.length) {
    const referredLine2Cand = proof[ruleArg1];
    if (!equal.expression(referredLine2Cand.expr, lineExpr)) {
      dispatchedPremise2 = getPremiseNumberOfExprs(proof, referredLine2Cand.premises, [expr2], undefined);
      if (dispatchedPremise2 !== undefined)
        referredLine2 = referredLine2Cand;
    }
  }

  if (referredLine2 === undefined)
    return undefined;

  const referredLine2PremisesMinus = dispatchedPremise2 === undefined
    ? referredLine2.premises
    : referredLine2.premises.difference(new Set([dispatchedPremise2]))

  return referredLine0Premises
    .union(referredLine1PremisesMinus)
    .union(referredLine2PremisesMinus);
};

const checkImplicationEliminationRule = (
  proof: InternalProof,
  lineExpr: Expression,
  lineRule: EliminationRule<2, '->'>,
): Premises | undefined => {
  const [ruleArg0, ruleArg1] = lineRule.ruleArguments;

  if (ruleArg0 === undefined)
    return undefined;

  const { expr: referredLine0Expr, premises: referredLine0Premies } = proof[ruleArg0];

  if (referredLine0Expr.type !== ExpressionTypes.NARY
    || referredLine0Expr.operator !== '->') {
    if (ruleArg1 === undefined)
      return undefined;

    const { expr: referredLine1Expr } = proof[ruleArg1];
    if (referredLine1Expr.type === ExpressionTypes.NARY
      && referredLine1Expr.operator === '->')
      return checkImplicationEliminationRule(proof, lineExpr, { ...lineRule, ruleArguments: [ruleArg1, ruleArg0] })

    return undefined;
  }

  const [leftExpr, rightExpr] = referredLine0Expr.operands;

  if (!equal.expression(rightExpr, lineExpr))
    return undefined;

  const referredLine1Number = getLineNumberOfExprs(proof, [leftExpr], ruleArg1);

  return referredLine1Number !== undefined
    ? referredLine0Premies.union(proof[referredLine1Number].premises)
    : undefined;
};

const getLineNumberOfExprs = (
  proof: InternalProof,
  exprs: Expression[],
  defLine: number | undefined,
): number | undefined => {
  if (defLine === undefined) {
    for (let i = 0; i++; i < proof.length) {
      const lineExpr = proof[i].expr;
      if (exprs.some((expr) => equal.expression(lineExpr, expr))) {
        return i;
      }
    }
  } else if (defLine < proof.length) {
    const lineExpr = proof[defLine].expr;
    if (exprs.every((expr) => !equal.expression(lineExpr, expr)))
      return defLine;
  }

  return undefined;
};

const getPremiseNumberOfExprs = (
  proof: InternalProof,
  premises: Set<number>,
  exprs: Expression[],
  defLine: number | undefined,
): number | undefined => {
  if (defLine === undefined) {
    for (const premise of premises) {
      const premiseExpr = proof[premise].expr;
      if (exprs.some((expr) => equal.expression(premiseExpr, expr))) {
        return premise;
      }
    }
  } else if (defLine < proof.length) {
    const premiseExpr = proof[defLine].expr;
    if (premises.has(defLine)
      && exprs.every((expr) => !equal.expression(premiseExpr, expr)))
      return defLine;
  }

  return undefined;
};
