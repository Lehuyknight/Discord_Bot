/*
|--------------------------------------------------------------------------
| Validating Environment Variables
|--------------------------------------------------------------------------
|
| In this file we define the rules for validating environment variables.
| By performing validation we ensure that your application is running in
| a stable environment with correct configuration values.
|
| This file is read automatically by the framework during the boot lifecycle
| and hence do not rename or move this file to a different location.
|
*/

import Env from '@ioc:Adonis/Core/Env'

export default Env.rules({
  HOST: Env.schema.string({ format: 'host' }),
  PORT: Env.schema.number(),
  APP_KEY: Env.schema.string(),
  APP_NAME: Env.schema.string(),
  DRIVE_DISK: Env.schema.enum(['local'] as const),
  NODE_ENV: Env.schema.enum(['development', 'production', 'test'] as const),
  CLIENT_ID: Env.schema.string(),
  TOKEN: Env.schema.string(),
  CSGO_SERVER_ID: Env.schema.string(),
  GURIKO_SERVER_ID: Env.schema.string(),
  GURIKO_WELCOME_CHANNEL_ID: Env.schema.string(),
  GURIKO_TTSN_ROLE_ID: Env.schema.string(),
  GURIKO_XTDT_CHANNEL_ID: Env.schema.string(),
  GURIKO_QUESTION_CHANNEL_ID: Env.schema.string(),
  GURIKO_NOTI_CHANNEL_ID: Env.schema.string(),
  GURIKO_LEAK_CHANNEL_ID: Env.schema.string(),
  GURIKO_HOW_TO_CHANNEL_ID: Env.schema.string(),
  GURIKO_CUONG_CHANNEL_ID: Env.schema.string()
})
