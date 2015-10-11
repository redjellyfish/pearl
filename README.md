# Pearl HTML Templates
Easy to learn, use, extend. 
___
## Features
 - Uses existing languages, code in HTML and JavaScript
 - Simple codebase, uses standard HTML Parser
 - Easily extend using filters and custom elements
 - Create re-usable, extendable components
___
## Usage Example
**Model**
```js
{
    title: "page title",
    pages: {
        home: "#home",
        contact: "#contact",
        about: "/about-us"
    }
}
```
**layout.html**
```html
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
    <meta charset="utf-8" />
    <title><block id="page-title">{{title}}</block></title>

    <block id="styles">
        <region id="styles"></region>
    </block>
</head>
<body>
	<component id="menu-item" $pageName $pageUrl>
		<li><a href="{{$.pageUrl}}">{{$.pageName}}</a></li>
	</component>
    <block id="page-menu">
        <ul>
            <foreach var="page" in="{{pages}}">
                <include name="menu-item" 
	                $pageName="{{page}}" 
	                $pageUrl="{{pages[page]}}"></include>
            </foreach>
        </ul>
    </block>
    <block id="page-content">
        Content
    </block>
    <block id="scripts">
        <region id="scripts"></region>
    </block>
</body>
</html>
```
**index.html**
```html
<include import="layout">
    <block id="page-content">
        Welcome to my website
    </block>
</include>
```
**Output**
```html
??<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
    <meta charset="utf-8">
    <title>page title</title>
</head>
<body>
    <ul>
        <li><a href="#home">home</a></li>
        <li><a href="#contact">contact</a></li>
        <li><a href="/about-us">about</a></li>
    </ul>

    Welcome to my website
</body>
</html>
```
___
## Text Interpolation
Values from the model can be inserted into the output by surrounding values in the model as follows:
```html
{{title}}
```
#### Text Helpers
Helpers provide transformations of the results of interpolated text blocks. There are two build in helpers:

 **HTML Escape** (e|html|escape)
 
`{{'<div/>'#escape}}` --> `&lt;div/&gt;`

 **URL Encode** (u|url|encode)
 
`{{'hello world'#url}}` --> `hello%20world`

## Region
 `Region`s define named areas that can later be exported into by components, by themselves they do not do anything but when referenced allow components to place scripts, styles, etc onto the page.
```html
<region id="scripts"></region> 
```
## Resource
A resource element provides an easy way to include a script or stylesheet reference on the page and format the path to the file.

```html
<resource type="js|css" path="/path/to/file/name-without-ext"></resource>
```
By default, the resource element will output the relevant element (`link`, `script`) with a source path based on the `NODE_ENV` variable. This is overridable by setting the `config.resource.format value`

In development mode:
`config.resource.format = "{path}.min.{type}"`
Otherwise:
`config.resource.format = "{path}.{type}"`

## Conditions
### If
### ElseIf
### Else

## Component
Components are the base element for creating re-usable content blobs.
```html
<component id="id" $arg0 $arg1="default value">
  {{$.arg0}} - {{$.arg1}}
</component>
```
`Component` markup itself is not output in the resulting HTML, but instances of `component`s can be created using `include`

They can accept arguments in the format `$argumentName` and these can be referenced from within the model using `{{$.argumentName}}`

Arguments can be given default values by assigning the attribute a value `$argumentName="value"`

### Export
`Export` is used to output elements from a component into a `region`
```html
<component id="test" $region>
  <export into="{{$.region}}">
    <resource type="js" path="js/main"></resource>
  </export>
</component>
```
The component above will export a JavaScript `resource` into the `region` that is specified in the `$region` argument

## Include





### For

### ForEach

### Block

### Parent

