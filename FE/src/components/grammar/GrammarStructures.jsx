function isVariantStructure(structure) {
  return /^(?:na(?:[だなで]|$)|N(?:[のだにで]|$))/.test(structure)
    || /\/na(?:\/|$)/.test(structure)
    || /\/N(?:[(/]|$)/.test(structure);
}

function isFormStructure(structure) {
  return /^(?:V|A|na|N)(?:[ぁ-んァ-ヶ一-龯々ー(/＋+]|$)/.test(structure);
}

function isGenericForm(structure) {
  return structure === 'N' || /[/普〈]/.test(structure);
}

function getBracketGroup(structures) {
  if (structures.length < 3) return null;

  if (isGenericForm(structures[0])) {
    const lastVariantIndex = structures.reduce(
      (lastIndex, structure, index) => (index > 0 && isVariantStructure(structure) ? index : lastIndex),
      -1,
    );
    if (lastVariantIndex >= 2) {
      return {
        base: structures[0],
        variants: structures.slice(1, lastVariantIndex + 1),
        suffixes: structures.slice(lastVariantIndex + 1),
      };
    }
  }

  const firstSuffixIndex = structures.findIndex((structure, index) => index > 0 && !isFormStructure(structure));
  const formVariants = firstSuffixIndex === -1 ? structures : structures.slice(0, firstSuffixIndex);
  if (formVariants.length < 2) return null;

  return {
    base: '',
    variants: formVariants,
    suffixes: firstSuffixIndex === -1 ? [] : structures.slice(firstSuffixIndex),
  };
}

function StructureRow({ children, className = '' }) {
  return <div className={`grammar-structure-row leading-6 ${className}`}>{children}</div>;
}

export default function GrammarStructures({ structures = [] }) {
  const bracketGroup = getBracketGroup(structures);

  if (!bracketGroup) {
    return structures.map((structure) => (
      <li key={structure} className="grammar-structure-row rounded-sm bg-slate-800/60 px-3 py-2.5 leading-6">
        {structure}
      </li>
    ));
  }

  return (
    <li className="grammar-structure-formula rounded-sm bg-slate-800/60 px-3 py-2.5">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        {bracketGroup.base && <StructureRow className="shrink-0">{bracketGroup.base}</StructureRow>}
        <span className="inline-flex items-stretch gap-1">
          <span aria-hidden="true" className="flex items-center text-2xl font-light leading-none text-accent-quizlet">[</span>
          <span className="flex flex-col gap-1">
            {bracketGroup.variants.map((structure) => (
              <StructureRow key={structure} className="grammar-structure-variant px-1">
                {structure}
              </StructureRow>
            ))}
          </span>
        </span>
        <span className="flex flex-col gap-1">
          {bracketGroup.suffixes.map((structure) => (
            <StructureRow key={structure} className="grammar-structure-suffix px-1">
              {structure}
            </StructureRow>
          ))}
        </span>
      </div>
    </li>
  );
}
