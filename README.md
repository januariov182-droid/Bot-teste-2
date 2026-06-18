# 🤖 Discord PIX Bot — Loja de Plugins

Bot Discord com loja permanente num canal, integrada ao **Mercado Pago** para geração de **PIX copia e cola**.

---

## Como funciona

- O bot publica **uma única mensagem** no canal configurado (ex: `#loja`).
- Essa mensagem nunca some — ao reiniciar o bot, ela é editada automaticamente.
- Quando um usuário interage (seleciona plugin, compra, verifica), tudo aparece apenas para ele (**efêmero**) — o canal permanece limpo.

```
Canal #loja:
┌─────────────────────────────────────────┐
│  🛒 Loja de Plugins                     │
│  🛡️ Anti-Raid Pro      R$ 29,90         │
│  🤖 AutoMod Ultra      R$ 19,90         │
│  🎫 Ticket System      R$ 24,90         │
│  ⭐ Level System XP    R$ 14,90         │
│  [📦 Escolha um plugin para ver ...]    │  ← select menu permanente
└─────────────────────────────────────────┘

Usuário seleciona → aparece só pra ele (ephemeral):
┌───────────────────────────────┐
│  🛡️ Anti-Raid Pro             │
│  Preço: R$ 29,90              │
│  Recursos: ...                │
│  [💚 Comprar via PIX]         │
└───────────────────────────────┘
```

---

## 📦 Arquivos

```
discord-pix-bot/
├── index.js              # Bot principal
├── mercadopago.js        # Integração Mercado Pago
├── plugins.js            # Catálogo de plugins (edite aqui)
├── store-message.json    # Gerado automaticamente (ID da mensagem da loja)
├── package.json
└── .env.example
```

---

## 🚀 Configuração

### 1. Criar o Bot no Discord

1. Acesse [discord.com/developers/applications](https://discord.com/developers/applications) → **New Application**.
2. Vá em **Bot** → **Add Bot** → copie o **Token**.
3. Em **OAuth2 → URL Generator**, marque os escopos `bot` e `applications.commands`.
4. Em **Bot Permissions**, marque: `Send Messages`, `View Channels`, `Embed Links`, `Use External Emojis`.
5. Abra a URL gerada no navegador e adicione o bot ao seu servidor.

### 2. Criar o canal da loja

Crie um canal dedicado (ex: `#loja` ou `#comprar-plugins`).
Ative o **Modo Desenvolvedor** (Configurações → Avançado), clique direito no canal e copie o **ID do canal**.

### 3. Credenciais Mercado Pago

1. Acesse [mercadopago.com.br/developers](https://www.mercadopago.com.br/developers/panel).
2. Crie uma aplicação.
3. Copie o **Access Token** (use `TEST-...` para testes, `APP_USR-...` para produção).

### 4. Configurar o .env

```bash
cp .env.example .env
```

Preencha o arquivo `.env`:

```env
DISCORD_TOKEN=seu_token_do_bot
CLIENT_ID=id_da_sua_aplicacao
STORE_CHANNEL_ID=id_do_canal_da_loja
MP_ACCESS_TOKEN=seu_access_token_mercadopago
```

### 5. Instalar e iniciar

```bash
npm install
npm start
```

Na primeira execução, o bot publica a mensagem no canal.
Nas próximas execuções, ele edita a mesma mensagem — sem duplicar.

---

## ➕ Adicionar/editar plugins

Edite `plugins.js`. Cada plugin segue este modelo:

```js
meu_plugin: {
  name: "Nome do Plugin",
  emoji: "🔥",
  price: 39.90,
  shortDesc: "Resumo para o menu (≤ 50 chars)",
  description: "Descrição completa exibida na tela de detalhes.",
  version: "v1.0.0",
  updates: "Vitalício",
  features: ["Recurso 1", "Recurso 2"],
  deliveryMessage: "Mensagem exibida no Discord após pagamento aprovado",
  downloadMessage: "Mensagem enviada por DM com link e chave do produto",
},
```

Após salvar, reinicie o bot — a mensagem da loja é editada automaticamente com o novo plugin.

---

## 🔒 Segurança

- Toda interação do usuário é **efêmera** — só ele vê, o canal fica limpo.
- Nunca commite o `.env` — adicione ao `.gitignore`.
- Use o token de **teste** do Mercado Pago durante desenvolvimento.
