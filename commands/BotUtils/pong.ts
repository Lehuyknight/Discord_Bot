import { SlashCommandBuilder } from 'discord.js'

export default class {
  public data = new SlashCommandBuilder()
    .setName('pong')
    .setDescription('rep')
    public async execute(interaction){
        await interaction.reply('Ping!')
    }
}
