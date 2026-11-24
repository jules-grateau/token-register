# shellcheck shell=bash
# Journée de caisse (D-061), en euros sur une base neuve : pas de vente sans journée, une seule
# journée ouverte, totaux espèces / carte / net, fermeture figée, suppression depuis la journée.
# Puis la migration d'une base d'avant les journées : la table est ajoutée et les anciennes
# commandes sont supprimées (réponse 18 b), une seule fois.

name=qa-journee
port=3161

# api_status <METHOD> <route> [json body] : affiche « <corps> <code HTTP> », sans échouer sur 4xx.
api_status() {
  local method="$1" route="$2" body="${3:-}"
  local args=(-sS -u "$BASIC_AUTH_USER:$BASIC_AUTH_PASS" -X "$method" -w ' %{http_code}')
  [ -n "$body" ] && args+=(-H 'Content-Type: application/json' --data "$body")
  curl "${args[@]}" "http://localhost:$port/api$route"
}
# expect_refused <description> <code HTTP> <code d'erreur> <METHOD> <route> [json body]
expect_refused() {
  local desc="$1" status="$2" code="$3" out; shift 3
  out=$(api_status "$@")
  qa_expect "$desc : HTTP $status" "${out##* }" "$status"
  qa_expect "$desc : code $code" "$(printf '%s' "${out% *}" | qa_json 'd?.code')" "$code"
}

qa_start "$name" EUR "$port"
if ! qa_wait_up "$name" "$port"; then
  qa_ko "EUR : l'instance démarre" "$(qa_logs "$name")"
  return 0
fi

qa_expect "base neuve : aucune journée ouverte" "$(qa_api "$port" GET /cash-days/current | qa_json 'd.cashDay')" null
category=$(qa_api "$port" POST /categories '{"name":"Buvette"}' | qa_json 'd.id')
biere=$(qa_api "$port" POST /products "{\"name\":\"Bière\",\"price\":350,\"categoryId\":$category}")
retour=$(qa_api "$port" POST /products "{\"name\":\"Retour eco-cup\",\"price\":-100,\"categoryId\":$category}")
order() { printf '{"items":[{"product":%s,"quantity":%s,"discountedAmount":0}],"payment":%s}' "$1" "$2" "$3"; }

expect_refused "vente sans journée ouverte refusée" 400 CASH_DAY_REQUIRED \
  POST /orders "$(order "$biere" 1 '{"cashAmount":350,"cardAmount":null}')"

day=$(qa_api "$port" POST /cash-days | qa_json 'd.id')
qa_expect "la journée démarre" "$(qa_api "$port" GET /cash-days/current | qa_json 'd.cashDay?.id')" "$day"
expect_refused "seconde ouverture refusée" 409 CASH_DAY_ALREADY_OPEN POST /cash-days

# Espèces, carte, mixte et négative (consigne rendue en espèces).
qa_api "$port" POST /orders "$(order "$biere" 2 '{"cashAmount":700,"cardAmount":null}')" > /dev/null
qa_api "$port" POST /orders "$(order "$biere" 1 '{"cashAmount":null,"cardAmount":350}')" > /dev/null
first=$(qa_api "$port" POST /orders "$(order "$biere" 2 '{"cashAmount":300,"cardAmount":400}')" | qa_json 'd.id')
qa_api "$port" POST /orders "$(order "$retour" 1 '{"cashAmount":-100,"cardAmount":null}')" > /dev/null

qa_expect "synthèse : net, espèces, carte, commandes" \
  "$(qa_api "$port" GET /cash-days/current | qa_json 'const s = d.cashDay.summary; [s.total, s.cashAmount, s.cardAmount, s.orderCount].join(" ")')" \
  "1650 900 750 4"
qa_expect "historique : les 4 commandes de la journée" \
  "$(qa_api "$port" GET '/orders?page=1&pageSize=20' | qa_json 'd.pagination.totalCount')" 4

qa_expect "fermeture : total annoncé figé" \
  "$(qa_api "$port" POST /cash-days/current/close | qa_json 'd.closedAt !== null && d.announced.total')" 1650
expect_refused "seconde fermeture refusée" 409 NO_OPEN_CASH_DAY POST /cash-days/current/close
expect_refused "vente après la fermeture refusée" 400 CASH_DAY_REQUIRED \
  POST /orders "$(order "$biere" 1 '{"cashAmount":350,"cardAmount":null}')"
