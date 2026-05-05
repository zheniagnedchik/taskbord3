# Незакоммиченные изменения: доски и боковая панель

Документ описывает текущее состояние рабочей копии (изменённые и новые файлы, не добавленные в коммит). База: Supabase; таблицы `boards`, `profiles`, `board_members` (ожидаемые контракты API описаны ниже).

---

## 1. Макет приложения — `src/components/layout/MainLayout.tsx`

- Подключён компонент `BoardsSidebar` из фичи boards.
- Область под хедером переведена на flex-разметку: `flex-col` на узких экранах, `lg:flex-row` на больших.
- Боковая панель показывается только для авторизованного пользователя и только когда инициализация сессии завершена (`!initializing && user`).
- Контент страницы (`<Outlet />`) обёрнут во внутренний контейнер `max-w-6xl` с сохранением прежней ограничивающей ширины для основного контента.

---

## 2. Типы — `src/features/boards/types.ts`

- **`Board`** — доска: `id`, `title`, `ownerId` (владелец соответствует `user_id` в строке таблицы `boards`).
- **`ProfileSummary`** — краткий профиль пользователя: `id`, `email`, `displayName` (может быть `null`).

---

## 3. API досок — `src/features/boards/api/boards.ts`

- **`fetchBoards()`** — выборка из `boards`: поля `id`, `title`, `user_id`, сортировка по `created_at` по убыванию; маппинг в `Board`.
- **`createBoard(title)`** — вставка строки с `title` (владелец задаётся политиками/триггерами Supabase на стороне БД); возврат созданной доски.
- **`deleteBoard(boardId)`** — удаление доски по `id`.

---

## 4. API участников и поиска — `src/features/boards/api/board-members.ts`

- Тип **`BoardSharingSnapshot`**: `ownerId`, профиль владельца `owner`, список участников `members` (без дублирования владельца в списке «members» в смысле UI — участники приходят из `board_members`).
- **`searchProfiles(query)`** — поиск в `profiles` по `email` и `display_name` через `ilike`, c санитизацией ввода от символов `%`, `_`, `\` (wildcard LIKE), объединение результатов с дедупликацией по `id`, ограничение итога.
- **`fetchBoardSharingSnapshot(boardId)`** — чтение `user_id` доски, списка `user_id` из `board_members`, загрузка профилей для владельца и всех участников; сборка снимка для UI.
- **`addBoardMember(boardId, userId)`** / **`removeBoardMember(boardId, userId)`** — вставка и удаление строк в `board_members`.

---

## 5. Хуки TanStack Query

### `src/features/boards/hooks/use-boards-query.ts`

- Ключ запроса: `boardsQueryKey = ['boards']`.
- **`useBoardsQuery(enabled)`** — загрузка списка досок.
- **`useCreateBoardMutation`** — создание доски с инвалидацией `['boards']`.
- **`useDeleteBoardMutation`** — удаление с инвалидацией `['boards']` и `['board-sharing', boardId]`.

### `src/features/boards/hooks/use-board-sharing.ts`

- **`useBoardSharingQuery(boardId, open)`** — ключ `['board-sharing', boardId]`; запрос включён при открытом диалоге и непустом `boardId`.
- **`useProfileSearchQuery(searchInput, open)`** — поиск профилей с `useDeferredValue` для ввода, ключ `['profile-search', deferred]`, `staleTime: 30_000`, активен при непустом отложенном запросе и `open`.
- **`useAddBoardMemberMutation` / `useRemoveBoardMemberMutation`** — после успеха инвалидация шаринга доски и списка досок.

---

## 6. Компоненты UI

### `src/features/boards/components/BoardsSidebar.tsx`

- Боковая панель «Boards»: только на `lg+` (`hidden lg:flex`), липкая под хедер, скролл списка.
- Загрузка списка через `useBoardsQuery(true)`, создание — `CreateBoardDialog`, настройки совместного доступа — `BoardSettingsDialog`.
- У владельца доски (`currentUserId === board.ownerId`): кнопки настройки и удаления; у остальных — плейсхолдер по ширине для выравнивания.
- Локальное состояние «выбранной» доски (`selectedId`) синхронизируется с загруженным списком (при изменении данных выбирается первая доска, если текущий выбор пропал).
- Диалог подтверждения удаления с предупреждением о необратимости и потере доступа у участников.

### `src/features/boards/components/CreateBoardDialog.tsx`

- Форма названия доски, сброс поля при закрытии, отображение ошибки мутации, блокировка при `isPending`.

### `src/features/boards/components/BoardSettingsDialog.tsx`

- Заголовок с названием доски; для `canManage` — поиск пользователей и добавление; для всех — просмотр владельца и участников.
- Поиск: исключение владельца, текущего пользователя и уже добавленных участников из результатов.
- Ошибки добавления/удаления участника выводятся в интерфейсе.

---

## 7. Замечания по интеграции

- Навигация по маршрутам приложения при клике по доске в сайдбаре в текущей реализации не подключена: выбор доски хранится только в состоянии компонента (`selectedId`), без `NavLink`/`useNavigate` к странице доски.
- Для корректной работы на стороне Supabase должны существовать RLS и схема для `boards`, `profiles`, `board_members`, а создание доски должно проставлять `user_id` владельца согласно вашим политикам.

---

*Файл отражает незакоммиченные изменения по состоянию репозитория на момент создания документа.*
