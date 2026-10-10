# Quest Platform — MVP

## Context

Платформа для проведения игрового квеста. Команды ходят по корпусам и аудиториям, в каждой аудитории — QR-код (пока 8-символьный код), открывающий вопрос-мини-игру. Логика мини-игр на фронтенде; выдача вопросов, проверка ответов, штрафы, таймер и рейтинг — на бэкенде. Проект с нуля, директория пустая. Соседние проекты не используем.

Подтверждённые требования (из интервью):

- **Команда** — основная сущность. Вход: название команды + пароль (заранее, не привязан к старту квеста). JWT.
- **Вопрос — единственная сущность содержания (решение 2026-09-23).** Все вопросы всех типов лежат в одной коллекции `questions`; вопрос несёт и задание, и аудиторию с корпусом. Сущностей «игра» и «аудитория» нет, ротации вариантов нет. Код на двери живёт отдельно (`bindings`) и говорит только про место.
- **Последовательность** игр у команды задана заранее. К следующему шагу можно перейти только после ответа на текущий и ввода верного кода следующей игры.
- **Вариант** выбирается динамически в момент ввода верного кода: по очереди (round-robin) по коллекции, счётчик общий для всех команд.
- **Вопросы не меняются** во время квеста. Состояние пары команда-вопрос — в общей коллекции `questionStates`. Состояние команды — в документе команды.
- **Проверка ответа на бэкенде.** Правильный ответ на фронт не уходит. Попытки не ограничены, за каждую неверную — штраф по времени, размер зависит от вопроса (в варианте). Все попытки записываются.
- **Подсказки:** текстовые, в варианте их произвольное число (решение 2026-09-15: правило «ровно 3» снято), у каждой свой штраф в секундах, берутся строго по порядку, взятые остаются видны и записываются.
- **Таймер:** от открытия первого вопроса до ответа на последний, минус паузы между корпусами, плюс штрафы. Переходы между аудиториями внутри корпуса считаются. Пауза между корпусами — от ответа на последний вопрос корпуса A до ввода кода первого вопроса корпуса B. Корпус — enum slug-ов, у игры есть корпус.
- **Рейтинг:** API-эндпоинт под `/api/admin`; в web-админке он виден как список команд.
- **Админка** появилась 2026-09-17 (см. ниже); стартовые данные заводятся скриптами загрузки (`npm run load-questions`, `npm run load-teams`). Служебные эндпоинты (рейтинг, сброс команды) — под `/api/admin/*` за статическим токеном.
- **MVP: один тип мини-игры** — текстовый ответ. Каркас позволяет добавлять типы (компонент на фронте + серверный чекер + схема варианта).

Решения, подтверждённые на грилле (2026-09-13):
- **Интерфейс команды.** Бегущий таймер, штрафы одной суммой рядом; по клику на сумму раскрывается история штрафов (аудитория, событие «подсказка N» / «неверный ответ», время события, секунды, итог). Сам текст неверного ответа не показывается. Экран финиша: финальное время и штрафы, без места в рейтинге.
- **Маршрут на экране.** Карточки, соединённые линией, в состоянии «открыта» / «заблокирована». Карточка `QUESTION`: номер(а) аудиторий (`roomNumber`), корпус не пишется. Карточка `LOCATION_TRANSITION`: название корпуса назначения, видна и для будущих шагов; на активном шаге подпись «время остановлено». `ROOM_TRANSITION` карточки не имеет — только линия, следующая карточка вопроса подсвечена как «введите код». Данные берутся из `sequence` и `questions`.
- **Сессии.** Имя команды при логине сравнивается строго. Одна активная сессия на команду: `sessionId` в документе команды и в JWT; новый логин выбивает остальные устройства (401 `auth__session_replaced`, на экране логина сообщение «вход выполнен на другом устройстве»). Выход — переход на `/logout` (кнопки в интерфейсе команды нет), он очищает `sessionId`. JWT 24 часа.
- **Admin.** Всё непубличное — под `/api/admin/*`, закрыто статическим токеном из env (`ADMIN_TOKEN`) в заголовке `X-Admin-Token`. В MVP: рейтинг и сброс состояния команды.
- **Код игры.** 8 символов `[a-zA-Z0-9]`, сравнение с учётом регистра (потом заменится QR).
- **Нормализация ответа.** Только trim, схлопывание пробелов, нижний регистр.
- **Корпуса.** `lomo` Ломоносова, `cronva` Кронверкский, `birja` Биржа, `chaika` Чайка, `griva` Гривцова. Enum + словарь названий в `shared`.
- Повтор игры в маршруте — невозможная ситуация, не обрабатывается. Неверные коды только логируются на сервере.
- Тай-брейк рейтинга при равном времени — `finishedAt`, затем имя. `acceptedAnswers: string[]` — несколько написаний ответа.
- Без преждевременных оптимизаций: никаких денормализаций и кэшей, всё считается из первичных данных.
- Инструментарий: актуальные мажоры библиотек, ESLint flat config + Prettier, git с коммитом после каждого пункта реализации, только dev-окружение.

## Стек (зафиксирован)

- npm workspaces: `packages/api`, `packages/web`, `packages/shared`
- Актуальные мажоры на момент старта (проверено 2026-09-13): Fastify 5.12, Mongoose 9.10, React 19.3, Vite 8.3, React Router 8.3, TanStack Query 5.102, `@fastify/swagger` 9.8, `@fastify/type-provider-typebox` 5.2 (6.x не существует; 5.x — линия под Fastify 5), Mongo 8 в образе. API библиотек сверять по документации (Context7) перед написанием кода.
- API: Node 24 LTS (образ `node:24-alpine`), TypeScript, Fastify + TypeBox (схемы → Swagger), `@fastify/swagger` + `@fastify/swagger-ui`, Mongoose, `@fastify/jwt`, `bcryptjs`, `@fastify/cors`, Vitest
- Web: React, Vite, React Router, TanStack Query, SCSS-модули (`sass`)
- Линтеры: ESLint flat config в корне — `typescript-eslint` (typed), `eslint-plugin-react`, `eslint-plugin-react-hooks`, `eslint-plugin-jsx-a11y`, `@tanstack/eslint-plugin-query`, `eslint-plugin-import-x`; Prettier через `eslint-config-prettier`. Без husky: скрипты `lint`, `format`, `typecheck`.
- Docker: `docker-compose.yml` с `mongo`, `api` (tsx watch), `web` (vite dev), bind-mount проекта для hot reload. Прод-сборки в MVP нет.
- Git: `git init` в начале, коммит после каждого пункта порядка реализации.

## Структура репозитория

```
quest_platform/
  package.json                 # workspaces, root scripts: dev, load-questions, load-teams, test, typecheck, lint, format
  tsconfig.base.json
  eslint.config.js, .prettierrc
  Dockerfile.dev               # общий для api и web
  docker-compose.yml
  .dockerignore, .env.example  # JWT_SECRET, ADMIN_TOKEN, API_HOST_PORT, WEB_HOST_PORT, MONGO_HOST_PORT
  README.md                    # запуск, загрузка данных, подводные камни Docker
  packages/
    shared/                    # без сборки: "main": "./src/index.ts"
      src/enums.ts             # GameType (вкл. BLITZ), Location, StepKind, QuestPhase, TeamStatus, TimeAdjustmentType, StepState
      src/errors/{common,auth,quest,team}.ts # константы: код + сообщение вместе
      src/errors/index.ts                    # ApiErrorCode (из констант), API_ERROR_CODES
      src/locations.ts         # LocationTitles: Record<Location, string>
      src/types/{roomRef,teamStep}.ts  # RoomRef, шаги маршрута
      src/dto/{auth,quest,admin,error}.ts    # TypeBox-схемы + Static<> типы
      src/games/basicGame.ts  # формы basicGame: content { prompt }, answer { text }, state { draft }, админский вопрос
      src/index.ts
    api/
      src/main.ts, app.ts
      src/config/{env,utils}.ts         # переменные окружения как константы (читалки в utils.ts) (MONGO_URI, JWT_SECRET, ADMIN_TOKEN, API_PORT, API_HOST, JWT_EXPIRES_IN, MOCK_CODE); читаются при импорте
      src/utils/errors/{ApiError,CommonErrors,AuthErrors,QuestErrors,TeamErrors}.ts
      src/db/connect.ts
      src/models/{Team,Question,questionFields,Binding,QuestionState}.ts   # сырой документ — существительное (Question, Team), гидратированный — <Сущность>Document
                                        # questionFields — базовые поля вопроса без импорта реестра (разрыв цикла)
      src/games/types.ts                # GameTypeDefinition { gameType, extraFields?, toPublicContent?, checkAnswer?, toAdminContent?, onStateUpdate? }, GameQuestion
      src/games/registry.ts             # Record<GameType, GameTypeDefinition> — типы игр
      src/games/{shazam,encyclopedia,televisions,light,googleForms,socialNetworks,stickers,yagodnoe}/index.ts  # типы на умолчаниях core: { gameType }
      src/games/history/index.ts                         # только свой toPublicContent
      src/games/blitz/{index,schema}.ts                  # тип со своими полями вопроса
      src/games/minesweeper/{index,schema}.ts, utils/{generateMinesweeperField,toMinesweeperQuestion}.ts  # поле генерируется при загрузке
      src/games/soundButtons/{index,schema}.ts, utils/toSoundButtonsQuestion.ts  # ответ собирается из последовательности кнопок
      src/routes/{auth,quest,admin,health}.ts              # core: progress, enter-code, question, hint, state, answer
      src/plugins/{authenticate,adminAuth,routeSchemaDefaults}.ts   # защита и общие tags/security навешиваются на плагин роутов, не на каждый роут
      src/services/{auth,quest,openQuestion,question,binding,startupValidation,rating,admin}/
                                        # сервисы: читают и пишут базу, оркестрируют; файл на экспортируемую функцию API (помощники внутри), types.ts на общие типы
      src/utils/{progress,timer,timeAdjustment,rating,sequence,team,question,errors}/
                                        # утилиты по сущностям: чистые функции над переданными объектами, без mongoose и без импортов из services (ESLint)
                                        # utils/question — ещё и умолчания вопроса: toGameQuestion, isAcceptedAnswer, normalizeAnswer, toBasic*Dto
      src/setup/{loadBindings,loadQuestions,loadTeams,runLoader,dropCollection,toTeamData}.ts, src/setup/{bindings,teams}.csv, src/setup/questions/<gameType>.json   # загрузка данных: отдельно от приложения, запускается руками
      test/{timer,sequenceValidator,normalize,rating,timeAdjustment,progress,questService}.test.ts
      test/basicGame.test.ts            # интеграционные тесты вопроса, подсказок, состояния и ответа
      test/helpers/testDb.ts            # mongodb-memory-server для интеграционных тестов
    web/
      Dockerfile.dev, vite.config.ts    # host: true, proxy /api -> http://api:3000
      src/main.tsx, App.tsx
      src/api/{client,queries}.ts       # fetch + JWT, ApiErrorDto -> ApiClientError, хуки
      src/auth/{AuthContext,RequireAuth}.tsx
      src/pages/{LoginPage,QuestPage}.tsx
      src/admin/{AdminAuthContext,AdminLayout,RequireAdmin}.tsx, queries.ts, labels.ts   # админка: токен, каркас, запросы
      src/admin/pages/{AdminLoginPage,AdminTeamsPage,AdminTeamPage,AdminRoutesPage,AdminQuestionsPage,AdminBindingsPage}.tsx
      src/admin/components/{CreateTeamForm,TeamCredentialsForm,RouteForm,RouteEditor,StepsMap,TimeAdjustmentsPanel,BindingForm}.tsx
      src/admin/utils/toRouteSegments.ts                # маршрут команды как таблица корпусов
      src/components/{Timer,TimeAdjustmentSummary,TimeAdjustmentHistory,StepCards,CodeEntryForm,QuestionCard,FinishedCard,LogoutButton,ErrorBanner,Spinner}.tsx
      src/ui/                                           # UI-пак: токены, компоненты и истории Storybook (README рядом)
      src/games/registry.tsx, src/games/types.ts           # GameProps { question: OpenQuestionDto }
      src/games/basicGame/{BasicGameContent,BasicAttemptView,BasicAdminQuestions}.tsx, createBasicWebGameType.ts  # web-часть текстовых типов
      src/styles/_variables.scss, global.scss, *.module.scss рядом с компонентами
```

