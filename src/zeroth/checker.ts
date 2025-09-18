import * as equal from './equal';
import { EliminationRule, EliminationRules, Expression, ExpressionTypes, InternalProof, IntroductionRule, IntroductionRules, NaryExpression, ProofLine, RuleTypes } from './types';

declare function assert(value: unknown): asserts value;

export const checkProofLine = (
  proof: InternalProof,
  line: ProofLine,
): InternalProof | undefined => {
  switch (line[1].type) {
    case RuleTypes.PREMISE:
      return proof.concat([[line[0], line[1], new Set([proof.length])]]);
    case RuleTypes.INTRODUCTION:
      return checkIntroductionRule(proof, line[0], line[1]);
    case RuleTypes.ELIMINATION:
      return checkEliminationRule(proof, line[0], line[1]);
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

  const [ruleArg] = lineRule.arguments;

  const referredLineNumber = getLineNumberOfExprs(proof, [negatedExpr], ruleArg);

  return referredLineNumber !== undefined
    ? proof.concat([[lineExpr, lineRule, proof[referredLineNumber][2]]])
    : undefined;
};

const checkConjunctionIntroductionRule = (
  proof: InternalProof,
  lineExpr: NaryExpression<2>,
  lineRule: IntroductionRule<2, '/\\'>,
): InternalProof | undefined => {
  const [leftExpr, rightExpr] = lineExpr.operands;

  const [ruleArg0, ruleArg1] = lineRule.arguments;

  const referredLine0Number = getLineNumberOfExprs(proof, [leftExpr], ruleArg0);
  const referredLine1Number = getLineNumberOfExprs(proof, [rightExpr], ruleArg1);

  return referredLine0Number !== undefined && referredLine1Number !== undefined
    ? proof.concat([[lineExpr, lineRule, proof[referredLine0Number][2].union(proof[referredLine1Number][2])]])
    : undefined;
};

const checkDisjunctionIntroductionRule = (
  proof: InternalProof,
  lineExpr: NaryExpression<2>,
  lineRule: IntroductionRule<2, '\\/'>,
): InternalProof | undefined => {
  const [leftExpr, rightExpr] = lineExpr.operands;

  const [ruleArg] = lineRule.arguments;

  const referredLineNumber = getLineNumberOfExprs(proof, [leftExpr, rightExpr], ruleArg);

  return referredLineNumber !== undefined
    ? proof.concat([[lineExpr, lineRule, proof[referredLineNumber][2]]])
    : undefined;
};

const checkImplicationIntroductionRule = (
  proof: InternalProof,
  lineExpr: NaryExpression<2>,
  lineRule: IntroductionRule<2, '->'>,
): InternalProof | undefined => {
  const [leftExpr, rightExpr] = lineExpr.operands;

  const [ruleArg0, ruleArg1] = lineRule.arguments;

  const referredLine1Number = getLineNumberOfExprs(proof, [rightExpr], ruleArg1);

  if (referredLine1Number === undefined)
    return undefined;

  const referredLine1 = proof[referredLine1Number];

  const referredLine0Number = getPremiseNumberOfExprs(proof, referredLine1[2], [leftExpr], ruleArg0);

  return referredLine0Number !== undefined && referredLine1 !== undefined
    ? proof.concat([[lineExpr, lineRule, referredLine1[2].difference(new Set([referredLine0Number]))]])
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
  const [ruleArg0, ruleArg1] = lineRule.arguments;

  if (ruleArg0 === undefined)
    return undefined;

  const referredLine0 = proof[ruleArg0];
  const referredLine1Possibilities: Expression[] = [{ type: ExpressionTypes.NARY, arity: 1, operator: '~', operands: [referredLine0[0]] }];
  if (referredLine0[0].type === ExpressionTypes.NARY
    && referredLine0[0].operator === '~')
    referredLine1Possibilities.push(referredLine0[0].operands[0]);

  const referredLine1Number = getLineNumberOfExprs(proof, referredLine1Possibilities, ruleArg1);

  return referredLine1Number !== undefined
    ? proof.concat([[lineExpr, lineRule, referredLine0[2].union(proof[referredLine1Number][2])]])
    : undefined;
};

const checkConjunctionEliminationRule = (
  proof: InternalProof,
  lineExpr: Expression,
  lineRule: EliminationRule<2, '/\\'>,
): InternalProof | undefined => {
  const [ruleArg] = lineRule.arguments;

  if (ruleArg === undefined)
    return undefined;

  const referredLine = proof[ruleArg];
  if (referredLine[0].type !== ExpressionTypes.NARY
    || referredLine[0].operator !== '/\\')
    return undefined;

  const [leftExpr, rightExpr] = referredLine[0].operands;

  return equal.expression(leftExpr, lineExpr)
    || equal.expression(rightExpr, lineExpr)
    ? proof.concat([[lineExpr, lineRule, referredLine[2]]])
    : undefined;
};

const checkDisjunctionEliminationRule = (
  proof: InternalProof,
  lineExpr: Expression,
  lineRule: EliminationRule<2, '\\/'>,
): InternalProof | undefined => {
  const [ruleArg0, ruleArg1, ruleArg2] = lineRule.arguments;

  if (ruleArg0 === undefined)
    return undefined;

  const referredLine0 = proof[ruleArg0];

  if (referredLine0[0].type !== ExpressionTypes.NARY
    || referredLine0[0].operator !== '\\/') {
    if (ruleArg1 === undefined)
      return undefined;

    const referredLine1 = proof[ruleArg1];
    if (referredLine1[0].type === ExpressionTypes.NARY
      && referredLine1[0].operator === '\\/')
      return checkDisjunctionEliminationRule(proof, lineExpr, { ...lineRule, arguments: [ruleArg1, ruleArg0, ruleArg2] })

    if (ruleArg2 === undefined)
      return undefined;

    const referredLine2 = proof[ruleArg2];
    if (referredLine2[0].type === ExpressionTypes.NARY
      && referredLine2[0].operator === '\\/')
      return checkDisjunctionEliminationRule(proof, lineExpr, { ...lineRule, arguments: [ruleArg2, ruleArg0, ruleArg1] })

    return undefined;
  }

  const [leftExpr, rightExpr] = referredLine0[0].operands;

  let referredLine1;
  let referredLine1Premise;
  if (ruleArg1 === undefined) {
    for (let i = 0; i++; i < proof.length) {
      const referredLine1Cand = proof[i];
      if (equal.expression(referredLine1Cand[0], lineExpr)) {
        referredLine1Premise = getPremiseNumberOfExprs(proof, referredLine1Cand[2], [leftExpr, rightExpr], undefined);
        if (referredLine1Premise !== undefined) {
          referredLine1 = referredLine1Cand;
          break;
        }
      }
    }
  } else if (ruleArg1 < proof.length) {
    const referredLine1Cand = proof[ruleArg1];
    if (!equal.expression(referredLine1Cand[0], lineExpr)) {
      referredLine1Premise = getPremiseNumberOfExprs(proof, referredLine1Cand[2], [leftExpr, rightExpr], undefined);
      if (referredLine1Premise !== undefined)
        referredLine1 = referredLine1Cand;
    }
  }

  if (referredLine1 === undefined)
    return undefined;

  const expr2 = equal.expression(referredLine1[0], leftExpr)
    ? rightExpr
    : leftExpr;

  let referredLine2;
  let referredLine2Premise;
  if (ruleArg1 === undefined) {
    for (let i = 0; i++; i < proof.length) {
      const referredLine2Cand = proof[i];
      if (equal.expression(referredLine2Cand[0], lineExpr)) {
        referredLine2Premise = getPremiseNumberOfExprs(proof, referredLine2Cand[2], [expr2], undefined);
        if (referredLine2Premise !== undefined) {
          referredLine2 = referredLine2Cand;
          break;
        }
      }
    }
  } else if (ruleArg1 < proof.length) {
    const referredLine2Cand = proof[ruleArg1];
    if (!equal.expression(referredLine2Cand[0], lineExpr)) {
      referredLine2Premise = getPremiseNumberOfExprs(proof, referredLine2Cand[2], [expr2], undefined);
      if (referredLine2Premise !== undefined)
        referredLine2 = referredLine2Cand;
    }
  }

  return referredLine2 !== undefined
    ? proof.concat([[lineExpr, lineRule, referredLine0[2].union(referredLine1[2].difference(new Set([referredLine1Premise]))).union(referredLine2[2].difference(new Set([referredLine2Premise])))]])
    : undefined;
};

const checkImplicationEliminationRule = (
  proof: InternalProof,
  lineExpr: Expression,
  lineRule: EliminationRule<2, '->'>,
): InternalProof | undefined => {
  const [ruleArg0, ruleArg1] = lineRule.arguments;

  if (ruleArg0 === undefined)
    return undefined;

  const referredLine0 = proof[ruleArg0];

  if (referredLine0[0].type !== ExpressionTypes.NARY
    || referredLine0[0].operator !== '->') {
    if (ruleArg1 === undefined)
      return undefined;

    const referredLine1 = proof[ruleArg1];
    if (referredLine1[0].type === ExpressionTypes.NARY
      && referredLine1[0].operator === '->')
      return checkImplicationEliminationRule(proof, lineExpr, { ...lineRule, arguments: [ruleArg1, ruleArg0] })

    return undefined;
  }

  const [leftExpr, rightExpr] = referredLine0[0].operands;

  if (!equal.expression(rightExpr, lineExpr))
    return undefined;

  const referredLine1Number = getLineNumberOfExprs(proof, [leftExpr], ruleArg1);

  return referredLine1Number !== undefined
    ? proof.concat([[lineExpr, lineRule, referredLine0[2].union(proof[referredLine1Number][2])]])
    : undefined;
};

const getLineNumberOfExprs = (
  proof: InternalProof,
  exprs: Expression[],
  defLine: number | undefined,
): number | undefined => {
  if (defLine === undefined) {
    for (let i = 0; i++; i < proof.length) {
      const lineExpr = proof[i][0];
      if (exprs.some((expr) => equal.expression(lineExpr, expr))) {
        return i;
      }
    }
  } else if (defLine < proof.length) {
    const lineExpr = proof[defLine][0];
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
      const premiseExpr = proof[premise][0];
      if (exprs.some((expr) => equal.expression(premiseExpr, expr))) {
        return premise;
      }
    }
  } else if (defLine < proof.length) {
    const premiseExpr = proof[defLine][0];
    if (premises.has(defLine)
      && exprs.every((expr) => !equal.expression(premiseExpr, expr)))
      return defLine;
  }

  return undefined;
};
