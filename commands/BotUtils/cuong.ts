import { SlashCommandBuilder } from 'discord.js'

export default class {
  public data = new SlashCommandBuilder()
    .setName('cuong')
    .setDescription('rep')
    public async execute(interaction){
        await interaction.reply('Vãi lồn luôn lô li con!')
    }
}