## Модель данных (Mongo)

Принцип: никаких денормализаций и кэшей. Система маленькая, всё вычисляется из первичных данных на каждый запрос. Игра проходит в одной аудитории и владеет одной коллекцией вопросов, поэтому в ссылках используем имя игры `name` (оно же имя коллекции), а не id.

**teams**
- `name` (unique, сравнение строгое), `passwordHash`
- `sessionId?: string` — единственная активная сессия; выдаётся при логине, зашивается в JWT, очищается при выходе
- `sequence: TeamStep[]` — заранее заданная линейная машина состояний. Переходы между корпусами и играми — это отдельные шаги, а не вычисляемое состояние. `StepKind` (enum в `shared`):
  - `LOCATION_TRANSITION` — переход между корпусами, время стоит. Первый шаг маршрута всегда такой (команда ещё не начала). `options` — аудитория выхода из предыдущего корпуса, её скан закрывает последний вопрос; у первого шага её нет.
  - `ROOM_TRANSITION` — переход между аудиториями внутри корпуса, время идёт.
  - `QUESTION` — вопрос; `options` — аудитории допустимых вопросов (обычно одна; несколько, когда команда сама выбирает; все в одном корпусе).
  ```ts
  interface RoomTransitionStep     { kind: StepKind.ROOM_TRANSITION }
  interface LocationTransitionStep { kind: StepKind.LOCATION_TRANSITION; options?: RoomRef[] }
  interface QuestionStep           { kind: StepKind.QUESTION; options: RoomRef[] }
  type TeamStep = RoomTransitionStep | LocationTransitionStep | QuestionStep
  ```
  Пример: `LOCATION_TRANSITION → QUESTION → ROOM_TRANSITION → QUESTION → LOCATION_TRANSITION → QUESTION → … → QUESTION`.
- `currentStepIndex` — индекс текущего шага. Это и есть всё состояние команды: вид текущего шага говорит, ждём ли код (и стоит ли время) или открыт вопрос. `0` — не начали, `=== sequence.length` — закончили.
- Статус команды (`NOT_STARTED | IN_PROGRESS | FINISHED`) и `startedAt`/`finishedAt` не хранятся, выводятся из `currentStepIndex` и меток в `questionStates`.

**Валидация маршрута** (`utils/sequence/validateSequence.ts`, чистая функция; вызывается загрузчиком данных и при старте API для всех команд, при ошибке API не стартует):
1. Маршрут не пустой, первый шаг `LOCATION_TRANSITION`, последний — `QUESTION` либо `LOCATION_TRANSITION` со своей аудиторией (финиш).
2. Переходы и вопросы строго чередуются (нет двух переходов или двух вопросов подряд).
3. У каждого `QUESTION` непустые `options`, в каждой названной аудитории есть вопрос, все вопросы шага в одном корпусе.
4. `ROOM_TRANSITION` стоит между вопросами одного корпуса, `LOCATION_TRANSITION` — между вопросами разных корпусов (для первого шага проверки нет).
5. **Ответ — номер следующей аудитории (решение 2026-09-21, уточнено 2026-09-23).** Если у вопроса стоит флаг `answerIsNextRoom` и ответы известны заранее, каждый из них обязан быть номером **ближайшей аудитории маршрута** (`getNextRooms`): следующего вопроса или выхода из корпуса. Аудитория обязана быть в том же корпусе, что и сам вопрос, иначе команда шла бы в другой корпус с идущим временем.
6. **Вычисляемый ответ (решение 2026-09-23).** Если у вопроса стоит флаг `hasDynamicAnswer`, ближайшая аудитория маршрута обязана быть ровно одна: она и станет ответом. Ветвление после такого вопроса запрещено — непонятно, какую из аудиторий считать ответом. Валидатор остаётся чистой функцией и получает `SequenceQuestionLookup` — корпус, аудиторию и эти ответы по ключу аудитории (`toRoomKey`); собирает его сервис `readSequenceQuestions`.
7. **Выход из корпуса (решение 2026-09-23).** У `LOCATION_TRANSITION` тоже бывают `options` — аудитория без вопроса, скан кода которой закрывает последний вопрос корпуса и запускает паузу на дорогу. У первого шага маршрута её быть не может: закрывать нечего. Код такой аудитории приходит в общей таблице `setup/bindings.csv`.
8. **Финиш (решение 2026-09-23, уточнено 2026-09-24).** Последним шагом такой переход закрывает квест: ответив на последний вопрос, команда встаёт на него и завершает квест сканом финишной аудитории. Скан обрабатывает `enterCode` — за последним шагом вопросов нет, поэтому код сверяется с аудиториями самого перехода, и `currentStepIndex` становится равен длине маршрута. Время на финишном шаге уже стоит, дорога до двери в зачёт не идёт.

**questions** — единственная коллекция содержания (решение 2026-09-23, заменяет сущность игры). Вопрос это и задание, и место: сущностей «игра» и «аудитория» больше нет, вопросы всех типов лежат вместе, поля сверх базовых тип игры объявляет дискриминатором Mongoose по `gameType`.
- `rooms: RoomRef[]` — **имя вопроса** (решение 2026-09-23): аудитория (`location` плюс `roomNumber` вида `101`, `2-14`) опознаёт вопрос, маршруты команд ссылаются на вопросы аудиториями, отдельного `slug` нет. Аудиторий у вопроса несколько: одна и та же игра стоит в нескольких кабинетах слово в слово, а ответ даёт маршрут команды, поэтому вопрос описан один раз. Индекс `{ rooms.location, rooms.roomNumber }` не уникален: в аудитории бывает несколько вариантов вопроса. В коде пара — `RoomRef`, ключ словарей делает `toRoomKey` (`lomo/1216`)
- `gameType: GameType` — какая механика
- `html` и `data?` прямо в документе (задание), `acceptedAnswers: [{ html, data? }]` (клиенту не отдаются, кроме `shouldSendAnswer`; пусто у вопроса с вычисляемым ответом), `answerIsNextRoom: boolean`, `hasDynamicAnswer: boolean`, `shouldSendAnswer: boolean`, `waitsForExternalAnswer: boolean`, `teamSlugs: string[]`, `wrongAttemptPenaltySeconds`, `hints: [{ html, data?, penaltySeconds }]`
- **`shouldSendAnswer` (решение 2026-09-23)** — ответ уходит команде полем `answers` в `QuestionViewDto`: так работают игры, которые прячут его своей механикой (блиц — внутри викторины). У остальных `answers` пустой
- **`waitsForExternalAnswer` (решение 2026-09-26)** — ответ засчитывает не экран задания, а внешний механизм: кнопки в аудитории у sound buttons, открытая страница `/pub/confirm_video` у соцсетей. Флаг уходит команде в `QuestionViewDto` и включает долгое ожидание на фронте; тип игры про это ничего не знает
- **`teamSlugs: string[]` (решение 2026-09-26)** — команды, которым предназначен этот вариант; пусто значит «вариант общий». При вводе кода ядро берёт варианты своей команды, а общие — только если своих нет (`utils/question/pickTeamQuestions`, чистая функция, зовёт её `enterCode`). Так устроены энциклопедия (три текста на 72 команды) и Яндекс (свой ролик каждой). Что у команды есть свой вариант, проверяет `validateSequence` — ошибка `room X has no question variant for this team` видна при старте API, в админке и при правке маршрута; загрузчик ругается на `slug`, которых нет среди команд, и не даёт завести команде два варианта в одной аудитории. Когда ни своих, ни общих вариантов нет, ядро отдаёт чужой: ответ у вариантов один, и чужой текст лучше, чем аудитория без вопроса
- **Команда опознаётся `slug` (решение 2026-09-26, заменяет привязку по имени).** Имя команды меняется через админку, а данные на команду ссылаться должны навсегда, поэтому у команды есть `slug` из `teams.csv` (`team_thwji`, уникален, обязателен). По нему ищутся варианты вопросов, по нему валидируется маршрут; имена остаются только для людей — организатор видит их в админке (`getAdminQuestions` переводит `slug` в имена), команда — на экране входа. Команде, заведённой руками в админке, `createTeam` выдаёт случайный `team_xxxxx`: вариантов на неё всё равно нет
- **`externalAnswerCode: number | null` (решение 2026-09-26)** — номер, которым механизм называет себя платформе: у sound buttons это номер дрампада (`0`→3408, `1`→3412, `2`→4207, `3`→4213, `4`→4306). Есть только у вопроса с `waitsForExternalAnswer`, номер приводит ровно к одному вопросу — и то и другое проверяет загрузчик
- `html` — текст (обычный текст тоже разметка), `data` — произвольный JSON механики, у текстовых полей его нет

