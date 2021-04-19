import * as P from 'parsimmon';

// Convert an array of tuples [[a,b],[a,c]] to an object {a: [b,c]}
const tuplesToObj = (d) => d.reduce((r, c) => {
  // load tuple [key,val] pair
  if(c.name === 'comment'){
    return r
  }
  let key = c[0], val = c[1];
  // combine old and new value to an array
  r[key] = r.hasOwnProperty(key) ? [].concat(r[key], val) : val;
  // return the object
  return r;
}, {});

// Turn escaped characters into real ones (e.g. "\\n" becomes "\n").
const interpretEscapes = (str) => {
  let escapes = {
    b: "\b",
    f: "\f",
    n: "\n",
    r: "\r",
    t: "\t"
  };
  return str.replace(/\\(u[0-9a-fA-F]{4}|[^u])/, (_, escape) => {
    let type = escape.charAt(0);
    let hex = escape.slice(1);
    if (type === "u") {
      return String.fromCharCode(parseInt(hex, 16));
    }
    if (escapes.hasOwnProperty(type)) {
      return escapes[type];
    }
    return _;
  });
}

const whitespace = P.regexp(/\s*/m);
const token = (parser) => parser.skip(whitespace);
const word = (str) => P.string(str).thru(token);

const Prototxt = P.createLanguage({
  value: (r) =>
    P.alt(r.number, r.null, r.true, r.false, r.string, r.identifier)
      .thru(parser => whitespace.then(parser))
      .desc("value"),

  identifier: () =>
    token(P.regexp(/[a-zA-Z_-][a-zA-Z0-9_+-]*/)
      .desc("identifier")),
 
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
      .map(interpretEscapes)
      .desc("string"),

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
});

export function parse(input) {
  return Prototxt.exp.tryParse(input);
}

const proto = parse(`
# 领域无关的组件
# componentParam:{
#         name: "TimeComponent"
#         type: TimeComponent
#         timeComponentParam {
#                 dict_path: "./resource/conf_dict/DICT/time_source"
#         }
# }
# componentParam:{
#         name: "PriceComponent"
#         type: PriceComponent
#         priceComponentParam {
#                 dict_path: "./resource/conf_dict/DICT/price_source"
#         }
# }
componentParam:{
        name: "TagMergeComponent"
        type: TagMergeComponent
        tagMergeParam {
        }
}

`);
  console.log(proto);
