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

componentParam:{
        name: "IVRComponent"
        type: IVRShareDataType
        ivr_sharedata_param {
                remote_para {
                        svr_appkey: "com.sankuai.ai.dm.context"
                        cli_appkey: "com.sankuai.nlubot.ivrfaq"
                        timeout_ms: 50
                        service_name: "com.meituan.ai.platform.context.ContextFacade"
                }
                environment: "prod"
                bu_map_path: "./resource/conf_dict/domain/ivr/bu_map.txt"
                mock_result_flag: false
                mock_result_resource: "./resource/conf_dict/domain/ivr/mock_ivr_share_data.txt"
        }
}

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

componentParam:{
        name: "IvrFaqBertClassify_finance"
        type: IvrFaqBertClassify
        ivrFaqBertClassifyParam {
            remote_para {
                # svr_appkey: "com.sankuai.nlubot.ivrfaqclassify"
                svr_appkey: "com.sankuai.nlu.nlubot.ivrwaimaifaqsv"
                # svr_appkey: "com.sankuai.nlu.remote.model"
                cli_appkey: "com.sankuai.nlubot.ivrfaq"
                timeout_ms: 150
                service_name: "com.meituan.hadoop.afo.serving.common.OnlineService"
            }
            vocab_dict_path : "resource/conf_dict/domain/ivrFinance/faqModel/bert/vocab.txt"
            label_dict_path : "resource/conf_dict/domain/ivrFinance/faqModel/bert/label.txt"
            max_token_length: 40
            model_name: "ivr_finance_faq"
        }
}

# 领域相关的组件
componentParam:{
        name: "PreProcess"
        type: PreProcess
        preProcessParam {
                domain: "IVR_routing_robot"
                delete_mark: " "
                delete_mark: "\t"
                delete_mark: "，"
                delete_mark: ","
                delete_mark: "。"
                delete_mark: "？"
                delete_mark: "?"
                delete_mark: "!"
                delete_mark: "！"
                delete_mark: "e"
                delete_mark: "r"
                delete_mark: "{"
                delete_mark: "}"
                delete_mark: "<"
                delete_mark: ">"
                delete_mark: "·"
                max_query_len: 30
        }
}

componentParam:{
        name: "PreProcess_abtest"
        type: PreProcess
        preProcessParam {
                domain: "IVR_routing_robot_abtest"
                delete_mark: " "
                delete_mark: "\t"
                delete_mark: "，"
                delete_mark: ","
                delete_mark: "。"
                delete_mark: "？"
                delete_mark: "?"
                delete_mark: "!"
                delete_mark: "！"
                delete_mark: "e"
                delete_mark: "r"
                delete_mark: "{"
                delete_mark: "}"
                delete_mark: "<"
                delete_mark: ">"
                delete_mark: "·"
                max_query_len: 30
        }
}

componentParam:{
        name: "PreProcess_abtest_c"
        type: PreProcess
        preProcessParam {
                domain: "IVR_routing_robot_abtest_c"
                delete_mark: " "
                delete_mark: "\t"
                delete_mark: "，"
                delete_mark: ","
                delete_mark: "。"
                delete_mark: "？"
                delete_mark: "?"
                delete_mark: "!"
                delete_mark: "！"
                delete_mark: "e"
                delete_mark: "r"
                delete_mark: "{"
                delete_mark: "}"
                delete_mark: "<"
                delete_mark: ">"
                delete_mark: "·"
                max_query_len: 30
        }
}

componentParam:{
        name: "PreProcess_finance"
        type: PreProcess
        preProcessParam {
                domain: "IVR_finance"
                delete_mark: " "
                delete_mark: "\t"
                delete_mark: "，"
                delete_mark: ","
                delete_mark: "。"
                delete_mark: "？"
                delete_mark: "?"
                delete_mark: "!"
                delete_mark: "！"
                delete_mark: "e"
                delete_mark: "r"
                delete_mark: "{"
                delete_mark: "}"
                delete_mark: "<"
                delete_mark: ">"
                delete_mark: "·"
                max_query_len: 30
        }
}

