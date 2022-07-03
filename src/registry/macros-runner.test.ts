import test from 'ava';
import { runMacros } from './macros-runner';

const parsedMdToHtmlSample = `<p><strong>JavaScript</strong> (<strong>JS</strong>) — це невибаглива до ресурсів мова програмування з {{Glossary("First-class Function", "функціями першого класу")}}, код якої інтерпретується, або компілюється <a href="https://uk.wikipedia.org/wiki/JIT-%D0%BA%D0%BE%D0%BC%D0%BF%D1%96%D0%BB%D1%8F%D1%86%D1%96%D1%8F">"на льоту"</a>. Хоча JavaScript насамперед відома як скриптова мова для вебсторінок, вона також використовується у <a href="https://uk.wikipedia.org/wiki/JavaScript#%D0%97%D0%B0%D1%81%D1%82%D0%BE%D1%81%D1%83%D0%B2%D0%B0%D0%BD%D0%BD%D1%8F">багатьох не браузерних середовищах</a>, як от: {{Glossary("Node.js")}}, <a href="https://couchdb.apache.org/">Apache CouchDB</a> та <a href="https://opensource.adobe.com/dc-acrobat-sdk-docs/acrobatsdk/">Adobe Acrobat</a>. JavaScript — це {{Glossary("Prototype-based programming", "прототипна")}}, однопотокова динамічна мова, що має декілька парадигм та підтримує об'єктноорієнтований, та декларативні (зокрема функційне програмування) стилі. Більше <a href="/uk/docs/Web/JavaScript/About_JavaScript">про JavaScript</a>.</p>
<blockquote>
<p><strong>Callout:</strong> <strong>Хочете стати фронтенд розробником?</strong></p>
<p>Ми зібрали докупи курс, що містить всю необхідну інформацію, яка знадобиться вам
для роботи над досягненням цієї мети</p>
<p><a href="/uk/docs/Learn/Front-end_web_developer"><strong>Почати</strong></a></p>
</blockquote>
<h2>Посібники</h2>
<p>Вчіться програмувати на JavaScript за допомогою наших настанов та посібників.</p>
<h3>Для абсолютних початківців</h3>
<p>Зверніться до <a href="/uk/docs/Learn/JavaScript">тематики "JavaScript" у нашому навчальному розділі</a>, якщо ви маєте бажання вчити JavaScript, але не маєте попереднього досвіду роботи з JavaScript чи програмування загалом. Повний список модулів, доступних там, виглядає так:</p>`;

const expandedMacrosSample = `<p><strong>JavaScript</strong> (<strong>JS</strong>) — це невибаглива до ресурсів мова програмування з <a href="/uk/docs/Glossary/First-class_Function">функціями першого класу</a>, код якої інтерпретується, або компілюється <a href="https://uk.wikipedia.org/wiki/JIT-%D0%BA%D0%BE%D0%BC%D0%BF%D1%96%D0%BB%D1%8F%D1%86%D1%96%D1%8F">"на льоту"</a>. Хоча JavaScript насамперед відома як скриптова мова для вебсторінок, вона також використовується у <a href="https://uk.wikipedia.org/wiki/JavaScript#%D0%97%D0%B0%D1%81%D1%82%D0%BE%D1%81%D1%83%D0%B2%D0%B0%D0%BD%D0%BD%D1%8F">багатьох не браузерних середовищах</a>, як от: <a href="/uk/docs/Glossary/Node.js">Node.js</a>, <a href="https://couchdb.apache.org/">Apache CouchDB</a> та <a href="https://opensource.adobe.com/dc-acrobat-sdk-docs/acrobatsdk/">Adobe Acrobat</a>. JavaScript — це <a href="/uk/docs/Glossary/Prototype-based_programming">прототипна</a>, однопотокова динамічна мова, що має декілька парадигм та підтримує об'єктноорієнтований, та декларативні (зокрема функційне програмування) стилі. Більше <a href="/uk/docs/Web/JavaScript/About_JavaScript">про JavaScript</a>.</p>
<blockquote>
<p><strong>Callout:</strong> <strong>Хочете стати фронтенд розробником?</strong></p>
<p>Ми зібрали докупи курс, що містить всю необхідну інформацію, яка знадобиться вам
для роботи над досягненням цієї мети</p>
<p><a href="/uk/docs/Learn/Front-end_web_developer"><strong>Почати</strong></a></p>
</blockquote>
<h2>Посібники</h2>
<p>Вчіться програмувати на JavaScript за допомогою наших настанов та посібників.</p>
<h3>Для абсолютних початківців</h3>
<p>Зверніться до <a href="/uk/docs/Learn/JavaScript">тематики "JavaScript" у нашому навчальному розділі</a>, якщо ви маєте бажання вчити JavaScript, але не маєте попереднього досвіду роботи з JavaScript чи програмування загалом. Повний список модулів, доступних там, виглядає так:</p>`;

