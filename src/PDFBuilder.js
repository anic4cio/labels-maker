'use strict'
import PDF from 'pdfkit'

export default async labelLogsArray => {
  const columnOnePositionLeft = 40
  const columnTwoPositionLeft = 330
  const textWidth = 510
  const textHeight = 140
  const topFirstLine = 60
  const gap = 10
  let count = 1
  let topColumnOne = 18
  let topColumnTwo = 18

  const doc = new PDF({ autoFirstPage: false })
  let buffers = []
  doc.on('data', buffers.push.bind(buffers))

  doc.addPage({
    size: 'A4',
    font: 'Courier',
    column: 2,
  }).fontSize(10)

  for (let log of labelLogsArray) {
    if (count === 1) {
      doc.text(
        log, columnOnePositionLeft, topFirstLine, {
        columnGap: gap,
        width: textWidth,
        height: 100,
      })
      topColumnOne += 130
      count++
      continue
    }

    if (count < 9) {
      doc.text(
        log, columnOnePositionLeft, topColumnOne, {
        columnGap: gap,
        width: textWidth,
        height: textHeight,
      })
      topColumnOne += 96
      count++
      continue
    }

    if (count === 9) {
      doc.text(
        log, columnTwoPositionLeft, topFirstLine, {
        columnGap: gap,
        height: textHeight,
        width: textWidth,
      })
      topColumnTwo += 130
      count++
      continue
    }

    if (count < 16) {
      doc.text(
        log, columnTwoPositionLeft, topColumnTwo, {
        columnGap: gap,
        width: textWidth,
        height: textHeight,
      })
      topColumnTwo += 96
      count++
      continue
    }

    if (count === 16) {
      doc.text(
        log, columnTwoPositionLeft, topColumnTwo, {
        columnGap: gap,
        width: textWidth,
        height: textHeight,
      })
      doc.addPage({
        size: 'A4',
        font: 'Courier',
        column: 2,
      }).fontSize(10)
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
