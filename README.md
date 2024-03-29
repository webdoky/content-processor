# Обробник вмісту проекту webdoky.org

Тут міститься вся логіка перед- і постобробки статей webdoky.org.

Цей пакунок призначений не для використання окремим продуктом, а для вміщення всієї логіки, яка стосується обробки вмісту, окремо від презентаційної логіки самого застосунку. Звісно, для забезпечення потреб розробки, його можна запустити окремо (зазвичай це корисно для швидкого тестування макросів).

## Початок роботи

1. Склонуйте цей репозиторій (разом з підмодулями) у будь-яке зручне місце:

    ```sh
    git clone --recurse-submodules git@github.com:webdoky/content-processor.git
    ```

2. Перейдіть всередину і встановіть необхідні залежності:

    ```sh
    yarn
    ```

    > Якщо ця команда викинула помилку — впевніться, що у вас встановлено NodeJs, NPM та Yarn

3. Зберіть проект (під час первинного розгортання це необов'язково, адже ця команда має автоматично виконатися згідно з гуком `postinstall`):

    ```sh
    yarn build
    ```

4. Запустіть проект:

    ```sh
    yarn start
    ```

В код проекта вже зашита певна усталена конфігурація, достатня для того, щоб запустити логіку і опрацювати нею весь масив статей так, як це відбувається під час збирання застосунка.

Типовий процес розробки складається з таких кроків:

1. Внесення змін до логіки.

2. Запуск команди `yarn build` для компіляції TS-коду в JS.

3. Запуск команди `yarn start` для прогону логіки.

## Структура файлів репозиторію

- `./src` — вихідні файли пакунка
- `./external` — підмодулі з текстовим вмістом
- `./cache` — результат роботи пакунка: оброблений і підготовлений вміст, а також необхідні для його коректного відображення метадані. Все оформлено у JSON-файли, у структуру, яка повторює структуру вихідного вмісту.
- `./build`, `./dist` — результати компіляції та збирання проекта, призначені для різних споживачів.

## Архітектура

- [`Registry`](src/registry) — основний блок логіки. Зчитує статті, збирає їх в реєстр, і обробляє (деякі блоки статей потребують доступу до інших статей). Поряд також знаходяться утиліти для роботи з синтаксичним деревом документів.
- [`runner`](src/runner) — обгортка для організації запуску основної логіки та її вводу і виводу. Відповідає за керування реєстром, передачу реєстрові посилань на файли статей, отримання від реєстру вже оброблених статей, і складання цих статей у кеш.
- [`components`](src/components) — абстраговані значення, які використовуються всередині означених перетворень, проте мають стосунок радше до презентаційного застосунку, аніж до самої логіки перетворень.
- [`_starter.ts`](src/_starter.ts) — обгортка для локального запуску пакунку.
