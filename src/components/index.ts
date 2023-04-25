type WdBaseComponent = Partial<HTMLElement>;

export const BrokenNavLink: WdBaseComponent = {
  className: 'wd-nav-link--not-translated',
  title:
    'Це посилання веде на сторінку, якої ще не існує. Ймовірно, ми її ще не переклали.',
};

export const ExpungedMacroInsert: WdBaseComponent = {
  className: 'wd-expunged',
  title: 'Реалізація цього макроса іще не готова.',
  tagName: 'span',
};
