const {
  Client,
  GatewayIntentBits,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  AttachmentBuilder,
  Events,
} = require("discord.js");
const { generatePixPayment, checkPaymentStatus } = require("./mercadopago");
const { plugins } = require("./plugins");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
require("dotenv").config();

// ─── Cliente Discord ──────────────────────────────────────────────────────────
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
});

// Armazena pagamentos ativos por usuário: { userId → { pluginKey, paymentId, expiresAt } }
const activePayments = new Map();

// ─── Mensagem permanente da loja ──────────────────────────────────────────────
// O ID da mensagem é salvo em store-message.json para sobreviver a reinicializações.
// Na inicialização: se existir → edita a mensagem existente. Se não → cria uma nova.
const STORE_MSG_FILE = "./store-message.json";
const LICENSES_FILE = "./licenses.json";

function loadStoredMessageId() {
  try {
    const raw = fs.readFileSync(STORE_MSG_FILE, "utf8");
    return JSON.parse(raw).messageId || null;
  } catch {
    return null;
  }
}

function saveStoredMessageId(messageId) {
  fs.writeFileSync(STORE_MSG_FILE, JSON.stringify({ messageId }), "utf8");
}

function loadLicenses() {
  try {
    const raw = fs.readFileSync(LICENSES_FILE, "utf8");
    const data = JSON.parse(raw);
    return Array.isArray(data.licenses) ? data.licenses : [];
  } catch {
    return [];
  }
}

function saveLicenses(licenses) {
  fs.writeFileSync(LICENSES_FILE, JSON.stringify({ licenses }, null, 2), "utf8");
}

function generateLicenseKey() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const licenses = loadLicenses();

  while (true) {
    const key = Array.from({ length: 3 }, () =>
      Array.from({ length: 4 }, () => alphabet[crypto.randomInt(0, alphabet.length)]).join("")
    ).join("-");

    if (!licenses.some((license) => license.license_key === key)) {
      return key;
    }
  }
}

function issueLicense({ userId, pluginKey, plugin, paymentId }) {
  const licenses = loadLicenses();
  const licenseKey = generateLicenseKey();

  licenses.push({
    license_key: licenseKey,
    status: "unused",
    buyer_discord_id: userId,
    product_key: pluginKey,
    product: plugin.name,
    payment_id: String(paymentId),
    created_at: new Date().toISOString(),
    server_id: null,
  });

  saveLicenses(licenses);
  return licenseKey;
}

function getPluginJarPath(plugin) {
  const configuredPath = plugin.jarPath || process.env.DELIVERY_JAR_PATH;
  if (!configuredPath) return null;
  return path.resolve(__dirname, configuredPath);
}

async function sendPurchasedPlugin(user, plugin, licenseKey) {
  const jarPath = getPluginJarPath(plugin);
  const embed = new EmbedBuilder()
    .setTitle(`Seu plugin: ${plugin.name}`)
    .setDescription(
      `Obrigado pela compra!\n\n` +
      `Chave de ativacao: \`${licenseKey}\`\n\n` +
      "Coloque o arquivo .jar na pasta plugins do servidor e use a chave para ativar."
    )
    .setColor(0x57f287);

  const payload = { embeds: [embed] };

  if (jarPath && fs.existsSync(jarPath)) {
    payload.files = [
      new AttachmentBuilder(jarPath, {
        name: plugin.fileName || `${plugin.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.jar`,
      }),
    ];
  } else {
    embed.setFooter({ text: jarPath ? `Arquivo .jar nao encontrado em ${jarPath}` : "jarPath nao configurado neste plugin" });
  }

  await user.send(payload);
}

