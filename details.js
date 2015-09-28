'use strict'

const request = require('request')
const cheerio = require('cheerio')
const sqlite3 = require('sqlite3').verbose()
const fs = require('fs')
const db = new sqlite3.Database('empresas.sqlite3')

db.serialize(function () {
  const script = fs.readFileSync('schema.sql', 'utf8')
  db.run(script, (err) => {
    if (err) console.log(`Error: ${ JSON.stringify(err) }`)
  })
})

function stmt () {
  return db.prepare([
    'INSERT INTO',
    'empresas(nombre, municipio, provincia, forma_juridica,',
    'direccion, objecto_social, cnae, sic)',
    'VALUES(?,?,?,?,?,?,?,?)'
  ].join(' '))
}

const empresas = []

function recursiveRequest (reqQueue) {
  if (reqQueue.length === 0) {
    console.log('FINISHED!')
    db.close()
  } else {
    const params = reqQueue.shift()
    request(params.url, (err, resp, body) => {
      if (err) {
        console.log(`Error on request: ${ JSON.stringify(err) }`)
        reqQueue.unshift(params)
        recursiveRequest(reqQueue)
      } else {
        extractDetails(body, {
          nombre: params.nombre,
          municipio: params.municipio,
          provincia: params.provincia
        })
        recursiveRequest(reqQueue)
      }
    })
  }
}

function extractDetails (body, basicInfo) {
  const $ = cheerio.load(body)
  const container = $('.main_mid_colA')
  const forma_juridica = container.find('dl').eq(0).find('dd').text().trim()
  const direccion = container.find('[itemprop=streetAddress]').text().trim() +
                    container.find('[itemprop=streetAddress]').text().trim() +
                    container.find('[itemprop=addressRegion]').text().trim()
  const objeto_social = container.find('dl').eq(4).find('.category').text().trim()
  const cnae = container.find('dl').eq(5).find('dd').text().trim()
  const sic = container.find('dl').eq(6).find('dd').text().trim()
  if (empresas.length === 2000) {
    console.log('SAVING..')
    {
      const _stmt = stmt()
      const empresasToInsert = empresas.splice(0, empresas.length)
      empresasToInsert.forEach(empresa => insertData(empresa, _stmt))
      _stmt.finalize()
    }
  }
  empresas.push({
    nombre: basicInfo.nombre,
    municipio: basicInfo.municipio,
    provincia: basicInfo.provincia,
    forma_juridica: forma_juridica,
    direccion: direccion,
    objeto_social: objeto_social,
    cnae: cnae,
    sic: sic
  })
}

function insertData (empresa, _stmt) {
  _stmt.run(
    empresa.nombre,
    empresa.municipio,
    empresa.provincia,
    empresa.forma_juridica,
    empresa.direccion,
    empresa.objeto_social,
    empresa.cnae,
    empresa.sic
  )
}

fs.readFile('empresas.txt', 'utf8', (err, content) => {
  if (err) {
    return console.log(`Error: ${ JSON.stringify(err) }`)
  }
  const lines = content.split('\n')// .slice(32000)
  const reqQueue = lines.map(line => {
    const fields = line.split(',')
    return {
      url: fields[0],
      nombre: fields[1],
      municipio: fields[2],
      provincia: fields[3]
    }
  })
  recursiveRequest(reqQueue)
})