**bindings** — коды на дверях: `code` (8 символов `^[a-zA-Z0-9]{8}$`, unique, сравнение с учётом регистра), `roomNumber`, `location`. Код говорит только про место; какой вопрос там открыть, решает маршрут команды. Ротации вариантов больше нет: шаг маршрута перечисляет конкретные вопросы.

**questionStates** (unique index `(teamId, stepIndex)`)
- `teamId`, `stepIndex` (индекс шага `QUESTION` в `sequence`)
- `room: RoomRef` — аудитория, код которой отсканировала команда: вопрос стоит в нескольких
- `questionId` — выданный вариант вопроса; по нему же считается, какой вариант сейчас занят
- `questionSnapshot` — весь документ вопроса, снятый при открытии, с уже посчитанными ответами
- `openedAt`, `answeredAt?`
- `attempts: [{ submittedAt, payload, correct }]`
- `hintsTaken: [{ index, takenAt }]`
- Это журнал фактов без секунд: поправки времени за них лежат в `teams.timeAdjustments` со `stepIndex` шага (см. решение 2026-09-21). Номер аудитории, корпус и `gameType` берутся из `questions` по `questionSlug`.

## Бэкенд: ключевая логика

**Core и игры (решение 2026-09-15).** API разделён на две части.

- **Core** — общий квест, не знает форму вопросов: логин, `GET /quest/progress`, `POST /quest/enter-code` (смена локации, открытие вопроса по коду аудитории), таймер, история штрафов, рейтинг, админка. Чтение и запись вопросов тоже за core: коллекция одна на все типы. Core хранит `questionStates` и владеет всеми правилами, которые одинаковы для любой игры: открытый ли вопрос, запись попытки со штрафом, запись подсказки со штрафом и проверкой порядка, продвижение `currentStepIndex` после верного ответа. Эти правила лежат в `services/openQuestion/` и вызываются **только из игр**:
  ```ts
  requireOpenQuestion(team): OpenQuestionContext          // { state, room }; 409 quest__no_open_question / quest__finished
  assertGameType(room, gameType)                           // 400 quest__game_type_mismatch — чужой роут игры
  recordWrongAttempt(state, payload, penaltySeconds, now)  // push в attempts; штраф назначает игра
  completeQuestion(team, state, payload, now)              // answeredAt + attempt, currentStepIndex += 1 (условный update)
  takeHint(state, hintIndex, hints: { penaltySeconds }[], now) // порядок / идемпотентность / исчерпание; список подсказок даёт игра
  ```
  Core не знает формы содержимого вопроса: тип игры оборачивает документ в `GameQuestion` и сам решает, какой штраф и сколько подсказок.
- **Тип игры** — модуль `api/src/games/<type>/{index,schema}.ts` (плюс `utils/`, если есть чистые вычисления). Роутов он не объявляет: все действия команды живут в core, а тип отвечает за поля вопроса и за смысл его содержимого. Формы `content`, `answer` и `state` описаны в `shared/src/games/<type>.ts`. Типы друг о друге не знают.
- **Регистрация типов игр (решение 2026-09-15).** Core знает о конкретных типах ровно в одном месте — `api/src/games/registry.ts`, карта `Record<GameType, GameTypeDefinition>`. Всё остальное в core (роуты, загрузчик данных, модели) работает только через интерфейс `GameTypeDefinition`: берёт определение из реестра по `gameType` и вызывает его поля и колбэки, ни один core-файл кроме реестра не импортирует из `games/<type>/` (правило ESLint). Список типов — enum `GameType` в `shared`, он же нужен фронту для своего реестра компонентов. Новый тип — это папка `games/<type>/` плюс одна строка в enum и одна в реестре; `Record<GameType, …>` не даёт забыть строку.
- **Вопросы — данные, а не код (решение 2026-09-16, уточнено 2026-09-26).** Вопрос описывается объектом в `api/src/setup/questions/<gameType>.json`: файл на тип игры, внутри массив вопросов этого типа, каждый со своими `location` и `roomNumber`; коды на дверях — отдельной таблицей. Загрузчик проверяет аудитории и один тип игры на файл и пишет вопросы в `questions`. В рантайме core читает вопрос из базы: код → аудитория → вопрос шага маршрута → `gameType` → модуль типа из реестра. Вопросов одного типа может быть сколько угодно, регистрировать их в коде не нужно.
- **Текстовые типы** (`SHAZAM`, `ENCYCLOPEDIA`, `TELEVISIONS`, `LIGHT` и другие без своей механики) живут на умолчаниях core: `content` — текст задания, `answer { text }`, `state { draft }`; формы описаны в `shared/src/games/basicGame.ts`. Исторические заметки: до 2026-09-20 роуты были у каждого типа свои (`/api/games/text-answer/*`), до 2026-09-23 типы собирались фабрикой `createBasicGameType`.

Полный порядок добавления типа — в README.

**Одна коллекция вопросов** (`models/Question.ts`): базовая схема плюс дискриминатор Mongoose по `gameType` на каждый тип из реестра — поля типа валидируются, а лежат все вопросы вместе. Базовые поля вынесены в `models/questionFields.ts`, чтобы схемы типов их импортировали без цикла через реестр. Ротации нет: шаг маршрута называет конкретные вопросы, а код на двери выбирает из них тот, что стоит в отсканированной аудитории.

**Нормализация текста** (`utils/question/normalizeAnswer.ts`): trim, схлопывание пробелов в один, нижний регистр. Больше ничего — организатор задаёт варианты написания в `acceptedAnswers`.

**Машина состояний команды.** Текущий шаг `sequence[currentStepIndex]` определяет всё:

| Текущий шаг | Что делает команда | Время | Допустимые действия |
|---|---|---|---|
| `LOCATION_TRANSITION` | идёт в другой корпус (или ещё не начала) | стоит | `enter-code` кодом одной из `options` следующего шага |
| `ROOM_TRANSITION` | идёт в другую аудиторию того же корпуса | идёт | `enter-code` кодом аудитории одного из вопросов следующего шага |
| `QUESTION` | решает открытый вопрос | идёт | `/quest/question`, `/quest/hint`, `/quest/state`, `/quest/answer`; повторный `enter-code` той же аудитории — идемпотентный no-op |
| `currentStepIndex === sequence.length` | закончила | стоит | ничего, 409 `quest__finished` |

Переходы: верный код на шаге-переходе → `currentStepIndex += 1` (становится `QUESTION`, создаётся `questionState`); верный ответ на `QUESTION` → `currentStepIndex += 1` (становится следующий переход или конец). Назад нет; сброс — перезапуск сида. Невалидный переход (например `answer` на шаге-переходе) → 409 с кодом ошибки.

**`enterCode(team, rawCode)`** (`POST /api/quest/enter-code`):
1. `code = trim()` (регистр сохраняется); конец маршрута → 409 `quest__finished`; `binding = bindings.findOne({code})` — аудитория и корпус.
2. Текущий шаг `QUESTION`: `state = questionStates.findOne({teamId, stepIndex: currentStepIndex})`; открытый вопрос стоит в этой аудитории → вернуть progress (идемпотентно); иначе 409 `quest__question_already_open`.
3. Текущий шаг — переход: `next = sequence[currentStepIndex + 1]` (по валидации это `QUESTION`). Среди аудиторий `next.options` ищем ту, что совпала с привязкой; нет кода или нет такой аудитории → 400 `quest__wrong_code` (одно сообщение для чужого, будущего и прошлого кода; причина в лог).
4. Вопрос аудитории: если он один — он и открывается; если их несколько, берётся дольше всех свободный (`readQuestionUsage` + `pickFreeQuestion`, решение 2026-09-24).
5. Снимок вопроса: у обычного копия его `acceptedAnswers`, у вопроса с `hasDynamicAnswer` — ближайшая аудитория маршрута. `questionStates.create({stepIndex: currentStepIndex + 1, room, questionId, questionSnapshot, openedAt: now})`; E11000 (двойной сабмит) → прочитать существующее. `team.currentStepIndex += 1`.

**Ответ (`submitAnswer(team, answer)`, core)**: `requireOpenQuestion` — текущий шаг не `QUESTION` → 409 `quest__no_open_question`; тип игры решает, верен ли ответ (`GameQuestion.checkAnswer`). Неверно → попытка с `wrongAttemptPenaltySeconds` вопроса, `{correct: false, penaltySecondsAdded, question, progress}`. Верно → `findOneAndUpdate({_id: state, answeredAt: null}, {answeredAt: now, $push attempt})`; если не совпало — уже отвечено; иначе `team.currentStepIndex += 1`; `{correct: true, penaltySecondsAdded: 0, question: null, progress}`.

**Подсказка (`takeHint(team, hintIndex)`, core)**: `requireOpenQuestion`, затем `hintIndex < hintsTaken.length` → идемпотентно; все подсказки взяты → 409 `quest__hints_exhausted`; `hintIndex !== hintsTaken.length` → 409 `quest__hint_order_violation`; иначе условный push в `hintsTaken` со штрафом подсказки из вопроса игры. Возвращает `{question, progress}`. **Состояние** (`get/setQuestionState`): произвольный JSON в `questionStates.state`, по умолчанию как есть, тип игры может подменить через `onStateUpdate`.

**Сборка данных для progress/таймера** (`questService.getProgress`): `team` + `questionStates.find({teamId})` + `questions.find({$or: аудитории всех QUESTION-шагов})`. Штраф шага — сумма по `attempts` и `hintsTaken`. Статус команды: `currentStepIndex === 0` → `NOT_STARTED`, `=== sequence.length` → `FINISHED`, иначе `IN_PROGRESS`.

**Таймер** (`utils/timer/toTimerDto.ts`, чистая функция, Vitest). Вход — шаги маршрута с метками из `questionStates`; корпуса таймеру не нужны, вид шага уже всё говорит:
```ts
interface TimerStep { kind: StepKind; openedAt?: Date; answeredAt?: Date }
toTimerDto(steps: TimerStep[], currentStepIndex: number, now: Date, timeAdjustmentSeconds: number): TimerDto
```
```
elapsedMs = 0
for i in 0..currentStepIndex (включительно, не дальше конца):
  s = steps[i]
  QUESTION:             elapsedMs += (s.answeredAt ?? now) - s.openedAt
  ROOM_TRANSITION:      elapsedMs += (steps[i+1].openedAt ?? now) - steps[i-1].answeredAt
  LOCATION_TRANSITION:  ничего
running = currentStepIndex < steps.length && kind(current) in {QUESTION, ROOM_TRANSITION}
timeAdjustmentSeconds = sum(team.timeAdjustments[].timeAdjustmentSeconds)   // считается снаружи, передаётся параметром
totalSeconds = max(0, floor(elapsedMs/1000) + timeAdjustmentSeconds)
```
Покрываемые случаи: не начат (индекс 0, `LOCATION_TRANSITION`, нули, стоит); открытый вопрос (идёт); `ROOM_TRANSITION` (идёт от `answeredAt` предыдущего); `LOCATION_TRANSITION` (стоит, elapsed заморожен); закончен (стоит). Клиент тикает от `serverNow`, своими часами не пользуется.

