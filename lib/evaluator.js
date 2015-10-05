"use strict";

var Entities = require('html-entities').AllHtmlEntities;

var entities = new Entities();
var helpers = {};

module.exports.evaluate = function (text, model) {
    //TODO: Change this to not use new Function
    return Function.apply(null, ['_', 'with(_) { return ' + text + ' }'])(model);
};

module.exports.rewrite = function (text, model, keyStart, keyEnd, helperIndicator) {
    keyStart = keyStart || "{{";
    keyEnd = keyEnd || "}}";
    helperIndicator = helperIndicator || "#";
    
    var pos;
    //Rewrite any {{code}} to their actual values
    while ((pos = text.indexOf(keyStart)) > -1) {
        var pos2 = text.indexOf(keyEnd, pos + keyStart.length);
        var key = text.substring(pos + keyStart.length, pos2);
        
        var inStr = "";
        var helper = null;
        for (var i = 0; i < key.length; i++) {
            var c = key[i];
            switch (c) {
                case "\\"://If we see a \ then skip the next character
                    i++;
                    break;
                case "'":
                case '"':
                    if (inStr === c) {
                        inStr = "";
                    } else if (inStr === "") {
                        inStr = c;
                    }
                    break;
                case helperIndicator:
                    if (inStr === "") {
                        helper = key.substr(i + 1);
                        key = key.substr(0, i);
                    }
                    break;
            }
            if (helper !== null) {
                break;
            }
        }
        
        var v = module.exports.evaluate(key, model);
        
        if (helper !== null) {
            v = helpers[helper](v, model);
        }
        
        var pre = text.substring(0, pos);
        var post = text.substr(pos2 + keyEnd.length);
        //If the text before and after is null just return the value to prevent casting to string
        if (pre.length === 0 && post.length === 0) return v;
        
        if (v === undefined) {
            v = "";
        }
        
        //Else rewrite that section and continue
        text = pre + v + post;
    }
    return text;
};

module.exports.registerHelper = function (name, action) {
    if (name instanceof Array) {
        for (var i = 0; i < name.length; i++) {
            helpers[name[i]] = action;
        }
    } else {
        helpers[name] = action;
    }
};

module.exports.registerHelper(["e", "html", "escape"], function (text, model) {
    return entities.encode(text);
});

module.exports.registerHelper(["u", "url", "encode"], function (text, model) {
    return encodeURI(text);
});