const rawMarkdownContent =
  '**JavaScript** (**JS**) &mdash; це невибаглива до ресурсів мова програмування з {{Glossary("First-class Function", "функціями першого класу")}}, код якої інтерпретується, або компілюється ["на льоту"](https://uk.wikipedia.org/wiki/JIT-%D0%BA%D0%BE%D0%BC%D0%BF%D1%96%D0%BB%D1%8F%D1%86%D1%96%D1%8F). Хоча JavaScript насамперед відома як скриптова мова для вебсторінок, вона також використовується у [багатьох не браузерних середовищах](https://uk.wikipedia.org/wiki/JavaScript#%D0%97%D0%B0%D1%81%D1%82%D0%BE%D1%81%D1%83%D0%B2%D0%B0%D0%BD%D0%BD%D1%8F), як от: {{Glossary("Node.js")}}, [Apache CouchDB](https://couchdb.apache.org/) та [Adobe Acrobat](https://opensource.adobe.com/dc-acrobat-sdk-docs/acrobatsdk/). JavaScript — це {{Glossary("Prototype-based programming", "прототипна")}}, однопотокова динамічна мова, що має декілька парадигм та підтримує об\'єктноорієнтований, та декларативні (зокрема функційне програмування) стилі. Більше [про JavaScript](/uk/docs/Web/JavaScript/About_JavaScript).';
const processedRawContentSample =
  '**JavaScript** (**JS**) &mdash; це невибаглива до ресурсів мова програмування з <a href="/uk/docs/Glossary/First-class_Function">функціями першого класу</a>, код якої інтерпретується, або компілюється ["на льоту"](https://uk.wikipedia.org/wiki/JIT-%D0%BA%D0%BE%D0%BC%D0%BF%D1%96%D0%BB%D1%8F%D1%86%D1%96%D1%8F). Хоча JavaScript насамперед відома як скриптова мова для вебсторінок, вона також використовується у [багатьох не браузерних середовищах](https://uk.wikipedia.org/wiki/JavaScript#%D0%97%D0%B0%D1%81%D1%82%D0%BE%D1%81%D1%83%D0%B2%D0%B0%D0%BD%D0%BD%D1%8F), як от: <a href="/uk/docs/Glossary/Node.js">Node.js</a>, [Apache CouchDB](https://couchdb.apache.org/) та [Adobe Acrobat](https://opensource.adobe.com/dc-acrobat-sdk-docs/acrobatsdk/). JavaScript — це <a href="/uk/docs/Glossary/Prototype-based_programming">прототипна</a>, однопотокова динамічна мова, що має декілька парадигм та підтримує об\'єктноорієнтований, та декларативні (зокрема функційне програмування) стилі. Більше [про JavaScript](/uk/docs/Web/JavaScript/About_JavaScript).';

test('Macros runner should output valid html', async (t) => {
  const { content: processedRawContent } = runMacros(rawMarkdownContent, {
    targetLocale: 'uk',
    registry: {},
    path: 'testPath',
    slug: 'testSlug',
  });

  t.assert(
    t.deepEqual(processedRawContentSample, processedRawContent),
    'Macros should correctly work with raw markdown',
  );

  const { content: processedContent } = runMacros(parsedMdToHtmlSample, {
    targetLocale: 'uk',
    registry: {},
    path: 'testPath',
    slug: 'testSlug',
  });

  t.assert(
    t.deepEqual(expandedMacrosSample, processedContent),
    'Macros should correctly work with HTML content (at least in the descriptions)',
  );
});
