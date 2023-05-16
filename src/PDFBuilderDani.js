'use strict'
const PDF = require('pdfkit')

module.exports = async labelLogsArray => {
  const columnOnePositionLeft = 20
  const columnTwoPositionLeft = 308
  const textWidth = 268
  const textHeight = 170
  const topFirstLine = 45
  let count = 1
  let topColumnOne = 18
  let topColumnTwo = 18

  const doc = new PDF({ autoFirstPage: false })
  const buffers = []
  doc.on('data', buffers.push.bind(buffers))

  doc.addPage({
    size: 'A4',
    font: 'Courier',
    align: 'justify'
  }).fontSize(6)

  for (let log of labelLogsArray) {
    if (count === 1) {
      doc.text(
        log, columnOnePositionLeft, topFirstLine, {
          width: textWidth,
          height: textHeight,
          align: 'justify'
        })
      topColumnOne += 125
      count++
      continue
    }

    if (count < 9) {
      doc.text(
        log, columnOnePositionLeft, topColumnOne, {
          width: textWidth,
          height: textHeight,
          align: 'justify'
        })
      topColumnOne += 95
      count++
      continue
    }

    if (count === 9) {
      doc.text(
        log, columnTwoPositionLeft, topFirstLine, {
          height: textHeight,
          width: textWidth,
          align: 'justify'
        })
      topColumnTwo += 125
      count++
      continue
    }

    if (count < 16) {
      doc.text(
        log, columnTwoPositionLeft, topColumnTwo, {
          width: textWidth,
          height: textHeight,
          align: 'justify'
        })
      topColumnTwo += 95
      count++
      continue
    }

    if (count === 16) {
      doc.text(
        log, columnTwoPositionLeft, topColumnTwo, {
          width: textWidth,
          height: textHeight,
          align: 'justify'
        })
      doc.addPage({
        size: 'A4',
        font: 'Courier'
      }).fontSize(6)
      count = 1
      topColumnOne = 18
      topColumnTwo = 18
    }
  }

  return await returnPDFBuffer(doc, buffers)
}

const returnPDFBuffer = (doc, buffers) => {
  return new Promise(resolve => {
    doc.on('end', () => resolve(Buffer.concat(buffers)))
    doc.end()
  })
}
