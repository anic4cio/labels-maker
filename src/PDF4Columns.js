'use strict'
const PDF = require('pdfkit')

module.exports = async labelLogsArray => {
  const columnOnePositionLeft = 20
  const columnTwoPositionLeft = 165
  const columnThreePositionLeft = 310
  const columnFourPositionLeft = 450
  const textWidth = 130
  const textHeight = 90
  const topFirstLine = 50
  let count = 1
  let distanceFromTopOne = 18
  let distanceFromTopTwo = 18

  const doc = new PDF({ autoFirstPage: false })
  let buffers = []
  doc.on('data', buffers.push.bind(buffers))

  doc.addPage({
    size: 'A4',
    font: 'Courier',
  }).fontSize(8)

  for (let log of labelLogsArray) {
    if (count === 1) {
      doc.text(
        log, columnOnePositionLeft, topFirstLine, {
        width: textWidth,
        height: 100,
      })
      distanceFromTopOne += 130
      count++
      continue
    }

    if (count < 9) {
      doc.text(
        log, columnOnePositionLeft, distanceFromTopOne, {
        width: textWidth,
        height: textHeight,
      })
      distanceFromTopOne += 96
      count++
      continue
    }

    if (count === 9) {
      doc.text(
        log, columnTwoPositionLeft, topFirstLine, {
        height: textHeight,
        width: textWidth,
      })
      distanceFromTopOne = 18
      distanceFromTopTwo += 130
      count++
      continue
    }

    if (count < 17) {
      doc.text(
        log, columnTwoPositionLeft, distanceFromTopTwo, {
        width: textWidth,
        height: textHeight,
      })
      distanceFromTopTwo += 96
      count++
      continue
    }

    if (count === 17) {
      doc.text(
        log, columnThreePositionLeft, topFirstLine, {
        width: textWidth,
        height: textHeight,
      })
      distanceFromTopTwo = 18
      distanceFromTopOne += 130
      count++
      continue
    }

    if (count < 25) {
      doc.text(
        log, columnThreePositionLeft, distanceFromTopOne, {
        width: textWidth,
        height: textHeight,
      })
      distanceFromTopOne += 96
      count++
      continue
    }

    if (count === 25) {
      doc.text(
        log, columnFourPositionLeft, topFirstLine, {
        width: textWidth,
        height: textHeight,
      })
      distanceFromTopTwo += 130
      count++
      continue
    }

    if (count < 32) {
      doc.text(
        log, columnFourPositionLeft, distanceFromTopTwo, {
        width: textWidth,
        height: textHeight,
      })
      distanceFromTopTwo += 96
      count++
      continue
    }

    if (count === 32) {
      doc.text(
        log, columnFourPositionLeft, distanceFromTopTwo, {
        width: textWidth,
        height: textHeight,
      })      
      doc.addPage({
        size: 'A4',
        font: 'Courier',
      }).fontSize(8)
      count = 1
      distanceFromTopOne = 18
      distanceFromTopTwo = 18
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