**История поправок времени** (`utils/timeAdjustment/toTimeAdjustmentDtos.ts`, чистая функция): `teams.timeAdjustments` по времени создания как `TimeAdjustmentDto { id, timeAdjustmentSeconds, type, createdAt, comment, stepIndex }`. Отдаётся в `ProgressDto.timeAdjustments` и `AdminTeamDetailDto.timeAdjustments`; аудиторию клиент находит по `stepIndex` в карточках шагов.

**Рейтинг** (`services/rating/`): все команды + все `questionStates` двумя запросами, группировка в памяти, один общий `now`. Сортировка: `FINISHED` по `totalSeconds` asc, затем `IN_PROGRESS` по `solvedCount` desc, `totalSeconds` asc, затем `NOT_STARTED` по имени.

**Ошибки.** Формат ответа: `{ code, message, data? }`. Код и сообщение лежат вместе в константах `shared/src/errors/{common,auth,quest,team}.ts` (`{ code: 'домен__snake_case', message }`), один файл на домен; такое же разбиение у классов в `api/src/utils/errors/`. На каждую ошибку — подкласс в `api/src/utils/errors/` с зашитым статусом; в месте броска только класс и параметры-значения, никаких текстов и кодов:

```ts
throw new WrongCodeError();
throw new HintOrderViolationError(takenCount);   // → data: { nextHintIndex }
throw new DynamicAnswerMissingError(question, stepIndex);   // → logData, наружу не уходит
```

`ApiError` хранит `status`, `code`, `message`, публичные `data` и приватные `logData`; `toApiErrorDto()` отдаёт только первые три и `data`. Ошибки 5xx наследуются от `InternalApiError`, у них всегда пустой `data` и заполненный `logData`. Обработчик в `app.ts` приводит к `ApiError` вообще всё: валидация Fastify → `ValidationError` (текст валидации уходит в `data.validation`), ошибки JWT → `UnauthorizedError`, остальное → `InternalError`. Поэтому технические подробности физически не могут утечь: сообщения берутся только из констант. Список кодов отдаётся в OpenAPI через `API_ERROR_CODES`.

**Admin** (`routes/admin.ts`, `plugins/adminAuth.ts`): все роуты под `/api/admin/*` требуют заголовок `X-Admin-Token`, равный `ADMIN_TOKEN` из env; иначе 401 `auth__admin_unauthorized`. В MVP: `GET /api/admin/rating`, `POST /api/admin/teams/:id/reset` (удаляет `questionStates` команды, `currentStepIndex = 0`, очищает `sessionId`).

