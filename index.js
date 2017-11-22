const { Command } = require('@adonisjs/ace')
const babel = require('rollup-plugin-babel')
const eslint = require('rollup-plugin-eslint')
const resolve = require('rollup-plugin-node-resolve')
const commonjs = require('rollup-plugin-commonjs')
const uglify = require('rollup-plugin-uglify')
const postcss = require('rollup-plugin-postcss')
const chokidar = require('chokidar')
const livereload = require('livereload')
const anymatch = require('anymatch')
const CLIEngine = require('eslint').CLIEngine

const Helpers = use('Helpers')

class Config {
  static get babel () {
    return {
      presets: [
        ['env', {
          modules: false,
          targets: {
            browsers: [ '> 1%', 'last 2 versions', 'not ie <= 8' ]
          }
        }],
        'stage-0'
      ],
      plugins: [
        ['transform-runtime', {
          helpers: false,
          polyfill: false,
          regenerator: true,
          moduleName: 'babel-runtime'
        }],
        'external-helpers'
      ],
      exclude: 'node_modules/**'
    }
  }

  static output (path = '', publicPath = '') {
    const fileAr = path.split('/')
    const fileDir = fileAr[fileAr.length - 2]
    return `${publicPath}/js/pages/${fileDir}.min.js`
  }

  static rollup (input = '', file = '', prod = false) {
    return {
      input,
      output: {
        file,
        format: 'iife',
        sourcemap: prod ? false : 'inline',
        intro: prod || !file.includes('master.min.js')
          ? ''
          : `document.write('<script src="http://' + (location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1"></script>')`
      },
      plugins: [
        postcss({ extensions: [ '.css' ] }),
        resolve({
          jsnext: true,
          main: true,
          browser: true
        }),
        commonjs(),
        eslint({
          formatter (report) {
            const formatter = CLIEngine.getFormatter()
            setTimeout(() => console.log(formatter(report)), 300)
          }
        }),
        babel(this.babel),
        (prod && uglify())
      ],
      watch: { chokidar: true }
    }
  }
}

class ES6Browser extends Command {
  static get signature () {
    return 'browser { --prod : Production Mode }'
  }

  static get description () {
    return 'A Ace command that  starts a listener on file change\n' +
           'compiling them into ES5 code using rollup with babel\n' +
           'as well booting up a livereload server that updates\n' +
           'the browser when changes occured.'
  }

  async handle (args, flags) {
    const [srcPath, publicPath] = [Helpers.appRoot('src'), Helpers.publicPath()]
    let listenerCounter = 0
    chokidar.watch(`${publicPath}/js/pages/*.min.js`, { persistent: false })
      .on('add', async path => { await this.removeFile(path) })
      .on('ready', () => {
        if (!flags.prod) {
          console.clear()
          this.info(`${this.icon('info')} Development Mode`)
          const server = livereload.createServer({ delay: 300 })
          server.watch(publicPath)
          this.success(`${this.icon('success')} Public Folder Cleaned Up`)
          this.success(`${this.icon('success')} LiveReload Watcher Started`)
        } else { this.success(`${this.icon('success')} Bundle Initiated...`) }
        init()
      })
    const init = () => {
      const watcher = chokidar.watch([`${srcPath}/pages/*/index.js`, `${srcPath}/master/index.js`], { persistent: !flags.prod })
      chokidar.watch(srcPath, { persistent: !flags.prod }).on('unlink', async path => {
        if (
          anymatch(`${srcPath}/pages/*/index.js`, path) ||
          anymatch(`${srcPath}/master/index.js`, path)
        ) {
          const output = Config.output(path, publicPath)
          await this.removeFile(output)
          console.clear()
          this.error(`${this.icon('error')} ${output.split('/').slice(-1)[0]} was deleted`)
          this.success(`${this.icon('success')} Waiting for changes...`)
        }
      })
      watcher
        .on('add', path => {
          listenerCounter++
          const rollupWatcher = require('rollup').watch(Config.rollup(path, Config.output(path, publicPath), !!flags.prod))
          rollupWatcher.on('event', event => {
            if (flags.prod) {
              if (event.code === 'END') {
                rollupWatcher.close()
                listenerCounter--
                if (!listenerCounter) {
                  this.success(`${this.icon('success')} All files were bundle for production`)
                }
              }
            } else {
              switch (event.code) {
                case 'END':
                  if (listenerCounter) {
                    listenerCounter--
                  } else { console.clear() }
                  this.info(`${this.icon('info')} ${Config.output(path, publicPath).split('/').slice(-1)[0]} bundled...`)
                  if(!listenerCounter) { this.success(`${this.icon('success')} Waiting for changes...`) }
                  break
                case 'ERROR':
                case 'FATAL':
                  this.error(JSON.stringify(event))
                  break
                default:
                  break
              }
            }
          })
        })
    }
  }
}

module.exports = ES6Browser
