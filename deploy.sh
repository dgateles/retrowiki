#!/usr/bin/env bash
#
# [LEGADO] Build + deploy da landing estática para host FTP.
#
# A landing AGORA roda em Docker (mesmo Coolify do painel/backend) via
# docker-compose.coolify.yml service `landing`. ISR atualiza produtos em ~5min
# sem precisar rodar este script.
#
# Este script segue funcionando para o caso de você querer voltar pra hosting
# estático em emergência — mas exige reverter next.config.ts pra output:'export'
# e re-adicionar force-static nas routes de sitemap/robots.
#
# Lê credenciais de ./.env (FTP_HOST, FTP_USER, FTP_PASS, FTP_PATH).
# Requer `lftp` instalado (macOS: `brew install lftp`).
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$SCRIPT_DIR/.env"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "error: .env not found at $ENV_FILE"
  echo "create it with FTP_HOST, FTP_USER, FTP_PASS, FTP_PATH"
  exit 1
fi

# shellcheck disable=SC1090
source "$ENV_FILE"

for var in FTP_HOST FTP_USER FTP_PASS; do
  if [[ -z "${!var:-}" ]]; then
    echo "error: $var not set in .env"
    exit 1
  fi
done

FTP_PATH="${FTP_PATH:-/httpdocs}"

if ! command -v lftp &>/dev/null; then
  echo "error: lftp not installed."
  echo "  macOS:  brew install lftp"
  echo "  Debian: sudo apt install lftp"
  echo "  Arch:   sudo pacman -S lftp"
  exit 1
fi

# Resolve gerenciador de pacotes preferido (npm/yarn/pnpm)
if [[ -f "$SCRIPT_DIR/yarn.lock" ]]; then
  PKG_CMD="yarn build"
elif [[ -f "$SCRIPT_DIR/pnpm-lock.yaml" ]]; then
  PKG_CMD="pnpm build"
else
  PKG_CMD="npm run build"
fi

echo ":: Building (${PKG_CMD})..."
( cd "$SCRIPT_DIR" && eval "$PKG_CMD" )

OUT_DIR="$SCRIPT_DIR/out"
if [[ ! -d "$OUT_DIR" ]]; then
  echo "error: no 'out/' directory after build."
  echo "       check that next.config.ts has output: 'export'"
  exit 1
fi

echo ":: Uploading to $FTP_HOST:$FTP_PATH..."

# Comandos do lftp em arquivo temp — evita problemas com caracteres
# especiais na senha (#, $, etc.) e paths com espaços (Meus Projetos).
LFTP_SCRIPT="$(mktemp)"
trap 'rm -f "$LFTP_SCRIPT"' EXIT

cat > "$LFTP_SCRIPT" <<EOF
set ssl:verify-certificate false
set ftp:ssl-allow yes
open -u "$FTP_USER","$FTP_PASS" "ftp://$FTP_HOST"
cd "$FTP_PATH"
mirror --reverse --delete --verbose --parallel=4 "$OUT_DIR" .
# Fix de permissões: muitos hosts (Plesk/cPanel) fazem upload com 600/640
# por padrão e o usuário do Nginx não consegue ler. Forçamos 0755 recursivo.
# (Arquivos com bit execute extra é inofensivo para o servidor web.)
chmod -R 0755 .
quit
EOF

lftp -f "$LFTP_SCRIPT"

echo ":: Deploy complete."
