import test from 'ava';
import { mdParseAndProcess } from './contentProcessors';

const sampleContent = `Something {{JSxRef("Operators/yield", "yield")}} in between`;

// const sampleContent = `
// - {{JSxRef("Operators/yield", "yield")}} (виробити) — Призупинити й відновити виконання функції-генератора.
// - {{JSxRef("Operators/yield*", "yield*")}} — Делегувати виконання іншій функції-генератору чи ітерованому об'єкту.
// `;

test('mdProcessor should recognize macros', async (t) => {
  t.timeout(200);

  console.log('start parsing');
  const tree = mdParseAndProcess.parse(sampleContent);
  console.log(
    'end parsing',
    tree.children,
    tree.children.map((entry: any) => entry.children),
  );

  t.assert(t.truthy(tree), 'There should be at least something');
});