// Monta o embed e o select menu permanentes da loja
function buildStoreComponents() {
  const embed = new EmbedBuilder()
    .setTitle("🛒  Loja de Plugins")
    .setDescription(
      "Escolha um plugin no menu abaixo para ver detalhes e comprar via **PIX copia e cola**.\n\u200b"
    )
    .setColor(0x5865f2)
    .setFooter({ text: "Pagamento seguro via Mercado Pago  •  PIX instantâneo" });

  for (const [, plugin] of Object.entries(plugins)) {
    embed.addFields({
      name: `${plugin.emoji}  ${plugin.name}`,
      value: `**R$ ${plugin.price.toFixed(2).replace(".", ",")}**`,
      inline: true,
    });
  }

  const selectOptions = Object.entries(plugins).map(([key, plugin]) => ({
    label: plugin.name,
    description: `R$ ${plugin.price.toFixed(2).replace(".", ",")} — ${plugin.shortDesc}`,
    value: key,
    emoji: plugin.emoji,
  }));

  const row = new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId("select_plugin")
      .setPlaceholder("📦  Escolha um plugin para ver detalhes...")
      .addOptions(selectOptions)
  );

  return { embeds: [embed], components: [row] };
}

// Publica ou edita a mensagem permanente da loja ao iniciar
async function setupStoreMessage() {
  const channelId = process.env.STORE_CHANNEL_ID;
  if (!channelId) {
    console.error("❌ STORE_CHANNEL_ID não definido no .env");
    return;
  }

  const channel = await client.channels.fetch(channelId);
  if (!channel) {
    console.error("❌ Canal não encontrado:", channelId);
    return;
  }

  const storeContent = buildStoreComponents();
  const savedId = loadStoredMessageId();

  if (savedId) {
    try {
      const existing = await channel.messages.fetch(savedId);
      await existing.edit(storeContent);
      console.log("✅ Mensagem da loja atualizada (ID:", savedId, ")");
      return;
    } catch {
      // Mensagem foi deletada manualmente — cria uma nova
      console.warn("⚠️  Mensagem antiga não encontrada, criando nova...");
    }
  }

  const msg = await channel.send(storeContent);
  saveStoredMessageId(msg.id);
  console.log("✅ Mensagem da loja criada (ID:", msg.id, ")");
}

// ─── Ready ────────────────────────────────────────────────────────────────────
client.once(Events.ClientReady, async () => {
  console.log(`✅ Bot online como ${client.user.tag}`);
  await setupStoreMessage();
});

// ─── Interações ───────────────────────────────────────────────────────────────
client.on(Events.InteractionCreate, async (interaction) => {

  // ── Select menu: usuário escolheu um plugin ──────────────────────────────
  if (interaction.isStringSelectMenu() && interaction.customId === "select_plugin") {
    const pluginKey = interaction.values[0];
    await showPluginDetail(interaction, pluginKey);
    return;
  }

  // ── Botão: Comprar via PIX ────────────────────────────────────────────────
  if (interaction.isButton() && interaction.customId.startsWith("buy_")) {
    const pluginKey = interaction.customId.replace("buy_", "");
    await handleBuy(interaction, pluginKey);
    return;
  }

  // ── Botão: Verificar pagamento ────────────────────────────────────────────
  if (interaction.isButton() && interaction.customId.startsWith("verify_")) {
    const pluginKey = interaction.customId.replace("verify_", "");
    await handleVerify(interaction, pluginKey);
    return;
  }

  // ── Botão: Voltar → mostra detalhes do plugin novamente ──────────────────
  if (interaction.isButton() && interaction.customId.startsWith("back_")) {
    const pluginKey = interaction.customId.replace("back_", "");
    await showPluginDetail(interaction, pluginKey);
    return;
  }
});

// ─── Funções de resposta efêmera ──────────────────────────────────────────────

