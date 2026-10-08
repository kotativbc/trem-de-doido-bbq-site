#!/usr/bin/env bash
# Teste de ponta a ponta da API PHP (requer php e curl). Usa uma cópia temporária: não toca em public/.
#   npm run test:api
set -u
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TMP="$(mktemp -d)"
PORT="${PORT:-8099}"
BASE="http://127.0.0.1:$PORT"
fail=0
cleanup() { [ -n "${PID:-}" ] && kill "$PID" 2>/dev/null; rm -rf "$TMP"; }
trap cleanup EXIT

mkdir -p "$TMP/site" && cp -r "$ROOT/public/api" "$TMP/site/api" && rm -f "$TMP/site/api/config.php"
TOKEN="$(node -e 'console.log(require("crypto").randomBytes(24).toString("hex"))')"
HASH="$(printf %s "$TOKEN" | sha256sum | cut -d' ' -f1)"

php -S "127.0.0.1:$PORT" -t "$TMP/site" >"$TMP/server.log" 2>&1 &
PID=$!
for _ in $(seq 1 30); do curl -s "$BASE/api/catalog.php" >/dev/null 2>&1 && break; sleep 0.2; done

check() { # nome esperado obtido
  if [ "$2" = "$3" ]; then echo "  ok   $1"; else echo "  FALHOU $1 (esperado $2, obtido $3)"; fail=1; fi
}
code() { curl -s -o /dev/null -w '%{http_code}' "$@"; }

CATALOG='{"categories":[{"id":"bebidas","label":"Bebidas","sundayOnly":false,"order":0,"active":true}],"products":[{"id":"p1","name":"Suco","description":"","priceCents":1200,"categoryId":"bebidas","active":true,"soldOut":false,"sundayOnly":false,"featured":false,"order":0,"addonGroups":[]}]}'
post() { curl -s -w '\n%{http_code}' -X POST "$BASE/api/catalog.php" -H "X-Editor-Token: $1" -H 'Content-Type: application/json' -d "$2"; }

echo "Sem config.php (API ainda não configurada)"
check "leitura pública funciona" 200 "$(code "$BASE/api/catalog.php")"
check "gravação recusada (503)" 503 "$(code -X POST "$BASE/api/catalog.php" -H "X-Editor-Token: $TOKEN" -d '{}')"

printf "<?php\ndefine('TDD_EDITOR_TOKEN_SHA256', '%s');\n" "$HASH" >"$TMP/site/api/config.php"

echo "Leitura"
check "cardápio vazio inicial (catalog null)" '{"revision":0,"updatedAt":null,"catalog":null}' "$(curl -s "$BASE/api/catalog.php")"

echo "Autorização"
check "verify com código certo" 200 "$(code "$BASE/api/catalog.php?action=verify" -H "X-Editor-Token: $TOKEN")"
check "verify sem código" 403 "$(code "$BASE/api/catalog.php?action=verify")"
check "verify com código errado" 403 "$(code "$BASE/api/catalog.php?action=verify" -H "X-Editor-Token: ${TOKEN:0:47}0")"
check "gravar com código errado" 403 "$(code -X POST "$BASE/api/catalog.php" -H 'X-Editor-Token: aaaaaaaaaaaaaaaaaaaa' -d "{\"baseRevision\":0,\"catalog\":$CATALOG}")"

echo "Gravação"
OUT="$(post "$TOKEN" "{\"baseRevision\":0,\"catalog\":$CATALOG}")"
check "salvar versão 1" 200 "$(echo "$OUT" | tail -1)"
check "leitura devolve o salvo" "Suco" "$(curl -s "$BASE/api/catalog.php" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>console.log(JSON.parse(s).catalog.products[0].name))')"
check "revisão antiga é recusada (409)" 409 "$(echo "$(post "$TOKEN" "{\"baseRevision\":0,\"catalog\":$CATALOG}")" | tail -1)"
check "versão seguinte aceita" 200 "$(echo "$(post "$TOKEN" "{\"baseRevision\":1,\"catalog\":$CATALOG}")" | tail -1)"
check "histórico guarda a versão anterior" 1 "$(ls "$TMP/site/api/data/history" | wc -l | tr -d ' ')"

