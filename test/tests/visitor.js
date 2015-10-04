var expect = require("chai").expect;
var visitor = require("../../lib/visitor.js");

describe("Visitor", function () {
    
    var tree = [
        {
            id: "1",
            children: [{
                    id: "1.1"
                }, {
                    id: "1.2"
                }]
        }, {
            id: "2"
        }, {
            id: "3",
            children: [{
                    id: "3.1",
                    stop: true
                }, {
                    id: "3.2", 
                    skip: true,
                    children: [{
                            id: "3.2.1"
                        }, {
                            id: "3.2.2"
                        }]
                }]
        }
    ];
    
    it("walks", function () {
        var expected = ["1", "1.1", "1.2", "2", "3", "3.1", "3.2", "3.2.1", "3.2.2"];
        var result = [];
        var walker = new visitor(function (node, state) {
            result.push(node.id);
        },
        function (node) {
            return node.children;
        });
        walker.walk(tree, {});
        
        expect(result).to.deep.equal(expected);
    });
    
    it("passes state", function () {
        var result = [];
        
        var walker = new visitor(function (node, state) {
            result.push(node.id);
            state.result.push(node.id);
            
            expect(state.result).to.deep.equal(result);
        },
        function (node) {
            return node.children;
        });
        walker.walk(tree, { result: [] });
    });

    it("can stop", function () {
        var expected = ["1", "1.1", "1.2", "2", "3", "3.1"];
        
        var result = [];
        var walker = new visitor(function (node, state) {
            result.push(node.id);
            if (node.stop) {
                return visitor.Stop;
            }
        },
        function (node) {
            return node.children;
        });
        walker.walk(tree, {});
        
        expect(result).to.deep.equal(expected);
    });
    
    it("can skip children", function () {
        var expected = ["1", "1.1", "1.2", "2", "3", "3.1", "3.2"];
        
        var result = [];
        var walker = new visitor(function (node, state) {
            result.push(node.id);
            if (node.skip) {
                return visitor.Skip;
            }
        },
        function (node) {
            return node.children;
        });
        walker.walk(tree, {});
        
        expect(result).to.deep.equal(expected);
    });

});