// Detalhes do plugin — efêmero, só o usuário vê
async function showPluginDetail(interaction, pluginKey) {
  const plugin = plugins[pluginKey];
  if (!plugin) {
    await interaction.reply({ content: "❌ Plugin não encontrado.", ephemeral: true });
    return;
  }

  const embed = new EmbedBuilder()
    .setTitle(`${plugin.emoji}  ${plugin.name}`)
    .setDescription(plugin.description)
    .setColor(0x57f287)
    .addFields(
      { name: "💰  Preço", value: `**R$ ${plugin.price.toFixed(2).replace(".", ",")}**`, inline: true },
      { name: "📦  Versão", value: plugin.version, inline: true },
      { name: "🔄  Atualizações", value: plugin.updates, inline: true },
      {
        name: "✅  Recursos incluídos",
        value: plugin.features.map((f) => `• ${f}`).join("\n"),
      }
    )
    .setFooter({ text: "Clique em Comprar para gerar seu PIX copia e cola" });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`buy_${pluginKey}`)
      .setLabel("Comprar via PIX")
      .setStyle(ButtonStyle.Success)
      .setEmoji("💚")
  );

  // Se é um select menu → reply efêmero. Se é botão de "voltar" → editReply.
  if (interaction.isStringSelectMenu()) {
    await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
  } else {
    await interaction.update({ embeds: [embed], components: [row] });
  }
}

// Gera o PIX — efêmero
async function handleBuy(interaction, pluginKey) {
  const plugin = plugins[pluginKey];
  if (!plugin) {
    await interaction.reply({ content: "❌ Plugin não encontrado.", ephemeral: true });
    return;
  }

  // Mostra "gerando..." enquanto chama o MP
  await interaction.update({
    embeds: [
      new EmbedBuilder()
        .setTitle("⏳  Gerando PIX...")
        .setDescription("Aguarde, estamos criando seu pagamento no Mercado Pago.")
        .setColor(0xfee75c),
    ],
    components: [],
  });

  try {
    const payment = await generatePixPayment({
      amount: plugin.price,
      description: `${plugin.name} — Discord Bot Store`,
      payerEmail: `${interaction.user.id}@discorduser.com`,
      externalReference: `${interaction.user.id}_${pluginKey}_${Date.now()}`,
    });

    activePayments.set(interaction.user.id, {
      pluginKey,
      paymentId: payment.id,
      expiresAt: Date.now() + 30 * 60 * 1000,
    });

    const pixCode = payment.point_of_interaction.transaction_data.qr_code;
    const expiresTimestamp = Math.floor((Date.now() + 30 * 60 * 1000) / 1000);

    const pixEmbed = new EmbedBuilder()
      .setTitle("✅  PIX gerado!")
      .setDescription("Copie o código abaixo e cole no seu banco ou app de pagamento.")
      .setColor(0x00b4d8)
      .addFields(
        { name: `${plugin.emoji}  Plugin`, value: plugin.name, inline: true },
        { name: "💰  Valor", value: `R$ ${plugin.price.toFixed(2).replace(".", ",")}`, inline: true },
        { name: "⏰  Expira", value: `<t:${expiresTimestamp}:R>`, inline: true },
        { name: "📋  PIX Copia e Cola", value: `\`\`\`${pixCode}\`\`\`` }
      )
      .setFooter({ text: `ID: ${payment.id}  •  Após pagar, clique em Verificar Pagamento` });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`verify_${pluginKey}`)
        .setLabel("Verificar Pagamento")
        .setStyle(ButtonStyle.Primary)
        .setEmoji("🔍"),
      new ButtonBuilder()
        .setCustomId(`back_${pluginKey}`)
        .setLabel("Voltar")
        .setStyle(ButtonStyle.Secondary)
        .setEmoji("◀️")
    );

    await interaction.editReply({ embeds: [pixEmbed], components: [row] });
  } catch (err) {
    console.error("Erro ao gerar PIX:", err);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`back_${pluginKey}`)
        .setLabel("Voltar")
        .setStyle(ButtonStyle.Secondary)
        .setEmoji("◀️")
    );

    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setTitle("❌  Erro ao gerar pagamento")
          .setDescription(
            `Não foi possível criar o PIX.\n\`${err.message}\`\n\nTente novamente em instantes.`
          )
          .setColor(0xed4245),
      ],
      components: [row],
    });
  }
}

