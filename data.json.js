/**
 * @fileoverview Utility JSON methods, fallbacks for JSON.parse/stringify, and a jsonPath implementation
 */

/*
    http://www.JSON.org/json2.js
    2010-08-25

    Public Domain.

    NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.

    See http://www.JSON.org/js.html


    This code should be minified before deployment.
    See http://javascript.crockford.com/jsmin.html

    USE YOUR OWN COPY. IT IS EXTREMELY UNWISE TO LOAD CODE FROM SERVERS YOU DO
    NOT CONTROL.


    This file creates a global JSON object containing two methods: stringify
    and parse.

        JSON.stringify(value, replacer, space)
            value       any JavaScript value, usually an object or array.

            replacer    an optional parameter that determines how object
                        values are stringified for objects. It can be a
                        function or an array of strings.

            space       an optional parameter that specifies the indentation
                        of nested structures. If it is omitted, the text will
                        be packed without extra whitespace. If it is a number,
                        it will specify the number of spaces to indent at each
                        level. If it is a string (such as '\t' or '&nbsp;'),
                        it contains the characters used to indent at each level.

            This method produces a JSON text from a JavaScript value.

            When an object value is found, if the object contains a toJSON
            method, its toJSON method will be called and the result will be
            stringified. A toJSON method does not serialize: it returns the
            value represented by the name/value pair that should be serialized,
            or undefined if nothing should be serialized. The toJSON method
            will be passed the key associated with the value, and this will be
            bound to the value

            For example, this would serialize Dates as ISO strings.

                Date.prototype.toJSON = function (key) {
                    function f(n) {
                        // Format integers to have at least two digits.
                        return n < 10 ? '0' + n : n;
                    }

                    return this.getUTCFullYear()   + '-' +
                         f(this.getUTCMonth() + 1) + '-' +
                         f(this.getUTCDate())      + 'T' +
                         f(this.getUTCHours())     + ':' +
                         f(this.getUTCMinutes())   + ':' +
                         f(this.getUTCSeconds())   + 'Z';
                };

            You can provide an optional replacer method. It will be passed the
            key and value of each member, with this bound to the containing
            object. The value that is returned from your method will be
            serialized. If your method returns undefined, then the member will
            be excluded from the serialization.

            If the replacer parameter is an array of strings, then it will be
            used to select the members to be serialized. It filters the results
            such that only members with keys listed in the replacer array are
            stringified.

            Values that do not have JSON representations, such as undefined or
            functions, will not be serialized. Such values in objects will be
            dropped; in arrays they will be replaced with null. You can use
            a replacer function to replace those with JSON values.
            JSON.stringify(undefined) returns undefined.

            The optional space parameter produces a stringification of the
            value that is filled with line breaks and indentation to make it
            easier to read.

            If the space parameter is a non-empty string, then that string will
            be used for indentation. If the space parameter is a number, then
            the indentation will be that many spaces.

            Example:

            text = JSON.stringify(['e', {pluribus: 'unum'}]);
            // text is '["e",{"pluribus":"unum"}]'


            text = JSON.stringify(['e', {pluribus: 'unum'}], null, '\t');
            // text is '[\n\t"e",\n\t{\n\t\t"pluribus": "unum"\n\t}\n]'

            text = JSON.stringify([new Date()], function (key, value) {
                return this[key] instanceof Date ?
                    'Date(' + this[key] + ')' : value;
            });
            // text is '["Date(---current time---)"]'


        JSON.parse(text, reviver)
            This method parses a JSON text to produce an object or array.
            It can throw a SyntaxError exception.

            The optional reviver parameter is a function that can filter and
            transform the results. It receives each of the keys and values,
            and its return value is used instead of the original value.
            If it returns what it received, then the structure is not modified.
            If it returns undefined then the member is deleted.

            Example:

            // Parse the text. Values that look like ISO date strings will
            // be converted to Date objects.

            myData = JSON.parse(text, function (key, value) {
                var a;
                if (typeof value === 'string') {
                    a =
/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*)?)Z$/.exec(value);
                    if (a) {
                        return new Date(Date.UTC(+a[1], +a[2] - 1, +a[3], +a[4],
                            +a[5], +a[6]));
                    }
                }
                return value;
            });

            myData = JSON.parse('["Date(09/09/2001)"]', function (key, value) {
                var d;
                if (typeof value === 'string' &&
                        value.slice(0, 5) === 'Date(' &&
                        value.slice(-1) === ')') {
                    d = new Date(value.slice(5, -1));
                    if (d) {
                        return d;
                    }
                }
                return value;
            });


    This is a reference implementation. You are free to copy, modify, or
    redistribute.
*/