**Единый интерфейс игр и эндпоинты в core (решение 2026-09-20).** Игры оказались похожими: ответ почти всегда текст, у всех подсказки и штрафы. Поэтому роуты действий команды снова принадлежат core и одинаковы для любого типа игры:
- `GET /quest/question` — открытый вопрос: `QuestionViewDto { stepIndex, roomNumber, gameType, content: unknown, hints, nextHintIndex, attemptsCount, wrongAttemptsCount, wrongAttemptPenaltySeconds, stepPenaltySeconds, state: unknown }`; тот же объект лежит в `ProgressDto.question`.
- `POST /quest/hint {hintIndex}` — подсказка по порядку, → `{ question, progress }`.
- `GET /quest/state`, `PUT /quest/state { state }` — промежуточное состояние прохождения (черновик ответа, прогресс мини-игры): произвольный JSON, хранится в `questionStates.state`; по умолчанию core просто сохраняет переданное и отдаёт обратно, тип игры может подменить обработку хуком `onStateUpdate`.
- `POST /quest/answer { answer: unknown }` — финальный ответ: неверно → попытка со штрафом, верно → вопрос закрыт, команда продвинута; → `{ correct, penaltySecondsAdded, question | null, progress }`.
Форма `content`, `answer` и `state` — `unknown` для core; её знает тип игры и его web-компонент. Тип игры больше не объявляет роутов, а реализует контракт:
```ts
interface GameTypeDefinition {
  gameType: GameType;
  extraFields?: SchemaDefinition;              // поля вопроса сверх базовых, core вешает их дискриминатором
  toGameQuestion(question): GameQuestion;      // документ вопроса, обёрнутый в поведение
  toAdminContent(question): unknown;           // для админки, с ответами
  onStateUpdate?(question, previous, next): unknown;  // по умолчанию next как есть
}
interface GameQuestion {
  hints: { text, penaltySeconds }[];
  wrongAttemptPenaltySeconds: number;
  toPublicContent(): unknown;
  checkAnswer(answer: unknown): boolean;
}
```
- **Аудитория без кода — не шаг маршрута (решение 2026-09-26).** Вопрос открывается только сканом кода, поэтому аудитория без кода шагом быть не может. Ягодное посылает команду в 1316/1404/1405 за ответом: там нет ни кодов, ни вопросов — это место, куда сходить, а не станция. Вопрос остаётся тем, что выдан в аудитории с QR (один из трёх вариантов по занятости), ответ у каждого варианта свой и набирается руками. Поэтому колонка таблицы вида `1316→2101` на Кронверкском шага не даёт, а на Ломоносова (`1603→3408`) даёт: там справа стоит вопрос с кодом на двери. Тип игры `ENCYCLOPEDIA` остался без вопросов — прежняя модель с вопросом в 1316/1404/1405 была ошибкой.
- **Распределяющая аудитория называет аудиторию сама (решение 2026-09-27).** Там, где в аудитории несколько вариантов и каждый уводит команду в свою аудиторию, платформа знает только ту, где висит код. Телевизоры стоят в 1603–1609, а шаг маршрута — `lomo/1600`, площадка у лифта с единственным QR: варианты раздаёт обычная ротация по занятости, поэтому команды расходятся по разным телевизорам. Куда идти, команде говорит текст самого варианта — «Пройдите в аудиторию 1603. Вступите в диалог с собой…», и отвечает этот вариант аудиторией 3408 (дальше 1604→3412, 1607→4207, 1608→4213, 1609→4306). Отдельного поля под номер у вопроса нет: аудитория без кода платформе неизвестна, а текст задания и так пишут организаторы. Так же устроено Ягодное: вопрос выдаёт одна из шестнадцати аудиторий с QR, а решают его в 1316, 1404 или 1405 — номер стоит первой строкой вводной, по аудитории на вариант (у каждого своя таблица анкет и свой ответ), и ротация по занятости разводит команды по всем трём.
- **Ответ — номер следующей аудитории (решение 2026-09-21).** Механика: ответ складывается в номер аудитории, куда команда идёт дальше. Вводить номер руками не нужно и незачем — команда доходит до двери и сканирует её код. Фронтенд игры делает три шага: `POST /quest/room-number { code }` → номер, `onSubmit({ text: номер })` → core проверяет ответ, и при верном ответе (и если квест не закончен) `onEnterCode(code)` открывает следующий вопрос тем же кодом. Core о механике не знает: он отдаёт игре номер по коду и два своих действия. Следствие для данных: ответ такого вопроса должен быть аудиторией существующего вопроса, а следующий шаг перечисляет в `options` все вопросы, куда ведут ответы предыдущего.
- **Умолчания принадлежат core (решение 2026-09-23, заменяет фабрику `createBasicGameType`).** Базовые поля вопроса (`html`, `data?`, `acceptedAnswers`, `answerIsNextRoom`, `hasDynamicAnswer`, `wrongAttemptPenaltySeconds`, `hints`) годятся и для текста, и для картинок, и для любой механики, поэтому поведение по умолчанию — тоже общее: содержимое это само задание, ответ `{ text }` против `acceptedAnswers` с нормализацией, вид для организатора — все базовые поля с ответами. Собирает всё `utils/question/toGameQuestion.ts`, рядом лежат сами умолчания. Тип без своей механики (`SHAZAM`, `ENCYCLOPEDIA`, `TELEVISIONS`, `LIGHT`, `GOOGLE_FORMS`, `SOCIAL_NETWORKS`, `STICKERS`, `YAGODNOE`) — это `{ gameType }` и больше ничего. Текст вопроса не обязателен: он пустой там, где задание целиком вне платформы, и на экране остаётся одно сканирование кода.
- **Гугл-формы — страница-обманка (решение 2026-09-26).** Задание этого типа и есть форма регистрации на квест, повторённая слово в слово и попиксельно (`web/src/games/googleForms/GoogleFormsContent.tsx`, оригинал — `tally.so/r/2Ep9vp`): команда заполняет её, жмёт «Зарегистрировать команду» и получает «Данная форма устарела, попробуйте раньше». Введённое никуда не уходит и не проверяется — настоящий ответ команда приносит кодом аудитории, до которой дошла по подсказке из описания. Описание формы — это `html` вопроса (у каждой команды своё, в нём и спрятано, куда идти), незаполненный `html` показывает исходный текст оригинала. **Вариант на команду (решение 2026-09-27):** из `googleForms.csv` собраны 72 варианта по `teamSlugs` — своё описание (их десять, по числу чатов) и своя тема (`topic`, единственное поле типа сверх базовых). Иконка темы лежит в `web/public/formIcons/<тема>.png` и стоит в шапке формы: по ней команда понимает, в какой чат идти. Подсказки общие на всех (600 и 1200 секунд), ответ по-прежнему вычисляемый — сверка показала, что колонка «Ответ» в таблице совпадает со следующей аудиторией маршрута у всех 72 команд. Шапку фронт собирает сам: фирменный фон `games/form.png`, «Квест» по центру и иконка темы в левом верхнем углу, который виден и на телефоне, где шапка обрезается. Шрифт формы — `fonts/Inter-Variable-*.woff2`.
- **Задание во весь экран (решение 2026-09-27).** Форма должна выглядеть чужим сайтом, поэтому платформы на экране нет вовсе: ни шапки с таймером, ни рамки вопроса. Включает это флаг `fullscreen` в реестре игр фронта (`games/registry.tsx`): `QuestLayout` на `/question` рисует такую игру без оболочки, `QuestionCard` — без аудитории, подсказок и баннеров. Дверь обратно — кнопка «Made with Megabattle» в правом нижнем углу, как «Made with Tally» у настоящих форм: она **включается только после первой отправки формы**, чтобы команда сначала прочитала задание. По нажатию открывается окно платформы (`GoogleFormsPanel`): таймер с поправками, подсказки и сканер кода. Логика ответа-аудитории вынесена в хук `useRoomCodeAnswer`, поэтому сканер работает и внутри окна, и в обычной вёрстке `RoomCodeAnswer`.
- **Снимок вопроса в состоянии шага (решение 2026-09-23).** При открытии вопроса ядро кладёт в `questionStates.questionSnapshot` весь документ вопроса, посчитав ответы: у обычного это его `acceptedAnswers`, у вопроса с `hasDynamicAnswer` — аудитория следующего вопроса маршрута, которая известна только теперь, когда понятен маршрут команды. Дальше команда работает только со снимком: `GET /quest/question`, проверка ответа и подсказки читают его, коллекция вопросов при этом не нужна. Правка вопроса или маршрута открытую игру не меняет, откат шага выдаёт вопрос заново. Тип игры разницы не видит: `toGameQuestion` получает снимок как обычный вопрос, поэтому код у блица и адрес страницы у истории работают как раньше. Флагов два и они про разное: `answerIsNextRoom` говорит, что ответ это номер следующей аудитории, а `hasDynamicAnswer` — что номер подставляет ядро, а не организатор. Заранее известный ответ-аудитория остаётся нужен там, где номер приходит из реального мира или где маршрут после вопроса ветвится; `hasDynamicAnswer` без `answerIsNextRoom` невозможен, это ошибка загрузки.
- **Ответ — исход игры на фронтенде (решение 2026-09-22).** У механик, которые целиком играются на клиенте, ответом шага становится результат игры, а не содержательный текст: сапёр отправляет `«0»` при каждом подрыве мины (неверный ответ, штраф `wrongAttemptPenaltySeconds`) и `«1»`, когда открыты все безопасные клетки (верный ответ, шаг закрыт). Значения лежат в enum `MinesweeperAnswer` в `shared`, проверка остаётся обычной: `«1»` — единственный `acceptedAnswers` вопроса. Клетку сапёра команда выбирает сканированием (решение 2026-09-26): коды клеток расклеены в аудитории, лежат в базовых полях вопроса — `cells` (`{ code, row, col }`, таблица `setup/questions/minesweper.csv` — она же раскладка меток) — и к кодам на дверях отношения не имеют; вся раскладка уходит команде вместе с заданием, поэтому скан разбирается на месте, без запроса на каждый кадр, а организатор проверяет метку на открытой странице `/pub/minesweeper` (`GET /api/pub/minesweeper/:code` → `{ row, col }`, неизвестный код — `quest__unknown_cell_code`); на экране квадратная камера, поле с подсвеченной клеткой и кнопки «Открыть» и «Поставить флаг», флаги хранятся в состоянии прохождения. **Три режима выбора клетки (решение 2026-09-27):** переключаются кнопками на самом экране (`minesweeperMode.ts`). «Вручную» — камера не включается, клетка выбирается нажатием на поле: запасной путь на случай, когда коды не читаются или телефон не даёт камеру. «Сканер» — камера сверху, поле под ней, клетку называет скан, пальцем её не выбрать. «В кадре» — поле рисуется поверх камеры, и отдельного поля под ней нет: оно там уже есть. Режим — состояние экрана и никуда не сохраняется: ход игры один на все режимы и живёт в состоянии прохождения, поэтому переключаться можно посреди партии. **Поле дорисовывается к коду прямо в кадре (решение 2026-09-27):** четыре угла найденного QR задают проекцию плоскости, на которой он наклеен, поэтому по ним считаются четырёхугольники соседних клеток (`web/src/games/minesweeper/toFieldQuads.ts`) и поверх камеры рисуется само поле — открытые клетки с цифрами, подорванные и помеченные флагом (`MinesweeperOverlay.tsx` поверх видео, рисование вынесено в `paintMinesweeperField.ts` и покрыто тестами). Масштаб задаёт одна константа `QR_TO_CELL_RATIO` (`minesweeperSize.ts`) — сторона напечатанного QR в долях стороны клетки: код стоит в своей клетке по центру, и этого хватает, чтобы разложить вокруг него всё поле. Углы кода сканер отдаёт наружу сам (`QrScanner` → `onCorners`, пересчёт в координаты кадра — `toDisplayCorners.ts`, общий с контуром кода), клетка приходит вместе с углами: чужой код в кадре поле не сдвигает. Поле сапёра бэкенд не видит вовсе: размер (10×6, 10 мин) — константа фронта, расстановка делается по первому клику и проверяется решателем, чтобы поле проходилось без угадывания (`web/src/games/minesweeper/generateSolvableField.ts`, алгоритм из github.com/w29ahmed/minesweeper). Подрыв не обнуляет прогресс — мина остаётся видимой, штраф берётся один раз, а открытые и подорванные клетки команда хранит в состоянии прохождения (`PUT /quest/state`), чтобы пережить перезагрузку страницы.
- **Ответ по открытой ссылке (решение 2026-09-26).** У соцсетей ответ заранее известен и одинаков для всех (`SocialNetworksAnswer.CONFIRMED`), аудиторией он не является (оба флага ответа сняты), поля ввода на экране задания нет. Отправляет его открытая страница `/pub/confirm_video`, ссылка на которую лежит в ролике: с устройства команды она сама шлёт `POST /quest/answer` и говорит, что ответ принят; без входа — просит открыть ссылку на устройстве команды. Перед отправкой страница смотрит открытое задание: если оно не из соцсетей или его нет, ответ не уходит, иначе переход по ссылке не вовремя стоил бы неверной попытки со штрафом.
- **Переход между корпусами со словом организаторов (решение 2026-09-26, дополнено 2026-09-27).** На `LOCATION_TRANSITION` команда видит постоянный текст: квест начинается или корпус пройден, какой корпус следующий и что таймер остановлен. Под ним — необязательный текст организаторов про дорогу: он приходит с сервера полем `transitionHtml` в `ProgressDto` и лежит в коллекции `locationNotes`, которую заливает `npm run load-locations` из `setup/locations.json`. Отдельная коллекция, а не поле шага маршрута: `load-teams` стирает прогресс, а текст должен правиться по ходу квеста. **Текст подписан парой корпусов: `location` — куда команда идёт, `from` — откуда (пусто = любой переход в этот корпус, включая самый первый).** Пара, а не один корпус назначения, потому что дорога зависит от обоих концов, а один и тот же корпус стоит у разных команд на разных местах маршрута: SideQuest по дороге между вторым и третьим корпусом — это `lomo → cronva` у одних команд и `cronva → lomo` у других, и корпусом назначения их не отличить от перехода в тот же корпус с первого места. Читается текст только на самом переходе (`services/quest/readLocationNote.ts`): корпус впереди даёт ближайший следующий вопрос, корпус позади — ближайший пройденный (`utils/sequence/getNextQuestionLocation.ts` и `getPreviousQuestionLocation.ts`), оба подходящих текста приходят одним запросом, и точный побеждает общий.
- **Блиц — раунд на время, код в фоне (решение 2026-09-26).** МегаКвиз идёт по одному вопросу: восемь вопросов про фотографию и минута на всё. Верный вариант по ходу не подсвечивается, разбор команда видит в конце — где угадала, где нет, но **правильный ответ у ошибочных вопросов не показывается**. Не уложились в минуту — раунд не засчитан; пройти заново можно и после удачного раунда. Ответ шага (номер следующей аудитории) приходит по `shouldSendAnswer` и спрятан в фоне викторины: цветом подложки плюс единица по каждому каналу RGB (`#2a3247` → `#2b3348`), повёрнут и скошен — глазом не читается, а контрастность в галерее его проявляет. Подложка именно средней яркости: на почти чёрной тёмные уровни при поднятии контраста схлопываются в чёрный и код не достать. **Сервер хранит о раунде только число законченных попыток** (`BlitzStateDto` = `{ attempts }`): каждая попытка, удачная или нет, отнимает у текстов вопросов 10% непрозрачности (100%, 90%, 80% и так до 5%, ниже не выцветает) и заново перемешивает варианты (`getOptionOrder` по зерну из числа попыток и номера вопроса; выбор команда отдаёт исходным номером варианта, поэтому верный ответ не путается). Время и выбранные варианты живут на экране команды: перезагрузка бросает раунд. Чистая логика — `web/src/games/blitz/blitzRound.ts` с тестами.
- **Ответ засчитывает внешний механизм (решение 2026-09-26, заменяет «правильный ответ на фронте» от 2026-09-22).** У sound buttons кнопки и звук живут вне платформы: бэкенд не хранит ни кнопок, ни последовательности, у типа нет своих полей. Ответ проставляет внешний механизм, меняя состояние прохождения команды, а фронт ждёт этого изменения долгим запросом `GET /quest/state?since=<метка>`: сервер держит его до четверти минуты и отвечает сразу, как только состояние изменилось (`services/openQuestion/waitForQuestionState.ts`, перечитывает раз в секунду; на фронте — хук `api/useQuestionStateWatch.ts`, который затем перечитывает прохождение). Метка — `updatedAt` документа состояния, она же приходит в `QuestionStateDto`. Опрашивать сервер вхолостую не приходится, а экран уходит на следующий шаг сам.
- **Финиш по последнему ответу (решение 2026-09-27, заменяет скан финишной двери).** Ответ на последнем вопросе маршрута закрывает квест: за ним остаются одни переходы, и сканировать больше нечего (`services/openQuestion/acceptAnswer.ts` двигает команду за последний шаг через `finishTeam`, вопросы впереди считает чистая `utils/sequence/hasQuestionsAhead.ts`). Команда сразу видит финишный экран — благодарность за участие, итоговое время, время прохождения и сумма штрафов, — а не переход с «вашим следующим корпусом» и вводом кода. Достижения при этом ограничены числом заданий маршрута: за последний ответ нового не дают, к стикерам все двенадцать уже собраны.
- **Достижение за вход и карта достижений (решение 2026-09-27).** Первое достижение команда получает за вход на платформу, остальные — за ответы, поэтому к последнему заданию маршрута (стикеры, двенадцатое) их набирается двенадцать: ровно столько эмодзи в ответе стикеров. Достижение приходит и в карточку своего задания (`QuestionCardDto.achievement`), рядом с временем, поправкой и числом взятых подсказок (`hintsCount`), — карта заодно показывает, что за задание стоило команде. Тост выезжает справа под шапкой (она же его и держит: сама sticky), висит три секунды и уезжает туда же, откуда приехал — весь путь ведёт CSS-анимация, состояния у отъезда нет; по нажатию тост открывает карту; на карте картинка достижения стоит справа от задания и по нажатию раскрывается крупно с названием. Выдачей по-прежнему заведует `solvedCount`: дважды одно достижение не выдать, порядок строгий, откат шага забирает его вместе с ответом.
- **Достижения за засчитанные ответы (решение 2026-09-26).** Каждый засчитанный ответ даёт команде достижение: картинку с нарисованным эмодзи и название, всплывающие тостом поверх экрана (`web/src/components/AchievementToast.tsx`). Порядок один на все команды и задан списком в `utils/achievement/toAchievementDtos.ts`: из этих эмодзи собирается ответ на стикерах, а он у всех одинаковый. Поэтому список живёт на бэкенде, а команде в `ProgressDto.achievements` уходят **только уже полученные** — будущие в браузер не попадают, иначе ответ на стикерах читался бы прямо из бандла. Достижений ровно столько, сколько `solvedCount`: своего состояния у них нет, откат шага забирает достижение вместе с ответом, а перезагрузка страницы тост не повторяет. Картинки лежат статикой в `packages/web/public/achievements/`, названия пока плейсхолдеры.
- **Дрампад сам находит свою команду (решение 2026-09-26).** Механизм не знает ни команд, ни токенов: он дёргает открытый `POST /pub/confirm_drum/:code`, где `code` — номер дрампада. Команду платформа вычисляет сама: по `externalAnswerCode` находит вопрос, по `questionStates.questionId` — открытое и ещё не отвеченное прохождение, по нему команду (`services/quest/confirmExternalAnswer.ts`). Если вопрос успели открыть двое, ответ получает открывшая раньше: она и стоит в аудитории дольше. Дальше это обычный верный ответ: шаг закрыт, команда продвинута — тем же `acceptAnswer`, что и ответ команды, поэтому повторный сигнал ничего не добавляет (`quest__no_waiting_team`). Неизвестный номер — `quest__unknown_external_code`. Ответ содержит, кому он засчитан: `{ teamName, roomNumber }` — организатору видно, что пад достучался. Роут открытый: у железа в аудитории нет ни входа, ни токена. Метод `POST`, потому что сигнал меняет состояние квеста, а не читает его. **Живёт он в корне, без префикса `/api`** (`routes/drum.ts`, зарегистрирован мимо группы `/api`): адрес зашит в железо, и укорачивать его на месте будет некогда. Остальные `/pub/*` — страницы самого сайта, поэтому в дев-режиме на бэкенд уходит только `/pub/confirm_drum` (`vite.config.ts`), а на проде это же правило нужно и в том, что раздаёт сайт. Пустое тело с заголовком `application/json` роут принимает: железо шлёт именно так, а тела ему и не нужно.
- **Ожидание — флаг вопроса, а не тип игры (решение 2026-09-26).** Ждут ответа извне и sound buttons, и соцсети, поэтому ожидание включает поле вопроса `waitsForExternalAnswer`, а запускает его core: `QuestionCard` зовёт `useQuestionStateWatch(question.waitsForExternalAnswer)`, компонент типа игры к этому не причастен. Ждать долгим запросом состояния хватает обоим: пока команда висит на нём, сервер раз в секунду перечитывает открытый вопрос, и когда ответ засчитан где-то ещё, вопроса уже нет — запрос падает с `quest__no_open_question`, фронт перечитывает прохождение и уходит на следующий шаг (у соцсетей это занимает меньше секунды). На экране такого вопроса нет ни поля ввода, ни кнопки: sound buttons показывают только задание и строку «Введите правильный ответ» — ответ набирается кнопками в аудитории.
- На фронте компонент типа получает готовый `QuestionViewDto` и колбэки core (`onSubmit(answer)`, `onSaveState(state)`), подсказки рисует core. Реестр web-типов: `{ label, Content, AttemptView, AdminQuestions }`. У каждого типа свой `Content` (решение 2026-09-22): хранение на бэкенде общее, показ разный. Общие блоки — `basicGame/TextAnswer` и `roomCodeAnswer/RoomCodeAnswer`.