// Verifica status do pagamento — efêmero
async function handleVerify(interaction, pluginKey) {
  const plugin = plugins[pluginKey];
  const active = activePayments.get(interaction.user.id);

  const rowBack = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`back_${pluginKey}`)
      .setLabel("Voltar")
      .setStyle(ButtonStyle.Secondary)
      .setEmoji("◀️")
  );

  const rowVerify = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`verify_${pluginKey}`)
      .setLabel("Verificar novamente")
      .setStyle(ButtonStyle.Primary)
      .setEmoji("🔍"),
    new ButtonBuilder()
      .setCustomId(`back_${pluginKey}`)
      .setLabel("Voltar")
      .setStyle(ButtonStyle.Secondary)
      .setEmoji("◀️")
  );

  if (!active || active.pluginKey !== pluginKey) {
    await interaction.update({
      embeds: [
        new EmbedBuilder()
          .setTitle("⚠️  Nenhum pagamento pendente")
          .setDescription("Gere um PIX antes de verificar.")
          .setColor(0xfee75c),
      ],
      components: [rowBack],
    });
    return;
  }

  if (Date.now() > active.expiresAt) {
    activePayments.delete(interaction.user.id);
    await interaction.update({
      embeds: [
        new EmbedBuilder()
          .setTitle("⌛  PIX expirado")
          .setDescription("Seu PIX expirou. Volte e gere um novo.")
          .setColor(0xed4245),
      ],
      components: [rowBack],
    });
    return;
  }

  // Mostra "verificando..." enquanto consulta o MP
  await interaction.update({
    embeds: [
      new EmbedBuilder()
        .setTitle("🔍  Verificando pagamento...")
        .setDescription("Consultando o Mercado Pago, aguarde.")
        .setColor(0xfee75c),
    ],
    components: [],
  });

  try {
    const status = await checkPaymentStatus(active.paymentId);

    if (status === "approved") {
      activePayments.delete(interaction.user.id);
      const licenseKey = issueLicense({
        userId: interaction.user.id,
        pluginKey,
        plugin,
        paymentId: active.paymentId,
      });

      let deliveryMessage = "Verifique seu DM — enviamos o arquivo .jar e sua chave de ativacao.";
      try {
        const dm = await interaction.user.createDM();
        await sendPurchasedPlugin(dm, plugin, licenseKey);
      } catch (err) {
        console.error("Erro ao enviar produto por DM:", err);
        deliveryMessage = `Nao consegui enviar DM. Sua chave e: \`${licenseKey}\``;
      }

      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setTitle("🎉  Pagamento aprovado!")
            .setDescription(
              `Obrigado, <@${interaction.user.id}>! Seu **${plugin.name}** foi liberado.\n${deliveryMessage}`
            )
            .setColor(0x57f287)
            .setFooter({ text: "Obrigado por comprar conosco!" }),
        ],
        components: [],
      });

    } else if (status === "pending" || status === "in_process") {
      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setTitle("⏳  Pagamento ainda não identificado")
            .setDescription(
              "Se você já pagou, aguarde alguns segundos e tente novamente."
            )
            .setColor(0xfee75c)
            .addFields(
              { name: "💰  Valor", value: `R$ ${plugin.price.toFixed(2).replace(".", ",")}`, inline: true },
              { name: "🔢  ID", value: `\`${active.paymentId}\``, inline: true }
            ),
        ],
        components: [rowVerify],
      });

    } else {
      activePayments.delete(interaction.user.id);
      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setTitle("❌  Pagamento recusado ou cancelado")
            .setDescription(`Status: \`${status}\`\nVolte e gere um novo PIX para tentar novamente.`)
            .setColor(0xed4245),
        ],
        components: [rowBack],
      });
    }
  } catch (err) {
    console.error("Erro ao verificar pagamento:", err);
    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setTitle("❌  Erro ao verificar")
          .setDescription(`\`${err.message}\``)
          .setColor(0xed4245),
      ],
      components: [rowVerify],
    });
  }
}

client.login(process.env.DISCORD_TOKEN);
