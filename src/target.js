import makePDFWith4Columns from './fourColumns.js'
import fs from 'fs'

const getRegistryFromFile = file => {
  const buffer = fs.readFileSync(file, { encoding: 'utf8' })
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

const buildLabels = (registryArrayFields, officerName) => {
  return registryArrayFields.map(field => {
    return `AN.1 Data ${today}
Situação: ${field.status}
Registrado sob n°:
${field.registerNumber} em ${field.date}


Oficial: ${officerName}`
  })
}

(async () => {
  const registryArray = getRegistryFromFile('./etiquetas/victor-33969-35165.txt')
  const registryFields = getRegistryFields(registryArray)
  const labels = buildLabels(registryFields, 'Vinicius')
  const buffer = await makePDFWith4Columns(labels)
  fs.writeFile('./victor-33969-35165.pdf', buffer, () => console.log('PDF File generated success!'))
})()