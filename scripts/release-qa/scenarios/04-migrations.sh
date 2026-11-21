# shellcheck shell=bash
# Commandes d'initialisation et de migration (MIGRATIONS.md) : relancées à chaque démarrage,
# elles doivent réussir plusieurs fois de suite sans modifier les données.

name=qa-migrations
port=3131
volume="$name-data"
docker volume create --label "$QA_LABEL" "$volume" > /dev/null

for run in 1 2; do
  qa_succeeds "base neuve : initialisation n°$run réussie" qa_admin "$volume" TOKEN npm run --silent prod:db:init
  qa_succeeds "base neuve : migration n°$run réussie" qa_admin "$volume" TOKEN npm run --silent prod:db:migrate
done

qa_start "$name" TOKEN "$port"
if ! qa_wait_up "$name" "$port"; then
  qa_ko "TOKEN : l'instance démarre après les migrations" "$(qa_logs "$name")"
  return 0
fi
category=$(qa_api "$port" POST /categories '{"name":"Snacks"}' | qa_json 'd.id')
product=$(qa_api "$port" POST /products "{\"name\":\"Chips\",\"price\":2,\"categoryId\":$category}")
qa_api "$port" POST /orders "{\"items\":[{\"product\":$product,\"quantity\":3,\"discountedAmount\":1}]}" > /dev/null
qa_stop "$name"

snapshot() {
  local table
  for table in settings categories products orders order_items; do
    qa_sql "$volume" "SELECT * FROM $table ORDER BY rowid"
  done
}
before=$(snapshot)
for run in 1 2; do
  qa_succeeds "base avec des données : migration n°$run réussie" qa_admin "$volume" TOKEN npm run --silent prod:db:migrate
done
qa_expect "les migrations ne modifient pas les données" "$(snapshot)" "$before"
