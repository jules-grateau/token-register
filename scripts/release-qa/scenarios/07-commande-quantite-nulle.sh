# shellcheck shell=bash
# Commande à quantité nulle (D-062, issue #92) : l'interface retire la ligne à 0, et l'API reste
# la dernière protection. Un POST /orders avec une quantité 0 (ou négative, ou non entière) est
# refusé en 400 avec un texte lisible, jamais « [object Object] », et n'enregistre rien.

name=qa-quantite
port=3171

# api_status <METHOD> <route> [json body] : affiche « <corps> <code HTTP> », sans échouer sur 4xx.
api_status() {
  local method="$1" route="$2" body="${3:-}"
  local args=(-sS -u "$BASIC_AUTH_USER:$BASIC_AUTH_PASS" -X "$method" -w ' %{http_code}')
  [ -n "$body" ] && args+=(-H 'Content-Type: application/json' --data "$body")
  curl "${args[@]}" "http://localhost:$port/api$route"
}

qa_start "$name" EUR "$port"
if ! qa_wait_up "$name" "$port"; then
  qa_ko "EUR : l'instance démarre" "$(qa_logs "$name")"
  return 0
fi

category=$(qa_api "$port" POST /categories '{"name":"Buvette"}' | qa_json 'd.id')
biere=$(qa_api "$port" POST /products "{\"name\":\"Bière\",\"price\":350,\"categoryId\":$category}")
qa_api "$port" POST /cash-days > /dev/null
order() { printf '{"items":[{"product":%s,"quantity":%s,"discountedAmount":0}],"payment":{"cashAmount":350,"cardAmount":null}}' "$biere" "$1"; }

for quantity in 0 -1 1.5; do
  out=$(api_status POST /orders "$(order "$quantity")")
  qa_expect "quantité $quantity : HTTP 400" "${out##* }" 400
  qa_expect "quantité $quantity : texte lisible" \
    "$(printf '%s' "${out% *}" | qa_json 'd.error')" "Invalid product quantity"
done
qa_expect "aucune commande enregistrée" \
  "$(qa_api "$port" GET '/orders?page=1&pageSize=20' | qa_json 'd.pagination.totalCount')" 0

qa_expect "quantité 1 : commande enregistrée" \
  "$(qa_api "$port" POST /orders "$(order 1)" | qa_json 'Number.isInteger(d.id)')" true

qa_stop "$name"
