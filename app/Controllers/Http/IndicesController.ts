// import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { REST, Routes } from 'discord.js'
import Env from '@ioc:Adonis/Core/Env'
import { Client, GatewayIntentBits } from 'discord.js'

export default class IndicesController {
  public async index() {
    const commands = [
      {
        name: 'ping',
        description: 'Replies with Pong!',
      },
    ]
    const client = new Client({ intents: [GatewayIntentBits.Guilds] })
    const rest = new REST({ version: '10' }).setToken(Env.get('TOKEN'))
    try {
      console.log('Started refreshing application (/) commands.')

      await rest.put(Routes.applicationCommands(Env.get('CLIENT_ID')), { body: commands })

      console.log('Successfully reloaded application (/) commands.')
      client.on('ready', () => {
        console.log(`Logged in as ${client.user?.tag}!`)
      })
      client.on('interactionCreate', async (interaction) => {
        if (!interaction.isChatInputCommand()) return

        if (interaction.commandName === 'ping') {
          await interaction.reply('Pong!')
        }
      })
      client.login(Env.get('TOKEN'))
    } catch (error) {
      console.error(error)
    }
  }
}
