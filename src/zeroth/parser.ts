import { ImplicitParjser, Parjser, int, newline, regexp, space, string, whitespace } from 'parjs-then';
import { between, later, many, manySepBy, map, mapConst, maybe, must, or, pipe, butThen, andThen, followedBy } from 'parjs-then/combinators';

import type { EliminationRule, EliminationRules, Expression, IntroductionRule, IntroductionRules, NaryExpression, NaryOperator, PremiseRule, Proof, ProofLine, PropositionExpression, Rule, RuleArgument } from './types';
import { ExpressionTypes, RuleTypes } from './types';


const lexToken = <T>(x: ImplicitParjser<T>) => followedBy<T>(space().pipe(many()))(x);

const symbol = <const T extends string>(s: T): Parjser<T> =>
  string<T>(s).pipe(lexToken);

const keyword = <const T extends string>(s: T): Parjser<T> =>
  string<T>(s).pipe(lexToken);

const lineNumber = pipe(
  int({ allowSign: false }),
  must(n => n > 0 ? true : { reason: 'line number should be positive' }),
  map(n => n - 1),
  lexToken,
);

const negationOperator = symbol('~');
const conjunctionOperator = symbol('/\\');
const disjunctionOperator = symbol('\\/');
const implicationOperator = symbol('->');

const propositionIdentifier = regexp(/[a-zA-Z_'][a-zA-Z0-9_']*/).pipe(map(r => r[0]), lexToken)

const unaryOperator: Parjser<NaryOperator<1>> = negationOperator
  .expects('unary operator');

const propositionExpression = pipe(
  propositionIdentifier,
  map((identifier): PropositionExpression => ({
    type: ExpressionTypes.PROPOSITION,
    identifier,
  })),
);

const atomicExpression = later<Expression>();

const unaryExpression = pipe(
  pipe(
    unaryOperator,
    andThen(atomicExpression),
    map(([operator, operand]): NaryExpression<1> => ({
      type: ExpressionTypes.NARY,
      arity: 1,
      operator,
      operands: [operand],
    })),
  ),
  or(atomicExpression),
)

const binaryExpression = <const BinOp extends NaryOperator<2>>(lowerExpr: Parjser<Expression>, binOp: BinOp, binOpP: Parjser<BinOp>) => pipe(
  lowerExpr,
  andThen(pipe(binOpP.pipe(butThen(lowerExpr)), many())),
  map(([operand, operands]) => [operand, ...operands].reduceRight((expr, newExpr): NaryExpression<2> => ({
    type: ExpressionTypes.NARY,
    arity: 2,
    operator: binOp,
    operands: [newExpr, expr],
  }))),
);

const expression1: Parjser<Expression> = binaryExpression(unaryExpression, '/\\', conjunctionOperator);

const expression0: Parjser<Expression> = binaryExpression(expression1, '\\/', disjunctionOperator);

export const expression: Parjser<Expression> = binaryExpression(expression0, '->', implicationOperator);

atomicExpression.init(
  pipe(
    propositionExpression,
    or(
      expression.pipe(between(symbol('('), symbol(')'))),
    ),
  )
);

const oneRuleArgument: Parjser<[RuleArgument]> = pipe(
  lineNumber,
  maybe(undefined),
  map(lineN => [lineN]),
);

const twoRuleArguments = pipe(
  lineNumber,
  manySepBy(symbol(','), 2),
  map((lineNs): [RuleArgument, RuleArgument] => [lineNs[0], lineNs[1]]),
);

const threeRuleArguments = pipe(
  lineNumber,
  manySepBy(symbol(','), 3),
  map((lineNs): [RuleArgument, RuleArgument, RuleArgument] => [lineNs[0], lineNs[1], lineNs[2]]),
);

const premiseRule = pipe(
  keyword('premise'),
  mapConst<PremiseRule>({ type: RuleTypes.PREMISE }),
)
  .expects('premise rule');

const negationIntroductionRule: Parjser<IntroductionRule<1, '~'>> = pipe(
  negationOperator,
  followedBy(keyword('with')),
  andThen(twoRuleArguments),
  map(([operator, ruleArguments]): IntroductionRule<1, '~'> => ({
    type: RuleTypes.INTRODUCTION,
    arity: 1,
    operator,
    ruleArguments,
  })),
)
  .expects('negation introduction rule');

