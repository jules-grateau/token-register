# shellcheck shell=bash
# Catalogue de la démo EUR (D-059) : scripts/demo/seed-eur-catalog.mjs, lancé par le CI après
# chaque déploiement de la démo, ne remplit qu'un catalogue vide, en euros, et ne modifie
# jamais ce qui existe (D-055). Sourcé par run.sh : les fonctions de lib.sh sont disponibles.

seed_script="$(cd "$DIR/../demo" && { pwd -W 2> /dev/null || pwd; })/seed-eur-catalog.mjs"
seed() { APP_URL="http://localhost:$1" WAIT_SECONDS=10 node "$seed_script" 2>&1; }
snapshot() { qa_sql "$1" 'SELECT c.name, c.icon, p.name, p.price, p.icon FROM categories c LEFT JOIN products p ON p.category_id = c.id ORDER BY c.id, p.id'; }

# 1. Base neuve en euros : le catalogue est créé, au centime, avec une consigne négative.
name=qa-demo-eur
port=3131
qa_start "$name" EUR "$port"
if qa_wait_up "$name" "$port"; then
  out=$(seed "$port")
  qa_expect "EUR, base neuve : le script réussit" "$?" 0
  qa_expect_contains "EUR, base neuve : catalogue créé" "$out" "Demo catalog created: 3 categories, 11 products"
  qa_expect "EUR, base neuve : catégories" \
    "$(qa_api "$port" GET /categories | qa_json 'd.map((c) => c.name).join(", ")')" "Boissons, Restauration, Consignes"
  qa_expect "EUR, base neuve : prix en centimes" \
    "$(qa_api "$port" GET /products | qa_json 'd.map((p) => p.price).join(" ")')" "350 300 200 100 150 450 350 150 250 100 -100"
  before=$(snapshot "$name-data")
  out=$(seed "$port")
  qa_expect "EUR, deuxième passage : le script réussit" "$?" 0
  qa_expect_contains "EUR, deuxième passage : rien n'est créé" "$out" "nothing changed"
  qa_expect "EUR, deuxième passage : le catalogue est inchangé" "$(snapshot "$name-data")" "$before"
else
  qa_ko "EUR : l'instance démarre sur une base neuve" "$(qa_logs "$name")"
fi
qa_stop "$name"

# 2. Instance en euros qui a déjà un catalogue : rien n'est ajouté ni modifié.
name=qa-demo-eur-existant
port=3132
qa_start "$name" EUR "$port"
if qa_wait_up "$name" "$port"; then
  category=$(qa_api "$port" POST /categories '{"name":"Buvette"}' | qa_json 'd.id')
  qa_api "$port" POST /products "{\"name\":\"Thé\",\"price\":120,\"categoryId\":$category}" > /dev/null
  before=$(snapshot "$name-data")
  out=$(seed "$port")
  qa_expect "EUR, catalogue existant : le script réussit" "$?" 0
  qa_expect_contains "EUR, catalogue existant : rien n'est créé" "$out" "nothing changed"
  qa_expect "EUR, catalogue existant : le catalogue est inchangé" "$(snapshot "$name-data")" "$before"
else
  qa_ko "EUR : l'instance démarre" "$(qa_logs "$name")"
fi
qa_stop "$name"

# 3. Instance en jetons (mauvaise URL dans les secrets) : refusée, rien n'est créé.
name=qa-demo-jetons
port=3133
qa_start "$name" TOKEN "$port"
if qa_wait_up "$name" "$port"; then
  out=$(seed "$port")
  qa_expect "TOKEN : le script refuse l'instance" "$?" 1
  qa_expect_contains "TOKEN : la raison est donnée" "$out" "not in EUR"
  qa_expect "TOKEN : aucune catégorie créée" "$(qa_api "$port" GET /categories | qa_json 'd.length')" 0
else
  qa_ko "TOKEN : l'instance démarre" "$(qa_logs "$name")"
fi
qa_stop "$name"