**Единая поправка времени `timeAdjustment` (решение 2026-09-21, заменяет «ручные штрафы и компенсации» от 2026-09-17).** Штраф за неверный ответ, штраф за подсказку, ручной штраф и компенсация — один механизм, различается только причина. Поэтому все секунды, меняющие итоговое время команды, хранятся одним массивом в её документе: `teams.timeAdjustments: [{ _id, timeAdjustmentSeconds, type: TimeAdjustmentType, createdAt, comment: string | null, stepIndex: number | null }]`. `timeAdjustmentSeconds` — целое, знак задаёт направление (`> 0` штраф, `< 0` бонус); `type` — только причина (`WRONG_ANSWER`, `HINT`, `PENALTY`, `COMPENSATION`, `OTHER`) и на знак не влияет, согласованность знака и типа проверяет только админская форма. `stepIndex` заполнен у автоматических записей и у ручных, если организатор привязал запись к шагу; `comment` у автоматических пустой. Коллекции `penaltyAdjustments` больше нет. `attempts` и `hintsTaken` в `questionStates` остаются журналом фактов без секунд: `submitAnswer` при неверном ответе пишет попытку и добавляет запись `WRONG_ANSWER` на `wrongAttemptPenaltySeconds` вопроса, `takeHint` — подсказку и запись `HINT` на её `penaltySeconds`; нулевые секунды не записываются. Таймер, рейтинг, карточки шагов и история считают всё по этому массиву: сумма всех записей — `timer.timeAdjustmentSeconds` (может быть отрицательной, `totalSeconds` не ниже 0), сумма записей с данным `stepIndex` — поправка шага. Организатор видит все записи и может отменить любую, включая автоматическую (`DELETE /admin/teams/:id/time-adjustments/:timeAdjustmentId`), добавляет запись через `POST /admin/teams/:id/time-adjustments { timeAdjustmentSeconds, type, comment, stepIndex? }`. Две записи за одно действие команды (в `questionStates` и в `teams`) идут без транзакции: сбой между ними считается маловероятным и не обрабатывается.

**Админка (решение 2026-09-17).** Отдельный раздел web под `/admin/*`, вход по `ADMIN_TOKEN`, тот же токен уходит в `X-Admin-Token`. Страницы: «Команды» (список со статусом, решёнными, временем и штрафами; создание и удаление), страница команды (редактирование имени и пароля, редактор маршрута, карта шагов с временем, штрафом и числом подсказок по каждому вопросу, по клику — попытки команды и взятые подсказки; ручные штрафы и компенсации), «Вопросы» (все вопросы с ответами). API под `/api/admin/*`: `GET/POST /teams`, `GET/PATCH/DELETE /teams/:id`, `POST /teams/:id/reset`, `POST /teams/:id/rewind`, `POST /teams/:id/time-adjustments`, `DELETE /teams/:id/time-adjustments/:timeAdjustmentId`, `GET /questions`, `GET /rating`. Правила:
- Имя команды уникально → 409 `team__name_taken`. Пароль задаётся при создании и меняется через PATCH, наружу не отдаётся.
- Маршрут при создании и изменении проходит `validateSequence` → 400 `team__route_invalid` с `data.errors`. У команды, которая уже начала, нельзя менять пройденную часть маршрута: шаги `0..currentStepIndex` включительно должны совпасть с прежними, иначе 409 `team__route_prefix_locked`. Хвост менять можно.
- Удаление команды удаляет её `questionStates`; поправки времени лежат в самом документе команды.
- **Откат к началу шага (решение 2026-09-21).** `POST /teams/:id/rewind { stepIndex }` возвращает команду к шагу-вопросу, который она уже открывала: удаляет `questionStates` с этого шага и дальше, удаляет автоматические поправки (`WRONG_ANSWER`, `HINT`) этих шагов и ставит `currentStepIndex = stepIndex - 1`. Целимся именно в предшествующий переход: на шаге-вопросе без состояния ввод кода упирается в `quest__question_already_open`, и команда застревает. Ручные поправки остаются: организатор ставил их осознанно и может снять сам. Счётчик ротации не отматывается, поэтому вопрос выдаётся заново и, скорее всего, будет другим. Шаг-переход и шаг впереди команды → 409 `team__rewind_step_invalid`.
- **Ответ за команду (решение 2026-09-27).** Задание может сломаться прямо на квесте — не работает механизм, потерялась наклейка, вопрос оказался нерешаемым. Тогда организатор закрывает его сам: `POST /admin/teams/:id/answer` засчитывает **открытый** вопрос команды верным ответом и двигает её дальше тем же `acceptAnswer`, что и обычный верный ответ, поэтому таймер, достижения и карта считаются как всегда. Попытка пишется в журнал шага текстом «ответ засчитан организатором», так что в карточке команды видно, что ответ не её. Открытого вопроса нет → 409 `quest__no_open_question`: закрывать нечего, а придумывать, какой шаг закрыть, ядро не должно. Кнопка «Засчитать ответ» стоит на карте шагов у открытого вопроса, рядом с «Вернуть сюда». **Скан за команду (решение 2026-09-27):** `POST /admin/teams/:id/scan` делает то же, что делает скан кода на двери, — открывает вопрос первой аудитории шага или закрывает квест на финишном переходе. Выручает, когда QR не читается или телефон не даёт камеру. Своего кода у организатора нет, поэтому ядро идёт путём тестового кода (`enterCode` с `mockCode`), и вся остальная логика — снимок вопроса, ротация вариантов, таймер — работает как при настоящем скане; повторный скан при открытом вопросе ничего не меняет. Кнопка «Засчитать скан» стоит у шага, который ждёт код, и у финишного перехода.
- **Коды клеток в админке (решение 2026-09-27).** Клетки сапёра правятся как коды на дверях, только код ведёт не в аудиторию, а в клетку поля: `GET /admin/cells` отдаёт все клетки всех вопросов с аудиторией их вопроса, `POST /admin/cells { location, roomNumber, code, row, col }` заводит код или переносит его на другую клетку (у клетки код один → 409 `cell__taken`; в аудитории нет вопроса → 404 `cell__question_not_found`), `DELETE /admin/cells/:code` убирает код (404 `quest__unknown_cell_code`, тот же, что у публичной проверки). Клетки — базовое поле вопроса, поэтому core не поминает сапёра: вопрос называет аудитория, а не тип игры. Страница «Сапёр» показывает клетку как «столбец-строка» со счётом с единицы, как `/pub/minesweeper`, и знает размер поля из фронтовой константы.
- Содержимое вопросов и ответов зависит от типа игры, поэтому core отдаёт ответы команды как `payload: unknown`, а тип игры даёт админке свой роут вопросов (`GET /api/games/<type>/admin/questions?gameName=`, под `adminAuth`, с правильными ответами) и на фронте два компонента: просмотр попытки и список вопросов игры. Реестр web-компонентов игры расширяется до `{ Component, AttemptView, AdminQuestions }`.
- **Маршруты и коды (решение 2026-09-24).** Страница «Маршруты» — та же таблица, что у организаторов в csv, только с сервера: строка на команду, колонка на корпус в порядке обхода, внутри — аудитории по шагам, текущий шаг подсвечен. Считается на фронте (`admin/utils/toRouteSegments.ts`) из `AdminTeamSummaryDto.sequence`, поэтому `GET /admin/teams` отдаёт вместе со статусом и временем ещё `slug` и весь маршрут. Страница «Коды» — все `bindings` с числом вопросов в аудитории (ноль значит, что код ведёт в никуда): `GET /admin/bindings`, `POST /admin/bindings { code, location, roomNumber }` заводит код или переносит его в другую аудиторию (**второй код на ту же дверь разрешён, решение 2026-09-27**: ядро ищет аудиторию по коду, поэтому сканируется любой из них, а админка показывает замечание, а не ошибку), `DELETE /admin/bindings/:code` убирает код (404 `binding__not_found`). Мутации возвращают весь список: он короткий и всегда нужен целиком.
- **Проверка дверей по QR (решение 2026-09-26).** Коды печатаются в QR-кодах, поэтому организаторам нужен способ убедиться, что на двери наклеен правильный код. Таблица `setup/bindings.csv` заливается в коллекцию `bindings` командой `npm run load-bindings` (разбор — чистая `utils/binding/toBindingsByCode.ts`), то есть источник кодов один и для квеста, и для проверки. Открытый `GET /api/pub/bindings/:code` отдаёт `PubBindingDto { code, location, roomNumber, locationTitle }` или 404 `binding__not_found`; авторизации нет — страницу открывают с чужих телефонов. Веб-страница `/pub/bindings` держит сканер (`components/QrScanner.tsx`, пакет `barcode-detector`: свой `BarcodeDetector` на Android, wasm-реализация ZXing на iOS; wasm лежит в сборке, а не на CDN) и показывает номер аудитории крупно. Прохождение квеста этот путь не трогает: `enterCode` по-прежнему читает коллекцию `bindings`.
- **Страница команды — вкладки (решение 2026-09-24).** Под шапкой с именем, временем и кнопками сброса и удаления — вкладки «Маршрут», «Штрафы и бонусы», «Данные команды». Маршрут один раздел, а не два: по умолчанию карта шагов с состоянием, временем и попытками, по кнопке «Изменить маршрут» те же шаги в редакторе. У пройденных шагов редактор не перечисляет все допустимые аудитории, а показывает выбранные строкой: менять их всё равно нельзя. Больших карточек-секций в админке нет — карточками остаются только сами шаги и строки.

