import "./chart"
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api.js'
// import 'monaco-editor/esm/vs/language/json/monaco.contribution'
import 'monaco-editor/esm/vs/basic-languages/javascript/javascript.contribution'

self.MonacoEnvironment = {
    getWorkerUrl: function(moduleId, label) {
      if (label === 'json') {
        return './json.worker.js';
      }
      if (label === 'css' || label === 'scss' || label === 'less') {
        return './css.worker.js';
      }
      if (label === 'html' || label === 'handlebars' || label === 'razor') {
        return './html.worker.js';
      }
      if (label === 'typescript' || label === 'javascript') {
        return './ts.worker.js';
      }
      return './editor.worker.js';
    },
  };

setTimeout(() => {
    
    const monacoInstance=monaco.editor.create(document.getElementById("test"),{
        value:`{test:1}`,
        language:"javascript",
        minimap: {
            enabled: false
        }
})
// monacoInstance.dispose();//使用完成销毁实例
window.monacoInstance = monacoInstance
}, 1000);

// setTimeout(() => {
//     // JSON object we want to edit
//   const jsonCode = [{"enabled": true,"description": "something"}];

//   const modelUri = monaco.Uri.parse("json://grid/settings.json");
//   console.log()
//   const jsonModel = monaco.editor.createModel(JSON.stringify(jsonCode, null, '\t'), "json", modelUri);

//   const editor = monaco.editor.create(document.getElementById('test'), {
//     model: jsonModel
//   });
//   window.monacoInstance = editor
// }, 1000);