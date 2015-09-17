'use strong'

const cheerio = require('cheerio')
const request = require('request')

const baseUrl = 'http://www.axesor.es/directorio-informacion-empresas'
//const req = request.defaults({ baseUrl: baseUrl })

function doRequest(options) {
  return new Promise(
    function(resolve, reject) {
      request(options, function(err, response, body) {
        if (err) {
          reject(err)
        } else {
          resolve({ response: response, body: body })
        }
      })
    }
  )
}

function recursiveRequest(reqQueue, resolve, reject) {
  if (reqQueue.length === 0) {
    resolve('Finished')
  } else {
    const rq = reqQueue.shift(0)
    request(rq, function(err, response, body) {
      if (err) {
        reject(err)
      } else {
        request('', function(err, response, body) {
          recursiveRequest(reqQueue, resolve, reject)
        })
      }
    })
  }
}

function doRecursiveRequest(reqQueue) {
  return new Promise(
    function(resolve, reject) {
      recursiveRequest(reqQueue, resolve, reject)
    }
  )
}

doRequest({ uri: baseUrl })
.then(function(result) {
  const $ = cheerio.load(result.body)
  const links = []
  $('.lista3 li').each(function(index, elem) {
    links.push($(elem).find('a').attr('href'))
  })
  console.log(links)
})
.catch(function(err) {
  console.log(`Error: ${ JSON.stringify(err) }`)
})
