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
# D-061 : une journée terminée et une journée ouverte, chacune avec une commande.
qa_api "$port" POST /cash-days > /dev/null
qa_api "$port" POST /orders "{\"items\":[{\"product\":$product,\"quantity\":3,\"discountedAmount\":1}]}" > /dev/null
qa_api "$port" POST /cash-days/current/close > /dev/null
qa_api "$port" POST /cash-days > /dev/null
qa_api "$port" POST /orders "{\"items\":[{\"product\":$product,\"quantity\":1,\"discountedAmount\":0}]}" > /dev/null
qa_stop "$name"

snapshot() {
  local table
  for table in settings categories products cash_days orders order_items roles role_permissions; do
    qa_sql "$volume" "SELECT * FROM $table ORDER BY rowid"
  done
  # Comptes (D-063) : jamais le hash du mot de passe dans une sortie.
  qa_sql "$volume" 'SELECT id, role, active, must_change_password FROM users ORDER BY id'
}
before=$(snapshot)
for run in 1 2; do
  qa_succeeds "base avec des données : migration n°$run réussie" qa_admin "$volume" TOKEN npm run --silent prod:db:migrate
done
qa_expect "les migrations ne modifient pas les données" "$(snapshot)" "$before"
