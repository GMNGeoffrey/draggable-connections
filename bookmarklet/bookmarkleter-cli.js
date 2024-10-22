// Really basic zero-option CLI for https://github.com/chriszarate/bookmarkleter

const fs = require("fs");
const bookmarkleter = require("bookmarkleter");

const code = fs.readFileSync(process.stdin.fd, "utf-8").toString();
const bookmarklet = bookmarkleter(code, { iife: true, mangleVars: true, urlencode: true });
fs.writeFileSync(process.stdout.fd, bookmarklet + "\n");
