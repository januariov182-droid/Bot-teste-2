/**
 * Execute este arquivo UMA VEZ para registrar os slash commands no Discord:
 *   node deploy-commands.js
 */
const { REST, Routes, SlashCommandBuilder } = require("discord.js");
require("dotenv").config();

const commands = [
  new SlashCommandBuilder()
    .setName("loja")
    .setDescription("Abra a loja de plugins e compre via PIX"),
].map((cmd) => cmd.toJSON());

const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log("📡 Registrando slash commands...");

    // Para registrar em um servidor específico (instantâneo):
    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
      { body: commands }
    );

    // Para registrar globalmente (demora até 1 hora para propagar):
    // await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: commands });

    console.log("✅ Slash commands registrados com sucesso!");
  } catch (err) {
    console.error("❌ Erro ao registrar commands:", err);
  }
})();