componentParam:{
        name: "MTSegWord"
        type: MTSegWord
        mtSegWordParam {
                seg_path: "./resource/MTSegWord/nlp_tools/dict/segpos/"
                #use_char_seg: true
        }
}

componentParam:{
        name: "TagExtract"
        type: TagExtract
        tagExtractParam {
                dict_path: "./resource/conf_dict/domain/ivr/OUTPUT"
                domain: "IVR_routing_robot"
                use_text_tag: true
                # max_paste_len: 20
        }
}

componentParam:{
        name: "TagExtract_abtest"
        type: TagExtract
        tagExtractParam {
                dict_path: "./resource/conf_dict/domain/ivr/OUTPUT"
                domain: "IVR_routing_robot_abtest"
                use_text_tag: true
                # max_paste_len: 20
        }
}

componentParam:{
        name: "TagExtract_abtest_c"
        type: TagExtract
        tagExtractParam {
                dict_path: "./resource/conf_dict/domain/ivr/OUTPUT"
                domain: "IVR_routing_robot_abtest_c"
                use_text_tag: true
                # max_paste_len: 20
        }
}

componentParam:{
        name: "TagExtract_finance"
        type: TagExtract
        tagExtractParam {
                dict_path: "./resource/conf_dict/domain/ivr/OUTPUT"
                domain: "IVR_finance"
                use_text_tag: true
                # max_paste_len: 20
        }
}

componentParam:{
        name: "FeatureExtract"
        type: FeatureExtract
        featureExtractParam {
                dict_path: "./resource/conf_dict/domain/ivr/OUTPUT"
                domain: "IVR_routing_robot"
        }
}

componentParam:{
        name: "FeatureExtract_abtest"
        type: FeatureExtract
        featureExtractParam {
                dict_path: "./resource/conf_dict/domain/ivr/OUTPUT"
                domain: "IVR_routing_robot_abtest"
        }
}

componentParam:{
        name: "FeatureExtract_abtest_c"
        type: FeatureExtract
        featureExtractParam {
                dict_path: "./resource/conf_dict/domain/ivr/OUTPUT"
                domain: "IVR_routing_robot_abtest_c"
        }
}

componentParam:{
        name: "FeatureExtract_finance"
        type: FeatureExtract
        featureExtractParam {
                dict_path: "./resource/conf_dict/domain/ivr/OUTPUT"
                domain: "IVR_finance"
        }
}

componentParam:{
        name: "FrameParse"
        type: FrameParse
        frameParseParam {
                dict_path: "./resource/conf_dict/domain/ivr/OUTPUT"
                pos_path: "./resource/AfterProcess/ltp_data/pos.model"
                domain: "IVR_routing_robot"
                feature_mode: "default"
        }
}

componentParam:{
        name: "FrameParse_abtest"
        type: FrameParse
        frameParseParam {
                dict_path: "./resource/conf_dict/domain/ivr/OUTPUT"
                pos_path: "./resource/AfterProcess/ltp_data/pos.model"
                domain: "IVR_routing_robot_abtest"
                feature_mode: "default"
        }
}

componentParam:{
        name: "FrameParse_abtest_c"
        type: FrameParse
        frameParseParam {
                dict_path: "./resource/conf_dict/domain/ivr/OUTPUT"
                pos_path: "./resource/AfterProcess/ltp_data/pos.model"
                domain: "IVR_routing_robot_abtest_c"
                feature_mode: "default"
        }
}

componentParam:{
        name: "FrameParse_finance"
        type: FrameParse
        frameParseParam {
                dict_path: "./resource/conf_dict/domain/ivr/OUTPUT"
                pos_path: "./resource/AfterProcess/ltp_data/pos.model"
                domain: "IVR_finance"
                feature_mode: "default"
        }
}

