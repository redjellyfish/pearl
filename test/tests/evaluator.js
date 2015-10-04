var expect = require("chai").expect;
var evaluator = require("../../lib/evaluator.js");

describe("Evaluator", function () {
    var model = {
        title: "Test",
        isTrue: false,
        ifTrue: "is true",
        ifFalse: "is false",
        complex: {
            subitem: "success"
        }
    };

    describe("evaluate", function () {
        it("can get values from model", function () {
            Object.keys(model).forEach(function (key) {
                expect(evaluator.evaluate(key, model)).to.equal(model[key]);
            });
            expect(evaluator.evaluate("complex.subitem", model)).to.equal(model.complex.subitem);
        });

        it("can execute statements", function () {
            expect(evaluator.evaluate("1+2", model)).to.equal(3);
            expect(evaluator.evaluate("isTrue ? ifTrue : ifFalse", model)).to.equal(model.ifFalse);
            expect(evaluator.evaluate("complex.subitem + 'test'", model)).to.equal(model.complex.subitem + 'test');
        });
    });
    
    describe("rewrite", function () {
        it("can get values from model", function () {
            Object.keys(model).forEach(function (key) {
                expect(evaluator.rewrite("{{" + key + "}}", model)).to.equal(model[key]);
            });
            expect(evaluator.rewrite("{{complex.subitem}}", model)).to.equal(model.complex.subitem);
        });

        it("can execute statements", function () {
            expect(evaluator.rewrite("{{1+2}}", model)).to.equal(3);
            expect(evaluator.rewrite("{{isTrue ? ifTrue : ifFalse}}", model)).to.equal(model.ifFalse);
            expect(evaluator.rewrite("{{complex.subitem + 'test'}}", model)).to.equal(model.complex.subitem + 'test');
        });

        it("can change key markers", function () {
            expect(evaluator.rewrite("|1+2|", model, "|", "|")).to.equal(3);
            expect(evaluator.rewrite("<<1+2>>", model, "<<", ">>")).to.equal(3);
            expect(evaluator.rewrite("!!!1+2___", model, "!!!", "___")).to.equal(3);
            expect(evaluator.rewrite("a1+2___", model, "a", "___")).to.equal(3);
            expect(evaluator.rewrite("{{1+2}}", model)).to.equal(3);
        });


        describe("helpers", function () {
            it("can handle marker in string", function () {
                expect(evaluator.rewrite("{{'marker#marker'#escape}}", model)).to.equal("marker#marker");
                expect(evaluator.rewrite('{{"<marker#marker>"#escape}}', model)).to.equal("&lt;marker#marker&gt;");
                expect(evaluator.rewrite('{{"marker<#>marker"}}', model)).to.equal("marker<#>marker");
                expect(evaluator.rewrite('{{"#"}}', model)).to.equal("#");
            });

            it("can process helpers", function () {
                expect(evaluator.rewrite("{{'<div/>'#escape}}", model)).to.equal("&lt;div/&gt;");
                expect(evaluator.rewrite('{{"<div/>"#escape}}', model)).to.equal("&lt;div/&gt;");
                expect(evaluator.rewrite('{{"<div>\'\\\'\\"test\\"\\\'\'</div>"#escape}}', model)).to.equal("&lt;div&gt;&apos;&apos;&quot;test&quot;&apos;&apos;&lt;/div&gt;");
            });

            it("escape works", function () {
                expect(evaluator.rewrite("{{'<>&@test!#\\'!-'#escape}}", model)).to.equal("&lt;&gt;&amp;@test!#&apos;!-");
                expect(evaluator.rewrite("{{'<>&@test!#\\'!-'#e}}", model)).to.equal("&lt;&gt;&amp;@test!#&apos;!-");
            });
            
            it("encode works", function () {
                expect(evaluator.rewrite("{{'http://website.com/qwer?t # y&uio .p+test?'#encode}}", model)).to.equal("http://website.com/qwer?t%20#%20y&uio%20.p+test?");
            });
        });
    });
    
});