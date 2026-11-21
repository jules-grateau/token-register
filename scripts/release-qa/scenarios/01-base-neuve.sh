# shellcheck shell=bash
# Base neuve (D-055) : une instance qui démarre sur une base vide crée ses tables et rien
# d'autre, en jetons comme en euros. Un redémarrage ne modifie jamais les données existantes.
# Sourcé par run.sh : les fonctions de lib.sh sont disponibles.

port=3101
for currency in TOKEN EUR; do
  name="qa-neuve-${currency,,}"
  qa_start "$name" "$currency" "$port"
  if ! qa_wait_up "$name" "$port"; then
    qa_ko "$currency : l'instance démarre sur une base neuve" "$(qa_logs "$name")"
    port=$((port + 1))
    continue
  fi
  qa_ok "$currency : l'instance démarre sur une base neuve"
  qa_expect "$currency : aucune catégorie" "$(qa_api "$port" GET /categories | qa_json 'd.length')" 0
  qa_expect "$currency : aucun produit" "$(qa_api "$port" GET /products | qa_json 'd.length')" 0
  qa_expect "$currency : aucune commande" \
    "$(qa_api "$port" GET '/orders?page=1&pageSize=20' | qa_json 'd.pagination.totalCount')" 0
  config=$(curl -fsS -u "$BASIC_AUTH_USER:$BASIC_AUTH_PASS" "http://localhost:$port/config.js")
  qa_expect_contains "$currency : la monnaie est transmise à l'appli" "$config" "\"VITE_CURRENCY\":\"$currency\""
  qa_expect "$currency : la monnaie est enregistrée dans la base" \
    "$(qa_sql "$name-data" "SELECT value FROM settings WHERE key = 'currency'" | qa_json 'd[0]?.value')" "$currency"

  # Des données, puis un redémarrage : l'entrypoint relance l'initialisation et les migrations.
  category=$(qa_api "$port" POST /categories '{"name":"Boissons"}' | qa_json 'd.id')
  qa_api "$port" POST /products "{\"name\":\"Café\",\"price\":150,\"categoryId\":$category}" > /dev/null
  before=$(qa_sql "$name-data" 'SELECT * FROM categories, products ORDER BY products.id')
  docker restart -t 5 "$name" > /dev/null
  if qa_wait_up "$name" "$port"; then
    qa_ok "$currency : l'instance redémarre sur une base qui a des données"
    qa_expect "$currency : le redémarrage ne modifie pas les données" \
      "$(qa_sql "$name-data" 'SELECT * FROM categories, products ORDER BY products.id')" "$before"
  else
    qa_ko "$currency : l'instance redémarre sur une base qui a des données" "$(qa_logs "$name")"
  fi
  qa_stop "$name"
  port=$((port + 1))
done
