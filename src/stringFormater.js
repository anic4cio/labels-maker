import { readFileSync } from 'fs'

const getDataLogs = () => {
  const text = readFileSync('../txt/retorno.txt', 'utf-8').trim().split(/[\n\r]+/g)
  text.shift()
  const logs = text.map(log => log
    .replace(/;;/g, ';')
    .replace(/  +/g, ' '))
  return logs
}

const today = new Date()
  .toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
  .split(',')[0]

const dataLogs = getDataLogs()

const buildLabels = dataLogs => {
  const formatedLogs = []
  for (let logg of dataLogs) {
    let log = logg.split(';')
    let status, date
    if (log.length !== 13) {
      status = 'Positivo'
      date = log[9].split(' ')[0]
    } else {
      status = `${log[7]} - ${log[8]}`
      date = log[10].split(' ')[0]
    }
    let officer = 'Fulano de Tal'
    let formatedLog =
`AN.1 Data ${today}
Situação: ${status}
Registrado sob n°: ${log[0]}
em ${date}
Oficial: ${officer}`
    formatedLogs.push([formatedLog])
  }
  return formatedLogs
}

const labels = buildLabels(dataLogs)

export default labels
