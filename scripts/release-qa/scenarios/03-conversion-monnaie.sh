# shellcheck shell=bash
# Commande admin de conversion de monnaie (D-009, D-036, D-056), lancée comme dans
# deploy/README.md : aperçu, application, contrôle au démarrage, puis retour en jetons.

name=qa-conversion
port=3121
volume="$name-data"
qa_start "$name" TOKEN "$port"
if ! qa_wait_up "$name" "$port"; then
  qa_ko "TOKEN : l'instance démarre" "$(qa_logs "$name")"
  return 0
fi

# Catalogue et historique en jetons : un produit à 3 jetons, une consigne à -1.
category=$(qa_api "$port" POST /categories '{"name":"Boissons"}' | qa_json 'd.id')
cafe=$(qa_api "$port" POST /products "{\"name\":\"Café\",\"price\":3,\"categoryId\":$category}")
consigne=$(qa_api "$port" POST /products "{\"name\":\"Retour consigne\",\"price\":-1,\"categoryId\":$category}")
qa_api "$port" POST /orders "{\"items\":[{\"product\":$cafe,\"quantity\":2,\"discountedAmount\":0}]}" > /dev/null
order=$(qa_api "$port" POST /orders \
  "{\"items\":[{\"product\":$cafe,\"quantity\":1,\"discountedAmount\":0},{\"product\":$consigne,\"quantity\":1,\"discountedAmount\":0}]}" |
  qa_json 'd.id')
qa_stop "$name"

# Une ligne d'historique sans prix, comme dans une ancienne base (D-056) : l'appli n'en crée pas.
qa_sql "$volume" "UPDATE order_items SET product_price = NULL WHERE order_id = $order AND product_price < 0" > /dev/null
prices() { qa_sql "$volume" 'SELECT price FROM products ORDER BY id' | qa_json 'd.map((r) => r.price).join(" ")'; }
lines() {
  qa_sql "$volume" 'SELECT product_price FROM order_items ORDER BY order_id, product_id' |
    qa_json 'd.map((r) => r.product_price ?? "vide").join(" ")'
}

out=$(qa_admin "$volume" TOKEN npm run --silent prod:db:convert-currency -- --to=EUR)
qa_expect "aperçu jetons → euros : réussit" "$?" 0
qa_expect_contains "aperçu : n'écrit rien" "$out" "PREVIEW ONLY"
qa_expect_contains "aperçu : signale la ligne sans prix (D-056)" "$out" "1 ligne(s) de commande sans prix enregistré"
qa_expect "aperçu : les prix sont inchangés" "$(prices)" "3 -1"

out=$(qa_admin "$volume" TOKEN npm run --silent prod:db:convert-currency -- --to=EUR --apply)
qa_expect "conversion jetons → euros : réussit" "$?" 0
qa_expect_contains "conversion : confirmée" "$out" "Done: the database is now in EUR"
qa_expect "conversion : 3 jetons → 3,00 €, -1 → -1,00 €" "$(prices)" "300 -100"
qa_expect "conversion : historique converti, la ligne sans prix reste vide" "$(lines)" "300 300 vide"

# Contrôle au démarrage (D-009) : l'ancienne monnaie est refusée, la nouvelle démarre.
qa_start "$name" TOKEN "$port"
code=$(qa_wait_exit "$name")
if [ "$code" != running ] && [ "$code" != 0 ]; then
  qa_ok "CURRENCY=TOKEN sur une base en euros : le démarrage s'arrête"
else
  qa_ko "CURRENCY=TOKEN sur une base en euros : le démarrage s'arrête" "état : $code"
fi
qa_expect_contains "le refus explique le problème" "$(qa_logs "$name")" "Currency mismatch"
qa_stop "$name"

qa_start "$name" EUR "$port"
if qa_wait_up "$name" "$port"; then
  qa_ok "CURRENCY=EUR : l'instance convertie démarre"
  qa_expect "EUR : prix lus par l'API" \
    "$(qa_api "$port" GET /products | qa_json 'd.map((p) => p.price).join(" ")')" "300 -100"
  # Une commande payée (D-034) : le retour en jetons doit effacer le paiement (D-036).
  cafe=$(qa_api "$port" GET /products | qa_json 'JSON.stringify(d[0])')
  qa_api "$port" POST /orders \
    "{\"items\":[{\"product\":$cafe,\"quantity\":1,\"discountedAmount\":0}],\"payment\":{\"cashAmount\":100,\"cardAmount\":200}}" > /dev/null
  qa_expect "EUR : une commande payée est enregistrée" \
    "$(qa_api "$port" GET '/orders?page=1&pageSize=20' | qa_json 'd.pagination.totalCount')" 3
else
  qa_ko "CURRENCY=EUR : l'instance convertie démarre" "$(qa_logs "$name")"
fi
qa_stop "$name"

out=$(qa_admin "$volume" EUR npm run --silent prod:db:convert-currency -- --to=TOKEN)
qa_expect_contains "aperçu euros → jetons : prévient de l'effacement des paiements (D-036)" "$out" \
  "la répartition espèces / carte sera effacée"
out=$(qa_admin "$volume" EUR npm run --silent prod:db:convert-currency -- --to=TOKEN --apply)
qa_expect "conversion euros → jetons : réussit" "$?" 0
qa_expect "conversion retour : prix en jetons" "$(prices)" "3 -1"
qa_expect "conversion retour : paiements effacés" \
  "$(qa_sql "$volume" 'SELECT COUNT(*) AS n FROM orders WHERE cash_amount IS NOT NULL OR card_amount IS NOT NULL' | qa_json 'd[0].n')" 0
