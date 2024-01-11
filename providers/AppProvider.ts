import type { ApplicationContract } from '@ioc:Adonis/Core/Application'
import { Client, EmbedBuilder, MessageReaction, PartialMessageReaction, PartialUser, Partials, REST, TextChannel, User } from 'discord.js'
import Env from '@ioc:Adonis/Core/Env'

export default class AppProvider {
  public bot: Client
  constructor(protected app: ApplicationContract) {}

  public register() {
    // Register your own bindings
  }

  public async boot() {
    // IoC container is ready
    const {
      default: { Client, Collection, Events, GatewayIntentBits, REST, Routes },
    } = await import('discord.js')
    const { default: Env } = await import('@ioc:Adonis/Core/Env')
    const { default: fs } = await import('node:fs')
    const { default: path } = await import('node:path')

    this.bot = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildInvites,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildEmojisAndStickers,
      ],
      partials: [Partials.Channel, Partials.Message, Partials.GuildMember, Partials.Reaction],
    })
    this.bot.commands = new Collection()
    const commandsToPushToBot = new Array()
    const token = Env.get('TOKEN')
    const clientId = Env.get('CLIENT_ID')

    //merge bot's commands

    const folderPath = path.resolve(__dirname, '..', 'commands')
    const commandFolders = fs.readdirSync(folderPath)

    for (const folder of commandFolders) {
      const commandsPath = path.join(folderPath, folder)
      if (fs.statSync(commandsPath).isDirectory()) {
        const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith('.ts'))
        for (const file of commandFiles) {
          const filePath = path.join(commandsPath, file)
          const reference = await import(filePath)
          const command = new reference.default()
          // Set a new item in the Collection with the key as the command name and the value as the exported module
          if ('data' in command && 'execute' in command) {
            this.bot.commands.set(command.data.name, command)
            commandsToPushToBot.push(command.data.toJSON())
          } else {
            console.log(
              `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`
            )
          }
        }
      }
    }

    // Construct and prepare an instance of the REST module
    const rest = new REST().setToken(token)
    // and deploy your commands!
    await this.refreshCommands(
      rest,
      Routes,
      clientId,
      Env.get('GURIKO_SERVER_ID'),
      commandsToPushToBot
    )

    //#---------interact with slash command--------------------
    await this.interactWithSlashCommand(Events.InteractionCreate)

    //#--------------login bot---------------
    await this.loginBot(Env.get('TOKEN'))
  }

  public async ready() {
    // App is ready

    //#-------------bot ready------------
    this.onBotReady()

    //#--------------event list--------------

    this.onMessageCreate()
    await this.onNewMember()
    await this.onEmojiInteract()
    await this.onMemberLeave()
  }

  public async shutdown() {
    // Cleanup, since app is going down
  }

  //#------------refresh and deploy command list
  private async refreshCommands(
    rest: REST,
    Routes: any,
    client_id: string,
    server_id: string,
    commandsToDeploy: string[]
  ) {
    try {
      console.log(`Started refreshing ${this.bot.commands.length} application (/) commands.`)
      // The put method is used to fully refresh all commands in the guild with the current set
      const data = await rest.put(Routes.applicationGuildCommands(client_id, server_id), {
        body: commandsToDeploy,
      })
      console.log(`Successfully reloaded ${data} application (/) commands.`)
    } catch (error) {
      // And of course, make sure you catch and log any errors!
      console.error(error)
    }
  }

  private async interactWithSlashCommand(event: string) {
    this.bot.on(event, async (interaction) => {
      if (!interaction.isChatInputCommand()) return
      console.log(interaction)
      const command = interaction.client.commands.get(interaction.commandName)
      if (!command) {
        console.error(`No command matching ${interaction.commandName} was found.`)
        return
      }

      try {
        await command.execute(interaction)
      } catch (error) {
        console.error(error)
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp({
            content: 'There was an error while executing this command!',
            ephemeral: true,
          })
        } else {
          await interaction.reply({
            content: 'There was an error while executing this command!',
            ephemeral: true,
          })
        }
      }
    })
  }

  private getEmojis(server_id: string, emoji_code: string) {
    const guild = this.bot.guilds.cache.get(server_id)
    const emojis = guild?.emojis.cache.find((e) => {
      return e.name == emoji_code
    })
    return emojis ?? ''
  }

  private async loginBot(token: string) {
    await this.bot.login(token)
  }

  private onBotReady(): void {
    this.bot.on('ready', () => {
      if (this.bot.user != null) {
        console.log(`Logged in as ${this.bot.user.tag}!`)
      }
    })
  }

  private onMessageCreate() {
    this.bot.on('messageCreate', async (msg) => {
      if (msg.author.id === '1194091133995864205') return

      if (msg.content === 'ping') {
        msg.reply('Pong!')
      }

      if (msg.content === 'Ai đẹp trai nhất hải quân?') {
        const emojiCode = this.getEmojis(Env.get('GURIKO_SERVER_ID'), 'TeriDance')
        const user = msg.author.id
        const mention = `<@${user}>`
        const reply = `Anh ${mention} đẹp trai nhất hải quân ${emojiCode}`
        msg.reply(reply)
      }

      if (msg.content.includes('cường') || msg.content.includes('Cường')) {
        const emojiCode = this.getEmojis(Env.get('GURIKO_SERVER_ID'), 'no')
        const reply = `Lô li con kìa anh em ${emojiCode}`
        msg.channel.send(reply)
      }

      if (msg.content == 'test') {
        const channel = this.bot.guilds.cache.get(Env.get('GURIKO_SERVER_ID'))
        const welcomeChannel = channel?.channels.cache.get(
          Env.get('GURIKO_WELCOME_CHANNEL_ID')
        ) as TextChannel
        const emoji = this.getEmojis(Env.get('GURIKO_SERVER_ID'), 'Wow')
        // const mention = `<@${member.user.id}>`
        // const userName = member.user.username
        const role = `<@&${Env.get('GURIKO_TTSN_ROLE_ID')}>`
        const verifyChannel = `<#${Env.get('GURIKO_XTDT_CHANNEL_ID')}>`
        const questionChannel = `<#${Env.get('GURIKO_QUESTION_CHANNEL_ID')}>`
        const notiChannel = `<#${Env.get('GURIKO_NOTI_CHANNEL_ID')}>`
        const howtoChannel = `<#${Env.get('GURIKO_HOW_TO_CHANNEL_ID')}>`
        const leakChannel = `<#${Env.get('GURIKO_LEAK_CHANNEL_ID')}>`
        const cuongChannel = `<#${Env.get('GURIKO_CUONG_CHANNEL_ID')}>`

        const embed = new EmbedBuilder()
          .setColor(0xc74c8c)
          .setTitle(
            `Chào Mừng {userName} Đã Đến Với Hải Quân HI3 Guriko ${emoji}${emoji}${emoji}${emoji}${emoji}${emoji}${emoji}`
          )
          .setDescription(`Xin chào {mention} đã đến với hải quân của chúng mình`)
          .setThumbnail(
            'https://static.wikia.nocookie.net/honkaiimpact3_gamepedia_en/images/e/e6/Site-logo.png/revision/latest?cb=20220202151420'
          )
          .addFields({ name: 'Hãy làm theo các bước sau đây để bắt đầu chém gió nhé!', value: ` ` })
          .addFields({
            name: `React emoji bên dưới tin nhắn này để lấy role`,
            value: `Có role ${role} này mới vào chém được nha!`,
          })
          .addFields({
            name: `Gửi ảnh hồ sơ ingame vào kênh này để được bợ đít!`,
            value: `${verifyChannel}`,
          })
          .addFields({
            name: `Trả lời câu hỏi "Đã xem phim con lợn chưa?" tại đây!`,
            value: `${questionChannel}`,
          })
          .addFields({ name: 'Tin tức về game:', value: '\u200B' })
          .addFields(
            { name: 'Thông báo', value: `${notiChannel}`, inline: true },
            { name: 'Giáo án', value: `${howtoChannel}`, inline: true },
            { name: '\u200B', value: '\u200B' },
            { name: 'Leak phiên bản mới', value: `${leakChannel}`, inline: true },
            { name: 'Linh vật của kênh', value: `${cuongChannel}`, inline: true }
          )
          .setImage(
            'https://fastcdn.hoyoverse.com/content-v2/bh3/114162/1f943da145fc2226a29007f5be6ae8f1_4879051840930930087.png'
          )
          .setTimestamp()
          .setFooter({
            text: 'Nếu là Việt Nam thì nói xin chào đi nào!',
            iconURL: 'https://i.imgur.com/AfFp7pu.png',
          })
        try {
          const sentEmbed = await welcomeChannel.send({ embeds: [embed] })
          const wowEmoji = this.getEmojis(Env.get('GURIKO_SERVER_ID'), 'Wow')
          await sentEmbed.react(wowEmoji)
        } catch (err) {
          console.log(err)
          return
        }
      }
    })
  }

  private async onNewMember() {
    this.bot.on('guildMemberAdd', async (member) => {
      const channel = this.bot.guilds.cache.get(Env.get('GURIKO_SERVER_ID'))
      const welcomeChannel = channel?.channels.cache.get(
        Env.get('GURIKO_WELCOME_CHANNEL_ID')
      ) as TextChannel
      const emoji = this.getEmojis(Env.get('GURIKO_SERVER_ID'), 'Wow')
      const mention = `<@${member.user.id}>`
      const userName = member.user.username
      const role = `<@&${Env.get('GURIKO_TTSN_ROLE_ID')}>`
      const verifyChannel = `<#${Env.get('GURIKO_XTDT_CHANNEL_ID')}>`
      const questionChannel = `<#${Env.get('GURIKO_QUESTION_CHANNEL_ID')}>`
      const notiChannel = `<#${Env.get('GURIKO_NOTI_CHANNEL_ID')}>`
      const howtoChannel = `<#${Env.get('GURIKO_HOW_TO_CHANNEL_ID')}>`
      const leakChannel = `<#${Env.get('GURIKO_LEAK_CHANNEL_ID')}>`
      const cuongChannel = `<#${Env.get('GURIKO_CUONG_CHANNEL_ID')}>`

      const embed = new EmbedBuilder()
        .setColor(0xc74c8c)
        .setTitle(
          `Chào Mừng ${userName} Đã Đến Với Hải Quân HI3 Guriko ${emoji}${emoji}${emoji}${emoji}${emoji}${emoji}${emoji}`
        )
        .setDescription(`Xin chào ${mention} đã đến với hải quân của chúng mình`)
        .setThumbnail(
          'https://static.wikia.nocookie.net/honkaiimpact3_gamepedia_en/images/e/e6/Site-logo.png/revision/latest?cb=20220202151420'
        )
        .addFields({ name: 'Hãy làm theo các bước sau đây để bắt đầu chém gió nhé!', value: ` ` })
        .addFields({
          name: `React emoji bên dưới tin nhắn này để lấy role`,
          value: `Có role ${role} này mới vào chém được nha!`,
        })
        .addFields({
          name: `Gửi ảnh hồ sơ ingame vào kênh này để được bợ đít!`,
          value: `${verifyChannel}`,
        })
        .addFields({
          name: `Trả lời câu hỏi "Đã xem phim con lợn chưa?" tại đây!`,
          value: `${questionChannel}`,
        })
        .addFields({ name: 'Tin tức về game:', value: '\u200B' })
        .addFields(
          { name: 'Thông báo', value: `${notiChannel}`, inline: true },
          { name: 'Giáo án', value: `${howtoChannel}`, inline: true },
          { name: '\u200B', value: '\u200B' },
          { name: 'Leak phiên bản mới', value: `${leakChannel}`, inline: true },
          { name: 'Linh vật của kênh', value: `${cuongChannel}`, inline: true }
        )
        .setImage(
          'https://fastcdn.hoyoverse.com/content-v2/bh3/114162/1f943da145fc2226a29007f5be6ae8f1_4879051840930930087.png'
        )
        .setTimestamp()
        .setFooter({
          text: 'Nếu là Việt Nam thì nói xin chào đi nào!',
          iconURL: 'https://i.imgur.com/AfFp7pu.png',
        })
      try {
        const wowEmoji = this.getEmojis(Env.get('GURIKO_SERVER_ID'), 'Wow')
        await welcomeChannel.send({ embeds: [embed] }).then((e) => e.react(wowEmoji))
      } catch (err) {
        console.log(err)
        return
      }
    })
  }

  private async  onMemberLeave() {
    this.bot.on('guildMemberRemove', async (member) => {
      const channel = this.bot.guilds.cache.get(Env.get('GURIKO_SERVER_ID'))
      const botChannel = channel?.channels.cache.get(
        Env.get('GURIKO_BOT_CHANNEL_ID')
      ) as TextChannel
      const emoji = this.getEmojis(Env.get('GURIKO_SERVER_ID'), 'sau')
      await botChannel.send(`**${member.user.username}** đã rời khỏi động gay ${emoji}`)
    })
  }

  private async onEmojiInteract() {
    this.bot.on('messageReactionAdd', async (reaction, user) => {
        await this.onNewMemberInteractToGetRole(reaction, user)
    })
  }

  private async onNewMemberInteractToGetRole(reaction: MessageReaction | PartialMessageReaction, user: User | PartialUser){
    if (user.bot) return
    if (reaction.message.partial) await reaction.message.fetch()
    if (reaction.partial) await reaction.fetch()
    if (
      reaction.emoji.name === 'Wow' &&
      reaction.message.embeds.length > 0 &&
      reaction.message.channelId === Env.get('GURIKO_WELCOME_CHANNEL_ID')
      && reaction.message.embeds[0].description != null
    ) {
      const mentionedMemberId = this.getUserIdFromEmbedDescrpition(reaction.message.embeds[0].description)
      const guildMember = reaction.message.guild?.members.cache.get(user.id)
      const role = reaction.message.guild?.roles.cache.get(Env.get('GURIKO_TTSN_ROLE_ID'))
      if (role && guildMember && user.id === mentionedMemberId) {
        if (guildMember.roles.cache.has(role.id)) return
        await guildMember?.roles.add(role)
        const mention = `<@${user.id}>`
        const roleMention = `<@&${Env.get('GURIKO_TTSN_ROLE_ID')}>`
        const responseEmbed = new EmbedBuilder().setDescription(
          `Chúc mừng ${mention} đã trở thành ${roleMention}`
        )
        await reaction.message.channel.send({ embeds: [responseEmbed] })
      }
      return
    }
  }

  //-------------get user id from mentioned in embed description-----------------
  private getUserIdFromEmbedDescrpition(description: string): string {
    const start = description.indexOf('<@') + 2
    const end = description.indexOf('>', start)
    const result = description.substring(start, end)
    return result
  }
}
