import { SlashCommandBuilder } from 'discord.js'

export default class {
  public data = new SlashCommandBuilder()
    .setName('ping')
    .setDescription('rep')
    public async execute(interaction){
        await interaction.reply('Pong!')
    }
}
