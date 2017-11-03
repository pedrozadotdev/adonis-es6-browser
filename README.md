
adonis-es6-browser
===============

An Ace command that  starts a listener on file change compiling them into ES5 code using rollup with babel as well booting up a livereload server that updates the browser when changes occurred.

# How to Install

To install adonis-es6-browser:

```sh
$ npm i -D adonis-es6-browser
```

Config AdonisJS to use the command at `start/app.js`:
```js
/*
|------------------------------------------------------------------
| Commands
|------------------------------------------------------------------
|
| Here you store ace commands for your package
|
*/
const commands = [
  require('adonis-es6-browser')
]
```
# How to Use

For Development:

```sh
$ adonis browser
```

For Production:

```sh
$ adonis browser --prod
```

# Code Structure

To use this command you have to follow a directory pattern:

 - All ES6 code go into `src/` at project root.
 - Master Page code go into `src/master`.
 - Code of other pages go into `src/pages/[pageName]`.
 - Every page folder have to have an `index.js`.
 - The output folder is `public/js/pages/[pageName].min.js`.



# License

Copyright (c) 2017 Andre P. Pedroza

Released under the MIT license. See `LICENSE` for details.