const conjunctionIntroductionRule: Parjser<IntroductionRule<2, '/\\'>> = pipe(
  conjunctionOperator,
  followedBy(keyword('with')),
  andThen(twoRuleArguments),
  map(([operator, ruleArguments]): IntroductionRule<2, '/\\'> => ({
    type: RuleTypes.INTRODUCTION,
    arity: 2,
    operator,
    ruleArguments,
  })),
)
  .expects('conjunction introduction rule');

const disjunctionIntroductionRule: Parjser<IntroductionRule<2, '\\/'>> = pipe(
  disjunctionOperator,
  followedBy(keyword('with')),
  andThen(oneRuleArgument),
  map(([operator, ruleArguments]): IntroductionRule<2, '\\/'> => ({
    type: RuleTypes.INTRODUCTION,
    arity: 2,
    operator,
    ruleArguments,
  })),
)
  .expects('disjunction introduction rule');

const implicationIntroductionRule: Parjser<IntroductionRule<2, '->'>> = pipe(
  implicationOperator,
  followedBy(keyword('with')),
  andThen(twoRuleArguments),
  map(([operator, ruleArguments]): IntroductionRule<2, '->'> => ({
    type: RuleTypes.INTRODUCTION,
    arity: 2,
    operator,
    ruleArguments,
  })),
)
  .expects('implication introduction rule');

const introductionRule: Parjser<IntroductionRules> = pipe(
  keyword('introduce'),
  butThen(negationIntroductionRule
    .pipe(
      or(
        conjunctionIntroductionRule,
        disjunctionIntroductionRule,
        implicationIntroductionRule,
      ),
    )),
);

const negationEliminationRule: Parjser<EliminationRule<1, '~'>> = pipe(
  negationOperator,
  followedBy(keyword('with')),
  andThen(twoRuleArguments),
  map(([operator, ruleArguments]): EliminationRule<1, '~'> => ({
    type: RuleTypes.ELIMINATION,
    arity: 1,
    operator,
    ruleArguments,
  })),
)
  .expects('negation elimination rule');

const conjunctionEliminationRule: Parjser<EliminationRule<2, '/\\'>> = pipe(
  conjunctionOperator,
  followedBy(keyword('with')),
  andThen(oneRuleArgument),
  map(([operator, ruleArguments]): EliminationRule<2, '/\\'> => ({
    type: RuleTypes.ELIMINATION,
    arity: 2,
    operator,
    ruleArguments,
  })),
)
  .expects('conjunction elimination rule');

const disjunctionEliminationRule: Parjser<EliminationRule<2, '\\/'>> = pipe(
  disjunctionOperator,
  followedBy(keyword('with')),
  andThen(threeRuleArguments),
  map(([operator, ruleArguments]): EliminationRule<2, '\\/'> => ({
    type: RuleTypes.ELIMINATION,
    arity: 2,
    operator,
    ruleArguments,
  })),
)
  .expects('disjunction elimination rule');

const implicationEliminationRule: Parjser<EliminationRule<2, '->'>> = pipe(
  implicationOperator,
  followedBy(keyword('with')),
  andThen(twoRuleArguments),
  map(([operator, ruleArguments]): EliminationRule<2, '->'> => ({
    type: RuleTypes.ELIMINATION,
    arity: 2,
    operator,
    ruleArguments,
  })),
)
  .expects('implication elimination rule');

const eliminationRule: Parjser<EliminationRules> = pipe(
  keyword('eliminate'),
  butThen(negationEliminationRule
    .pipe(
      or(
        conjunctionEliminationRule,
        disjunctionEliminationRule,
        implicationEliminationRule,
      ),
    )),
);

export const rule: Parjser<Rule> = pipe(
  premiseRule,
  or(
    introductionRule,
    eliminationRule,
  ),
);

export const proofline: Parjser<ProofLine> = pipe(
  expression,
  followedBy(symbol("|")),
  andThen(rule),
  followedBy(newline()),
  map(([expr, rule]): ProofLine => ({ expr, rule })),
);

export const proof: Parjser<Proof> = pipe(
  whitespace(),
  butThen(proofline),
  many(),
  between(whitespace(), whitespace()),
);
