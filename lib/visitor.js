"use strict";

var debug = require('debug')("pearl:visitor");

function visitor(visit, children) {
    /*jshint validthis:true */
    this.visit = visit;
    this.children = children;
}

visitor.Continue = "continue";
visitor.Stop = "stop";
visitor.Skip = "skip";

visitor.prototype.walk = function (tree, state) {
    var self = this;
    
    debug("Visit beginning - Tree:");
    debug(tree);
    debug("State:");
    debug(state);
    
    for (var i = 0; i < tree.length; i++) {
        var node = tree[i];
        
        debug("Visiting node [" + i + "/" + tree.length + "]");
        debug(node);
        
        var res = self.visit(node, state);
        
        debug("Visited node: " + (res || visitor.Continue));
        
        switch (res) {
            case visitor.Stop:
                return;
            case visitor.Skip:
                continue;
        }
        
        var nodes = self.children(node);
        debug("Children:");
        debug(nodes || {});
        
        if (nodes) {
            self.walk(nodes, state);
        }

    }
};

module.exports = visitor;