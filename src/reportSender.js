'use strict'
import { LogLevel, WebClient } from '@slack/web-api'
import { slackToken } from './envs'

const channelId = ''

const sendFileExtensionError = async filename => {
  const client = new WebClient(slackToken, { logLevel: LogLevel.INFO })
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

const sendReportToSlack = async params => {
  const { filename, timestamp, pdfBuffer } = params
  const client = new WebClient(slackToken, { logLevel: LogLevel.INFO })
  let pdfFileName = filename.replace('.txt', '.pdf')
  try {
    await client.files.uploadV2({
      channel_id: channelId,
      file: pdfBuffer,
      filename: pdfFileName,
      thread_ts: timestamp,
    })
  } catch (error) {
    console.error('Failed to send report message to slack', error)
    throw error
  }
}

export default {
  sendFileExtensionError,
  sendReportToSlack,
}
