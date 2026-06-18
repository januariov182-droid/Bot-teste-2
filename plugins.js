/**
 * Catálogo de plugins à venda.
 * Edite este arquivo para adicionar, remover ou alterar plugins.
 *
 * Campos obrigatórios:
 *   name          — Nome exibido na loja
 *   emoji         — Emoji que aparece ao lado do nome
 *   price         — Preço em R$ (número)
 *   shortDesc     — Descrição curta (aparece no select menu, máx. ~50 chars)
 *   description   — Descrição longa (aparece na página de detalhes)
 *   version       — Versão atual do plugin
 *   updates       — Política de atualizações
 *   features      — Array de strings com recursos incluídos
 *   deliveryMessage   — Mensagem mostrada no Discord após aprovação
 *   downloadMessage   — Mensagem enviada via DM com o link/chave do produto
 *   jarPath       — Caminho do arquivo .jar enviado apos o pagamento
 *   fileName      — Nome opcional do arquivo enviado no Discord
 */
const plugins = {
  // ── Plugin 1 ──────────────────────────────────────────────────────────────
  anti_raid: {
    name: "Anti-Raid Pro",
    emoji: "🛡️",
    price: 29.9,
    jarPath: "C:/Users/Vnz/.gemini/antigravity/scratch/VnSpawners/target/VnSpawners-1.0-SNAPSHOT.jar",
    fileName: "VnSpawners.jar",
    shortDesc: "Proteção avançada contra raids e invasões",
    description:
      "Proteja seu servidor com detecção inteligente de raids em tempo real. " +
      "O **Anti-Raid Pro** bloqueia automaticamente contas suspeitas, aplica lockdown " +
      "instantâneo e notifica moderadores, tudo sem intervenção manual.",
    version: "v2.4.1",
    updates: "Vitalício",
    features: [
      "Detecção de raid por padrão de entrada",
      "Lockdown automático de canais",
      "Lista branca de usuários confiáveis",
      "Log detalhado de ações",
      "Suporte a webhooks de alerta",
    ],
    deliveryMessage:
      "Verifique seu DM — enviamos o link de download e a chave de licença.",
    downloadMessage:
      "🎉 **Anti-Raid Pro** — Obrigado pela compra!\n\n" +
      "🔗 **Download:** https://sua-loja.com/download/anti-raid-pro\n" +
      "🔑 **Chave:** `ANTI-XXXX-XXXX-XXXX` *(substitua por chave real no código)*\n\n" +
      "📖 Documentação: https://sua-loja.com/docs/anti-raid-pro",
  },

  // ── Plugin 2 ──────────────────────────────────────────────────────────────
  auto_mod: {
    name: "AutoMod Ultra",
    emoji: "🤖",
    price: 19.9,
    jarPath: "C:/Users/Vnz/Downloads/plugins/AutoModUltra.jar",
    fileName: "AutoModUltra.jar",
    shortDesc: "Moderação automática com IA e filtros avançados",
    description:
      "O **AutoMod Ultra** usa filtros por expressões regulares e análise semântica " +
      "para capturar spam, links maliciosos, palavrões e flood antes que prejudiquem " +
      "a experiência do seu servidor.",
    version: "v1.8.0",
    updates: "12 meses",
    features: [
      "Filtro de palavrões configurável",
      "Detecção de spam e flood",
      "Bloqueio de convites externos",
      "Sistema de punições progressivas (warn → mute → ban)",
      "Painel de configuração via comandos",
    ],
    deliveryMessage:
      "Verifique seu DM — enviamos o link de download e a chave de licença.",
    downloadMessage:
      "🎉 **AutoMod Ultra** — Obrigado pela compra!\n\n" +
      "🔗 **Download:** https://sua-loja.com/download/automod-ultra\n" +
      "🔑 **Chave:** `AMOD-XXXX-XXXX-XXXX` *(substitua por chave real no código)*\n\n" +
      "📖 Documentação: https://sua-loja.com/docs/automod-ultra",
  },

  // ── Plugin 3 ──────────────────────────────────────────────────────────────
  ticket_system: {
    name: "Ticket System",
    emoji: "🎫",
    price: 24.9,
    jarPath: "C:/Users/Vnz/Downloads/plugins/TicketSystem.jar",
    fileName: "TicketSystem.jar",
    shortDesc: "Sistema completo de suporte por tickets",
    description:
      "Crie um canal de suporte profissional com o **Ticket System**. " +
      "Os usuários abrem tickets via botão, escolhem a categoria e interagem " +
      "com a equipe em canais privados. Inclui transcrição de histórico em HTML.",
    version: "v3.1.2",
    updates: "Vitalício",
    features: [
      "Abertura de ticket via botão interativo",
      "Categorias de suporte personalizáveis",
      "Canais privados por usuário",
      "Transcrição automática em HTML ao fechar",
      "Atribuição de staff ao ticket",
    ],
    deliveryMessage:
      "Verifique seu DM — enviamos o link de download e a chave de licença.",
    downloadMessage:
      "🎉 **Ticket System** — Obrigado pela compra!\n\n" +
      "🔗 **Download:** https://sua-loja.com/download/ticket-system\n" +
      "🔑 **Chave:** `TICK-XXXX-XXXX-XXXX` *(substitua por chave real no código)*\n\n" +
      "📖 Documentação: https://sua-loja.com/docs/ticket-system",
  },

  // ── Plugin 4 ──────────────────────────────────────────────────────────────
  level_system: {
    name: "Level System XP",
    emoji: "⭐",
    price: 0.01,
    jarPath: "C:\Users\Vnz\Desktop\VnPluginsVenda\VnSpawners-1.0-SNAPSHOT.jar",
    fileName: "LevelSystemXP.jar",
    shortDesc: "Sistema de XP e ranking para engajar membros",
    description:
      "Engaje sua comunidade com o **Level System XP**. Membros ganham XP ao enviar " +
      "mensagens e interagir em canais de voz. Ao subir de nível, cargos são " +
      "atribuídos automaticamente e um anúncio é feito no servidor.",
    version: "v1.5.3",
    updates: "6 meses",
    features: [
      "XP por mensagens e tempo em voz",
      "Leaderboard global do servidor",
      "Cargos automáticos por nível",
      "Multiplicadores de XP por cargo",
      "Comando /perfil com card personalizado",
    ],
    deliveryMessage:
      "Verifique seu DM — enviamos o link de download e a chave de licença.",
    downloadMessage:
      "🎉 **Level System XP** — Obrigado pela compra!\n\n" +
      "🔗 **Download:** https://sua-loja.com/download/level-system\n" +
      "🔑 **Chave:** `LEVL-XXXX-XXXX-XXXX` *(substitua por chave real no código)*\n\n" +
      "📖 Documentação: https://sua-loja.com/docs/level-system",
  },
};

module.exports = { plugins };