componentParam:{
        name: "AfterProcess"
        type: AfterProcess
        afterProcessParam {
                dict_path_omit: "/OmitRuleIntent.txt"
                seg_path: "./resource/AfterProcess/ltp_data/cws.model"
                pos_path: "./resource/AfterProcess/ltp_data/pos.model"
                parser_path: "./resource/AfterProcess/ltp_data/parser.model"
                removeDefaultIntent: true
        }
}

componentParam:{
        name: "IvrFaqSearch"
        type: IvrFaqSearch
        ivrFaqSearchParam {
                model_path: "./resource/conf_dict/domain/ivr/faqModel/biMPM/dependModel"
                pattern_path: "./resource/conf_dict/domain/ivr/ivr_data/ivr_data.json"
                convert_id_path: "./resource/conf_dict/domain/ivr/faqModel/biMPM/convertId"
                bimpm_model_path: "./resource/conf_dict/domain/ivr/faqModel/biMPM/BiMPMModel/"
                typical_question_cate_path: "./resource/conf_dict/domain/ivr/tq_frequency.txt"
        }
}

# componentParam:{
#         name: "IvrFaqSearch_abtest_c"
#         type: IvrFaqSearch
#         ivrFaqSearchParam {
#                 model_path: "./resource/conf_dict/domain/ivr/faqModel/biMPM/dependModel"
#                 pattern_path: "./resource/conf_dict/domain/ivr/ivr_data/ivr_data.json"
#                 convert_id_path: "./resource/conf_dict/domain/ivr/faqModel/biMPM/convertId"
#                 bimpm_model_path: "./resource/conf_dict/domain/ivr/faqModel/biMPM/BiMPMModel/"
#                 typical_question_cate_path: "./resource/conf_dict/domain/ivr/tq_frequency.txt"
#                 abtest_flag: "c"
#         }
# }

componentParam:{
        name: "IvrFaqSearch_finance"
        type: IvrFaqSearch
        ivrFaqSearchParam {
                model_path: "./resource/conf_dict/domain/ivr/faqModel/biMPM/dependModel"
                pattern_path: "./resource/conf_dict/domain/ivrFinance/ivr_finance/ivr_finance_data.json"
                convert_id_path: "./resource/conf_dict/domain/ivr/faqModel/biMPM/convertId"
                bimpm_model_path: "./resource/conf_dict/domain/ivr/faqModel/biMPM/BiMPMModel/"
                typical_question_cate_path: "./resource/conf_dict/domain/ivrFinance/tq_frequency.txt"
                bimpm_run_flag: false
                hot_update_data_name: "ivr_finance"
        }
}

componentParam{
        name: "IvrUserRoles"
        type: IvrUserRoles
        ivrUserRolesParam {
                user_roles_conf_path: "./resource/conf_dict/domain/ivr/online_buid_to_user_map.txt"
                history_work_order_path: "./resource/conf_dict/domain/ivr/history_work_order.txt"
                register_info_path: "./resource/conf_dict/domain/ivr/register_info_map.txt"
        }
}

componentParam{
        name: "IvrOrder"
        type: IvrOrder
        ivrOrderParam {
                business_high_confidence_threshold: 0.92
                business_fasttext_threshold: 0.5
        }
}

componentParam{
        name: "IvrOrderRank"
        type: IvrOrderRank
        ivrOrderRankParam {
                xgboost_model_path: "./resource/conf_dict/domain/ivr/orderRankModel/0025.model"
                select_order_num: 10
                threshold: 0.212
                multi_class_num: 11
                hotline: "7888"
                business_high_confidence_threshold: 0.92
        }   
}

