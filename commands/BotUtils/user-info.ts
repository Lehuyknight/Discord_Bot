import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js'

export default class {
  public data = new SlashCommandBuilder()
    .setName('in4')
    .setDescription('Show user info')
    
    public async execute(interaction: ChatInputCommandInteraction){
        await interaction.reply('Ping!')
    }
}
