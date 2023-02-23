const fs = require('fs/promises')
const { resolve } = require('path')

const Completion = require('./completion.js')

// Are these tied to this.npm?
const { commands, aliases } = require('../utils/cmd-list.js')
const { shorthands, definitions } = require('../utils/config/index.js')

class FishCompletion extends Completion {
  static description = 'Fish completion for npm'
  static name = 'fish-completion'

  async exec (args) {
    const { COMP_CWORD, COMP_LINE, COMP_POINT, COMP_FISH } = process.env

    // if the COMP_* isn't in the env, then just dump the script.
    if (COMP_CWORD === undefined || COMP_LINE === undefined || COMP_POINT === undefined) {
      // We don't have to worry about the stdout error stuff like we do w/ the
      // bash/zsh completion because ". (npm fish-completion)" doesn't work in fish
      // in the first place.
      const file = resolve(this.npm.npmRoot, 'lib', 'utils', 'completion.fish')
      const d = await fs.readFile(file, 'utf-8')
      this.npm.output(d)
      const cmds = {}
      for (const cmd of commands) {
        cmds[cmd] = { aliases: [cmd] }
        const cmdClass = require(`./${cmd}.js`)
        cmds[cmd].description = cmdClass.description
        cmds[cmd].params = cmdClass.params
      }

      for (const alias in aliases) {
        cmds[aliases[alias]].aliases.push(alias)
      }
      for (const cmd in cmds) {
        this.npm.output(`# ${cmd}`)
        const { aliases, description, params = [] } = cmds[cmd]
        // If npm completion could return all commands in a fish friendly manner like we do w/ run-script these wouldn't be needed.
        this.npm.output(`complete -x -f -c npm -n __fish_npm_needs_command -a '${aliases.join(' ')}' -d '${description}'`)
        const shorts = params.map(p => {
          // Our multi-character short params are not very standard and don't work
          // with things that assume short params are only ever single characters.
          if (definitions[p].short?.length === 1) {
            return `-s ${definitions[p].short}`
          }
        }).filter(p => p).join(' ')
        // The config descriptions are not appropriate for -d here. We may want to
        // consider having a more terse description for these.
        // We can also have a mechanism to auto-generate the long form of options
        // that have predefined values.
        this.npm.output(`complete -x -f -c npm -n '__fish_npm_using_commands ${aliases.join(' ')}' ${params.map(p => `-l ${p}`).join(' ')} ${shorts}`)
        this.npm.output(`complete -x -f -c npm -n '__fish_npm_using_commands ${aliases.join(' ')}' -a '(__fish_complete_npm)'`)
      }
      return
    }
    return super.exec(args)
  }
}

module.exports = FishCompletion
