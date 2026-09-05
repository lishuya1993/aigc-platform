#!/usr/bin/env bash
set -euo pipefail

release="${1:?release directory required}"
app_root=/opt/aigc-platform
www="$app_root/www"
backup="$app_root/backups/$(date +%Y%m%d%H%M%S)"
stage="$(mktemp -d "$app_root/releases/stage.XXXXXX")"

cleanup() { rm -rf "$stage"; }
trap cleanup EXIT

test -f "$release/app.jar"
test -f "$release/web.zip"
test -f "$release/admin.zip"
test -f "$release/aigc_usage_report.sql"
test -f "$release/aigc_app_user_management.sql"
python3 -m zipfile -t "$release/web.zip" >/dev/null
python3 -m zipfile -t "$release/admin.zip" >/dev/null

mkdir -p "$stage/web" "$stage/admin" "$backup"
python3 -m zipfile -e "$release/web.zip" "$stage/web" >/dev/null
python3 -m zipfile -e "$release/admin.zip" "$stage/admin" >/dev/null
test -f "$stage/web/index.html"
test -f "$stage/admin/index.html"

# TTS files are generated in the user frontend root and must survive a frontend release.
if [[ -d "$www/web/tts" ]]; then
  cp -a "$www/web/tts" "$stage/web/"
fi

cp -a "$app_root/app.jar" "$backup/app.jar"
cp -a "$www/web" "$backup/web"
cp -a "$www/admin" "$backup/admin"
cp -a "$release" "$backup/release-manifest"

# These scripts only insert menus and permissions with stable IDs, so they are safe to rerun.
for sql_file in aigc_usage_report.sql aigc_app_user_management.sql; do
  docker exec -i aigc-mysql sh -c 'mysql --default-character-set=utf8mb4 -uroot -p"$MYSQL_ROOT_PASSWORD" ry_vue_plus' < "$release/$sql_file"
done

mv "$www/web" "$backup/web-live"
mv "$stage/web" "$www/web"
mv "$www/admin" "$backup/admin-live"
mv "$stage/admin" "$www/admin"
install -m 0644 "$release/app.jar" "$app_root/app.jar.new"
mv -f "$app_root/app.jar.new" "$app_root/app.jar"

docker restart aigc-app >/dev/null
for attempt in $(seq 1 30); do
  if curl -fsS http://127.0.0.1:8080/aigc/features >/dev/null; then
    usage_response="$(curl -fsS http://127.0.0.1:8080/aigc/admin/usage/daily)"
    if grep -q '"code":401' <<<"$usage_response"; then
      printf 'DEPLOY_SUCCESS backup=%s usage_endpoint=protected\n' "$backup"
      exit 0
    fi
  fi
  sleep 2
done

printf 'Deployment health check failed. Backup: %s\n' "$backup" >&2
exit 1
