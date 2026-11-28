# shellcheck shell=bash
# Gestion des comptes et mots de passe (D-064), en jetons et en euros, sur des bases neuves :
#   - l'admin crée un caissier : mot de passe temporaire, identifiant déjà pris (casse ignorée)
#     refusé ;
#   - le caissier se connecte : tout est refusé (403 PASSWORD_CHANGE_REQUIRED) sauf /auth/me,
#     la déconnexion et le changement ; même mot de passe refusé ; après le changement, la
#     caisse répond et /users reste en 403 ;
#   - réinitialisation par l'admin : sessions fermées, mot de passe temporaire, de nouveau
#     bloqué jusqu'au changement ;
#   - changement de son mot de passe : la session en cours reste, les autres sont fermées ;
#   - refus : auto-désactivation, auto-rétrogradation, auto-réinitialisation (avec deux admins),
#     dernier admin actif (avec un seul admin, message exact), réinitialisation d'un compte
#     désactivé ; désactivation (sessions fermées) puis réactivation (même mot de passe) ;
#   - aucun mot de passe dans les réponses ni dans les logs du conteneur.
# Identifiants générés à chaque run et jamais affichés : les corps sont construits depuis
# l'environnement (qa_send), aucun mot de passe sur une ligne de commande.

gen() { printf 'qa-%s%s%s' "$RANDOM" "$RANDOM" "$RANDOM"; }
code_of() { printf '%s' "${1##* }"; }
body_of() { printf '%s' "${1% *}"; }
# login_as <port> <user> <password> <jar>: HTTP code of the login.
login_as() { qa_login "$1" "$2" "$3" "$4"; }
# change_pw <port> <jar> <current> <new>: « <body> <code> » of POST /auth/password.
change_pw() {
  QA_CUR="$3" QA_NEW="$4" qa_send "$1" POST /auth/password \
    '({ currentPassword: process.env.QA_CUR, newPassword: process.env.QA_NEW })' "$2"
}
# create_account <port> <user> <password> <role>: « <body> <code> » of POST /users (admin).
create_account() {
  QA_U="$2" QA_P="$3" QA_R="$4" qa_send "$1" POST /users \
    '({ username: process.env.QA_U, password: process.env.QA_P, role: process.env.QA_R })'
}
# expect_code <description> <« body code »> <code> [API code]
expect_code() {
  qa_expect "$1" "$(code_of "$2")" "$3"
  if [ -n "${4:-}" ]; then
    qa_expect "$1 ($4)" "$(body_of "$2" | qa_json 'd && d.code')" "$4"
  fi
}