componentParam{
        name: "IvrBusiness"
        type: IvrBusiness
        ivrBusinessParam {
                keyword_map_dict_path: "./resource/conf_dict/domain/ivr/keyword_to_business_02.txt"
                fasttext_model_path: "./resource/conf_dict/domain/ivr/businessModel/fasttext"
                remote_para {
                        # svr_appkey: "com.sankuai.nlubot.ivrfaqclassify"
                        svr_appkey: "com.sankuai.nlu.remote.model"
                        cli_appkey: "com.sankuai.nlubot.ivrfaq"
                        timeout_ms: 150
                        service_name: "com.meituan.hadoop.afo.serving.common.OnlineService"
                }
                model_name: "ivr_bu_classify_new"
                vocab_dict_path: "resource/conf_dict/domain/ivr/businessModel/bert/vocab.txt"
                label_dict_path: "resource/conf_dict/domain/ivr/businessModel/bert/label_02.txt"
                use_rule_flag: true
                use_fasttext_flag: false
                use_bert_flag: true
                output_class_num: 4
                user_roles_map_conf_path: "resource/conf_dict/domain/ivr/bu_map_based_on_user_roles.txt"
                history_work_order_path: "resource/conf_dict/domain/ivr/history_work_order.txt"
                bu_id_to_name_path: "resource/conf_dict/domain/ivr/bu_id_to_name.txt"
                fuzzy_keyword_path: "resource/conf_dict/domain/ivr/fuzzy_keyword_to_bu_info.txt"
                xgboost_model_path: "resource/conf_dict/domain/ivr/businessModel/xgboost/call_bu_xgboost_02.model"
                history_skill_bu_path: "resource/conf_dict/domain/ivr/history_skill_info.txt"
                business_threshold: 0.5
                user_roles_conf_path: "./resource/conf_dict/domain/ivr/online_buid_to_user_map.txt"
        }
}

componentParam{
        name: "IvrBusiness_finance"
        type: IvrBusiness
        ivrBusinessParam {
                keyword_map_dict_path: "./resource/conf_dict/domain/ivr/keyword_to_business.txt"
                fasttext_model_path: "./resource/conf_dict/domain/ivr/businessModel/fasttext"
                remote_para {
                        # svr_appkey: "com.sankuai.nlubot.ivrfaqclassify"
                        svr_appkey: "com.sankuai.nlu.nlubot.ivrwaimaifaqsv"
                        # svr_appkey: "com.sankuai.nlu.remote.model"
                        cli_appkey: "com.sankuai.nlubot.ivrfaq"
                        timeout_ms: 150
                        service_name: "com.meituan.hadoop.afo.serving.common.OnlineService"
                }
                # model_name: "ivr_bu_classify_test"
                vocab_dict_path: "resource/conf_dict/domain/ivrFinance/businessModel/bert/vocab.txt"
                label_dict_path: "resource/conf_dict/domain/ivrFinance/businessModel/bert/label.txt"
                use_rule_flag: true
                use_fasttext_flag: false
                use_bert_flag: true
                output_class_num: 4
                user_roles_map_conf_path: "resource/conf_dict/domain/ivr/bu_map_based_on_user_roles.txt"
                history_work_order_path: "resource/conf_dict/domain/ivr/history_work_order.txt"
                bu_id_to_name_path: "resource/conf_dict/domain/ivrFinance/bu_id_to_name.txt"
                fuzzy_keyword_path: "resource/conf_dict/domain/ivrFinance/fuzzy_keyword_to_bu_info.txt"
                xgboost_model_path: "resource/conf_dict/domain/ivr/businessModel/xgboost/call_bu_xgboost.model"
                history_skill_bu_path: "resource/conf_dict/domain/ivr/history_skill_info.txt"
                business_threshold: 0.5
                user_roles_conf_path: "./resource/conf_dict/domain/ivr/online_buid_to_user_map.txt"
                model_name: "ivr_finance_bu_classify"
                use_call_business_model: false
                use_call_business_keyword: true
                hotline: "95172"
        }
}

