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
        command npm fish-completion -- $COMP_LINE 2>/dev/null
    end
end

# flush out what ships with fish
complete -e npm
