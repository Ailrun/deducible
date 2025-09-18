import assert from 'assert';

import * as equal from './equal';
import { EliminationRule, EliminationRules, Expression, ExpressionTypes, InternalProof, IntroductionRule, IntroductionRules, NaryExpression, Proof, ProofLine, RuleTypes } from './types';

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
  switch (line.rule.type) {
    case RuleTypes.PREMISE:
      return proof.concat({ ...line, premises: new Set([proof.length]) });
    case RuleTypes.INTRODUCTION:
      return checkIntroductionRule(proof, line.expr, line.rule);
    case RuleTypes.ELIMINATION:
      return checkEliminationRule(proof, line.expr, line.rule);
  }
};

const checkIntroductionRule = (
  proof: InternalProof,
  lineExpr: Expression,
  lineRule: IntroductionRules,
): InternalProof | undefined => {
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
): InternalProof | undefined => {
  const [negatedExpr] = lineExpr.operands;

  const [ruleArg] = lineRule.ruleArguments;

  if (ruleArg === undefined)
    return undefined;

  // TODO: implement this!
  return undefined;
  // const referredLine = proof[ruleArg];

  // const referredLineNumber = getPremiseNumberOfExprs(proof, [negatedExpr], ruleArg);

  // return referredLineNumber !== undefined
  //   ? proof.concat({
  //     expr: lineExpr,
  //     rule: lineRule,
  //     premises: proof[referredLineNumber].premises,
  //   })
  //   : undefined;
};

const checkConjunctionIntroductionRule = (
  proof: InternalProof,
  lineExpr: NaryExpression<2>,
  lineRule: IntroductionRule<2, '/\\'>,
): InternalProof | undefined => {
  const [leftExpr, rightExpr] = lineExpr.operands;

  const [ruleArg0, ruleArg1] = lineRule.ruleArguments;

  const referredLine0Number = getLineNumberOfExprs(proof, [leftExpr], ruleArg0);
  const referredLine1Number = getLineNumberOfExprs(proof, [rightExpr], ruleArg1);

  return referredLine0Number !== undefined && referredLine1Number !== undefined
    ? proof.concat({
      expr: lineExpr,
      rule: lineRule,
      premises: proof[referredLine0Number].premises.union(proof[referredLine1Number].premises),
    })
    : undefined;
};

const checkDisjunctionIntroductionRule = (
  proof: InternalProof,
  lineExpr: NaryExpression<2>,
  lineRule: IntroductionRule<2, '\\/'>,
): InternalProof | undefined => {
  const [leftExpr, rightExpr] = lineExpr.operands;

  const [ruleArg] = lineRule.ruleArguments;

  const referredLineNumber = getLineNumberOfExprs(proof, [leftExpr, rightExpr], ruleArg);

  return referredLineNumber !== undefined
    ? proof.concat({
      expr: lineExpr,
      rule: lineRule,
      premises: proof[referredLineNumber].premises,
    })
    : undefined;
};

const checkImplicationIntroductionRule = (
  proof: InternalProof,
  lineExpr: NaryExpression<2>,
  lineRule: IntroductionRule<2, '->'>,
): InternalProof | undefined => {
  const [leftExpr, rightExpr] = lineExpr.operands;

  const [ruleArg0, ruleArg1] = lineRule.ruleArguments;

  const referredLine1Number = getLineNumberOfExprs(proof, [rightExpr], ruleArg1);

  if (referredLine1Number === undefined)
    return undefined;

  const referredLine1 = proof[referredLine1Number];

  const referredLine0Number = getPremiseNumberOfExprs(proof, referredLine1.premises, [leftExpr], ruleArg0);

  return referredLine0Number !== undefined && referredLine1 !== undefined
    ? proof.concat({
      expr: lineExpr,
      rule: lineRule,
      premises: referredLine1.premises.difference(new Set([referredLine0Number])),
    })
    : undefined;
};

const checkEliminationRule = (
  proof: InternalProof,
  lineExpr: Expression,
  lineRule: EliminationRules,
): InternalProof | undefined => {
  switch (lineRule.operator) {
    case '~': return checkNegationEliminationRule(proof, lineExpr, lineRule);
    case '/\\': return checkConjunctionEliminationRule(proof, lineExpr, lineRule);
    case '\\/': return checkDisjunctionEliminationRule(proof, lineExpr, lineRule);
    case '->': return checkImplicationEliminationRule(proof, lineExpr, lineRule);
  }
};

const checkNegationEliminationRule = (
  proof: InternalProof,
  lineExpr: Expression,
  lineRule: EliminationRule<1, '~'>,
): InternalProof | undefined => {
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
    ? proof.concat({
      expr: lineExpr,
      rule: lineRule,
      premises: referredLine0.premises.union(proof[referredLine1Number].premises),
    })
    : undefined;
};

const checkConjunctionEliminationRule = (
  proof: InternalProof,
  lineExpr: Expression,
  lineRule: EliminationRule<2, '/\\'>,
): InternalProof | undefined => {
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
    ? proof.concat({
      expr: lineExpr,
      rule: lineRule,
      premises: referredLinePremises,
    })
    : undefined;
};

const checkDisjunctionEliminationRule = (
  proof: InternalProof,
  lineExpr: Expression,
  lineRule: EliminationRule<2, '\\/'>,
): InternalProof | undefined => {
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

  let referredLine1;
  let referredLine1Premise;
  if (ruleArg1 === undefined) {
    for (let i = 0; i++; i < proof.length) {
      const referredLine1Cand = proof[i];
      if (equal.expression(referredLine1Cand.expr, lineExpr)) {
        referredLine1Premise = getPremiseNumberOfExprs(proof, referredLine1Cand.premises, [leftExpr, rightExpr], undefined);
        if (referredLine1Premise !== undefined) {
          referredLine1 = referredLine1Cand;
          break;
        }
      }
    }
  } else if (ruleArg1 < proof.length) {
    const referredLine1Cand = proof[ruleArg1];
    if (!equal.expression(referredLine1Cand.expr, lineExpr)) {
      referredLine1Premise = getPremiseNumberOfExprs(proof, referredLine1Cand.premises, [leftExpr, rightExpr], undefined);
      if (referredLine1Premise !== undefined)
        referredLine1 = referredLine1Cand;
    }
  }

  if (referredLine1 === undefined)
    return undefined;

  const expr2 = equal.expression(referredLine1.expr, leftExpr)
    ? rightExpr
    : leftExpr;

  let referredLine2;
  let dispatchedPremise2;
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

  return referredLine2 !== undefined
    ? proof.concat({
      expr: lineExpr,
      rule: lineRule,
      premises: referredLine0Premises.union(referredLine1.premises.difference(new Set([referredLine1Premise]))).union(referredLine2.premises.difference(new Set([dispatchedPremise2]))),
    })
    : undefined;
};

const checkImplicationEliminationRule = (
  proof: InternalProof,
  lineExpr: Expression,
  lineRule: EliminationRule<2, '->'>,
): InternalProof | undefined => {
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
    ? proof.concat({
      expr: lineExpr,
      rule: lineRule,
      premises: referredLine0Premies.union(proof[referredLine1Number].premises),
    })
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