componentParam{
        name: "IvrIntentMerge"
        type: IvrIntentMerge
        ivrIntentMergeParam {
                nlu_pass_threshold: 0.7
                faq_bimpm_threshold_full_match: 0.999999
                faq_bimpm_threshold_lower_limit: 0.9987
                faq_classify_threshold_high_frequency_top1: 0
                faq_classify_threshold_high_frequency_top2: 0
                faq_classify_threshold_mid_frequency_top1: 0.803
                faq_classify_threshold_mid_frequency_top2: 0.257
                faq_classify_threshold_low_frequency_top1: 0.807
                faq_classify_threshold_low_frequency_top2: 0.059
                business_fasttext_threshold: 0.5
                typical_question_cate_path: "./resource/conf_dict/domain/ivr/tq_frequency.txt"
                business_threshold_path: "./resource/conf_dict/domain/ivr/bu_threshold_02.txt"  
                positive_threshold: 0.763
                negative_threshold: 0.434
                bu_id_to_name_path: "resource/conf_dict/domain/ivr/bu_id_to_name.txt"
                call_business_model_threshold: 0.751
        }
}

componentParam{
        name: "IvrIntentMerge_finance"
        type: IvrIntentMerge
        ivrIntentMergeParam {
                nlu_pass_threshold: 0.7
                faq_bimpm_threshold_full_match: 0.999999
                faq_bimpm_threshold_lower_limit: 0.9987
                faq_classify_threshold_high_frequency_top1: 0.6260
                faq_classify_threshold_high_frequency_top2: 0
                faq_classify_threshold_mid_frequency_top1: 0.8330
                faq_classify_threshold_mid_frequency_top2: 0.1
                faq_classify_threshold_low_frequency_top1: 0.3650
                faq_classify_threshold_low_frequency_top2: 0.02
                business_fasttext_threshold: 0.5
                typical_question_cate_path: "./resource/conf_dict/domain/ivrFinance/tq_frequency.txt"
                business_threshold_path: "./resource/conf_dict/domain/ivrFinance/bu_threshold.txt"  
                positive_threshold: 0.763
                negative_threshold: 0.434
                bu_id_to_name_path: "resource/conf_dict/domain/ivr/bu_id_to_name.txt"
        }
}

componentParam{
        name: "IvrRoleClassify"
        type: IvrRoleClassify
        ivrRoleClassifyParam {
                fasttext_model_path: "./resource/conf_dict/domain/ivr/roleClassfiyModel/fasttext/model.bin"
                multi_class_num: 5
        }
}

componentParam{
        name: "IvrYesNoClassify"
        type: IvrYesNoClassify
        ivrYesNoClassifyParam {
                fasttext_model_path: "./resource/conf_dict/domain/ivr/yesNoClassfiyModel/fasttext/model.bin"
                multi_class_num: 1
        }
}

graphParam:{
        name: "IVR_routing_robot"
        type: StaticDAG
        StaticDAGParam {
            node_name: "PreProcess"
            node_type: LOCAL
            in_name: ""
            out_name: "MTSegWord"
        }
        StaticDAGParam {
            node_name: "MTSegWord"
            node_type: LOCAL
            in_name: "PreProcess"
            out_name: "TagExtract"
        }
        StaticDAGParam {
            node_name: "TagExtract"
            node_type: LOCAL
            in_name: "MTSegWord"
            out_name: "TagMergeComponent"
        }
        StaticDAGParam {
            node_name: "TagMergeComponent"
            node_type: LOCAL
            in_name: "TagExtract"
            out_name: "FeatureExtract"
        }
        StaticDAGParam {
            node_name: "FeatureExtract"
            node_type: LOCAL
            in_name: "TagMergeComponent"
            out_name: "FrameParse"
        }
        StaticDAGParam {
            node_name: "FrameParse"
            node_type: LOCAL
            in_name: "FeatureExtract"
            out_name: "AfterProcess"
        }
        StaticDAGParam {
            node_name: "AfterProcess"
            node_type: LOCAL
            in_name: "FrameParse"
            out_name: "IvrRoleClassify"
        }
        StaticDAGParam {
            node_name: "IvrRoleClassify"
            node_type: LOCAL
            in_name: "AfterProcess"
            out_name: "IVRComponent"
        }
        StaticDAGParam {
            node_name: "IVRComponent"
            node_type: LOCAL
            in_name: "IvrRoleClassify"
            out_name: "IvrUserRoles"
        }
        StaticDAGParam {
            node_name: "IvrUserRoles"
            node_type: LOCAL
            in_name: "IVRComponent"
            out_name: "IvrYesNoClassify"
        }
        StaticDAGParam {
            node_name: "IvrYesNoClassify"
            node_type: LOCAL
            in_name: "IvrUserRoles"
            out_name: "IvrFaqSearch"
        }
        StaticDAGParam {
            node_name: "IvrFaqSearch"
            node_type: LOCAL
            in_name: "IvrYesNoClassify"
            out_name: "IvrFaqBertClassify"
        }
        StaticDAGParam {
            node_name: "IvrFaqBertClassify"
            node_type: LOCAL
            in_name: "IvrFaqSearch"
            out_name: "IvrOrderRank"
        }
        StaticDAGParam {
            node_name: "IvrOrderRank"
            node_type: LOCAL
            in_name: "IvrFaqBertClassify"
            out_name: "IvrBusiness"
        }
        StaticDAGParam {
            node_name: "IvrBusiness"
            node_type: LOCAL
            in_name: "IvrOrderRank"
            out_name: "IvrIntentMerge"
        }
        StaticDAGParam {
            node_name: "IvrIntentMerge"
            node_type: LOCAL
            in_name: "IvrBusiness"
            out_name: ""
        }
}

