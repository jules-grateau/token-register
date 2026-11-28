# shellcheck shell=bash
# Démarrage impossible (D-055) : si la base ne peut pas être créée, le démarrage s'arrête (le
# conteneur sort en erreur) au lieu de lancer une appli sans tables.

name=qa-lecture-seule
port=3111
docker volume create --label "$QA_LABEL" "$name-ro" > /dev/null
# Dossier de la base monté en lecture seule : elle ne peut pas être créée.
qa_start "$name" TOKEN "$port" -v "$name-ro:/ro:ro" -e DATABASE_PATH=/ro/database.sqlite
code=$(qa_wait_exit "$name")
if [ "$code" != running ] && [ "$code" != 0 ]; then
  qa_ok "base impossible à créer : le conteneur s'arrête en erreur"
else
  qa_ko "base impossible à créer : le conteneur s'arrête en erreur" "état : $code ; $(qa_logs "$name")"
fi
if curl -fsS "http://localhost:$port/config.js" > /dev/null 2>&1; then
  qa_ko "base impossible à créer : l'appli ne répond pas" "l'API répond"
else
  qa_ok "base impossible à créer : l'appli ne répond pas"
fi
qa_stop "$name"
