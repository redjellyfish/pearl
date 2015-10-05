"use strict";

var domutils = require('domutils');

module.exports = {
    nextTag : function (node) {
        while (node.next !== null) {
            if (node.next.type === "tag")
                return node.next;
            node = node.next;
        }
        return null;
    },
    replaceNode: function (node, replacements) {
        for (var i = 0; i < replacements.length; i++) {
            domutils.prepend(node, replacements[i]);
        }
        domutils.removeElement(node);
    }
};