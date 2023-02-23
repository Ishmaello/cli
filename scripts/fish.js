const { commands, aliases } = require('../lib/utils/cmd-list.js')
const { shorthands, definitions } = require('../lib/utils/config/index.js')

const fns = `
# npm completions for Fish shell
# __fish_npm_needs_command and __fish_npm_using_commands taken/adapted from:
# https://stackoverflow.com/questions/16657803/creating-autocomplete-script-with-sub-commands
function __fish_npm_needs_command
    set -l cmd (commandline -opc)

    if test (count $cmd) -eq 1
        return 0
    end

    return 1
end

function __fish_npm_using_commands
    set -l cmd (commandline -opc)

    if test (count $cmd) -gt 1
        for a in $argv
          if test $a = $cmd[2]
              return 0
          end
        end
    end

    return 1
end

# Taken from https://github.com/fish-shell/fish-shell/blob/HEAD/share/completions/npm.fish
function __fish_complete_npm -d "Complete the commandline using npm's 'completion' tool"
    # tell npm we are fish shell
    set -lx COMP_FISH true
    if command -sq npm
        # npm completion is bash-centric, so we need to translate fish's "commandline" stuff to bash's $COMP_* stuff
        # COMP_LINE is an array with the words in the commandline
        set -lx COMP_LINE (commandline -opc)
        # COMP_CWORD is the index of the current word in COMP_LINE
        # bash starts arrays with 0, so subtract 1
        set -lx COMP_CWORD (math (count $COMP_LINE) - 1)
        # COMP_POINT is the index of point/cursor when the commandline is viewed as a string
        set -lx COMP_POINT (commandline -C)
        # If the cursor is after the last word, the empty token will disappear in the expansion
        # Readd it
        if test (commandline -ct) = ""
            set COMP_CWORD (math $COMP_CWORD + 1)
            set COMP_LINE $COMP_LINE ""
        end
        command node . completion -- $COMP_LINE 2>/dev/null
    end
end

# flush out what ships with fish
complete -e npm
`

console.log(fns)
const cmds = {}
for (const cmd of commands) {
  cmds[cmd] = { aliases: [cmd] }
  const cmdClass = require(`../lib/commands/${cmd}.js`)
  cmds[cmd].description = cmdClass.description
  cmds[cmd].params = cmdClass.params
}

for (const alias in aliases) {
  cmds[aliases[alias]].aliases.push(alias)
}
for (const cmd in cmds) {
  console.log(`# ${cmd}`)
  const { aliases, description, params = [] } = cmds[cmd]
  // If npm completion could return all commands in a fish friendly manner like we do w/ run-script these wouldn't be needed.
  console.log(`complete -x -f -c npm -n __fish_npm_needs_command -a '${aliases.join(' ')}' -d '${description}'`)
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
  console.log(`complete -x -f -c npm -n '__fish_npm_using_commands ${aliases.join(' ')}' ${params.map(p => `-l ${p}`).join(' ')} ${shorts}`)
  console.log(`complete -x -f -c npm -n '__fish_npm_using_commands ${aliases.join(' ')}' -a '(__fish_complete_npm)'`)
}
