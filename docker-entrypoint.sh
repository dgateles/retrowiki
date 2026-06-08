#!/bin/sh
set -e

echo "[retrowiki] Aplicando migrações do banco…"
node migrate.mjs

echo "[retrowiki] Seed de dados base (idempotente)…"
node seed.mjs || echo "[retrowiki] Seed pulado/falhou (continuando)."

echo "[retrowiki] Iniciando servidor na porta ${PORT:-3000}…"
exec node server.js
