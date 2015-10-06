var engine = require('./lib/engine.js');
var fs = require('fs');
var htmlparser = require("htmlparser2");
var domutils = require('domutils');

function renderDOM(dom, model) {
    return domutils.getOuterHTML(engine.process(dom, model));
}

function renderHTML(html, model) {
    return renderDOM(htmlparser.parseDOM(html), model);
}

function renderFile(path, model) {
    return this.renderHTML(fs.readFileSync(file, "utf8"), model);
}

module.exports = {
    renderDOM: renderDOM,
    renderHTML: renderHTML,
    renderFile: renderFile,
    engine: engine
};