graphParam:{
        name: "IVR_routing_robot_abtest"
        type: StaticDAG
        StaticDAGParam {
            node_name: "PreProcess_abtest"
            node_type: LOCAL
            in_name: ""
            out_name: "MTSegWord"
        }
        StaticDAGParam {
            node_name: "MTSegWord"
            node_type: LOCAL
            in_name: "PreProcess_abtest"
            out_name: "TagExtract_abtest"
        }
        StaticDAGParam {
            node_name: "TagExtract_abtest"
            node_type: LOCAL
            in_name: "MTSegWord"
            out_name: "TagMergeComponent"
        }
        StaticDAGParam {
            node_name: "TagMergeComponent"
            node_type: LOCAL
            in_name: "TagExtract_abtest"
            out_name: "FeatureExtract_abtest"
        }
        StaticDAGParam {
            node_name: "FeatureExtract_abtest"
            node_type: LOCAL
            in_name: "TagMergeComponent"
            out_name: "FrameParse_abtest"
        }
        StaticDAGParam {
            node_name: "FrameParse_abtest"
            node_type: LOCAL
            in_name: "FeatureExtract_abtest"
            out_name: "AfterProcess"
        }
        StaticDAGParam {
            node_name: "AfterProcess"
            node_type: LOCAL
            in_name: "FrameParse_abtest"
            out_name: "IvrRoleClassify"
        }
        StaticDAGParam {
            node_name: "IvrRoleClassify"
            node_type: LOCAL
            in_name: "AfterProcess"
            out_name: "IVRComponent"
        }
        StaticDAGParam {
            node_name: "IVRComponent"
            node_type: LOCAL
            in_name: "IvrRoleClassify"
            out_name: "IvrUserRoles"
        }
        StaticDAGParam {
            node_name: "IvrUserRoles"
            node_type: LOCAL
            in_name: "IVRComponent"
            out_name: "IvrYesNoClassify"
        }
        StaticDAGParam {
            node_name: "IvrYesNoClassify"
            node_type: LOCAL
            in_name: "IvrUserRoles"
            out_name: "IvrFaqSearch"
        }
        StaticDAGParam {
            node_name: "IvrFaqSearch"
            node_type: LOCAL
            in_name: "IvrYesNoClassify"
            out_name: "IvrFaqBertClassify"
        }
        StaticDAGParam {
            node_name: "IvrFaqBertClassify"
            node_type: LOCAL
            in_name: "IvrFaqSearch"
            out_name: "IvrOrderRank"
        }
        StaticDAGParam {
            node_name: "IvrOrderRank"
            node_type: LOCAL
            in_name: "IvrFaqBertClassify"
            out_name: "IvrBusiness"
        }
        StaticDAGParam {
            node_name: "IvrBusiness"
            node_type: LOCAL
            in_name: "IvrOrderRank"
            out_name: "IvrIntentMerge"
        }
        StaticDAGParam {
            node_name: "IvrIntentMerge"
            node_type: LOCAL
            in_name: "IvrBusiness"
            out_name: ""
        }
}