echo "Validação do conteúdo"
BAD_PRICE="${CATALOG/1200/-5}"
check "preço negativo recusado" 422 "$(echo "$(post "$TOKEN" "{\"baseRevision\":2,\"catalog\":$BAD_PRICE}")" | tail -1)"
BAD_CAT="${CATALOG/\"categoryId\":\"bebidas\"/\"categoryId\":\"inexistente\"}"
check "categoria inexistente recusada" 422 "$(echo "$(post "$TOKEN" "{\"baseRevision\":2,\"catalog\":$BAD_CAT}")" | tail -1)"
BAD_IMG="${CATALOG/\"order\":0,\"addonGroups\"/\"imageUrl\":\"javascript:alert(1)\",\"order\":0,\"addonGroups\"}"
check "imageUrl perigosa recusada" 422 "$(echo "$(post "$TOKEN" "{\"baseRevision\":2,\"catalog\":$BAD_IMG}")" | tail -1)"
check "JSON inválido recusado" 400 "$(echo "$(post "$TOKEN" 'nao-e-json')" | tail -1)"
check "método não permitido" 405 "$(code -X DELETE "$BASE/api/catalog.php")"

echo "Proteção de arquivos"
[ -f "$TMP/site/api/data/.htaccess" ] && check ".htaccess criado em api/data" ok ok || check ".htaccess criado em api/data" ok ausente

echo "Upload de imagem"
node -e '
const zlib=require("zlib");const crc=(b)=>{let c,t=[];for(let n=0;n<256;n++){c=n;for(let k=0;k<8;k++)c=c&1?0xedb88320^(c>>>1):c>>>1;t[n]=c>>>0}let x=0xffffffff;for(const v of b)x=t[(x^v)&255]^(x>>>8);return (x^0xffffffff)>>>0};
const ch=(ty,d)=>{const l=Buffer.alloc(4);l.writeUInt32BE(d.length);const td=Buffer.concat([Buffer.from(ty),d]);const c=Buffer.alloc(4);c.writeUInt32BE(crc(td));return Buffer.concat([l,td,c])};
const ihdr=Buffer.alloc(13);ihdr.writeUInt32BE(2,0);ihdr.writeUInt32BE(2,4);ihdr[8]=8;ihdr[9]=2;
const raw=Buffer.from([0,255,0,0,255,0,0,0,255,0,0,255,0,255,0,0,255,0]);
process.stdout.write(Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),ch("IHDR",ihdr),ch("IDAT",zlib.deflateSync(raw)),ch("IEND",Buffer.alloc(0))]))' >"$TMP/ok.png"
printf '<?php echo "x"; ?>' >"$TMP/fake.png"
check "upload sem código" 403 "$(code -X POST "$BASE/api/upload.php" -F "image=@$TMP/ok.png")"
check "arquivo que não é imagem" 415 "$(code -X POST "$BASE/api/upload.php" -H "X-Editor-Token: $TOKEN" -F "image=@$TMP/fake.png;type=image/png")"
UP="$(curl -s -X POST "$BASE/api/upload.php" -H "X-Editor-Token: $TOKEN" -F "image=@$TMP/ok.png")"
URL="$(echo "$UP" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>console.log(JSON.parse(s).url||""))')"
check "upload válido devolve /uploads/..png" "yes" "$([[ "$URL" =~ ^/uploads/[a-f0-9]{24}\.png$ ]] && echo yes || echo no)"
check "imagem enviada é servida" 200 "$(code "$BASE$URL")"
[ -f "$TMP/site/uploads/.htaccess" ] && check ".htaccess criado em uploads" ok ok || check ".htaccess criado em uploads" ok ausente

echo
[ "$fail" = 0 ] && echo "API: tudo certo." || echo "API: HÁ FALHAS."
exit "$fail"