qa_expect "historique vide sans journée ouverte" \
  "$(qa_api "$port" GET '/orders?page=1&pageSize=20' | qa_json 'd.pagination.totalCount')" 0
qa_expect "journées passées : la journée terminée" \
  "$(qa_api "$port" GET /cash-days | qa_json 'd.map((j) => j.id + ":" + j.announced.total).join(" ")')" "$day:1650"
qa_expect "commandes de la journée terminée" \
  "$(qa_api "$port" GET "/cash-days/$day/orders?page=1&pageSize=20" | qa_json 'd.pagination.totalCount')" 4

# Suppression : refusée depuis l'historique, possible depuis la journée (réponses 14, 16, 17).
expect_refused "suppression depuis l'historique refusée" 409 CASH_DAY_CLOSED DELETE "/orders/$first"
out=$(api_status DELETE "/cash-days/$day/orders/$first")
qa_expect "suppression depuis la journée : HTTP 204" "${out##* }" 204
qa_expect "journée modifiée après la fermeture, total annoncé gardé" \
  "$(qa_api "$port" GET /cash-days | qa_json 'const j = d[0]; [j.modifiedAfterClose, j.announced.total, j.summary.total, j.summary.orderCount].join(" ")')" \
  "true 1650 950 3"
qa_stop "$name"

# Migration d'une base d'avant les journées de caisse (2.3.x), avec deux commandes.
volume=qa-journee-ancienne-data
docker volume create --label "$QA_LABEL" "$volume" > /dev/null
qa_sql "$volume" 'CREATE TABLE orders (id INTEGER PRIMARY KEY AUTOINCREMENT, date INTEGER NOT NULL, cash_amount INTEGER, card_amount INTEGER)' > /dev/null
qa_sql "$volume" 'CREATE TABLE order_items (order_id INTEGER NOT NULL, product_id INTEGER NOT NULL, quantity INTEGER NOT NULL, discountedAmount INTEGER NOT NULL DEFAULT 0, product_name TEXT, product_price INTEGER, category_name TEXT, PRIMARY KEY (order_id, product_id))' > /dev/null
qa_sql "$volume" 'INSERT INTO orders (id, date) VALUES (1, 1700000000000), (2, 1700000001000)' > /dev/null
qa_sql "$volume" "INSERT INTO order_items (order_id, product_id, quantity, product_name, product_price, category_name) VALUES (1, 1, 2, 'Bière', 3, 'Buvette'), (2, 1, 1, 'Bière', 3, 'Buvette')" > /dev/null

qa_succeeds "ancienne base : initialisation réussie" qa_admin "$volume" TOKEN npm run --silent prod:db:init
qa_succeeds "ancienne base : migration réussie" qa_admin "$volume" TOKEN npm run --silent prod:db:migrate
qa_expect "migration : table cash_days ajoutée" \
  "$(qa_sql "$volume" "SELECT COUNT(*) AS n FROM sqlite_master WHERE type = 'table' AND name = 'cash_days'" | qa_json 'd[0].n')" 1
qa_expect "migration : colonne orders.cash_day_id ajoutée" \
  "$(qa_sql "$volume" "SELECT COUNT(*) AS n FROM pragma_table_info('orders') WHERE name = 'cash_day_id'" | qa_json 'd[0].n')" 1
qa_expect "migration : anciennes commandes et lignes supprimées (réponse 18 b)" \
  "$(qa_sql "$volume" 'SELECT (SELECT COUNT(*) FROM orders) + (SELECT COUNT(*) FROM order_items) AS n' | qa_json 'd[0].n')" 0

# Relancée (chaque démarrage) : ne supprime plus rien.
qa_sql "$volume" 'INSERT INTO cash_days (id, opened_at) VALUES (1, 1700000002000)' > /dev/null
qa_sql "$volume" 'INSERT INTO orders (date, cash_day_id) VALUES (1700000003000, 1)' > /dev/null
qa_succeeds "ancienne base : migration relancée réussie" qa_admin "$volume" TOKEN npm run --silent prod:db:migrate
qa_expect "migration relancée : la commande de la journée reste" \
  "$(qa_sql "$volume" 'SELECT COUNT(*) AS n FROM orders' | qa_json 'd[0].n')" 1