graphParam:{
        name: "IVR_routing_robot_abtest_c"
        type: StaticDAG
        StaticDAGParam {
            node_name: "PreProcess_abtest_c"
            node_type: LOCAL
            in_name: ""
            out_name: "MTSegWord"
        }
        StaticDAGParam {
            node_name: "MTSegWord"
            node_type: LOCAL
            in_name: "PreProcess_abtest_c"
            out_name: "TagExtract_abtest_c"
        }
        StaticDAGParam {
            node_name: "TagExtract_abtest_c"
            node_type: LOCAL
            in_name: "MTSegWord"
            out_name: "TagMergeComponent"
        }
        StaticDAGParam {
            node_name: "TagMergeComponent"
            node_type: LOCAL
            in_name: "TagExtract_abtest_c"
            out_name: "FeatureExtract_abtest_c"
        }
        StaticDAGParam {
            node_name: "FeatureExtract_abtest_c"
            node_type: LOCAL
            in_name: "TagMergeComponent"
            out_name: "FrameParse_abtest_c"
        }
        StaticDAGParam {
            node_name: "FrameParse_abtest_c"
            node_type: LOCAL
            in_name: "FeatureExtract_abtest_c"
            out_name: "AfterProcess"
        }
        StaticDAGParam {
            node_name: "AfterProcess"
            node_type: LOCAL
            in_name: "FrameParse_abtest_c"
            out_name: "IvrRoleClassify"
        }
        StaticDAGParam {
            node_name: "IvrRoleClassify"
            node_type: LOCAL
            in_name: "AfterProcess"
            out_name: "IVRComponent"
        }
        StaticDAGParam {
            node_name: "IVRComponent"
            node_type: LOCAL
            in_name: "IvrRoleClassify"
            out_name: "IvrUserRoles"
        }
        StaticDAGParam {
            node_name: "IvrUserRoles"
            node_type: LOCAL
            in_name: "IVRComponent"
            out_name: "IvrYesNoClassify"
        }
        StaticDAGParam {
            node_name: "IvrYesNoClassify"
            node_type: LOCAL
            in_name: "IvrUserRoles"
            out_name: "IvrFaqSearch"
        }
        StaticDAGParam {
            node_name: "IvrFaqSearch"
            node_type: LOCAL
            in_name: "IvrYesNoClassify"
            out_name: "IvrFaqBertClassify"
        }
        StaticDAGParam {
            node_name: "IvrFaqBertClassify"
            node_type: LOCAL
            in_name: "IvrFaqSearch"
            out_name: "IvrOrderRank"
        }
        StaticDAGParam {
            node_name: "IvrOrderRank"
            node_type: LOCAL
            in_name: "IvrFaqBertClassify"
            out_name: "IvrBusiness"
        }
        StaticDAGParam {
            node_name: "IvrBusiness"
            node_type: LOCAL
            in_name: "IvrOrderRank"
            out_name: "IvrIntentMerge"
        }
        StaticDAGParam {
            node_name: "IvrIntentMerge"
            node_type: LOCAL
            in_name: "IvrBusiness"
            out_name: ""
        }
}

