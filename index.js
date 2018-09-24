#!/usr/bin/env node
const util = require('util')
const fs = require('fs')
const path = require('path')

const stat = util.promisify(fs.stat)
const lstat = util.promisify(fs.lstat)
const exec = util.promisify(require('child_process').exec)

const argv = require('yargs')
  .version('1.0.0')
  .demandCommand(2).argv

const isDirectoryFalseFunc = {
  isDirectory () {
    return false
  }
}

const copyFileWithoutOverwriting = async (src, tgt) => {
  if ((await lstat(tgt).catch(e => isDirectoryFalseFunc)).isDirectory()) {
    tgt = `${tgt}/${path.basename(src)}`
  }

  const fileName = path.basename(tgt)
  const ext = path.extname(tgt)

  const existance = await stat(tgt)
    .then(() => true)
    .catch(e => false)

  if (existance) {
    return copyFileWithoutOverwriting(
      src,
      `${path.dirname(tgt)}/${fileName}_${Date.now()}${ext}`
    )
  }

  return exec(`cp -p "${src}" "${tgt}"`)
}

const main = async (srcs, tgt) => {
  try {
    await srcs
      .map(src => async () => {
        try {
          if (fs.lstatSync(src).isDirectory()) {
            throw new Error('the first argument can not be a directory')
          }
          await copyFileWithoutOverwriting(src, tgt)
        } catch (e) {
          console.error(e.message)
        }
      })
      .reduce((a, c) => {
        return a.then(() => c())
      }, Promise.resolve())
  } catch (e) {
    console.error(e.message)
  }
}

// extract the output argument
const output = argv._.pop()
main(argv._, output)