/*jslint evil: true, strict: false */

/*members "", "\b", "\t", "\n", "\f", "\r", "\"", JSON, "\\", apply,
    call, charCodeAt, getUTCDate, getUTCFullYear, getUTCHours,
    getUTCMinutes, getUTCMonth, getUTCSeconds, hasOwnProperty, join,
    lastIndex, length, parse, prototype, push, replace, slice, stringify,
    test, toJSON, toString, valueOf
*/


// Create a JSON object only if one does not already exist. We create the
// methods in a closure to avoid creating global variables.

if (!this.JSON) {
    this.JSON = {};
}

(function () {

    function f(n) {
        // Format integers to have at least two digits.
        return n < 10 ? '0' + n : n;
    }

    if (typeof Date.prototype.toJSON !== 'function') {

        Date.prototype.toJSON = function (key) {

            return isFinite(this.valueOf()) ?
                   this.getUTCFullYear()   + '-' +
                 f(this.getUTCMonth() + 1) + '-' +
                 f(this.getUTCDate())      + 'T' +
                 f(this.getUTCHours())     + ':' +
                 f(this.getUTCMinutes())   + ':' +
                 f(this.getUTCSeconds())   + 'Z' : null;
        };

       // String.prototype.toJSON =
        Number.prototype.toJSON =
        Boolean.prototype.toJSON = function (key) {
            return this.valueOf();
        };
    }

    var cx = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
        escapable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
        gap,
        indent,
        meta = {    // table of character substitutions
            '\b': '\\b',
            '\t': '\\t',
            '\n': '\\n',
            '\f': '\\f',
            '\r': '\\r',
            '"' : '\\"',
            '\\': '\\\\'
        },
        rep;


    function quote(string) {

// If the string contains no control characters, no quote characters, and no
// backslash characters, then we can safely slap some quotes around it.
// Otherwise we must also replace the offending characters with safe escape
// sequences.

        escapable.lastIndex = 0;
        return escapable.test(string) ?
            '"' + string.replace(escapable, function (a) {
                var c = meta[a];
                return typeof c === 'string' ? c :
                    '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
            }) + '"' :
            '"' + string + '"';
    }


    function str(key, holder) {

// Produce a string from holder[key].

        var i,          // The loop counter.
            k,          // The member key.
            v,          // The member value.
            length,
            mind = gap,
            partial,
            value = holder[key];

// If the value has a toJSON method, call it to obtain a replacement value.

        if (value && typeof value === 'object' &&
                typeof value.toJSON === 'function') {
            value = value.toJSON(key);
        }

// If we were called with a replacer function, then call the replacer to
// obtain a replacement value.

        if (typeof rep === 'function') {
            value = rep.call(holder, key, value);
        }

// What happens next depends on the value's type.

        switch (typeof value) {
        case 'string':
            return quote(value);

        case 'number':

// JSON numbers must be finite. Encode non-finite numbers as null.

            return isFinite(value) ? String(value) : 'null';

        case 'boolean':
        case 'null':

// If the value is a boolean or null, convert it to a string. Note:
// typeof null does not produce 'null'. The case is included here in
// the remote chance that this gets fixed someday.

            return String(value);

// If the type is 'object', we might be dealing with an object or an array or
// null.

        case 'object':

// Due to a specification blunder in ECMAScript, typeof null is 'object',
// so watch out for that case.

            if (!value) {
                return 'null';
            }

// Make an array to hold the partial results of stringifying this object value.

            gap += indent;
            partial = [];

// Is the value an array?

            if (Object.prototype.toString.apply(value) === '[object Array]') {

// The value is an array. Stringify every element. Use null as a placeholder
// for non-JSON values.

                length = value.length;
                for (i = 0; i < length; i += 1) {
                    partial[i] = str(i, value) || 'null';
                }

// Join all of the elements together, separated with commas, and wrap them in
// brackets.

                v = partial.length === 0 ? '[]' :
                    gap ? '[\n' + gap +
                            partial.join(',\n' + gap) + '\n' +
                                mind + ']' :
                          '[' + partial.join(',') + ']';
                gap = mind;
                return v;
            }

// If the replacer is an array, use it to select the members to be stringified.

            if (rep && typeof rep === 'object') {
                length = rep.length;
                for (i = 0; i < length; i += 1) {
                    k = rep[i];
                    if (typeof k === 'string') {
                        v = str(k, value);
                        if (v) {
                            partial.push(quote(k) + (gap ? ': ' : ':') + v);
                        }
                    }
                }
            } else {

// Otherwise, iterate through all of the keys in the object.

                for (k in value) {
                    if (Object.hasOwnProperty.call(value, k)) {
                        v = str(k, value);
                        if (v) {
                            partial.push(quote(k) + (gap ? ': ' : ':') + v);
                        }
                    }
                }
            }

// Join all of the member texts together, separated with commas,
// and wrap them in braces.

            v = partial.length === 0 ? '{}' :
                gap ? '{\n' + gap + partial.join(',\n' + gap) + '\n' +
                        mind + '}' : '{' + partial.join(',') + '}';
            gap = mind;
            return v;
        }
    }

// If the JSON object does not yet have a stringify method, give it one.

    if (typeof JSON.stringify !== 'function') {
     	/**
     	 * Convert a native JavaScript object into a valid JSON string
     	 * @param {Mixed} value Any native JavaScript object, note that XMLDocument, XMLHttpRequest, and other non serializable custom objects cannot be used.
     	 * @return {string} a string of JSON
     	 * @name av.data.json.stringify
     	 * @methodOf av.data.json#
     	 */
        JSON.stringify = function (value, replacer, space) {

// The stringify method takes a value and an optional replacer, and an optional
// space parameter, and returns a JSON text. The replacer can be a function
// that can replace values, or an array of strings that will select the keys.
// A default replacer method can be provided. Use of the space parameter can
// produce text that is more easily readable.

            var i;
            gap = '';
            indent = '';

// If the space parameter is a number, make an indent string containing that
// many spaces.

            if (typeof space === 'number') {
                for (i = 0; i < space; i += 1) {
                    indent += ' ';
                }

// If the space parameter is a string, it will be used as the indent string.

            } else if (typeof space === 'string') {
                indent = space;
            }

// If there is a replacer, it must be a function or an array.
// Otherwise, throw an error.

            rep = replacer;
            if (replacer && typeof replacer !== 'function' &&
                    (typeof replacer !== 'object' ||
                     typeof replacer.length !== 'number')) {
                throw new Error('JSON.stringify');
            }

// Make a fake root object containing our value under the key of ''.
// Return the result of stringifying the value.

            return str('', {'': value});
        };
    }


// If the JSON object does not yet have a parse method, give it one.

    if (typeof JSON.parse !== 'function') {
    	/**
    	 * Parse JSON text into a native JavaScript object. 
    	 * @param {string} text a string that is valid JSON to parse
    	 * @return a native JavaScript object
    	 * @name av.data.json.parse
    	 * @methodOf av.data.json#
    	 */
        JSON.parse = function (text, reviver) {

// The parse method takes a text and an optional reviver function, and returns
// a JavaScript value if the text is a valid JSON text.

            var j;

            function walk(holder, key) {

// The walk method is used to recursively walk the resulting structure so
// that modifications can be made.

                var k, v, value = holder[key];
                if (value && typeof value === 'object') {
                    for (k in value) {
                        if (Object.hasOwnProperty.call(value, k)) {
                            v = walk(value, k);
                            if (v !== undefined) {
                                value[k] = v;
                            } else {
                                delete value[k];
                            }
                        }
                    }
                }
                return reviver.call(holder, key, value);
            }


// Parsing happens in four stages. In the first stage, we replace certain
// Unicode characters with escape sequences. JavaScript handles many characters
// incorrectly, either silently deleting them, or treating them as line endings.

            text = String(text);
            cx.lastIndex = 0;
            if (cx.test(text)) {
                text = text.replace(cx, function (a) {
                    return '\\u' +
                        ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
                });
            }

// In the second stage, we run the text against regular expressions that look
// for non-JSON patterns. We are especially concerned with '()' and 'new'
// because they can cause invocation, and '=' because it can cause mutation.
// But just to be safe, we want to reject all unexpected forms.

// We split the second stage into 4 regexp operations in order to work around
// crippling inefficiencies in IE's and Safari's regexp engines. First we
// replace the JSON backslash pairs with '@' (a non-JSON character). Second, we
// replace all simple value tokens with ']' characters. Third, we delete all
// open brackets that follow a colon or comma or that begin the text. Finally,
// we look to see that the remaining characters are only whitespace or ']' or
// ',' or ':' or '{' or '}'. If that is so, then the text is safe for eval.

            if (/^[\],:{}\s]*$/
.test(text.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, '@')
.replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']')
.replace(/(?:^|:|,)(?:\s*\[)+/g, ''))) {

// In the third stage we use the eval function to compile the text into a
// JavaScript structure. The '{' operator is subject to a syntactic ambiguity
// in JavaScript: it can begin a block or an object literal. We wrap the text
// in parens to eliminate the ambiguity.

                j = eval('(' + text + ')');

// In the optional fourth stage, we recursively walk the new structure, passing
// each name/value pair to a reviver function for possible transformation.

                return typeof reviver === 'function' ?
                    walk({'': j}, '') : j;
            }

// If the text is not JSON parseable, then a SyntaxError is thrown.

            throw new SyntaxError('JSON.parse');
        };
    }
    
    if (typeof JSON.jsonPath !== 'function') {
	    /* JSONPath 0.8.0 - XPath for JSON
			XPath	JSONPath					Description
			/	 	$							the root object/element
			.	 	@							the current object/element
			/	 	. or []						child operator
			..	 	n/a							parent operator
			//	 	..							recursive descent. JSONPath borrows this syntax from E4X.
			*	 	*							wildcard. All objects/elements regardless their names.
			@	 	n/a							attribute access. JSON structures don't have attributes.
			[]	 	[]							subscript operator. XPath uses it to iterate over element collections and for predicates. In Javascript and JSON it is the native array operator.
			|	 	[,]							Union operator in XPath results in a combination of node sets. JSONPath allows alternate names or array indices as a set.
			n/a	 	[start:end:step]			array slice operator borrowed from ES4.
			[]	 	?()							applies a filter (script) expression.
			n/a	 	()							script expression, using the underlying script engine.
			()	 	n/a							grouping in Xpath
			
			
			
		 * { "store": {
		    "book": [ 
		      { "category": "reference",
		        "author": "Nigel Rees",
		        "title": "Sayings of the Century",
		        "price": 8.95
		      },
		      { "category": "fiction",
		        "author": "Evelyn Waugh",
		        "title": "Sword of Honour",
		        "price": 12.99
		      },
		      { "category": "fiction",
		        "author": "Herman Melville",
		        "title": "Moby Dick",
		        "isbn": "0-553-21311-3",
		        "price": 8.99
		      },
		      { "category": "fiction",
		        "author": "J. R. R. Tolkien",
		        "title": "The Lord of the Rings",
		        "isbn": "0-395-19395-8",
		        "price": 22.99
		      }
		    ],
		    "bicycle": {
		      "color": "red",
		      "price": 19.95
		    }
		  }
		}
		XPath					JSONPath					Result
		/store/book/author		$.store.book[*].author	the authors of all books in the store
		//author				$..author	all authors
		/store/*				$.store.*	all things in store, which are some books and a red bicycle.
		/store//price			$.store..price	the price of everything in the store.
		//book[3]				$..book[2]	the third book
		//book[last()]			$..book[(@.length-1)] OR $..book[-1:]	the last book in order.
		//book[position()<3]	$..book[0,1] OR  ..book[:2]	the first two books
		//book[isbn]			$..book[?(@.isbn)]	filter all books with isbn number
		//book[price<10]		$..book[?(@.price<10)]	filter all books cheapier than 10
		//*						$..*	all Elements in XML document. All members of JSON structure.
		
		 * 
		 * @copyright Copyright (c) 2007 Stefan Goessner (goessner.net)
		 * Licensed under the MIT (MIT-LICENSE.txt) licence.
		 * 
		 * 
		 */
		JSON.jsonPath = function(obj, expr, arg) {
		   var P = {
		      resultType: arg && arg.resultType || "VALUE",
		      result: [],
		      normalize: function(expr) {
		         var subx = [];
		         return expr.replace(/[\['](\??\(.*?\))[\]']/g, function($0,$1){return "[#"+(subx.push($1)-1)+"]";})
		                    .replace(/'?\.'?|\['?/g, ";")
		                    .replace(/;;;|;;/g, ";..;")
		                    .replace(/;$|'?\]|'$/g, "")
		                    .replace(/#([0-9]+)/g, function($0,$1){return subx[$1];});
		      },
		      asPath: function(path) {
		         var x = path.split(";"), p = "$";
		         for (var i=1,n=x.length; i<n; i++)
		            p += /^[0-9*]+$/.test(x[i]) ? ("["+x[i]+"]") : ("['"+x[i]+"']");
		         return p;
		      },
		      store: function(p, v) {
		         if (p) P.result[P.result.length] = P.resultType == "PATH" ? P.asPath(p) : v;
		         return !!p;
		      },
		      trace: function(expr, val, path) {
		         if (expr) {
		            var x = expr.split(";"), loc = x.shift();
		            x = x.join(";");
		            if (val && val.hasOwnProperty(loc))
		               P.trace(x, val[loc], path + ";" + loc);
		            else if (loc === "*")
		               P.walk(loc, x, val, path, function(m,l,x,v,p) { P.trace(m+";"+x,v,p); });
		            else if (loc === "..") {
		               P.trace(x, val, path);
		               P.walk(loc, x, val, path, function(m,l,x,v,p) { typeof v[m] === "object" && P.trace("..;"+x,v[m],p+";"+m); });
		            }
		            else if (/,/.test(loc)) { // [name1,name2,...]
		               for (var s=loc.split(/'?,'?/),i=0,n=s.length; i<n; i++)
		                  P.trace(s[i]+";"+x, val, path);
		            }
		            else if (/^\(.*?\)$/.test(loc)) // [(expr)]
		               P.trace(P.eval(loc, val, path.substr(path.lastIndexOf(";")+1))+";"+x, val, path);
		            else if (/^\?\(.*?\)$/.test(loc)) // [?(expr)]
		               P.walk(loc, x, val, path, function(m,l,x,v,p) { if (P.eval(l.replace(/^\?\((.*?)\)$/,"$1"),v[m],m)) P.trace(m+";"+x,v,p); });
		            else if (/^(-?[0-9]*):(-?[0-9]*):?([0-9]*)$/.test(loc)) // [start:end:step]  phyton slice syntax
		               P.slice(loc, x, val, path);
		         }
		         else
		            P.store(path, val);
		      },
		      walk: function(loc, expr, val, path, f) {
		         if (val instanceof Array) {
		            for (var i=0,n=val.length; i<n; i++)
		               if (i in val)
		                  f(i,loc,expr,val,path);
		         }
		         else if (typeof val === "object") {
		            for (var m in val)
		               if (val.hasOwnProperty(m))
		                  f(m,loc,expr,val,path);
		         }
		      },
		      slice: function(loc, expr, val, path) {
		         if (val instanceof Array) {
		            var len=val.length, start=0, end=len, step=1;
		            loc.replace(/^(-?[0-9]*):(-?[0-9]*):?(-?[0-9]*)$/g, function($0,$1,$2,$3){start=parseInt($1||start);end=parseInt($2||end);step=parseInt($3||step);});
		            start = (start < 0) ? Math.max(0,start+len) : Math.min(len,start);
		            end   = (end < 0)   ? Math.max(0,end+len)   : Math.min(len,end);
		            for (var i=start; i<end; i+=step)
		               P.trace(i+";"+expr, val, path);
		         }
		      },
		      eval: function(x, _v, _vname) {
		         try { return $ && _v && eval(x.replace(/@/g, "_v")); }
		         catch(e) { throw new SyntaxError("jsonPath: " + e.message + ": " + x.replace(/@/g, "_v").replace(/\^/g, "_a")); }
		      }
		   };
		
		   var $ = obj;
		   if (expr && obj && (P.resultType == "VALUE" || P.resultType == "PATH")) {
		      P.trace(P.normalize(expr).replace(/^\$;/,""), obj, "$");
		      return P.result.length ? P.result : false;
		   }
		} 

    }
}());


av.nameSpace('av.data.json');
/**
 * @namespace av.data.json
 */
av.data.json = window.JSON = JSON;