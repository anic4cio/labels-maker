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
  const body = {}, uploads = {}, fileWrites = []
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
  bb.on('field', async (fieldname, val) => {
    body[fieldname] = val
  })
  bb.on('close', async () => {
    await Promise.all(fileWrites)
    // await handleWithFile({ uploads, body })
    console.log(body)
    res.status(200).send('success')
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
    await sendFileExtensionError(filename)
    throw new error(`File [${filename}] extension not allowed`)
  }
  return res.status(200).send('success')
}

// const handleWithFile = async params => {
//   const { uploads, body } = params
//   const timestamp = body.message.ts
//   const message = body.message
//   const officerName = await getOfficerName(message)
//   if (!officerName) return
//   for (const name in uploads) {
//     const { file, filename } = uploads[name]
//     const registryArray = await getRegistryFromFile(file)
//     const registryFields = getRegistryFields(registryArray)
//     const labels = buildLabels(registryFields, officerName)
//     const pdfBuffer = await buildPDFWithLabels(labels)
//     const pdfExtensionFilename = renameFile(filename)
//     await sendReportToSlack({ pdfExtensionFilename, timestamp, pdfBuffer })
//     fs.unlinkSync(file)
//   }
// }

const renameFile = filename => filename.replace('.txt', '.pdf')

const getOfficerName = async message => {
  const id = message.user.id
  const timestamp = message.ts
  const names = [
    ['1', 'Aline'],
    ['2', 'Bruna'],
    ['3', 'Raquel'],
    ['4', 'Julia'],
    ['5', 'Luana'],
    ['6', 'Monica'],
  ]
  try {
    return names.find(name => name[0] === id)[1]
  } catch (err) {
    console.error(err)
    await sendUnknownUserError(timestamp)
    return undefined
  }
}

const getRegistryFromFile = async file => {
  const buffer = await fsPromise.readFile(file)
  const str = buffer.toString('utf-8')
  const registryArray = turnRegistryStringToArray(str)
  return registryArray.sort()
}

const turnRegistryStringToArray = registryText => {
  const text = registryText.trim().split(/[\n\r]+/g)
  const sanitizedRegistry = sanitizeContent(text)
  return sanitizedRegistry.map(log =>
    log.replaceAll(/;;/g, ';').replaceAll(/  +/g, ' ')
  )
}

const sanitizeContent = registryText => {
  const fisrtItem = registryText[0]
  const firstField = fisrtItem.split(';')
  if (firstField[0] === 'REGISTRO') registryText.shift()
  return registryText
}

const today = new Date()
  .toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
  .split(' ')[0].replace(',', '')

const getRegistryFields = registryArray => {
  return registryArray.map(register => {
    const registerArray = register.split(';')
    const registerNumber = registerArray[0]
    const date = getDateField(registerArray)
    const status = getStatusField(registerArray)
    return { status, registerNumber, date }
  })
}

const getDateField = registry => {
  const dateRegex = /(\d{2}\/\d{2}\/\d{4})/g
  const getDates = date => date.match(dateRegex)
  const dates = registry.filter(getDates)
  if (dates.length > 1) return dates[1].split(' ')[0]
  return dates[0].split(' ')[0]
}

const getStatusField = register => {
  let status
  const isPositive = item => item === 'Positivo'
  const isNegative = item => item === 'Negativo'
  if (register.some(isPositive)) {
    status = 'Positivo'
  } else {
    const statusIndex = register.findIndex(isNegative)
    status = `${register[statusIndex]} - ${register[statusIndex + 1]}`
  }
  return status
}

const buildLabels = (registryFields, officerName) => {
  return registryFields.map(field => {
    return `AN.1 Data ${today}
  Situação: ${field.status}
  Registrado sob n°:
  ${field.registerNumber} em ${field.date}
  
  
  Oficial: ${officerName}`
  })
}