**Auth** (`services/auth/`, `plugins/authenticate.ts`): логин — `bcrypt.compare`, генерируется новый `sessionId` (random UUID), пишется в команду, JWT `{sub: teamId, sid: sessionId}`, `expiresIn: 24h`, без refresh. `preHandler: app.authenticate` на quest-роутах: проверяет подпись, перечитывает команду из БД, сравнивает `team.sessionId === payload.sid`; несовпадение → 401 `auth__session_replaced`, отсутствие токена / истёк → 401 `auth__unauthorized`. `POST /auth/logout` очищает `sessionId`.

## API (префикс `/api`, Swagger UI `/docs`; все I/O — TypeBox DTO из `shared`)

| Метод | Путь | Auth | Запрос | Ответ |
|---|---|---|---|---|
| POST | `/auth/login` | — | `LoginRequestDto {name, password}` | `LoginResponseDto {token, team}` |
| POST | `/auth/logout` | JWT | — | `OkDto` |
| GET | `/quest/progress` | JWT | — | `ProgressDto` |
| POST | `/quest/enter-code` | JWT | `EnterCodeRequestDto {code}` | `ProgressDto` |
| GET | `/quest/question` | JWT | — | `QuestionViewDto` |
| POST | `/quest/hint` | JWT | `TakeHintRequestDto {hintIndex}` | `QuestionResultDto {question, progress}` |
| GET, PUT | `/quest/state` | JWT | `QuestionStateDto {state: unknown}` | `QuestionStateDto` |
| POST | `/quest/answer` | JWT | `SubmitAnswerRequestDto {answer: unknown}` | `AnswerResultDto {correct, penaltySecondsAdded, question | null, progress}` |
| GET | `/admin/games/:name/questions` | `X-Admin-Token` | — | `AdminGameQuestionsDto {questions: unknown[]}` |
| GET | `/admin/rating` | `X-Admin-Token` | — | `RatingDto {generatedAt, entries[]}` |
| POST | `/admin/teams/:id/reset` | `X-Admin-Token` | — | `OkDto` |
| GET | `/health` | — | — | `HealthDto {ok, mongo}` |

```ts
ProgressDto {
  team: { id, name, status },           // status выводится из currentStepIndex
  phase: QuestPhase,                    // LOCATION_TRANSITION | ROOM_TRANSITION | QUESTION | FINISHED — вид текущего шага
  currentStepIndex, totalQuestions, solvedCount,
  steps: StepCardDto[],                // карточки маршрута для отображения (см. ниже)
  question: OpenQuestionDto | null,     // только в фазе QUESTION: { stepIndex, roomNumber, gameType } — содержимое отдаёт роут игры
  timer: TimerDto,                      // { elapsedSeconds, timeAdjustmentSeconds, totalSeconds, running }
  timeAdjustments: TimeAdjustmentDto[], // { id, timeAdjustmentSeconds, type: TimeAdjustmentType, createdAt, comment, stepIndex }
  serverNow: string
}
StepCardDto =                          // union по kind; ROOM_TRANSITION карточки не имеет
  | { kind: StepKind.LOCATION_TRANSITION, stepIndex, location, locationTitle, state: StepState }
  | { kind: StepKind.QUESTION, stepIndex, roomNumbers: string[], state: StepState,
      solvedSeconds: number | null, timeAdjustmentSeconds: number | null }   // заполняются для DONE
// roomNumbers тоже только у DONE (решение 2026-09-21): ответом бывает номер следующей аудитории,
// поэтому вперёд команда его не видит — по карте считываются только число вопросов и переходы между корпусами
StepState = LOCKED | ACTIVE | AWAITING_CODE | DONE   // AWAITING_CODE — следующий вопрос, когда команда на шаге-переходе
QuestionViewDto {                        // общая часть от core, content и state — форма типа игры
  stepIndex, roomNumber, gameType,
  content: unknown,                     // basicGame: { prompt }
  hints: HintDto[],                     // по числу подсказок вопроса: { index, penaltySeconds, taken, text: string | null }
  nextHintIndex: number | null,
  attemptsCount, wrongAttemptsCount, wrongAttemptPenaltySeconds, stepPenaltySeconds,
  state: unknown                        // сохранённое командой; basicGame: { draft }
}
RatingEntryDto { rank, teamId, teamName, status, solvedCount, totalQuestions, elapsedSeconds, timeAdjustmentSeconds, totalSeconds, finishedAt: string | null }   // finishedAt = answeredAt последнего вопроса; teamId нужен для сброса команды
ApiErrorDto { code: ApiErrorCode, message, details?: Record<string, unknown> }
```

## Фронтенд

Роуты: `/login`; `/` → `QuestPage` под `RequireAuth` (редирект на `/login` без токена и при 401).

Общий каркас `QuestPage`: сверху `Timer` (бегущий; при `LOCATION_TRANSITION` подпись «время остановлено»; скрыт при `NOT_STARTED`) и `TimeAdjustmentSummary` (одна сумма; по клику раскрывается `TimeAdjustmentHistory` — список событий из `penaltyHistory` с временем и итогом), `LogoutButton`. Ниже `StepCards` — карточки из `route`, соединённые линией: `LOCKED` (серая), `AWAITING_CODE` (подсвечена, «введите код»), `ACTIVE` (открытый вопрос), `DONE` (галочка, время на вопросе и штраф). Карточка вопроса показывает `roomNumbers`, карточка перехода — `locationTitle`. Корпус на карточках вопросов не пишется.

Рабочая область по `phase`:
- `LOCATION_TRANSITION` / `ROOM_TRANSITION`: `CodeEntryForm` (8 символов, регистр сохраняется, `quest__wrong_code` инлайн).
- `QUESTION`: `QuestionCard` (core: заголовок с номером аудитории, счётчик попыток, `HintsPanel`, мутации ответа и состояния) → `Content` типа из `games/registry[gameType]` с `GameContentProps { question: QuestionViewDto, onSubmit(answer), submitting, lastResult, onSaveState(state) }`. `BasicGameContent`: формулировка, поле ответа, «неверно, +N с»; набранный текст сохраняется как `state { draft }` при потере фокуса и восстанавливается из `question.state`. Мутации кладут `progress` из ответа в кэш.
- `FINISHED`: `FinishedCard` с итоговым временем и штрафами (история по клику доступна и здесь).

`LoginPage`: форма; если редирект пришёл с кодом `auth__session_replaced` — сообщение «вход выполнен на другом устройстве».

Данные: `useProgress` (`refetchInterval: 15s`, `refetchOnWindowFocus`); мутации пишут `progress` из ответа в кэш через `setQueryData`. Любой 401 → очистка токена и редирект на `/login` (с кодом ошибки в state). `Timer` — интервал 1 с от `serverNow`/`totalSeconds`/`running`. Loading: `Spinner` при первой загрузке, disabled-кнопки во время мутаций; ошибки — `ErrorBanner` с `message` из `ApiErrorDto`. Стили: SCSS-модули, `_variables.scss`, без UI-библиотек.

## Docker (dev)

