"use strict";

var htmlparser = require("htmlparser2");
var domutils = require('domutils');
var visitor = require('./visitor.js');
var evaluator = require('./evaluator.js');
var nextTag = require('./utilities.js').nextTag;
var replaceNode = require('./utilities.js').replaceNode;

function pearl() {
}

function getModel(state) {
    var obj = {};
    for (var i = 0; i < state.modelStack.length; i++) {
        obj = Object.assign(obj, state.modelStack[i]);
    }
    return obj;
}

function popBlock(id, state) {
    for (var j = state.blockStack.length - 1; j >= 0; j--) {
        if (id in state.blockStack[j]) {
            var block = state.blockStack[j][id];
            delete state.blockStack[j][id];
            return {
                el: htmlparser.parseDOM(block.html)[0],
                orig: block.orig
            };
        }
    }
    return null;
}

pearl.process = function (dom, model, config) {
    dom = { type: "tag", name: "pearl", children: dom };
    for (var c = 0; c < dom.children.length; c++) {
        dom.children[c].parent = dom;
    }
    
    var defaults = {};
    defaults.resource = {};
    if (process.env.NODE_ENV === "development") {
        defaults.resource.format = "{path}.{type}";
    } else {
        defaults.resource.format = "{path}.min.{type}";
    }
    
    //TODO: Extend defaults
    config = Object.assign({}, defaults, config);
    
    
    var state = {
        regions: {},
        templates: {},
        exports: {},
        blockStack: [],
        parentBlock: [],
        modelStack: [model],
        dom: dom,
        config: config
    };
    
    var els = domutils.getElementsByTagName("region", dom);
    for (var j = 0; j < els.length; j++) {
        state.regions[els[j].attribs.id] = els[j];
    }
    
    els = domutils.getElementsByTagName("component", dom);
    for (var i = 0; i < els.length; i++) {
        domutils.removeElement(els[i]);
        els[i].parent = null;
        els[i].next = null;
        els[i].prev = null;
        state.templates[els[i].attribs.id] = domutils.getOuterHTML(els[i]);
    }
    
    pearl.visitor.walk(dom.children, state);
    
    for (var k in state.regions) {
        domutils.removeElement(state.regions[k]);
    }
    
    return dom.children;
};

