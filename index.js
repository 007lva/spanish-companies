'use strong'

const cheerio = require('cheerio')
const request = require('request')
const async = require('async')


const fs = require('fs');

const baseUrl = 'http://www.axesor.es/directorio-informacion-empresas'
//const req = request.defaults({ baseUrl: baseUrl })

const links = []
const linksDetalles = []


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

function doAnalizeProvincias(data){
  return new Promise(
    function(resolve, reject){
      doRequest({uri : value})
        .then(function(result){
          const $ = cheerio.load(result.body)
          $('.lista3 li').each(function(index, elem) {
            linksDetalles.push($(elem).find('a').attr('href'))
          })
          console.log(linksDetalles);
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

  $('.lista3 li').each(function(index, elem) {
    links.push($(elem).find('a').attr('href'))
  })
  return doAnalizeProvincias(links)
})
.then(function(){
  //Escuchando https://www.youtube.com/watch?v=XrMssQ2JB48
  console.log('remisex')
})
.catch(function(err) {
  console.log(`Error: ${ JSON.stringify(err) }`)
})

