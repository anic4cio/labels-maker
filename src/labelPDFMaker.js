import { writeFile } from 'fs'
import PDF from 'pdfkit'
import labels from './stringFormater.js'

export const buildPDF = async () => {
  let count = 1
  let gap = 10
  let textWidth = 510
  let textHeight = 140
  let top = 18
  let left = 40
  let top2 = 18
  let left2 = 330

  const doc = new PDF({ autoFirstPage: false })
  let buffers = []
  doc.on('data', buffers.push.bind(buffers))

  doc.addPage({
    size: 'A4',
    font: 'Courier',
    column: 2,
  }).fontSize(10)

  for (let log of labels) {
    if (count === 1) {
      doc.text(
        log, left, 60, {
        columns: 2,
        columnGap: gap,
        width: textWidth,
        height: 100,
      })
      top += 130
      count++
      continue
    }

    if (count < 9) {
      // doc.moveDown(10)
      doc.text(
        log, left, top, {
        columns: 2,
        columnGap: gap,
        width: textWidth,
        height: textHeight,
      })
      top += 96
      count++
      continue
    }

    if (count === 9) {
      doc.text(
        log, left2, 60, {
        columns: 2,
        columnGap: gap,
        height: textHeight,
        width: textWidth,
      })
      top2 += 130
      count++
      continue
    }

    if (count < 16) {
      doc.text(
        log, left2, top2, {
        columns: 2,
        columnGap: gap,
        width: textWidth,
        height: textHeight,
      })
      top2 += 96
      count++
      continue
    }

    if (count === 16) {
      doc.text(
        log, left2, top2, {
        columns: 2,
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
      top = 18
      top2 = 18
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
