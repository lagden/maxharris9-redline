What is redline?
============

Redline is a collaborative word-processing component that allows you to embed document editing workflows into your application. It offers the following features:

- edit history (aka "track changes")
- threaded commenting
- rich text (via Daniel Earwicker's excellent, MIT-licensed carota project)
- document data as a JavaScript object on the client, which you are free to load and store in any way you see fit
- a truly free, permissive license (MIT)

###Getting started:###

    git clone https://github.com/max-leportlabs/redline-demo.git
    cd redline-demo
    meteor

###To-do:###
- a tutorial for library users
- spell-checking
- grammar-checking
- more and better keyboard shortcuts (command-left, for example, doesn’t take you to the start of a line, but it should!)
deleted text shouldn’t get drawn in the carota context, except for, potentially, a little deletion caret/icon to indicate where the old text used to be.
- auto-saving
- store a backup of the user's latest edits in localstorage
- unit tests
- acceptance tests

Feel free to help! PRs are encouraged!