graphParam:{
        name: "IVR_finance"
        type: StaticDAG
        StaticDAGParam {
            node_name: "PreProcess_finance"
            node_type: LOCAL
            in_name: ""
            out_name: "MTSegWord"
        }
        StaticDAGParam {
            node_name: "MTSegWord"
            node_type: LOCAL
            in_name: "PreProcess_finance"
            out_name: "TagExtract_finance"
        }
        StaticDAGParam {
            node_name: "TagExtract_finance"
            node_type: LOCAL
            in_name: "MTSegWord"
            out_name: "TagMergeComponent"
        }
        StaticDAGParam {
            node_name: "TagMergeComponent"
            node_type: LOCAL
            in_name: "TagExtract_finance"
            out_name: "FeatureExtract_finance"
        }
        StaticDAGParam {
            node_name: "FeatureExtract_finance"
            node_type: LOCAL
            in_name: "TagMergeComponent"
            out_name: "FrameParse_finance"
        }
        StaticDAGParam {
            node_name: "FrameParse_finance"
            node_type: LOCAL
            in_name: "FeatureExtract_finance"
            out_name: "AfterProcess"
        }
        StaticDAGParam {
            node_name: "AfterProcess"
            node_type: LOCAL
            in_name: "FrameParse_finance"
            out_name: "IvrRoleClassify"
        }
        StaticDAGParam {
            node_name: "IvrRoleClassify"
            node_type: LOCAL
            in_name: "AfterProcess"
            out_name: "IVRComponent"
        }
        StaticDAGParam {
            node_name: "IVRComponent"
            node_type: LOCAL
            in_name: "IvrRoleClassify"
            out_name: "IvrUserRoles"
        }
        StaticDAGParam {
            node_name: "IvrUserRoles"
            node_type: LOCAL
            in_name: "IVRComponent"
            out_name: "IvrYesNoClassify"
        }
        StaticDAGParam {
            node_name: "IvrYesNoClassify"
            node_type: LOCAL
            in_name: "IvrUserRoles"
            out_name: "IvrFaqSearch_finance"
        }
        StaticDAGParam {
            node_name: "IvrFaqSearch_finance"
            node_type: LOCAL
            in_name: "IvrYesNoClassify"
            out_name: "IvrFaqBertClassify_finance"
        }
        StaticDAGParam {
            node_name: "IvrFaqBertClassify_finance"
            node_type: LOCAL
            in_name: "IvrFaqSearch_finance"
            out_name: "IvrOrder"
        }
        StaticDAGParam {
            node_name: "IvrOrder"
            node_type: LOCAL
            in_name: "IvrFaqBertClassify_finance"
            out_name: "IvrBusiness_finance"
        }
        StaticDAGParam {
            node_name: "IvrBusiness_finance"
            node_type: LOCAL
            in_name: "IvrOrder"
            out_name: "IvrIntentMerge_finance"
        }
        StaticDAGParam {
            node_name: "IvrIntentMerge_finance"
            node_type: LOCAL
            in_name: "IvrBusiness_finance"
            out_name: ""
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

function valDealer(res, val, indent = 0, key) {
  if (val instanceof Object) {
    if (val.name === 'identifier') {
      res += spaces(indent) + key + ": " + (val.value) + "\n"
    } else {
      res += spaces(indent) + key + " " + '{\n' + obj2prototxt(val, indent + 2) + spaces(indent) + '}\n'
    }
      
  } else {
    res += spaces(indent) + key + ": " + addQuote(val) + "\n"
  }
  return res
}
      

export const obj2prototxt = function (obj, indent) {
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

// console.log(proto, obj2prototxt(proto, 0))
const graph = proto.graphParam[0]
export const AllNodes = proto.componentParam
export const links = graph.StaticDAGParam.map((val, key) => {
    return {
        ...val,
        type: val.node_type.value,
        source: val.in_name, 
        target: val.out_name
    }
})
export const nodes = Array.from(new Set(links.flatMap(l => [l.source, l.target])), id => ({id}))

export const linkNodeArr = proto.componentParam.map((val, key) => {
    return { id: val.name }
})
linkNodeArr.push({id: ''})
export const linkFlatArr = proto.graphParam.flatMap((val, key) => {
    return val.StaticDAGParam
}).map((val, key) => {
    return {
        ...val,
        type: val.node_type.value,
        source: val.in_name, 
        target: val.out_name
    }
})

console.log(graph.name, `graph`, proto)

export const data = {links, nodes}