- `mongo:7` (8.x не стартует на ядрах Linux 6.19–7.0.13, SERVER-121912; Mongoose 9 поддерживает сервер 7.x), named volume `mongo_data`. Порты на хосте смещены (`API_HOST_PORT` 3100, `MONGO_HOST_PORT` 27018), внутри сети всегда 3000 и 27017.
- `api`, `web`: одинаковые `Dockerfile.dev` — `node:24-alpine`, копируем корневые `package*.json` и `packages/*/package.json`, `npm ci`, исходники не копируем. Compose монтирует `.:/app` и named volumes поверх `/app/node_modules` и `/app/packages/*/node_modules` (хостовые macOS-модули не затеняют Linux-установку).
- `api`: `npm run dev -w packages/api` (tsx watch), порт 3000, `MONGO_URI=mongodb://mongo:27017/quest`. `web`: `vite --host 0.0.0.0`, порт 5173, прокси `/api → http://api:3000`, `server.hmr.clientPort = 5173`.
- Подводные камни в README: после смены зависимостей `docker compose exec api npm ci` (`--build -V` именованные тома не обновляет); если file watching не срабатывает — `CHOKIDAR_USEPOLLING=true` для Vite и `nodemon --legacy-watch -x tsx` для api (по умолчанию polling выключен).

## Загрузка данных

Загрузчики разделены, чтобы добавление вопроса не стирало команды (решение 2026-09-21). Общая обвязка — `setup/runLoader.ts`, дроп коллекции — `setup/dropCollection.ts`.

**Загрузка данных отдельно от приложения (решение 2026-09-26).** Всё, что нужно для заливки — файлы данных, загрузчики и их утилиты, — лежит в `api/src/setup/` и связано с проектом только типами `shared`, моделями Mongoose и чистыми утилитами; сервисы, роуты, игры, конфиг и подключение к базе ему запрещены правилом ESLint, и обратной связи тоже нет — приложение `setup` не импортирует. К базе загрузчик подключается сам по `MONGO_URI`. Запускается только руками с консоли сервера: в рантайме этого кода нет.

**Вопросы — JSON вне git, файл на тип игры (решение 2026-09-23).** Организатор диктует вопрос в произвольной форме, он ложится объектом в массив `setup/questions/<gameType>.json` (`history.json`, `blitz.json`, …) со своими `location` и `roomNumber`; коды на дверях лежат отдельной таблицей `setup/bindings.csv`. Файлы в `.gitignore`: в них правильные ответы, поэтому в репозиторий они не попадают и на чистой копии кладутся руками. `npm run load-questions` (`setup/loadQuestions.ts`) читает все такие файлы и для каждого вопроса пишет документ по его аудиториям (`deleteMany` + `create` нужным дискриминатором). Коллекции не пересоздаются, коды, команды и прогресс не трогаются — поэтому вопросы заводятся по одному и правятся на ходу. Незаданные поля берутся из умолчаний (`html: ''`, `acceptedAnswers: []`, флаги ответа сняты, штраф 0, без подсказок), затем проверки: корпус и аудитория, один вопрос на аудиторию по всем файлам, один `gameType` на файл, допустимое сочетание флагов ответа. Про аудиторию, на которую нет кода, загрузчик предупреждает, но вопрос пишет. Формат полей — `setup/questions/README.md`.

Тестовых вопросов-заглушек в репозитории нет (решение 2026-09-23): квест собирается сразу из финальных вопросов, поэтому команда, пересоздающая коллекции целиком, больше не нужна.

**Команды** — `npm run load-teams` (`setup/loadTeams.ts`) из таблицы организаторов `setup/teams.csv` (имя, пароль и маршрут по колонкам корпусов): хэш пароля, `currentStepIndex = 0`, маршрут прогоняется через `validateSequence` по вопросам, уже лежащим в базе. Дропает `teams` и `questionStates`, поэтому по ходу квеста не запускается. Пароли печатаются в stdout.

## Тесты (Vitest, `packages/api/test`)

- `timer.test.ts`: не начат; один открытый; `ROOM_TRANSITION` считается; `LOCATION_TRANSITION` пауза; завершён; сценарий из 3 вопросов в 2 корпусах с фиксированными датами; `running` в каждом случае; штрафы суммируются.
- `sequenceValidator.test.ts`: пустой маршрут; не начинается с `LOCATION_TRANSITION`; два перехода подряд; два вопроса подряд; заканчивается переходом; неизвестная игра; аудитории шага в разных корпусах; `ROOM_TRANSITION` между корпусами; `LOCATION_TRANSITION` внутри корпуса; валидный маршрут.
- `normalize.test.ts`: регистр, trim, двойные пробелы; `ё` и пунктуация НЕ трогаются.
- `timeAdjustment.test.ts`: сумма поправок, сумма по шагу, порядок записей по времени.
- `rotation.test.ts`: последовательность индексов 0,1,2,0…; пустая коллекция → ошибка.
- `questService.test.ts` (интеграционный, `mongodb-memory-server`, core): открытие вопроса кодом, чувствительность кода к регистру, идемпотентность повторного кода, чужой код при открытом вопросе, конкурентный двойной ввод кода, ротация вариантов между командами, финальный прогресс. Отдельно проверяется, что правильный ответ не попадает в DTO.
- `basicGame.test.ts` (интеграционный): содержимое вопроса, тот же объект в progress, штраф за неверный ответ, ответ неверной формы как неверный, нормализация верного ответа, конкурентный двойной верный ответ, подсказки по порядку и их идемпотентность, четвёртая подсказка, действия на шаге-переходе, сохранение и чтение состояния.
- `rating.test.ts`: порядок FINISHED / IN_PROGRESS / NOT_STARTED, тай-брейк.

## Порядок реализации

1. Корень: `git init`, workspaces, tsconfig, ESLint + Prettier, `shared` (enum, DTO, `LocationTitles`), docker-compose, Dockerfiles, `.env.example` → `docker compose up` поднимает 3 контейнера, hot reload работает.
2. API-каркас: config, Mongo connect, Fastify + swagger + error handler, `/health`.
3. Модели, динамические модели вариантов, реестр типов игр, загрузка данных; прогон загрузки.
4. `sequenceValidator`, `timer` и `normalize` с тестами (сначала тесты); валидатор подключается к загрузке данных и старту API.
5. Auth: login/logout, `sessionId`, плагин `authenticate` с проверкой `auth__session_replaced`.
6. `services/quest` + роуты progress / enter-code / answer / hint, `timeAdjustments`, `steps` карточки; ручная проверка через Swagger.
7. `ratingService`, плагин `adminAuth`, `/admin/rating`, `/admin/teams/:id/reset`.
8. Web: клиент (обработка 401), auth, `LoginPage`, `QuestPage` (Timer, TimeAdjustmentSummary/History, StepCards, code entry → question → hints → finished), состояния loading/error.
9. README. Коммит после каждого пункта.

## Крайние случаи

| Случай | Обработка |
|---|---|
| Повторный ввод кода открытой игры | 200, no-op, счётчик не растёт |
| Код будущего/прошлого шага или неизвестный | 400 `quest__wrong_code`, одно сообщение |
| Ввод кода при открытом вопросе | 409 `quest__question_already_open` |
| Двойной сабмит enter-code | unique index, E11000 → вернуть существующее (один слот ротации может пропуститься — допустимо) |
| Двойной сабмит верного ответа | условный update по `answeredAt $exists:false`, второй вызов возвращает progress |
| Ответ/подсказка после финиша или без открытого вопроса | 409 `quest__finished` / `quest__no_open_question` |
| Подсказка не по порядку / повторно / 4-я | 409 / идемпотентно 200 / 409 `quest__hints_exhausted` |
| Одна игра дважды в маршруте | невозможная ситуация на уровне маршрута, не обрабатывается |
| Логин с второго устройства | новый `sessionId`, первое устройство получает 401 `auth__session_replaced` и сообщение на экране логина |
| Запрос в `/api/admin/*` без токена или с неверным | 401 `auth__admin_unauthorized` |
| Шаг с несколькими играми на выбор | принимается код любой из `options`; в `questionStates` фиксируется выбранная `gameName`; остальные варианты шага дальше не участвуют |
| Невалидный маршрут в данных | `sequenceValidator` при загрузке данных и при старте API; при ошибке процесс не стартует с понятным сообщением |
| `answer`/`hint` на шаге-переходе | 409 `quest__no_open_question` |
| Рассинхрон часов клиента | клиент тикает только от `serverNow` |
| Тестирование без QR-кодов (решение 2026-09-16) | env `MOCK_CODE`: этот код открывает первую из допустимых игр следующего шага, идемпотентен при открытом вопросе и засчитывается как верный ответ на любой вопрос (решение 2026-09-21 — иначе игры, где ответ собирается из кода следующей аудитории, тестовым кодом не пройти); `POST /quest/room-number` возвращает его как есть; реальные коды продолжают работать. Не задан или пуст — выключено. При старте API пишет предупреждение в лог, при использовании — warn с командой и игрой |
| Истечение JWT посреди квеста | 401 → логин, состояние на сервере, продолжаем |

## Verification

- `docker compose up` → `http://localhost:3000/docs` открывается, `GET /api/health` 200 с `mongo: true`.
- `docker compose exec api npm run load-games` и `npm run load-teams` → в Swagger: логин тестовой командой; `enter-code` с кодом первой игры → вопрос без ответа; `enter-code` с чужим кодом → `quest__wrong_code`; неверный ответ → `correct=false`, `penaltySeconds` растёт; подсказки 0,1,2 по порядку, `hintIndex: 2` сразу → `quest__hint_order_violation`; верный ответ → `currentStepIndex` сдвинулся, `phase` стал `ROOM_TRANSITION` или `LOCATION_TRANSITION`; `answer` на шаге-переходе → `quest__no_open_question`.
- Таймер: прогнать маршрут через 2 корпуса; на шаге `LOCATION_TRANSITION` `running=false` и `elapsedSeconds` не растёт до ввода кода; на `ROOM_TRANSITION` растёт.
- Сломать маршрут в данных (два перехода подряд) → загрузка данных и старт API падают с понятной ошибкой. Unit-тесты `toTimerDto` зелёные.
- `GET /api/admin/rating` с `X-Admin-Token`: завершившие выше идущих, у идущих — по числу решённых; без токена → 401. `POST /api/admin/teams/:id/reset` возвращает команду в начало.
- Логин той же командой во второй вкладке: первая при следующем запросе получает `auth__session_replaced` и уходит на логин с сообщением.
- Web `http://localhost:5173`: логин, карточки маршрута (заблокированные, «введите код», активная, пройденные с временем и штрафом; карточки переходов с названием корпуса), ввод кода, ответ с ошибкой и штрафом, подсказки, сумма штрафов и история по клику, таймер с подписью «время остановлено» на переходе между корпусами, экран финиша, кнопка «выйти»; ошибка сети показывает баннер, при ожидании ответа кнопки disabled.
- `npm run lint` зелёный.
- Правка файла в `packages/web/src` и `packages/api/src` подхватывается без пересборки образа.
- `npm test -w packages/api` и `npm run typecheck` зелёные.
