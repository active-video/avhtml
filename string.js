
(function(av){
	/**
	 * @namespace Provides utility methods for dealing with strings; common methods that support
	 * tasks that are used repeatedly in web applications. 
	 */
	av.string = {
		version : '1.0.1',
		/**
		 * Given a string, replace all occurrences of the keys in 2nd argument
		 * with the value in the from searchAndReplaceObject[key]
		 * @param {String} str The subject of the search
		 * @param {Object} name/value pairs, where the name is what to search for, and the value is the replacement
		 * @return {String} The string with all replacements
		 */
		replaceString : function(str, searchAndReplaceObject){
			for(key in searchAndReplaceObject){
				str = str.replace(new RegExp(key,'g'),searchAndReplaceObject[key]);
			}
			return str;
		},
		
		/**
		 * The bread and butter of building up strings for post-back and url parameters - can be used as a static method for strings;
		 * @param {Object} url
		 * @param {Object} params
		 * @example var welcomeMessage = "Hello [[name]], welcome to the [[appName]]. Please tell "
		 * 		+ "us what the weather is like in [[userState]]...";
		 * var userInfo = {name:"Chad", appName:"Olmpics App", userState:"California"};
		 * var message = av.string.populateTemplate(welcomeMessage, userInfo);
		 * console.log(message);
		 * //Hello Chad, welcome to the Olympics App. Please tell "
		 * //us what the weather is like in California...
		 * 
		 * @example var url="http://[[site]]?page=[[page]]&keyword=[[keyword]]";
		 * var fullURL = av.string.populateTemplate(url, 
		 * 			{site:"www.activevideo.com",page:"newsList",keyword:"weather"});
		 * av.log.debug(fullURL);
		 * // http://www.avwebrequests.com?page=newList&keyword=weather
		 * @return String All elements in the first paramater as [[someName]] replaced with(a) their value as found in "params", or (b) an empty string if not present.
		 */
		populateTemplate : function(template,nameValuePairs){
			var templateNew = template;
			if(typeof(nameValuePairs) =='undefined') nameValuePairs = {};//empty object by default
			var replacements = /\[\[(\-|\:|\w)*\]\]/img;
			var match = replacements.exec(template);
			while (match != null) {
				// matched text: match[0]
			    // match start: match.index
			    // capturing group n: match[n]
				var templateVariableName = match[0].replace(/\[/g,'').replace(/\]/g,'');
				var templateVariableValue = typeof(nameValuePairs[templateVariableName]) == 'undefined' ? '' : nameValuePairs[templateVariableName];
					//print("Replacing "+match[0]+" with params['"+paramName+"'] = " + paramVal + "");
				templateNew = templateNew.replace(match[0],templateVariableValue);
				
				match = replacements.exec(template);
			}
			
			return templateNew;
			
		},
		
		/**
		 * Trim whitespace characters from the beginning and end of a string
		 * @param {String} str The string to trim
		 */
		trim			: function(str){
			return str.replace(/^\s+|\s+$/g, '');
		},//added str.replace(/&#/g,"##AMPHASH##").replace(/&/g,'&amp;').replace(/##AMPHASH##/g,"&#") to avoid double escaping already escaped strings
		/**
		 * Strip most HTML entities from a string, returning the sanitized string
		 * @param {String} str The string to replace htmlEntities from
		 * @return {String}
		 */
		htmlEntities : function (str) {
		   return str.replace(/&#/g,"##AMPHASH##").replace(/&(?![a-zA-Z]+;)/g,'&amp;').replace(/##AMPHASH##/g,"&#").replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\"/g,'&#34;');
		},
		/**
		 * Replace special characters that are not allowed in HTML/XML node attributes
		 * @param {String} str The string to remove attribute entities from
		 * @return {String}
		 */
		attributeEntities : function(str){
			return str.replace(/&#/g,"##AMPHASH##").replace(/&(?![a-zA-Z]+;)/g,'&amp;').replace(/##AMPHASH##/g,"&#").replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\"/g,'&#34;').replace(/\s/g,'&#160;');
		},
		
		/**
		 * Repeat str "numTimes" times
		 * @param {String} str The string to repeat
		 * @param {Number} numTimes How many times to repeat str
		 * @return {String}
		 */
		repeat : function(str, numTimes){
			return (new Array(numTimes+1)).join(str);//since joining creates only numTimes-1 copies of the concatenator, use numTimes+1 --> (numTimes+1)-1 = numTimes, exactly what we want
		},
		
		/**
		 * Given a single word, make the first letter lower case
		 * @param {String} str The string to modify
		 * @return {String}
		 */
		lcfirst : function(str){
			return str.substring(0,1).toLowerCase() + str.substring(1);
		},
		
		/**
		 * Given a single word, make the first letter upper case
		 * @param {String} str The string to modify
		 * @return {String}
		 */
		ucfirst : function(str){
			return str.substring(0,1).toUpperCase() + str.substring(1);
		},
		/**
		 * Parse a URL into its parts and return an object which represents the URL
		 * @return {Object} An object with the following properties: protocol, user, pass,
		 * port, server, path, query, queryString, hash, hashString, url
		 */
		parseURL : function(url){
			url = typeof(url) != 'string' ? '' : av.string.trim(url);
			var protocol = '', user = '', pass = '', port = '', server = '', query = '', path = '', 
				queryString = '', hash = '', hashString = '', startServer = 0, startPath, hasUserPass, _sup, _upstring,_sp; 
			//EXTRACT PROTOCOL
			protocol = url.substring(0,url.indexOf(':'));
			//EXTRACT USERNAME/PASSWORD
			hasUserPass = url.indexOf('@') != -1 && url.indexOf('@') < url.indexOf('/',protocol.length+3);
			_sup = protocol.length+3, startServer = _sup;//where does the username/password begin
			if(hasUserPass){
				_upstring = url.substring(sup,url.indexOf('/')-_sup);
				startServer = _sup + _upstring.length + 1;//add 1 for the "@" symbol
				_up = _upstring.split(':');
				user = decodeURIComponent(_up[0]);
				if(_up.length > 1) pass = decodeURIComponent(_up[1]);
			}
			server = url.substring(startServer,url.indexOf('/', startServer));//look for the first "/" after the server name start
			serverLength = server.length;
			
			hasPort = server.indexOf(':') != -1;
			if(hasPort){
				_sp = server.split(':');
				server = sp[0];
				port = sp[1];
			}
			
			hasQueryString = url.indexOf('?',startServer + serverLength) != -1;
			if(hasQueryString){
				queryString = url.substring(url.indexOf('?',startServer + server.length) + 1)
				queryString = queryString.indexOf('#') != -1 ? queryString.substring(0,queryString.indexOf('#')) : queryString;
				path = url.substring(startServer+serverLength);
				path = path.substring(0, path.indexOf('?'));
				query = av.string.parseString(queryString);
			}
			hasHash = url.indexOf('#') != -1;
			if(hasHash){
				hashString = url.substring(url.indexOf('#'));
			}
			
			//extract path if not yet done
			if(!hasQueryString && hasHash){
				//start after the server, go to the query-string
				startPath = url.indexOf('/',startServer);
				path = url.substring(startPath, url.indexOf('#', startServer) - startServer);
			}else if(!hasQueryString && !hasHash){
				//start after the server, go to the hash
				path = url.substring(startServer + serverLength);
			}
			
			
			
			return {
				protocol	: protocol,
				user		: user,
				password	: pass,
				port		: port,
				server		: server,
				path		: path,
				query		: query,
				queryString	: queryString,
				hash		: hash,
				hashString	: hashString,
				url			: url,
			}
		},
		/**
		 * Given a string, break it into pieces wherever the separator occurs
		 * @param {String} a query string or other string to parse into pieces
		 * @param {String} [separator=&amp;] a string which each parameter is split by, usually an amperstand or a semi-colon.
		 */
		parseString : function(str, separator){
			var qs = {}, separator = typeof(separator) == 'string' ? separator : '&', vars = str.split(separator), qsVar, i;
			for(i=0; i<vars.length; i++){
				qsVar = vars[i].split('=');
				qs[decodeURIComponent(qsVar[0])] = qsVar.length > 1 ? decodeURIComponent(qsVar[1]) : null;//null is different than empty
			}
			return qs;
		},
		
		/**
		 * Given an object, split it into key/value pairs and return a query string
		 * @param {Object} arr
		 * 
		 * @example var url = 'http://www.yahoo.com?' + av.string.arrayToQueryString({name:'Chad','search':'fun'}) 
		 */
		arrayToQueryString : function(arr){
			var qs = '',name,val, onInput = 0, prefix = '', nameE, valE;
			for(name in arr){
				val = arr[name];
				prefix = onInput == 0 ? '' : '&';
			
				//build the encoded name=value pair
				nameE = encodeURIComponent(name);
				valE = encodeURIComponent(val);
				//av.log.debug("Adding '"+name+"' with val='"+val+"'");
				qs+= prefix + nameE + (val == null ? "" : "=" + valE);//if null, include a named and non-value assigned query param, so x='',y=3 would lead to x=&y=3, where x,y=3 would lead to x&y=3
				onInput++;
			}
			
			return qs;
		},
		
		/**
		 * Given a string, return the utf-8 encoded version of the string
		 * @param {String} s The string to encode
		 * @return {String} The encoded string
		 * @author Jonas Raoni Soares Silva {@link http://jsfromhell.com/geral/utf-8} [v1.0]
		 */
		utf8Encode : function(s){
			for(var c, i = -1, l = (s = s.split("")).length, o = String.fromCharCode; ++i < l;
				s[i] = (c = s[i].charCodeAt(0)) >= 127 ? o(0xc0 | (c >>> 6)) + o(0x80 | (c & 0x3f)) : s[i]
			);
			return s.join("");
		},
		
		/**
		 * Given a string that is utf-8 encoded, return the decoded version of the string
		 * @param {String} s The string to encode
		 * @return {String} The decoded string
		 * @author Jonas Raoni Soares Silva {@link http://jsfromhell.com/geral/utf-8} [v1.0]
		 */
		utf8Decode : function(s){
			for(var a, b, i = -1, l = (s = s.split("")).length, o = String.fromCharCode, c = "charCodeAt"; ++i < l;
				((a = s[i][c](0)) & 0x80) &&
				(s[i] = (a & 0xfc) == 0xc0 && ((b = s[i + 1][c](0)) & 0xc0) == 0x80 ?
				o(((a & 0x03) << 6) + (b & 0x3f)) : o(128), s[++i] = "")
			);
			return s.join("");
		},
		
		/**
		 * Using a pseud-random hash to generate a UUID that is suitable for identifiers
		 * @return {String} a string of the form "av" + alpha-numeric characters
		 * 
		 */
		createUUID : function() {
	        // http://www.ietf.org/rfc/rfc4122.txt
	        var s = [],
	            i = 0;
	        for (; i < 32; i++) {
	            s[i] = (~~(Math.random() * 16)).toString(16);
	        }
	        s[12] = 4;  // bits 12-15 of the time_hi_and_version field to 0010
	        s[16] = ((s[16] & 3) | 8).toString(16);  // bits 6-7 of the clock_seq_hi_and_reserved to 01
	        return "av" + s.join("");
	   },
	   
	   /**
	    * Decode the all HTML entities into a string of useable text; useful for taking HTML in a response 
	    * and then re-using it prior to inserting into DOM; uses an HTML textarea DOM element to
	    * temporarily inset the str and then extract the parsed value
	    * @return {String}
	    */
	   decodeEntities : function(str) {
			if(typeof(str) == 'undefined' || (typeof(str) != 'string' && typeof(str) != 'number' && typeof(str) != 'boolean')){
				return str;
			}
			var ta=document.createElement("textarea");
			ta.innerHTML=str.replace(/</g,"&lt;").replace(/>/g,"&gt;");
			return ta.value;
		},
		/**
		 * Strip all tags/xml-nodes from a string, preserving nothing from within each.
		 * @param {String} str
		 * @param {String} tags Comma separated list of tags to remove
		 */
		stripTags : function(str, tags){
			var regex =  '/(<([tags])[^(<\/)]+[<\/][^>]+[>])/ig';
				eval('regex = ' + regex.replace('tags',tags.split(',').join('|')));
				//console.log('regex',regex);
				return str.replace(regex, '');
		},
		/**
		 * Make a string OS/FileSystem safe
		 * @param {String} str
		 */
		sanitize : function(str){
			return str.replace(/([\/|\.])/g,'_').replace(/[^a-z0-9_]+/gi,'');
		}
	}
})(av);