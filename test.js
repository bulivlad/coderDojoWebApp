
const validator = require('validator');
const keys = require('./static_keys/project_keys')


let date18YearsAgo = new Date();
date18YearsAgo.setFullYear(date18YearsAgo.getFullYear() - 12);

let date12YearsAgo = new Date();
date12YearsAgo.setFullYear(date12YearsAgo.getFullYear() - 12);

let date22YearsAgo = new Date();
date22YearsAgo.setFullYear(date22YearsAgo.getFullYear() - 12);

console.log(date12YearsAgo < date18YearsAgo)
