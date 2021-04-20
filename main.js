import * as P from 'parsimmon'

// Convert an array of tuples [[a,b],[a,c]] to an object {a: [b,c]}
const tuplesToObj = (d) => d.reduce((r, c) => {
  // load tuple [key,val] pair
  // console.log(r,c)
  if (c.name === 'comment') {
    return r
  }

  let key = c[0],
    val = c[1]
  if (typeof key === 'object' && key.name === 'identifier') {
    key = key.value
  }
  // combine old and new value to an array
  r[key] = r.hasOwnProperty(key) ? [].concat(r[key], val) : val
  // return the object
  return r
}, {})

// 不转义字符
function hex(c) {
  var v = '0' + c.charCodeAt(0).toString(16)
  return '\\x' + v.substr(v.length - 2)
}

function stringEscape(s) {
  return s ? s.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/\t/g, '\\t').replace(/\v/g, '\\v').replace(/'/g, "\\'").replace(/"/g, '\\"').replace(/[\x00-\x1F\x80-\x9F]/g, hex) : s
}


// Turn escaped characters into real ones (e.g. "\\n" becomes "\n").
// const interpretEscapes = (str) => {
//   let escapes = {
//     b: "\b",
//     f: "\f",
//     n: "\n",
//     r: "\r",
//     t: "\t"
//   }
//   return str.replace(/\\(u[0-9a-fA-F]{4}|[^u])/, (_, escape) => {
//     let type = escape.charAt(0)
//     let hex = escape.slice(1)

//     // console.log(`type`, type, hex)
//     if (type === "u") {
//       return String.fromCharCode(parseInt(hex, 16))
//     }
//     if (escapes.hasOwnProperty(type)) {
//       return escapes[type]
//     }
//     return _
//   })
// }

const whitespace = P.regexp(/\s*/m)
const token = (parser) => parser.skip(whitespace)
const word = (str) => P.string(str).thru(token)

const Prototxt = P.createLanguage({
  value: (r) =>
    P.alt(r.number, r.null, r.true, r.false, r.string, r.identifier)
      .thru(parser => whitespace.then(parser))
      .desc("value"),

  identifier: () =>
    token(P.regexp(/[a-zA-Z_-][a-zA-Z0-9_+-]*/)
      .desc("identifier")
      .node("identifier")
    ),

  lbrace: () => word("{"),
  rbrace: () => word("}"),
  colon: () => word(":"),

  null: () => word("null").result(null),
  true: () => word("true").result(true),
  false: () => word("false").result(false),

  comment: () => P.regexp(/\s*#\s*(.*)/, 1).desc("comment").node("comment"),
  doubleQuotedString: () => P.regexp(/"((?:\\.|.)*?)"/, 1),
  singleQuotedString: () => P.regexp(/'((?:\\.|.)*?)'/, 1),

  string: (r) =>
    token(P.alt(r.doubleQuotedString, r.singleQuotedString))
      .map(stringEscape)
      .desc('string'),

  number: () =>
    token(P.regexp(/-?(0|[1-9][0-9]*)([.][0-9]+)?([eE][+-]?[0-9]+)?/))
      .map(Number)
      .desc("number"),

  pair: (r) => P.seq(r.identifier.skip(r.colon), r.value),

  message: (r) =>
    P.seq(
      r.identifier,
      r.colon.times(0, 1)
        .then(r.lbrace)
        .then(r.exp)
        .skip(r.rbrace)
    ),

  exp: (r) =>
    P.alt(r.pair, r.message, r.comment)
      .trim(P.optWhitespace)
      .many()
      .map(tuplesToObj)
})

export function parse(input) {
  return Prototxt.exp.tryParse(input)
}

const proto = parse(`
componentParam:{
        name: "IvrFaqBertClassify"
        type: IvrFaqBertClassify
        ivrFaqBertClassifyParam {
            remote_para {
                svr_appkey: "com.sankuai.nlubot.ivrfaqclassify"
                # svr_appkey: "com.sankuai.nlu.remote.model"
                cli_appkey: "com.sankuai.nlubot.ivrfaq"
                timeout_ms: 150
                service_name: "com.meituan.hadoop.afo.serving.common.OnlineService"
            }
            vocab_dict_path : "resource/conf_dict/domain/ivr/faqModel/bert/vocab.txt"
            label_dict_path : "resource/conf_dict/domain/ivr/faqModel/bert/label.txt"
        }
}
`)

function spaces(num) {
  let res = ""
  for (let i = 0; i < num; i++) {
    res += " "
  }
  return res
}

function valDealer(res, val, indent, key) {
  if (val instanceof Object) {
    if (val.name === 'identifier') {
      res += spaces(indent + 2) + key + ": " + (val.value) + "\n"
    } else {
      res += spaces(indent + 2) + key + " " + '{\n' + obj2prototxt(val, indent + 2) + '}\n'
    }
      
  } else {
    res += spaces(indent + 2) + key + ": " + addQuote(val) + "\n"
  }
  return res
}
      

const obj2prototxt = function (obj, indent) {
  let res = ""
  let key
  for (key in obj) {
    let value = obj[key]
    if (Array.isArray(value)) {
      for (let i = 0; i < value.length; i += 1) {
        res = valDealer(res, value[i], indent, key)
      }
    } else {
        res = valDealer(res, value, indent, key)
    }
  }
  res += spaces(indent)
  return res
}

const addQuote = function (z) {
  if(typeof z === 'number' || typeof z === 'boolean'){
    return z
  } else if(typeof z === 'string'){
    return "\"" + z + "\""
  } else {
    console.warn('other')
    return z
  }
}

console.log(proto, obj2prototxt(proto, 0))
