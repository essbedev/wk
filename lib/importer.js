'use strict'

const fs   = require('fs')
const path = require('path')

class Importer {

  /**
   * Creates an instance of Importer.
   *
   *
   * @memberOf Importer
   */
  constructor() {

    // Binds
    this.load  = this.load.bind(this)
    this.extra = this.extra.bind(this)

    // Defaults
    this.pkg = null

    // Load package.json
    const package_path = path.resolve('package.json')
    if (fs.existsSync( package_path )) {
      this.pkg = require(package_path)
    }

    this.searchPaths = [
      process.cwd(),
      path.join(process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'], '.wk', 'tasks')
    ]
  }

  /**
   * Check if the path exists
   *
   * @param {String} p
   * @returns
   *
   * @memberOf Importer
   */
  exists( p ) {
    return fs.existsSync( path.resolve(p) )
  }

  /**
   * Import file
   *
   * @param {String} p
   * @param {Boolean} createNamespace
   *
   * @memberOf Importer
   */
  load(p, createNamespace) {

    if (createNamespace) {
      this.loadNamespace(p)
      return
    }

    const filePaths = []

    var pp

    for (let j = 0, jlen = this.searchPaths.length; j < jlen; j++) {
      pp = path.join(this.searchPaths[j], p)
      pp = path.resolve(pp)

      const ext = path.extname(pp)

      filePaths.push( pp )

      if (ext !== '.js') filePaths.push(pp+'.js')
      if (ext !== '.wk') filePaths.push(pp+'.wk')
    }

    let file = null

    for (let i = 0; i < filePaths.length; i++) {
      if (!this.exists(filePaths[i])) {
        continue
      }

      try {
        if (fs.statSync(filePaths[i]).isFile()) {
          file = filePaths[i]
          break
        }
      } catch(e) {}
    }

    if (file) {
      if (file.match(/package\.json/)) {
        this._package(require(file))
      } else {
        this._file(file)
      }

      return
    }

    // Is a directory
    if (this.exists(p) && fs.statSync(p).isDirectory()) {
      this._directory(p)
    }
  }

  /**
   * Load a file and create a namespace with the basename
   *
   * @param {String} p
   *
   * @memberOf Importer
   */
  loadNamespace(p) {

    let name = path.basename(p)
    name     = name.split('.').shift()

    const scope = this
    namespace(name, function() {
      scope.load( p )
    })

  }

  /**
   * Import extra tasks
   *
   * @param {String} name
   * @returns {ExtraTask}
   *
   * @memberOf Importer
   */
  extra( name ) {
    const p = `${__dirname}/extras/${name}.js`
    if (this.exists( p )) {
      return require(p)
    }
  }

  _package(pkg) {

    const scripts = pkg.scripts || {}

    for (const key in scripts) {

      const parts = key.split(':')
      const name  = parts.pop()

      const createNS = function(parts) {
        const ns = parts.shift()
        namespace(ns, function() {
          if (parts.length > 0) {
            createNS(parts)
          } else {
            desc('[package.json]')
            taskProcess(name, scripts[key])
          }
        })
      }

      if (parts.length) createNS(parts.slice(0))
      else {
        desc('[package.json]')
        taskProcess(name, scripts[key])
      }
    }
  }

  _file(p) {
    return require(p)
  }

  _directory(p) {
    const files = fs.readdirSync(p).filter(function(file) {
      return file.match(/\Wkfile|.(js|wk)$/)
    })

    for (const i in files) {
      this._file(`${p}/${files[i]}`)
    }
  }

}

module.exports = new Importer