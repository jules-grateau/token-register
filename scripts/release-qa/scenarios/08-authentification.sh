# shellcheck shell=bash
# Authentification (D-063), en jetons et en euros, sur des bases neuves :
#   - sans INITIAL_ADMIN_* (ou mot de passe trop court), le démarrage est refusé et le message
#     nomme la variable ;
#   - /api répond 401 sans session ; le statique et /config.js restent publics ;
#   - connexion, cookie HttpOnly + SameSite=Strict (+ Secure sauf COOKIE_SECURE=false), jamais
#     le mot de passe dans un en-tête ; déconnexion puis 401 ;
#   - compte désactivé : sa session reçoit 401 aussitôt et la connexion est refusée ; un
#     changement de rôle s'applique sans reconnexion ;
#   - reset-admin-password : nouveau mot de passe, compte réactivé et admin, sessions fermées ;
#   - blocage après 5 échecs ; avertissement si BASIC_AUTH_* est encore défini.
# Identifiants générés à chaque run et jamais affichés (pas de set -x, aucune sortie ne les
# contient ; les workflows les masquent avec ::add-mask::).

port=3181
for currency in TOKEN EUR; do
  tag="$currency"
  name="qa-auth-${currency,,}"
  volume="$name-data"

  # 1. Base vide sans INITIAL_ADMIN_* : refus de démarrer, la variable est nommée.
  INITIAL_ADMIN_USERNAME='' INITIAL_ADMIN_PASSWORD='' qa_start "$name-sans-admin" "$currency" "$port"
  code=$(qa_wait_exit "$name-sans-admin")
  if [ "$code" != running ] && [ "$code" != 0 ]; then
    qa_ok "$tag, base vide sans INITIAL_ADMIN_* : le démarrage s'arrête"
  else
    qa_ko "$tag, base vide sans INITIAL_ADMIN_* : le démarrage s'arrête" "état : $code"
  fi
  qa_expect_contains "$tag : le refus nomme la variable manquante" \
    "$(docker logs "$name-sans-admin" 2>&1)" "Missing INITIAL_ADMIN_USERNAME and INITIAL_ADMIN_PASSWORD"
  qa_stop "$name-sans-admin"

  INITIAL_ADMIN_PASSWORD='12345' qa_start "$name-court" "$currency" "$port"
  code=$(qa_wait_exit "$name-court")
  if [ "$code" != running ] && [ "$code" != 0 ]; then
    qa_ok "$tag, mot de passe initial de 5 caractères : le démarrage s'arrête"
  else
    qa_ko "$tag, mot de passe initial de 5 caractères : le démarrage s'arrête" "état : $code"
  fi
  qa_expect_contains "$tag : le refus donne la règle" "$(docker logs "$name-court" 2>&1)" \
    "INITIAL_ADMIN_PASSWORD: The password must be at least 6 characters long"
  qa_stop "$name-court"

  # 2. Démarrage normal ; BASIC_AUTH_* encore défini : avertissement, sans effet.
  qa_start "$name" "$currency" "$port" -e BASIC_AUTH_USER=ancien -e BASIC_AUTH_PASS=ancien-mdp
  if ! qa_wait_up "$name" "$port"; then
    qa_ko "$tag : l'instance démarre avec INITIAL_ADMIN_* et l'admin se connecte" "$(qa_logs "$name")"
    qa_stop "$name"
    port=$((port + 1))
    continue
  fi
  qa_ok "$tag : l'instance démarre avec INITIAL_ADMIN_* et l'admin se connecte"
  qa_expect_contains "$tag : avertissement BASIC_AUTH_* au démarrage" "$(docker logs "$name" 2>&1)" \
    "BASIC_AUTH_USER / BASIC_AUTH_PASS are no longer used"
  out=$(curl -sS -w ' %{http_code}' -u ancien:ancien-mdp "http://localhost:$port/api/categories")
  qa_expect "$tag : BASIC_AUTH n'ouvre plus l'API" "${out##* }" 401

  # 3. Public : le statique et /config.js ; protégé : tout /api.
  out=$(curl -sS -w ' %{http_code}' "http://localhost:$port/")
  qa_expect "$tag : page d'accueil publique" "${out##* }" 200
  qa_expect_contains "$tag : /config.js public" "$(curl -fsS "http://localhost:$port/config.js")" \
    "\"VITE_CURRENCY\":\"$currency\""
  for route in /categories /products '/orders?page=1&pageSize=20' /cash-days/current /auth/me; do
    out=$(qa_status "$port" GET "$route" '' none)
    qa_expect "$tag : GET $route sans session → 401" "${out##* }" 401
  done
  out=$(qa_status "$port" POST /categories '{"name":"Intrus"}' none)
  qa_expect "$tag : POST /categories sans session → 401" "${out##* }" 401

  # 4. Session : cookie et appel protégé (qa_wait_up vient de se connecter).
  headers=$(cat "$QA_COOKIES/login-headers.txt")
  cookie_line=$(printf '%s' "$headers" | grep -i '^set-cookie:' | head -n 1)
  qa_expect_contains "$tag : cookie HttpOnly" "$cookie_line" "HttpOnly"
  qa_expect_contains "$tag : cookie SameSite=Strict" "$cookie_line" "SameSite=Strict"
  if [[ "$headers" == *"$INITIAL_ADMIN_PASSWORD"* ]]; then
    qa_ko "$tag : aucun en-tête ne contient le mot de passe" "mot de passe trouvé (non affiché)"
  else
    qa_ok "$tag : aucun en-tête ne contient le mot de passe"
  fi
  qa_expect "$tag : appel protégé avec la session" "$(qa_api "$port" GET /categories | qa_json 'd.length')" 0
  qa_expect "$tag : /auth/me donne l'admin" \
    "$(qa_api "$port" GET /auth/me | qa_json 'd.user.role')" admin

  # 5. Déconnexion : la session est fermée côté serveur (une copie du cookie reçoit 401).
  copy="$QA_COOKIES/copie-$port.txt"
  cp "$(qa_jar "$port")" "$copy"
  out=$(qa_status "$port" POST /auth/logout)
  qa_expect "$tag : déconnexion → 204" "${out##* }" 204
  out=$(qa_status "$port" GET /auth/me '' "$copy")
  qa_expect "$tag : après la déconnexion, l'ancien cookie → 401" "${out##* }" 401

  # 6. Un second compte (créé par reset-admin-password, instance arrêtée), puis désactivé et
  #    changé de rôle pendant que sa session est ouverte.
  second="qa-second"
  second_pass="qa-$RANDOM$RANDOM$RANDOM"
  qa_stop "$name"
  out=$(RESET_ADMIN_PASSWORD="$second_pass" qa_admin "$volume" "$currency" npm run --silent prod:db:reset-admin-password -- "$second")
  qa_expect_contains "$tag : reset-admin-password crée un admin absent" "$out" "a new admin account was created"
  qa_start "$name" "$currency" "$port"
  qa_wait_up "$name" "$port" || qa_ko "$tag : l'instance redémarre" "$(qa_logs "$name")"
  jar2="$QA_COOKIES/second-$port.txt"
  qa_expect "$tag : le second compte se connecte" "$(qa_login "$port" "$second" "$second_pass" "$jar2")" 200

  qa_sql "$volume" "UPDATE users SET role = 'qa_sans_droit' WHERE username = '$second'" > /dev/null
  out=$(qa_status "$port" GET /categories '' "$jar2")
  qa_expect "$tag : rôle sans permission → 403 sans reconnexion" "${out##* }" 403
  qa_sql "$volume" "UPDATE users SET role = 'cashier' WHERE username = '$second'" > /dev/null
  out=$(qa_status "$port" GET /categories '' "$jar2")
  qa_expect "$tag : rôle caissier → 200 sans reconnexion" "${out##* }" 200

  qa_sql "$volume" "UPDATE users SET active = 0 WHERE username = '$second'" > /dev/null
  out=$(qa_status "$port" GET /auth/me '' "$jar2")
  qa_expect "$tag : compte désactivé → sa session reçoit 401" "${out##* }" 401
  qa_expect "$tag : compte désactivé → connexion refusée" \
    "$(qa_login "$port" "$second" "$second_pass" "$jar2")" 401
  qa_expect "$tag : même message qu'un mauvais mot de passe" \
    "$(qa_json 'd.code' < "$QA_COOKIES/login-body.txt")" INVALID_CREDENTIALS

  # 7. reset-admin-password sur le compte désactivé : réactivé, admin, sessions fermées.
  qa_login "$port" > /dev/null
  copy_admin="$QA_COOKIES/admin-$port.txt"
  cp "$(qa_jar "$port")" "$copy_admin"
  new_pass="qa-$RANDOM$RANDOM$RANDOM"
  qa_stop "$name"
  out=$(RESET_ADMIN_PASSWORD='12345' qa_admin "$volume" "$currency" npm run --silent prod:db:reset-admin-password -- "$second")
  qa_expect_contains "$tag : reset avec 5 caractères refusé" "$out" "at least 6 characters"
  out=$(RESET_ADMIN_PASSWORD="$new_pass" qa_admin "$volume" "$currency" npm run --silent prod:db:reset-admin-password -- "$second")
  qa_expect_contains "$tag : reset d'un compte existant" "$out" "account active and admin"
  if [[ "$out" == *"$new_pass"* ]]; then
    qa_ko "$tag : la commande n'affiche pas le mot de passe" "mot de passe trouvé (non affiché)"
  else
    qa_ok "$tag : la commande n'affiche pas le mot de passe"
  fi
  qa_expect "$tag : compte réactivé et admin" \
    "$(qa_sql "$volume" "SELECT role, active FROM users WHERE username = '$second'" | qa_json 'd[0].role + " " + d[0].active')" "admin 1"
  INITIAL_ADMIN_USERNAME='' INITIAL_ADMIN_PASSWORD='' qa_start "$name" "$currency" "$port"
  sleep 1
  up=1
  for _ in $(seq 1 90); do
    [ "$(qa_login "$port" "$second" "$new_pass" "$jar2" 2> /dev/null)" = 200 ] && { up=0; break; }
    sleep 1
  done
  if [ "$up" -eq 0 ]; then
    qa_ok "$tag : connexion avec le nouveau mot de passe (INITIAL_ADMIN_* ignoré, des comptes existent)"
  else
    qa_ko "$tag : connexion avec le nouveau mot de passe" "$(qa_logs "$name")"
  fi
  qa_expect "$tag : l'ancien mot de passe est refusé" "$(qa_login "$port" "$second" "$second_pass" "$jar2")" 401
  out=$(qa_status "$port" GET /auth/me '' "$copy_admin")
  qa_expect "$tag : la session de l'autre admin reste ouverte" "${out##* }" 200

  # 8. 5 échecs : le 5e et le suivant (même bon mot de passe) attendent 1 minute.
  for attempt in 1 2 3 4; do
    qa_expect "$tag : échec n°$attempt → 401" "$(qa_login "$port" "$second" "mauvais-$attempt" "$jar2")" 401
  done
  qa_expect "$tag : 5e échec → 429" "$(qa_login "$port" "$second" "mauvais-5" "$jar2")" 429
  qa_expect "$tag : bon mot de passe pendant l'attente → 429" \
    "$(qa_login "$port" "$second" "$new_pass" "$jar2")" 429
  qa_stop "$name"

  # 9. Sans COOKIE_SECURE=false, le cookie porte Secure.
  QA_COOKIE_SECURE=true qa_start "$name-secure" "$currency" "$port"
  secure=""
  for _ in $(seq 1 90); do
    if [ "$(qa_login "$port" 2> /dev/null)" = 200 ]; then
      secure=$(grep -i '^set-cookie:' "$QA_COOKIES/login-headers.txt" | head -n 1); break
    fi
    sleep 1
  done
  qa_expect_contains "$tag : cookie Secure en production" "$secure" "Secure"
  qa_stop "$name-secure"

  port=$((port + 1))
done