pearl.tags = {
    text: function (node, state) {
        //Simply rewrite the text node
        node.data = evaluator.rewrite(node.data, getModel(state));
    },
    include: function (node, state) {
        var $ = {};
        
        //Create a new DOM object from the template object and visit it
        var template = htmlparser.parseDOM(state.templates[node.attribs.name])[0];
        for (var def in template.attribs) {
            if (def[0] === '$') {
                $[def.substr(1)] = evaluator.rewrite(template.attribs[def], getModel(state));
            }
        }
        
        //Generate arguments object
        for (var attr in node.attribs) {
            if (attr[0] === '$') {
                $[attr.substr(1)] = evaluator.rewrite(node.attribs[attr], getModel(state));
            }
        }
        
        //Find and store all blocks that are being overridden and then remove them
        var overrideBlocks = domutils.getElementsByTagName("block", node);
        var blocks = {};
        
        var findBlock = function (id) {
            return function (el) {
                return el.type === "tag" && el.name === "block" && el.attribs && el.attribs.id === id;
            };
        };

        for (var i = 0; i < overrideBlocks.length; i++) {
            blocks[overrideBlocks[i].attribs.id] = {
                html: domutils.getOuterHTML(overrideBlocks[i]), 
                orig: domutils.findOne(findBlock(overrideBlocks[i].attribs.id), template.children)
            };
            domutils.removeElement(overrideBlocks[i]);
        }
        
        //Push new scope
        state.blockStack.push(blocks);
        state.modelStack.push({ $: $ });
        
        pearl.visitor.walk(template.children, state);
        
        //Pop scope
        state.modelStack.pop();
        state.blockStack.pop();
        
        //Replace this include with the children of the template
        replaceNode(node, template.children);
        
        //Dont update the children, we already have
        return false;
    },
    export: function (node, state) {
        //Check to see if this export is marked as unique indicating that it should only be exported once
        if ("unique" in node.attribs) {
            var uid = evaluator.rewrite(node.attribs.unique, getModel(state));
            //If we've already exported this just remove it
            if (uid in state.exports) {
                domutils.removeElement(node);
                return;
            } else {
                state.exports[uid] = true;
            }
        }
        
        //Ensure its children are processed and then copy it into the target region
        pearl.visitor.walk(node.children, state);
        
        var into = evaluator.rewrite(node.attribs.into, getModel(state));
        if (into in state.regions) {
            var region = state.regions[into];
            
            for (var i = 0; i < node.children.length; i++) {
                domutils.prepend(region, node.children[i]);
            }
            
            domutils.removeElement(node);
            
            //Dont update the children, we already have
            return false;
        } else {
            this.error(node, "region not found: " + into);
        }
    },
    resource: function (node, state) {
        var type = evaluator.rewrite(node.attribs.type, getModel(state));
        var path = evaluator.rewrite(node.attribs.path, getModel(state));
        
        path = state.config.resource.format.replace("{path}", path).replace("{type}", type);
        
        var newNode;
        
        //Create a new link or script tag depending on the type
        switch (type) {
            case "css":
                newNode = {
                    type: "tag",
                    name: "link",
                    attribs: {
                        href: path,
                        rel: "stylesheet"
                    }
                };
                break;
            case "js":
                newNode = {
                    type: "tag",
                    name: "script",
                    attribs: {
                        src: path,
                        type: "text/javascript"
                    }
                };
                break;
        }
        
        //Replace the resource node
        domutils.prepend(node, newNode);
        domutils.removeElement(node);
    },
    if: function (node, state) {
        var nodes = [];
        nodes.push(node);
        
        //Process all elseif/else nodes following
        while (true) {
            node = nextTag(node);
            if (node === null) {
                break;
            } else if (node.name === "elseif") {
                nodes.push(node);
            } else if (node.name === "else") {
                nodes.push(node);
                break;
            } else {
                break;
            }
        }
        
        //Iterate over each condition and check it for success
        for (var i = 0; i < nodes.length; i++) {
            var cond = false;
            var n = nodes[i];
            if (n.name === "else") {
                cond = true;
            } else {
                var condition = evaluator.evaluate(n.attribs.condition, getModel(state));
                if (condition && condition !== "undefined") {
                    cond = true;
                }
            }
            //If the condition evaluated to true then append its children
            if (cond) {
                pearl.visitor.walk(n.children, state);
                
                for (var j = 0; j < n.children.length; j++) {
                    domutils.prepend(n, n.children[j]);
                }
                break;
            }
        }
        
        //Remove all if/elseif/else nodes
        for (var k = 0; k < nodes.length; k++) {
            domutils.removeElement(nodes[k]);
        }
    },
    for: function (node, state) {
        var variable = node.attribs.var;
        var target = evaluator.rewrite(node.attribs.in, getModel(state));
        
        //Get the HTML of the node se we can duplicate it
        var html = domutils.getOuterHTML(node);
        
        //Iterate over each target
        for (var i = 0; i < target.length; i++) {
            var block = htmlparser.parseDOM(html)[0];
            
            //Create a new scope with the key and process children
            var k = {};
            k[variable] = i;
            state.modelStack.push(k);
            pearl.visitor.walk(block.children, state);
            //Pop the model off the stack
            state.modelStack.pop();
            
            //Append the children after the node
            for (var x = 0; x < block.children.length; x++) {
                domutils.prepend(node, block.children[x]);
            }
        }
        
        //Remove the node
        domutils.removeElement(node);
        return false;
    },
    foreach: function (node, state) {
        var variable = node.attribs.var;
        var target = evaluator.rewrite(node.attribs.in, getModel(state));
        
        //Get the HTML of the node se we can duplicate it
        var html = domutils.getOuterHTML(node);
        
        //Iterate over each target
        for (var key in target) {
            var block = htmlparser.parseDOM(html)[0];
            
            //Create a new scope with the key and process children
            var k = {};
            k[variable] = key;
            state.modelStack.push(k);
            pearl.visitor.walk(block.children, state);
            
            //Pop the model off the stack
            state.modelStack.pop();
            
            //Append the children after the node
            for (var i = 0; i < block.children.length; i++) {
                domutils.prepend(node, block.children[i]);
            }
        }
        
        //Remove the node
        domutils.removeElement(node);
        return false;
    },
    block: function (node, state) {
        //Try and find the block that we are overriding
        var block = popBlock(node.attribs.id, state);
        if (block === null) {
            replaceNode(node, node.children);
            return;
        }
        state.parentBlock.push(block);
        
        //Visit the children of the node and add then to the dom
        pearl.visitor.walk(block.el.children, state);
        
        state.parentBlock.pop();
        

        replaceNode(node, block.el.children);
        return false;
    },
    script: function (node, state) {
        if (node.attribs.type === "text/pearl") {
            Function.apply({}, ['_', 'with(_) { ' + domutils.getText(node) + ' }'])(getModel(state));
            domutils.replaceElement(node, { type: "text", data: "" });
        }
    },
    parent: function (node, state){
        var block = state.parentBlock[state.parentBlock.length - 1].orig;
        pearl.visitor.walk(block.children, state);
        replaceNode(node, block.children);
        return false;
    }
};


pearl.visitor = new visitor(function (node, state) {
    if (node.type in pearl.tags) {
        if (pearl.tags[node.type](node, state) === false) return visitor.Skip;
    }
    
    if (node.type == "tag") {
        if (node.name in pearl.tags) {
            if (pearl.tags[node.name](node, state) === false) return visitor.Skip;
        }
        
        if (node.attribs) {
            for (var attr in node.attribs) {
                node.attribs[attr] = evaluator.rewrite(node.attribs[attr], getModel(state));
            }
        }
    }

}, function (node) {
    return node.children;
});

module.exports = pearl;