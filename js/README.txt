Как запустить Скрипт generatePortfolioJson.js
---------------------------------------------------
Установи Node.js (если не установлен) → https://nodejs.org/

Помести этот файл в корень проекта (рядом с папками img и data).

В терминале напиши:

bash
Копировать
Редактировать
node generatePortfolioJson.js
В data/portfolio.json появится полностью сгенерированная структура.

--------------------------------------------------------


generate_portfolio_json.py запускать так:
---------------------------------------------
bash
python generate_portfolio_json.py

или

bash
python3 generate_portfolio_json.py

# — в зависимости от того, как у тебя установлен Python.

-------------------------------------------------

    Установи зависимости сервера:
------------
npm init -y
npm i express multer cors swagger-ui-express

----------------------------------------------------------------

    (Опционально) Задай ключ админа:

# macOS/Linux
export ADMIN_KEY="my-secret-key"
# Windows (PowerShell)
$env:ADMIN_KEY="my-secret-key"

------------------------------------------------------------------


    Запусти сервер:

node server.js
-------------------------------------------------------------------

После запуска:

    Сервер поднимется на http://localhost:3000.

    Админку можно будет открыть через http://localhost:3000/admin.html.

    Swagger доступен по http://localhost:3000/api/docs.




