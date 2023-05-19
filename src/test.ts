const pdfBuilder = require('./pdf-builders/builder16Annotations')
const fs = require('fs');

const getDate = (text: string) => {
  const dateRegex = /(?!AN\.\d\.)(\d{2}\.\d{2}\.\d{4})(?=\.)/g
  const matchedDate = text.match(dateRegex)
  if (matchedDate) return formatDate(matchedDate[0])
}

const formatDate = (date: string) => {
  const months = new Map([
    [1, 'janeiro'],
    [2, 'fevereiro'],
    [3, 'marco'],
    [4, 'abril'],
    [5, 'maio'],
    [6, 'junho'],
    [7, 'julho'],
    [8, 'agosto'],
    [9, 'setembro'],
    [10, 'outubro'],
    [11, 'novembro'],
    [12, 'dezembro']
  ])
  const dateSplitted = date.split('.')
  return `${dateSplitted[0]} de ${months.get(Number(dateSplitted[1]))} de ${dateSplitted[2]}`
}

(async () => {
  const filename = 'annotation-labels'
  const text = fs.readFileSync(`./${filename}.txt`, 'utf8').trim()
  const regex = /\r\n|\n/gi
  const arrayText = text.split(regex)

  const dismissBlankLines = (textLine: string) => textLine.trim() !== ''
  const fixedText = arrayText.filter(dismissBlankLines)

  const formattedLabels = fixedText.map((text: string) => {
    return `${text}
${getDate(text)}

Fulano de Tal
Oficial Auxiliar`
  })

  console.log(formattedLabels.length)

  const pdfString = await pdfBuilder(formattedLabels)
  fs.writeFile(`${filename}.pdf`, pdfString, () => { })
})()
