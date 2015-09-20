"use strict"


/**
 * @author @stuk4 (https://github.com/Stuk4)
 * Eliminar filas 50 y 64 para obtener todos los links
 *
 *
 * @type {*|exports|module.exports}
 */

const cheerio = require('cheerio')
const request = require('request')

const baseUrl = 'http://www.axesor.es/directorio-informacion-empresas'


//const req = request.defaults({ baseUrl: baseUrl })

/**
 * Array con las provincias
 * @type {Array}
 */
const links = []

/**
 * @author @stuk4
 * Array con las poblaciones por provincia
 *
 * @type {Array}
 */
const linksDetalles = []


/**
 * @author @stuk4
 * Array final con la info de las empresas (link, name, poblacion y provincia)
 * @type {Array}
 */
const linksEmpresas = []


/**
 * @author @007lva
 * @param options
 * @returns {Promise}
 */
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

/**
 * @author @stuk4
 * @param data
 * @returns {Promise}
 */
function doAnalizeProvinciasLinks(data){
  return new Promise(
    function(resolve, reject){
      links.splice(1,data.length);
      analizeProvinciasLinks(data, resolve, reject)
    }
  )
}

/**
 * @author @stuk4
 * @param data
 * @returns {Promise}
 */
function doAnalizeMunicipiosLinks(data){
  return new Promise(
    function(resolve, reject){
      linksDetalles.splice(1,data.length);
      analizeMunicipiosLinks(data, resolve, reject)
    }
  )
}


/**
 * @author @stuk4
 * @param link
 * @returns {Promise}
 */
function doAnalizeLinkEmpresasByPoblacion(link){
  return new Promise(
    function(resolve, reject){
      getLinksEmpresaByProblacion(link, resolve, reject)
  })
}



/**
 * @author @stuk4
 * @param data
 * @param resolve
 * @param reject
 */
function analizeMunicipiosLinks(data, resolve, reject){
  if(data.length>0){
    doAnalizeLinkEmpresasByPoblacion(data[0])
    .then(function(){
      data.shift()
      analizeMunicipiosLinks(data, resolve, reject)
    })
  }
  else{
    resolve('Done -> analizeMunicipiosLinks')  }
}


/**
 * @author @stuk4
 * @param data
 * @param resolve
 * @param reject
 */
function analizeProvinciasLinks(data, resolve, reject){
  if(data.length>0){
    doRequest({ uri: data[0]})
    .then(function (result) {
      const $ = cheerio.load(result.body)
      $('.lista3 li').each(function(index, elem) {
        linksDetalles.push($(elem).find('a').attr('href'))
      })
      data.shift();
      analizeProvinciasLinks(data, resolve, reject)
    })
  }else{
    resolve('Done ! --> analizeProvinciasLinks')
  }
}


/**
 * @author @stuk4
 * @param link
 * @param resolve
 * @param reject
 */
function getLinksEmpresaByProblacion(link, resolve, reject){
  doRequest({ uri: link})
  .then(function(result) {
    const $ = cheerio.load(result.body)
    $('.t01 tbody tr').each(function (index, elem){
      linksEmpresas.push(decodeListEmpresasLinks($(elem)))
    })
    if($('.next').length > 0) {
      getLinksEmpresaByProblacion(decodeLinkEmpresa(link), resolve, reject)
    }else{
      resolve('Done! -> getLinksEmpresaByProblacion')
    }
  })

}

/**
 * @author @stuk4
 * Returns next link for pagination
 * @param {string} url The link for pagination
 * @returns {string} next url for paginacion
 */
function decodeLinkEmpresa(url){
  const pageNumber = parseInt(url.substr(url.length - 1))+1;
  return url.substring(0, url.length - 1)+pageNumber
}

/**
 * @author @stuk4
 * Return row of "empresa"
 * @param tr
 * @returns {{link, name: string, poblacion: string, provincia: string}}
 */
function decodeListEmpresasLinks(tr){
  return {
    link : tr.find('a').attr('href'),
    name : tr.find('.first').text().trim(),
    poblacion : tr.find('.last').prev().text().trim(),
    provincia : tr.find('.last').text().trim()
  }
}

/**
 * Run
 */
doRequest({ uri: baseUrl})
.then(function(result) {
  const $ = cheerio.load(result.body)
  $('.lista3 li').each(function(index, elem) {
    links.push($(elem).find('a').attr('href'))
  })
  return doAnalizeProvinciasLinks(links)
})
.then(function(){
  return doAnalizeMunicipiosLinks(linksDetalles)
})
.then(function () {
  console.log(linksEmpresas)
})
.catch(function(err) {
  console.log(`Error: ${ JSON.stringify(err) }`)
})
