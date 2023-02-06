'use strict'
const { LogLevel, WebClient } = require('@slack/web-api')
const envs = require('./envs.js')

const channelId = 'C04HGA6RPTL'

const sendFileExtensionError = async filename => {
  const client = new WebClient(envs.slackToken, { logLevel: LogLevel.INFO })
  const message = `Erro com arquivo *${filename}*. O arquivo deve estar no formato .txt`
  try {
    await client.chat.postMessage({
      channel: channelId,
      text: message,
    })
  } catch (error) {
    console.error('Failed to send file extension message to slack', error)
    throw error
  }
}

const sendUnknownUserError = async timestamp => {
  const client = new WebClient(envs.slackToken, { logLevel: LogLevel.INFO })
  const message = `Usuário não reconhecido, não foi possível gerar o PDF.`
  try {
    await client.chat.postMessage({
      channel: channelId,
      text: message,
      thread_ts: timestamp
    })
  } catch (error) {
    console.error('Failed to send unknown user message to slack', error)
    throw error
  }
}

const sendReportToSlack = async params => {
  const { pdfExtensionFilename, timestamp, pdfBuffer } = params
  const client = new WebClient(envs.slackToken, { logLevel: LogLevel.INFO })
  try {
    await client.files.uploadV2({
      channel_id: channelId,
      file: pdfBuffer,
      filename: pdfExtensionFilename,
      thread_ts: timestamp
    })
  } catch (error) {
    console.error('Failed to send report message to slack', error)
    throw error
  }
}

module.exports = {
  sendFileExtensionError,
  sendReportToSlack,
  sendUnknownUserError
}