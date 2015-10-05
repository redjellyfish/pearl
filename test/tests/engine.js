var expect = require("chai").expect;
var engine = require("../../lib/engine.js");
var htmlparser = require("htmlparser2");
var domutils = require('domutils');

function process(html, model) {
    return domutils.getOuterHTML(engine.process(htmlparser.parseDOM(html), model));
}

describe("Engine", function () {
    describe("text interpolation", function () {
        it("works", function () {
            expect(process('{{value}}', {value: "hello world"})).to.equal("hello world");
        });
        it("works with complex", function () {
            expect(process('{{value.nested[0].text}}', { value: {nested: [{ text: "hello world" }]} })).to.equal("hello world");
        });
        it("works with inline with html", function () {
            expect(process('<div>{{value}}</div>', { value: "hello world" })).to.equal("<div>hello world</div>");
        });
        it("works with in attributes", function () {
            expect(process('<div class="{{value}}"/>', { value: "hello world" })).to.equal('<div class="hello world"></div>');
        });
    });
    
    describe("foreach", function () {
        it("outputs the key and value", function () {
            expect(process('<foreach var="key" in="{{lookup}}">[{{key}}:{{lookup[key]}}]</foreach>', {
                lookup: {
                    z: "a",
                    y: "b",
                    x: "c",
                    w: "d"
                }
            })).to.equal("[z:a][y:b][x:c][w:d]");
        });
        
        it("works with complex objects", function () {
            expect(process('<foreach var="key" in="{{lookup}}">{{lookup[key].b.c.text}}</foreach>', {
                lookup: {
                    a: { b: { c: { text: "hello" } } },
                    b: { b: { c: { text: "world" } } }
                }
            })).to.equal("helloworld");
        });
    });
    
    describe("for", function () {
        it("outputs the index and value", function () {
            expect(process('<for var="i" in="{{array}}">[{{i}}:{{array[i]}}]</for>', {
                array: ["a", "b", "c", "d"]
            })).to.equal("[0:a][1:b][2:c][3:d]");
        });
        
        it("works with complex objects", function () {
            expect(process('<for var="i" in="{{array}}">{{array[i].text}}</for>', {
                array: [{ text: "hello" }, { text: "world" }]
            })).to.equal("helloworld");
        });
    });
    
    describe("ifs", function () {
        var model = { isfalse: false, istrue: true };
        
        it("works with basic condition", function () {
            expect(process('<if condition="true">pass</if><else>fail</else>', model)).to.equal("pass");
        });
        
        it("works with else", function () {
            expect(process('<if condition="false">fail</if><else>pass</else>', model)).to.equal("pass");
        });
        
        it("works with elseif", function () {
            expect(process('<if condition="false">fail</if><elseif condition="true">pass</elseif><else>fail</else>', model)).to.equal("pass");
        });
        
        it("works with model values", function () {
            expect(process('<if condition="istrue">pass</if><else>fail</else>', model)).to.equal("pass");
        });
        
        it("works with nesting", function () {
            expect(process('<if condition="istrue"><if condition="istrue">pass</if><else>fail</else></if><else>fail</else>', model)).to.equal("pass");
        });
        
        it("works with negation", function () {
            expect(process('<if condition="isfalse">fail</if><else><if condition="!isfalse">pass</if><else>fail</else></else>', model)).to.equal("pass");
        });
        
        it("works with AND", function () {
            expect(process('<if condition="istrue && !isfalse">pass</if><else>fail</else>', model)).to.equal("pass");
        });
        
        it("works with expression", function () {
            expect(process('<if condition="!(!istrue && isfalse)">pass</if><else>fail</else>', model)).to.equal("pass");
        });
    });
    
    describe("resource", function () {
        it("outputs script tag", function () {
            expect(process('<resource type="js" path="/scripts/library"></resource>', {})).to.equal('<script src="/scripts/library.js" type="text/javascript"></script>');
        });

        it("outputs link tag", function () {
            expect(process('<resource type="css" path="/styles/site"></resource>', {})).to.equal('<link href="/styles/site.css" rel="stylesheet">');
        });
    });

    describe("component", function () {
        it("is removed from dom", function () {
            expect(process('<component id="test">test</component>', {})).to.equal("");
        });

        describe("include", function () {
            describe("region", function () {
                it("is removed from dom", function () {
                    expect(process('<region id="test"></region>', {})).to.equal("");
                });
            });
            
            it("can create a component", function () {
                expect(process('<component id="test">test</component><include name="test"/>', {})).to.equal("test");
            });
            
            it("can accept arguments", function () {
                expect(process('<component id="test" $arg>{{$.arg}}</component><include name="test" $arg="pass"/>', {})).to.equal("pass");
            });
            
            it("can use model values", function () {
                expect(process('<component id="test">{{title}}</component><include name="test"/>', { title: 'test' })).to.equal("test");
            });

            describe("export", function () {
                it("can export into region", function () {
                    expect(process('<region id="region"></region><component id="test" $region>|<export into="{{$.region}}"><div>hello</div></export>test</component><include name="test" $region="region"/>', {})).to.equal("<div>hello</div>|test");
                });
                
                it("can export interpolated text into region", function () {
                    expect(process('<region id="region"></region><component id="test" $region $text>|<export into="{{$.region}}"><div>{{$.text}}</div></export>test</component><include name="test" $region="region" $text="{{text}}"/>', { text: "pass" })).to.equal("<div>pass</div>|test");
                });
            });
        });
    });
});











