'use strong'

const cheerio = require('cheerio')
const request = require('request')
const fs = require('fs')
const baseUrl = 'http://www.axesor.es/directorio-informacion-empresas'

//const req = request.defaults({ baseUrl: baseUrl })
const linksEmpresas = []

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

function doAnalizeMunicipiosLinks(linksMunicipio) {
  return new Promise(
    function(resolve, reject) {
      analizeMunicipiosLinks(linksMunicipio, resolve, reject)
    }
  )
}

function doAnalizeLinkEmpresasByMunicipio(linksMunicipio) {
  return new Promise(
    function(resolve, reject) {
      getLinksEmpresaByMunicipio(linksMunicipio, resolve, reject)
    }
  )
}

function analizeMunicipiosLinks(linksMunicipio, resolve, reject) {
  console.log(`municipios: ${ linksMunicipio.length }`)
  if (linksMunicipio.length > 0) {
    doAnalizeLinkEmpresasByMunicipio(linksMunicipio.shift())
    .then(function(data) {
      analizeMunicipiosLinks(linksMunicipio, resolve, reject)
    })
  } else {
    resolve('Done -> analizeMunicipiosLinks')
  }
}

function doAnalizeProvinciasLinks(linksProvincia) {
  return new Promise(
    function(resolve, reject) {
      analizeProvinciasLinks(linksProvincia, [], resolve, reject)
    }
  )
}

function analizeProvinciasLinks(linksProvincia, linksMunicipio, resolve, reject) {
  console.log(`provincias: ${ linksProvincia.length }`)
  if (linksProvincia.length > 0) {
    doRequest({ uri: linksProvincia.shift() })
    .then(function (result) {
      const $ = cheerio.load(result.body)
      $('.lista3 li').each(function(index, elem) {
        linksMunicipio.push($(elem).find('a').attr('href'))
      })
      analizeProvinciasLinks(linksProvincia, linksMunicipio, resolve, reject)
    })
    .catch(function(err) {
      console.log(`analizeProvinciasLinks error: ${ JSON.stringify(err) }`)
    })
  } else {
    resolve(linksMunicipio)
  }
}

function getLinksEmpresaByMunicipio(link, resolve, reject) {
  doRequest({ uri: link })
  .then(function(result) {
    const $ = cheerio.load(result.body)
    $('.t01 tbody tr').each(function(index, elem) {
      const empresa = decodeRowEmpresa($(elem))
      const csvRow = `${ empresa.url },${ empresa.name },${ empresa.poblacion },${ empresa.provincia }\n`
      fs.appendFileSync('empresas.txt', csvRow, 'utf8')
      linksEmpresas.push(empresa)
    })
    if ($('.next').length > 0) {
      getLinksEmpresaByMunicipio(nextPageEmpresa(link), resolve, reject)
    } else {
      resolve('Done! -> getLinksEmpresaByMunicipio')
    }
  })
  .catch(function(err) {
    console.log(`getLinksEmpresaByMunicipio error: ${ JSON.stringify(err) }`)
  })
}

function nextPageEmpresa(url) {
  const pageNumber = parseInt(url.substr(-1)) + 1
  return `${ url.substring(0, url.length - 1) }${ pageNumber }`
}

function decodeRowEmpresa(tr) {
  return {
    url: tr.find('a').attr('href'),
    name: tr.find('.first').text().trim(),
    poblacion: tr.find('.last').prev().text().trim(),
    provincia: tr.find('.last').text().trim()
  }
}

doRequest({ uri: baseUrl })
.then(function(result) {
  const $ = cheerio.load(result.body)
  const linksProvincia = []
  $('.lista3 li').each(function(index, elem) {
    linksProvincia.push($(elem).find('a').attr('href'))
  })
  return doAnalizeProvinciasLinks(linksProvincia)
})
.then(function(linksMunicipio) {
  return doAnalizeMunicipiosLinks(linksMunicipio)
})
.then(function () {
  console.log('FINISH!')
})
.catch(function(err) {
  console.log(`Error: ${ JSON.stringify(err) }`)
})

