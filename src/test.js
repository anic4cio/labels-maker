const pdfBuilder = require('./PDFBuilderDani')
const fs = require('fs');


(async () => {
  const filename = 'labels-annotation'
  const text = fs.readFileSync(`./${filename}.txt`, 'utf8').trim()
  const regex = /\r\n|\n/gi
  const arrayText = text.split(regex)

  const dismissBlankLines = (textLine) => textLine.trim() !== ''
  const fixedText = arrayText.filter(dismissBlankLines)

  const formattedLabels = fixedText.map(text => {
    return `${text}
03 de maio de 2023

Daniela dos Santos
Oficial Auxiliar`
  })
  console.log(formattedLabels.length)
  
  const pdfString = await pdfBuilder(formattedLabels)
  fs.writeFile(`${filename}.pdf`, pdfString, () => {})
  
})()
