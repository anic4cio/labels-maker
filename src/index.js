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

export const start = async (req, res) => {
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
    await handleWithFile({ uploads, res })
  })
  bb.end(req.rawBody)
  res.status(200).send('success')
}

const reqValidator = (req, res) => {
  const reqValidation = validator(req)
  if (!reqValidation.success)
    return res.status(reqValidation.code).json(reqValidation)
}

const checkFileExtension = async filename => {
  if (!filename.endsWith('.txt')) {
    await sendFileExtensionError(filename)
    throw new error(`File [${filename}] extension not allowed`)
  }
  return res.status(200).send('success')
}

const handleWithFile = async params => {
  const { uploads, res } = params
  const timestamp = res.body.ts
  const officerName = getOfficerName(res.body)
  for (const name in uploads) {
    const { file, filename } = uploads[name]
    const registry = await getRegistryFromFile(file)
    const labels = buildLabels(registry, officerName)
    const pdfBuffer = await buildPDFWithLabels(labels)
    await sendReportToSlack({ filename, timestamp, pdfBuffer })
    fs.unlinkSync(file)
  }
}

const getOfficerName = body => {
  const email = body.message.user.profile.email
  if (!email) return undefined
  if (email === 'karina@cartoriocolorado.com.br') return 'Karina B. Alves'
  if (email === 'gabriel@cartoriocolorado.com.br') return 'Gabriel S. Chaves'
  if (email === 'isaque@cartoriocolorado.com.br') return 'Isaque Henrique B. Novato'
  if (email === 'laismarques@cartoriocolorado.com.br') return 'Laís M. S. Fidelis'
  if (email === 'victor@cartoriocolorado.com.br') return 'André Victor A. de Sousa'
  if (email === 'hellen@cartoriocolorado.com.br') return 'Hellen F. M. de Oliveira Arruda'
}

const getRegistryFromFile = async file => {
  const buffer = await fsPromise.readFile(file)
  const str = buffer.toString('utf-8')
  const registryArray = turnRegistryStringToArray(str)
  return registryArray
}

const turnRegistryStringToArray = registryText => {
  const text = registryText.trim().split(/[\n\r]+/g)
  const validRegistry = validateRegistry(text)
  const validatedRegistryArray = validRegistry.map(log => log
    .replace(/;;/g, ';')
    .replace(/  +/g, ' '))
  return validatedRegistryArray
}

const validateRegistry = registryText => {
  const fisrtItem = registryText[0]
  const firstField = fisrtItem.split(';')
  if (firstField[0] === 'REGISTRO') registryText.shift()
  return registryText
}

const today = new Date()
  .toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
  .split(' ')[0]

const buildLabels = (registryArray, officerName) => {
  const formatedLabels = []
  for (let registry of registryArray) {
    let label = registry.split(';')
    let status, date
    if (label.length !== 13) {
      status = label[7]
      date = label[9].split(' ')[0]
    } else {
      status = `${label[7]} - ${label[8]}`
      date = label[10].split(' ')[0]
    }
    let formatedLabel =
`AN.1 Data ${today}
Situação: ${status}
Registrado sob n°: ${label[0]} em ${date}

Oficial: ${officerName}`
    formatedLabels.push(formatedLabel)
  }
  return formatedLabels
}
