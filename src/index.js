'use strict'
import buildPDFWithLabels from './PDFBuilder.js'
import validator from './requestValidator.js'
import { sendReportToSlack, sendFileExtensionError } from './reportSender.js'
import auth from './auth.js'
import busboy from 'busboy'
import path from 'path'
import fsPromise from 'fs/promises'
import fs from 'fs'
import os from 'os'

export default start = async (req, res) => {
  auth(req, res)
  reqValidator(req, res)
  const bb = busboy({ headers: req.headers })
  const uploads = {}
  const fileWrites = []
  bb.on('file', async (name, file, info) => {
    const { filename, encoding } = info
    await checkFileExtension(filename)
    console.info(`File [${name}] filename: ${filename}, encoding: ${encoding}`)
    const filepath = path.join(os.tmpdir(), name)
    uploads[name] = { file: filepath, filename }
    console.info(`Saving '${name}' to ${filepath}`)
    const writeStream = fs.createWriteStream(filepath)
    file.pipe(writeStream)
    const promise = new Promise((resolve, reject) => {
      file.on('end', () => writeStream.end())
      writeStream.on('finish', resolve)
      writeStream.on('error', reject)
    })
    fileWrites.push(promise)
  })
  bb.on('close', async () => {
    await Promise.all(fileWrites)
    await manageData({ uploads, res })
  })
  bb.end(req.rawBody)
}

const reqValidator = (req, res) => {
  const reqValidation = validator(req)
  if (!reqValidation.success)
    return res.status(reqValidation.code).json(reqValidation)
}

const checkFileExtension = async filename => {
  if (!filename.endsWith('.txt')) {
    res.status(200).send('success')
    return await sendFileExtensionError(filename)
  }
}

const manageData = async params => {
  const { uploads, res } = params
  const timestamp = res.body.ts
  for (const name in uploads) {
    const { file, filename } = uploads[name]
    const labels = await getLabelsFromFile(file)
    const formatedLabels = buildLabels(labels)
    const pdfBuffer = await buildPDFWithLabels(formatedLabels)
    await sendReportToSlack({ filename, timestamp, pdfBuffer })
    fs.unlinkSync(file)
    res.status(200).send('success')
  }
}

const getLabelsFromFile = async file => {
  const buffer = await fsPromise.readFile(file)
  const str = buffer.toString('latin1')
  const logsArray = getLabelsArrayFromFile(str)
  return logsArray
}

const getLabelsArrayFromFile = logsText => {
  const text = logsText.trim().split(/[\n\r]+/g)
  text.shift()
  const logs = text.map(log => log
    .replace(/;;/g, ';')
    .replace(/  +/g, ' '))
  return logs
}

const today = new Date()
  .toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
  .split(',')[0]

const buildLabels = labelsArray => {
  const formatedLabels = []
  for (let log of labelsArray) {
    let labelArr = log.split(';')
    let status, date
    if (labelArr.length !== 13) {
      status = 'Positivo'
      date = labelArr[9].split(' ')[0]
    } else {
      status = `${labelArr[7]} - ${labelArr[8]}`
      date = labelArr[10].split(' ')[0]
    }
    let officer = 'Fulano de Tal'
    let formatedLabel =
`AN.1 Data ${today}
Situação: ${status}
Registrado sob n°: ${labelArr[0]}
em ${date}
Oficial: ${officer}`
    formatedLabels.push([formatedLabel])
  }
  return formatedLabels
}
