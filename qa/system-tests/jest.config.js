module.exports = {
  reporters: [
    "default",
    ["jest-html-reporter", {
      "pageTitle": "Quản lý Chung cư - System Test Report",
      "outputPath": "./report/system-test-report.html",
      "includeFailureMsg": true,
      "customScriptPath": "./export-excel.js"
    }]
  ]
};