port=3191
for currency in TOKEN EUR; do
  tag="$currency"
  name="qa-comptes-${currency,,}"
  volume="$name-data"
  secrets=("$INITIAL_ADMIN_PASSWORD")

  qa_start "$name" "$currency" "$port"
  if ! qa_wait_up "$name" "$port"; then
    qa_ko "$tag : l'instance démarre" "$(qa_logs "$name")"
    qa_stop "$name"
    port=$((port + 1))
    continue
  fi
  admin_id=$(qa_api "$port" GET /auth/me | qa_json 'd.user.id')

  # 1. Création d'un caissier : mot de passe temporaire.
  cashier="qa-caisse-$RANDOM"
  temp=$(gen); secrets+=("$temp")
  out=$(create_account "$port" "$cashier" "$temp" cashier)
  expect_code "$tag : l'admin crée un caissier → 201" "$out" 201
  cashier_id=$(body_of "$out" | qa_json 'd.id')
  qa_expect "$tag : le compte créé a un mot de passe temporaire" \
    "$(body_of "$out" | qa_json 'd.mustChangePassword + " " + d.role + " " + d.active')" "true cashier true"
  out=$(create_account "$port" "${cashier^^}" "$(gen)" cashier)
  expect_code "$tag : identifiant déjà pris (casse ignorée) → 409" "$out" 409 USERNAME_TAKEN
  out=$(create_account "$port" "qa-court-$RANDOM" 12345 cashier)
  expect_code "$tag : mot de passe de 5 caractères → 400" "$out" 400 PASSWORD_INVALID

  # 2. Connexion du caissier : tout est bloqué sauf me, logout et le changement.
  jar_c="$QA_COOKIES/caissier-$port.txt"
  qa_expect "$tag : le caissier se connecte avec le mot de passe temporaire" \
    "$(login_as "$port" "$cashier" "$temp" "$jar_c")" 200
  out=$(qa_status "$port" GET /categories '' "$jar_c")
  expect_code "$tag : mot de passe temporaire → GET /categories bloqué" "$out" 403 PASSWORD_CHANGE_REQUIRED
  out=$(qa_status "$port" POST /orders '{"items":[]}' "$jar_c")
  expect_code "$tag : mot de passe temporaire → POST /orders bloqué" "$out" 403 PASSWORD_CHANGE_REQUIRED
  qa_expect "$tag : /auth/me répond et signale le mot de passe temporaire" \
    "$(body_of "$(qa_status "$port" GET /auth/me '' "$jar_c")" | qa_json 'd.user.mustChangePassword')" true
  out=$(change_pw "$port" "$jar_c" "$temp" "$temp")
  expect_code "$tag : garder le mot de passe temporaire → 400" "$out" 400 SAME_PASSWORD
  out=$(change_pw "$port" "$jar_c" "mauvais-$RANDOM" "$(gen)")
  expect_code "$tag : mauvais mot de passe temporaire → 400" "$out" 400 WRONG_PASSWORD
  pass_c=$(gen); secrets+=("$pass_c")
  out=$(change_pw "$port" "$jar_c" "$temp" "$pass_c")
  expect_code "$tag : changement du mot de passe temporaire → 200" "$out" 200
  out=$(qa_status "$port" GET /categories '' "$jar_c")
  expect_code "$tag : après le changement, la caisse répond (même session)" "$out" 200
  out=$(qa_status "$port" GET /users '' "$jar_c")
  expect_code "$tag : un caissier n'a pas accès aux comptes" "$out" 403 FORBIDDEN

  # 3. Changement de son mot de passe : la session en cours reste, les autres sont fermées.
  jar_c2="$QA_COOKIES/caissier2-$port.txt"
  login_as "$port" "$cashier" "$pass_c" "$jar_c2" > /dev/null
  pass_c2=$(gen); secrets+=("$pass_c2")
  out=$(change_pw "$port" "$jar_c" "$pass_c" "$pass_c2")
  expect_code "$tag : changement de son mot de passe → 200" "$out" 200
  expect_code "$tag : la session en cours reste ouverte" "$(qa_status "$port" GET /auth/me '' "$jar_c")" 200
  expect_code "$tag : l'autre session est fermée" "$(qa_status "$port" GET /auth/me '' "$jar_c2")" 401

  # 4. Réinitialisation par l'admin : sessions fermées, de nouveau temporaire.
  temp2=$(gen); secrets+=("$temp2")
  out=$(QA_P="$temp2" qa_send "$port" POST "/users/$cashier_id/reset-password" '({ password: process.env.QA_P })')
  expect_code "$tag : réinitialisation par l'admin → 200" "$out" 200
  expect_code "$tag : la réinitialisation ferme les sessions" "$(qa_status "$port" GET /auth/me '' "$jar_c")" 401
  qa_expect "$tag : l'ancien mot de passe est refusé" "$(login_as "$port" "$cashier" "$pass_c2" "$jar_c")" 401
  qa_expect "$tag : connexion avec le mot de passe temporaire" "$(login_as "$port" "$cashier" "$temp2" "$jar_c")" 200
  out=$(qa_status "$port" GET /products '' "$jar_c")
  expect_code "$tag : de nouveau bloqué jusqu'au changement" "$out" 403 PASSWORD_CHANGE_REQUIRED
  pass_c3=$(gen); secrets+=("$pass_c3")
  expect_code "$tag : nouveau changement → 200" "$(change_pw "$port" "$jar_c" "$temp2" "$pass_c3")" 200

  # 5. Avec deux admins : refus sur son propre compte (pas la règle du dernier admin).
  admin2="qa-admin2-$RANDOM"
  temp_a2=$(gen); secrets+=("$temp_a2")
  out=$(create_account "$port" "$admin2" "$temp_a2" admin)
  admin2_id=$(body_of "$out" | qa_json 'd.id')
  jar_a2="$QA_COOKIES/admin2-$port.txt"
  login_as "$port" "$admin2" "$temp_a2" "$jar_a2" > /dev/null
  pass_a2=$(gen); secrets+=("$pass_a2")
  change_pw "$port" "$jar_a2" "$temp_a2" "$pass_a2" > /dev/null
  out=$(qa_status "$port" PATCH "/users/$admin2_id" '{"active":false}' "$jar_a2")
  expect_code "$tag : deux admins, auto-désactivation refusée" "$out" 409 SELF_ACCOUNT_CHANGE
  out=$(qa_status "$port" PATCH "/users/$admin2_id" '{"role":"cashier"}' "$jar_a2")
  expect_code "$tag : deux admins, auto-rétrogradation refusée" "$out" 409 SELF_ACCOUNT_CHANGE
  out=$(QA_P="$(gen)" qa_send "$port" POST "/users/$admin2_id/reset-password" '({ password: process.env.QA_P })' "$jar_a2")
  expect_code "$tag : auto-réinitialisation refusée" "$out" 409 SELF_PASSWORD_RESET

  # 6. Un seul admin actif : l'admin 2 passe gérant, avec le droit des comptes ajouté pour ce
  #    test seulement (aucun rôle ne l'a aujourd'hui), et tente de retirer le dernier admin.
  out=$(qa_status "$port" PATCH "/users/$admin2_id" '{"role":"manager"}')
  expect_code "$tag : l'admin 1 passe l'admin 2 en gérant" "$out" 200
  qa_sql "$volume" "INSERT OR IGNORE INTO role_permissions (role, permission) VALUES ('manager', 'users')" > /dev/null
  out=$(qa_status "$port" PATCH "/users/$admin_id" '{"active":false}' "$jar_a2")
  expect_code "$tag : un seul admin actif, désactivation refusée" "$out" 409 LAST_ACTIVE_ADMIN
  qa_expect "$tag : message exact du dernier admin" "$(body_of "$out" | qa_json 'd.error')" \
    "Il doit rester au moins un administrateur actif"
  out=$(qa_status "$port" PATCH "/users/$admin_id" '{"role":"cashier"}' "$jar_a2")
  expect_code "$tag : un seul admin actif, rétrogradation refusée" "$out" 409 LAST_ACTIVE_ADMIN
  qa_sql "$volume" "DELETE FROM role_permissions WHERE role = 'manager' AND permission = 'users'" > /dev/null
  expect_code "$tag : un gérant n'a plus accès aux comptes" \
    "$(qa_status "$port" GET /users '' "$jar_a2")" 403 FORBIDDEN

  # 7. Désactivation, réinitialisation refusée, réactivation avec le même mot de passe.
  out=$(qa_status "$port" PATCH "/users/$cashier_id" '{"active":false}')
  expect_code "$tag : désactivation du caissier → 200" "$out" 200
  expect_code "$tag : la désactivation ferme ses sessions" "$(qa_status "$port" GET /auth/me '' "$jar_c")" 401
  out=$(QA_P="$(gen)" qa_send "$port" POST "/users/$cashier_id/reset-password" '({ password: process.env.QA_P })')
  expect_code "$tag : réinitialiser un compte désactivé → 409" "$out" 409 ACCOUNT_DISABLED
  qa_expect "$tag : compte désactivé, connexion refusée" "$(login_as "$port" "$cashier" "$pass_c3" "$jar_c")" 401
  expect_code "$tag : réactivation → 200" "$(qa_status "$port" PATCH "/users/$cashier_id" '{"active":true}')" 200
  qa_expect "$tag : réactivé, il garde son mot de passe" "$(login_as "$port" "$cashier" "$pass_c3" "$jar_c")" 200

  # 8. Liste : actifs d'abord, sans aucun hash.
  list=$(qa_api "$port" GET /users)
  qa_expect "$tag : la liste donne tous les comptes" "$(printf '%s' "$list" | qa_json 'd.length')" 3
  if [[ "$list" == *scrypt* ]] || [[ "$list" == *password* ]]; then
    qa_ko "$tag : la liste ne contient ni hash ni mot de passe" "champ sensible trouvé (non affiché)"
  else
    qa_ok "$tag : la liste ne contient ni hash ni mot de passe"
  fi

  # 9. Aucun mot de passe dans les logs du conteneur.
  logs=$(docker logs "$name" 2>&1)
  leaked=0
  for secret in "${secrets[@]}"; do [[ "$logs" == *"$secret"* ]] && leaked=1; done
  if [ "$leaked" -eq 0 ]; then
    qa_ok "$tag : aucun mot de passe dans les logs"
  else
    qa_ko "$tag : aucun mot de passe dans les logs" "mot de passe trouvé (non affiché)"
  fi

  qa_stop "$name"
  port=$((port + 1))
done
