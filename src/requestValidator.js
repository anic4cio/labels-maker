'use strict'

export default req => {
  if (req.method !== 'POST')
    return {
      code: 405,
      message: 'Only post method accepted',
      success: false,
    }
  if (!req.body || typeof req.body !== 'object')
    return {
      code: 400,
      message: 'Must send body',
      success: false,
    }
  return { code: 200, message: 'sucesso', success: true }
}
