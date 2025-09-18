import { Parjser, int, regexp, result, space, string } from 'parjs';
import { between, later, manySepBy, map, maybe, or, pipe, qthen, then, thenq } from 'parjs/combinators';

import { EliminationRule, EliminationRules, Expression, ExpressionTypes, IntroductionRule, IntroductionRules, NaryExpression, NaryOperator, PremiseRule, PropositionExpression, ReferenceExpression, Rule, RuleArgument, RuleTypes } from './types';

const lexToken = <T>() => thenq<T>(space());

const symbol = <const T extends string>(s: T): Parjser<T> =>
  string<T>(s).pipe(lexToken());

const keyword = <const T extends string>(s: T): Parjser<T> =>
  string<T>(s).pipe(lexToken());

const lineNumber = int({ allowSign: false }).pipe(lexToken());

const negationOperator = symbol('~');
const conjunctionOperator = symbol('/\\');
const disjunctionOperator = symbol('\\/');
const implicationOperator = symbol('->');

const propositionIdentifier = regexp(/[a-zA-Z_'][a-zA-Z0-9_']*/).pipe(map(r => r[0]))

const unaryOperator: Parjser<NaryOperator<1>> = negationOperator
  .expects('unary operator');

const binaryOperator: Parjser<NaryOperator<2>> = pipe(
  conjunctionOperator,
  or(
    disjunctionOperator,
    implicationOperator,
  ),
)
  .expects('binary operators');

const propositionExpression = pipe(
  propositionIdentifier,
  map((identifier): PropositionExpression => ({
    type: ExpressionTypes.PROPOSITION,
    identifier,
  })),
  lexToken(),
)
  .expects('proposition');

const referenceExpression = pipe(
  lineNumber,
  map((lineNumber): ReferenceExpression => ({
    type: ExpressionTypes.REFERENCE,
    lineNumber,
  })),
  lexToken(),
)
  .expects('line reference');

const atomicExpression = later<Expression>();

const unaryExpression = pipe(
  pipe(
    unaryOperator,
    then(atomicExpression),
    map(([operator, operand]): NaryExpression<1> => ({
      type: ExpressionTypes.NARY,
      arity: 1,
      operator,
      operands: [operand],
    })),
  ),
  or(atomicExpression),
  lexToken(),
)

const binaryExpression = pipe(
  pipe(
    unaryExpression,
    then(
      binaryOperator,
      unaryExpression,
    ),
    map(([operand0, operator, operand1]): NaryExpression<2> => ({
      type: ExpressionTypes.NARY,
      arity: 2,
      operator,
      operands: [operand0, operand1],
    })),
  ),
  or(unaryExpression),
  lexToken(),
);

export const expression: Parjser<Expression> = pipe(
  binaryExpression,
  lexToken(),
);

atomicExpression.init(
  pipe(
    propositionExpression,
    or(
      referenceExpression,
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
  qthen(result<PremiseRule>({ type: RuleTypes.PREMISE })),
  lexToken(),
)
  .expects('premise rule');

const negationIntroductionRule: Parjser<IntroductionRule<1, '~'>> = pipe(
  keyword('introduce'),
  qthen(negationOperator),
  then(oneRuleArgument),
  map(([operator, ruleArguments]): IntroductionRule<1, '~'> => ({
    type: RuleTypes.INTRODUCTION,
    arity: 1,
    operator,
    ruleArguments,
  })),
  lexToken()
)
  .expects('negation introduction rule');

const conjunctionIntroductionRule: Parjser<IntroductionRule<2, '/\\'>> = pipe(
  keyword('introduce'),
  qthen(conjunctionOperator),
  then(twoRuleArguments),
  map(([operator, ruleArguments]): IntroductionRule<2, '/\\'> => ({
    type: RuleTypes.INTRODUCTION,
    arity: 2,
    operator,
    ruleArguments,
  })),
  lexToken()
)
  .expects('conjunction introduction rule');

const disjunctionIntroductionRule: Parjser<IntroductionRule<2, '\\/'>> = pipe(
  keyword('introduce'),
  qthen(disjunctionOperator),
  then(oneRuleArgument),
  map(([operator, ruleArguments]): IntroductionRule<2, '\\/'> => ({
    type: RuleTypes.INTRODUCTION,
    arity: 2,
    operator,
    ruleArguments,
  })),
  lexToken()
)
  .expects('disjunction introduction rule');

const implicationIntroductionRule: Parjser<IntroductionRule<2, '->'>> = pipe(
  keyword('introduce'),
  qthen(implicationOperator),
  then(twoRuleArguments),
  map(([operator, ruleArguments]): IntroductionRule<2, '->'> => ({
    type: RuleTypes.INTRODUCTION,
    arity: 2,
    operator,
    ruleArguments,
  })),
  lexToken()
)
  .expects('implication introduction rule');

const introductionRule: Parjser<IntroductionRules> = pipe(
  negationIntroductionRule,
  or(
    conjunctionIntroductionRule,
    disjunctionIntroductionRule,
    implicationIntroductionRule,
  ),
  lexToken(),
);

const negationEliminationRule: Parjser<EliminationRule<1, '~'>> = pipe(
  keyword('eliminate'),
  qthen(negationOperator),
  then(twoRuleArguments),
  map(([operator, ruleArguments]): EliminationRule<1, '~'> => ({
    type: RuleTypes.ELIMINATION,
    arity: 1,
    operator,
    ruleArguments,
  })),
  lexToken()
)
  .expects('negation elimination rule');

const conjunctionEliminationRule: Parjser<EliminationRule<2, '/\\'>> = pipe(
  keyword('eliminate'),
  qthen(conjunctionOperator),
  then(oneRuleArgument),
  map(([operator, ruleArguments]): EliminationRule<2, '/\\'> => ({
    type: RuleTypes.ELIMINATION,
    arity: 2,
    operator,
    ruleArguments,
  })),
  lexToken()
)
  .expects('conjunction elimination rule');

const disjunctionEliminationRule: Parjser<EliminationRule<2, '\\/'>> = pipe(
  keyword('eliminate'),
  qthen(disjunctionOperator),
  then(threeRuleArguments),
  map(([operator, ruleArguments]): EliminationRule<2, '\\/'> => ({
    type: RuleTypes.ELIMINATION,
    arity: 2,
    operator,
    ruleArguments,
  })),
  lexToken()
)
  .expects('disjunction elimination rule');

const implicationEliminationRule: Parjser<EliminationRule<2, '->'>> = pipe(
  keyword('eliminate'),
  qthen(implicationOperator),
  then(twoRuleArguments),
  map(([operator, ruleArguments]): EliminationRule<2, '->'> => ({
    type: RuleTypes.ELIMINATION,
    arity: 2,
    operator,
    ruleArguments,
  })),
  lexToken()
)
  .expects('implication elimination rule');

const eliminationRule: Parjser<EliminationRules> = pipe(
  negationEliminationRule,
  or(
    conjunctionEliminationRule,
    disjunctionEliminationRule,
    implicationEliminationRule,
  ),
  lexToken(),
);

export const rule: Parjser<Rule> = pipe(
  premiseRule,
  or(
    introductionRule,
    eliminationRule,
  ),
  lexToken(),
);
