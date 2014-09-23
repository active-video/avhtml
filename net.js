/**
 * @fileoverview Implements a simple browser that retains state between launches per STB;
 * @param {Object} str
 * @class <pre>The "NetContainer" class provides a mechanism of not just creating
 * new a Request, but wrapping it with many helpful utility methods, headers, 
 * parsing responses as JSON, XML, XML--to--JSON, etc.
 * 
 * The most simple usage will be to call the automatically instantiated av.net.makeRequest()
 * method, where av.net is automatically loaded for you when you load this Class via:
 * 
 * av.require('net');//loads av.NetContainer and instantiates it inside the av.net namespace.
 * 
 * Redirect logic:
 *	1) create a new XMLHttp object
 *	2) copy over all headers less the "Authenticate" header (re-calucluated just-in-time
 * 	   within "send" call)
 *	3) point the nex "onreadystatechange" to the previouslly set "request.onreadystatechange"
 *	4) copy over request parameters (token, key, etc)
 * </pre>
 * 
 * @since AVE 1.4.1 and AVEd 1.5 tested, note that XMLHttp is slightly different in 1.3.1 and needs testing if used in that enviornment, namely XMLHttp related methods
 * 
 * @example av.require('Net');
 * av.net.makeRequest("http://www.yahoo.com",function(r){av.log.debug('Received ' + r.responseText);});
 * //would print
 * &lt;!DOCTYPE html&gt; 
&lt;html lang=&quot;en-US&quot; class=&quot;y-fp-bg y-fp-pg-grad ua-wk ua-win ua-wk534  bkt701&quot;&gt; 
&lt;!-- m2 template 0 --&gt; 
&lt;head&gt; 
    &lt;meta http-equiv=&quot;Content-Type&quot; content=&quot;text/html; charset=utf-8&quot;&gt; 
 
    &lt;title&gt;Yahoo!&lt;/title&gt; 
    &lt;meta http-equiv=&quot;X-UA-Compatible&quot; content=&quot;chrome=1&quot;&gt; ...
 * @example var newBrowser = new av.NetContainer();//a new instance, from scratch
 * newBrowser.setUserAgent(''mobile-safari');
 * 
 */
av.NetContainer = function(){
	av.require('string');
	var self = this;
	
	//HTML5 workaround, define XMLDocument locally based on the browser's native XML parser DOMParser
	try{var x = new XMLDocument(); delete x;}catch(eNotYetImplemented){var XMLDocument = function(){var me = this; me['native'] = new DOMParser(); me.loadString = function(str){var d = me['native'].parseFromString(str,"text/xml"); me.documentElement = d.documentElement; return me.documentElement;}; return me;}}
	
	/**
	 * Internal property that spans all requests, can be used to spoof user agents, or create your own user agent string
	 * @private 
	 */
	self._userAgent = '';
	
	/**
	 * Currently sets the user agent to the default AVE user agent, called internally on new av.net().
	 * @name av.NetContainer.init
	 * @methodOf av.NetContainer#
	 * @method
	 * @constructor
	 */
	self.init = function(){
		self.setUserAgent('ave');
		return self;
	}
	
	self.errors = {
		400 : "(Bad request) The server didn't understand the syntax of the request.",
		401 : "(Not authorized) The request requires authentication. The server might return this response for a page behind a login.",
		403 : "(Forbidden) The server is refusing the request. If you see that Googlebot received this status code when trying to crawl valid pages of your site (you can see this on the Web crawl page under Diagnostics in Google Webmaster Tools), it's possible that your server or host is blocking Googlebot's access.",
		404 : "(Not found) The server can't find the requested page. For instance, the server often returns this code if the request is for a page that doesn't exist on the server.",
		405 : "(Method not allowed) The method specified in the request is not allowed.",
		406 : "(Not acceptable) The requested page can't respond with the content characteristics requested.",
		407 : "(Proxy authentication required) This status code is similar 401 (Not authorized); but specifies that the requestor has to authenticate using a proxy. When the server returns this response, it also indicates the proxy that the requestor should use.",
		408 : "(Request timeout) The server timed out waiting for the request.",
		409 : "(Conflict) The server encountered a conflict fulfilling the request. The server must include information about the conflict in the response. The server might return this code in response to a PUT request that conflicts with an earlier request, along with a list of differences between the requests.",
		410 : "(Gone) The server returns this response when the requested resource has been permanently removed. It is similar to a 404 (Not found) code, but is sometimes used in the place of a 404 for resources that used to exist but no longer do. If the resource has permanently moved, you should use a 301 to specify the resource's new location.",
		411 : "(Length required) The server won't accept the request without a valid Content-Length header field.",
		412 : "(Precondition failed) The server doesn't meet one of the preconditions that the requestor put on the request.",
		413 : "(Request entity too large) The server can't process the request because it is too large for the server to handle.",
		414 : "(Requested URI is too long) The requested URI (typically, a URL) is too long for the server to process.",
		415 : "(Unsupported media type) The request is in a format not support by the requested page.",
		416 : "(Requested range not satisfiable) The server returns this status code if the request is for a range not available for the page.",
		417 : "(Expectation failed) The server can't meet the requirements of the Expect request-header field.",
		500 : "(Internal server error) The server encountered an error and can't fulfill the request.",
		501 : "(Not implemented) The server doesn't have the functionality to fulfill the request. For instance, the server might return this code when it doesn't recognize the request method.",
		502 : "(Bad gateway) The server was acting as a gateway or proxy and received an invalid response from the upstream server.",
		503 : "(Service unavailable)The server is currently unavailable (because it is overloaded or down for maintenance). Generally, this is a temporary state.",
		504 : "(Gateway timeout) The server was acting as a gateway or proxy and didn't receive a timely request from the upstream server.",
		505 : "(HTTP version not supported) The server doesn't support the HTTP protocol version used in the request.",
	};
	
	/**
	 * @name av.NetContainer.makeRequest
	 * @param {String} url
	 * @param {Function,null} callback Your callback will be called with an instance of a {@link Request} object,
	 * not just the response, so use the returned Response and the properties of it when processing the response;
	 * for example the callback(request) will have properties of a Request like request.responseText,
	 * response.getAllResponseHeaders(), etc... based on the options you provide.
	 * @param {String} [method=GET]
	 * @param {String} params HTTP POST body contents, can be url-encoded, raw, etc
	 * @param {Object} options Options for the Request, any property of Request is fair game {@link Request}.
	 * @param {Array[Object]} [options.headers]
	 * 
	 * @methodOf av.NetContainer#
	 * 
	 */
	self.makeRequest = function(url, callback, method, params, options){
		self.log.debug('av.net.makeRequest('+url+','+typeof(callback)+','+method+','+typeof(params)+','+typeof(options)+')');
		//url encode the params
		var params = typeof(params) == 'undefined' ? '' : 
					typeof(params) == 'string' 	   ? params : 
					av.string.arrayToQueryString(params);
		method = typeof(method) != 'string' ? 'get' : method;
		var async = typeof(callback) == 'function';
		
		//a new request
		var request = self.createRequest();
		
		
		//ASYNC?
		if(async){
			request.onreadystatechange = function(state){
				//self.log.debug("makeRequest.(internal)onreadystatechange : state = " + state );
				if(state == 4 || (typeof(request.readyState) == 'number' && request.readystate == 4)){
					callback.apply(request,[request]);
				}
			}
		}
		
		//Are there any additional options like enableHeaderCookies, etc?
		if(typeof(options) != 'undefined') for(var opt in options){
			if(opt == 'headers'){
				request.setRequestHeaders(options[opt]);
			}else{
				request[opt] = options[opt];
			}
		}
		
		//Headers must be set prior to calling request.open()
		request.open(method, url, async);
		
		request.send(params);
		return request;
	}
	
	/**
	 * Adds to the head, and appends a new callback function that will ensure you can send us a function closure and not worry about scope
	 * @param {String} url
	 * @param {String,Function} callback If sending a string, ensure that it is available in the global Window scope and not a closure, otherwise send the function and we will encapsulate it in a global object
	 */
	self.jsonp = function(url, callback){
		var callbackString = '';//for debug
		if(typeof(callback) == 'function'){
			var functionHash = 'av.global.netJSONPCallback' + av.string.createUUID();
			
			var newCallback = function(data){
				callback(data);
				eval('delete ' + functionHash);//remove the reference to this global created function, 1-timer
			}
			
			//assign the global value the closure encapsulated newCallback with access to original callback
			eval(functionHash + ' = newCallback');
			callbackString = functionHash;
		}else{
			callbackString = callback;
		}
		
		//insert the JSONp standard callback=
		url += url.indexOf('?') != -1 ? '&' : '?';
		url += 'callback=' + callbackString;
		
		//LOAD THE JSONp in <script> tag
		self.log.debug("Making a JSONp request to : " + url + " and callback was " + callbackString);
		
	
			av.html.loadScriptHead(url, true, true);//load in top doc and true
			return true;//success
			try{}catch(eScriptNotAdded){
			self.log.error(eScriptNotAdded);
			return false;//failure
		}
	}
	
	/**
	 * See http://www.useragentstring.com/pages/useragentstring.php for a full list of user agents to choose from, or create your own!
	 * @param {String} ua User agent to use for requests from the following options: {firefox,safari, mobile-safari,ie,ave}; 
	 * 					if the argument does not match one of these strings, the user agent that requests will use will be
	 * 					 the actual value of a user agent argument.
	 * @name av.NetContainer.setUserAgent
	 * @methodOf av.NetContainer#
	 */
	self.setUserAgent = function(ua){
		switch(ua){
			case 'firefox':
				self._userAgent = 'Mozilla/5.0 (Windows; U; Windows NT 5.1; en-US; rv:1.9.2.7) Gecko/20100713 Firefox/3.6.7 ( .NET CLR 3.5.30729)';	
				break;
			case 'safari':
				self._userAgent = 'Mozilla/5.0 (Windows; U; Windows NT 5.1; en-US) AppleWebKit/533.16 (KHTML, like Gecko)';
				break;
			case 'mobile-safari':
				self._userAgent = 'Mozilla/5.0 (iPhone; U; CPU like Mac OS X; en) AppleWebKit/420+ (KHTML, like Gecko) Version/3.0 Mobile/1A543 Safari/419.3';
				break;
			case 'ie':
				self._userAgent = 'Mozilla/5.0 (compatible; MSIE 8.0; Windows NT 5.1; Trident/4.0; SLCC1; .NET CLR 3.0.4506.2152; .NET CLR 3.5.30729; .NET CLR 1.1.4322)';
				break;
			case 'ave':
				self._userAgent = 'AVDN Browser';
				break;
			default:
				self._userAgent = ua;
				break;
		}	
	}
	
	/**
	 * Sets/resets default parameters on a "request" object as returned from av.net.createRequest(); 
	 * @param {av.net.createRequest} request Object to reset
	 * @param {Boolean} preserveHeaders Should headers from the previous request be preserved for future send()?
	 * @name av.NetContainer.resetXMLHttpDefault
	 * @methodOf av.NetContainer#
	 */
	self.resetXMLHttpDefault = function(request, preserveHeaders){
		if(typeof(preserveHeaders) != 'boolean') preserveHeaders = false;
		request.status = '';
		request.statusText = '';
		
		request.user = '';
		request.password = '';
		request.responseText = '';
		request.responseXML = '';
		request.responseJSON = '';
		request.success = true;
		request.error = '';
		request.readyState = '';
		
		
		if(!preserveHeaders) {
			request.headers = {};
		}
		
		
	}
	
	
	/**
	 * Creates a new instance of an XMLHttpRequest object (wrapper) and returns it to the callee, usable and extended
	 * by the callee as an instance that implements an av.net wrapped XMLHttpRequest request - awesome! When you are
	 * done with the XMLHttpRequest object (where x = av.net.createRequest(), x has additional properites: x.redirects[], x.forms[], see below.)
	 * <br />
	 * The usefullness of this is to ensure that throughout the browser session, you are allowed multiple calls to multiple
	 * endpoint URLs and they do not collide - ie each av.net.createRequest() call returns a throwaway XMLHttpRequest request.
	 * @name av.NetContainer.createRequest
	 * @methodOf av.NetContainer#
	 * @return {Request}
	 */
	self.createRequest = function(){
		
		/**
		 * @name Request
		 * @class
		 * @extends XMLHttpRequest
		 * A wrapper for XMLHttpRequest returned by av.net.createRequest()
		 */
		var request = new Function;
			self.resetXMLHttpDefault(request);//initialize the request
		var x = new XMLHttpRequest();//methods will be process, replaceXMLHttp, onreadystatechange, open, send, setRequestHeader, setRequestHeaders
		x.request = request;
		x.used = false;
		
		//request "attributes"/properties
		
		/**
		 * Read/write -  If True, any cookies that match the path domain for the XMLHttp request will automatically be sent; 
		 * 				 if any cookies are sent in the response header, those cookies will be saved and used in subsequent requests;
		 * 				 If False, cookies will not be sent in the request and not saved from the response header (default).
		 * @name Request.enableHeaderCookies
		 * @memberOf Request#
		 * @type Boolean
		 */
		request.enableHeaderCookies = false;
		
		/**
		 * Stores the number of retries that occured to get the response
		 * @name Request.retries
		 * @memberOf Request#
		 * @member av.net.request
		 * @type Number
		 */
		request.retries = 0;
		
		/**
		 * Flag which indicates the number of times we are should retry requests before considering it failure. 
		 * @name Request.retries
		 * @memberOf Request#
		 * @member av.net.request
		 * @type Number
		 */
		request.maxRetries = 0;
		
		/**
		 * Automatically evals the content of .responseText and populates .responseJSON with it if the content-type returned by the server is set to application/json or text/javascript.
		 * @name Request.evalJSON
		 * @memberOf Request#
		 * @member av.net.request
		 * @type Boolean
		 */
		request.evalJSON 		= false;//allows callee to adjust hence altering the behavior of the onreadystate change if callbackFunction is sent
		
		/**
		 * Populates the XML body of the response if the content-type of the request is set to application/xml, null otherwise (.responseXML)
		 * @name Request.evalXML
		 * @memberOf Request#
		 * @type Boolean
		 */
		request.evalXML 		= false;
		
		/**
		 * Default false; Should XML responses be converted to JSON? If true the av.data.xml.xml2json() parser will convert the responseText to JSON before calling the final callback function/onreadystatechange(4)
		 * @name Request.convertXML
		 * @memberOf Request#
		 * @type Boolean
		 */
		request.convertXML		= false;
		
		/**
		 * The XML body of the response if the content-type of the request is set to application/xml, null otherwise.
		 * @name Request.responseXML
		 * @memberOf Request#
		 * @type XMLDocument
		 */
		request.responseXML = null;
		
		/**
		 * The JSON body of the response if the content-type of the request is set to application/json or text/javascript, null otherwise.
		 * @name Request.responseJSON
		 * @memberOf Request#
		 * @type {Object}
		 */
		request.responseJSON= null;
		
		/**
		 * True/false - if true, will remove external DTDs.
		 */
		request.removeExternalXMLDependencies = true;
		
		
		/**
		 * Used to set the redirect policy to one of the following values: 0 = Never redirect, 1 = Disallow HTTPS to HTTP redirects, 2 = Always redirect, 
		 * the default is 1 in AVE (Disallow HTTPS to HTTP redirects) - but within av.net.createRequest() we have only implemented 0 and 2, so 1 acts like 2 (follow all redirects).
		 * @name Request.redirectPolicy
		 * @memberOf Request#
		 * @type Number
		*/
		request.redirectPolicy = 1;
		
		/**
		 * Parse the response for &lt;form&gt; tags, and populate .forms = [av.net.createForm()]
		 * @name Request.extractForms
		 * @memberOf Request#
		 * @type Boolean
		*/
		request.extractForms = false;
		
		/**
		 * Boolean - use to enable or disable certificate checking during secure HTTP operations; This property can be read or assigned; The default value is true.
		 * @name Request.checkCertificate
		 * @memberOf Request#
		 * @type Boolean
		 */
		request.checkCertificate = true;
		
		//char encoding and content types
		/**
		 * Read only - Default is the current value as set by av.net.setUserAgent(useragentString), re-obtained from av.net and attached to XMLHttp request at send()
		 * @name Request.userAgent
		 * @memberOf Request#
		 * @type String
		 */
		request.useragent = self._userAgent;
		
		/**
		 * The content-type of the current request, if form post the default is application/x-www-form-urlencoded, but can be overridden - {@see Request.setContentType}
		 * @name Request.contentType
		 * @memberOf Request#
		 * @type Boolean
		 */
		request.contentType = 'application/x-www-form-urlencoded';
		
		/**
		 * Populated after a request is .send() sent with the end URL, so if redirectPolicy > 0, this will contain the final destination URL
		 * @name Request.url
		 * @memberOf Request#
		 * @type String
		 */
		request.url = '';
		
		/**
		 * The initial URL as populated by .open(method, url, async)
		 * @name Request.originalURL
		 * @memberOf Request#
		 * @type String
		 */
		request.originalURL = '';
		
		/**
		 * An array of form objects like: {name : '', id : '', method : 'post', action : '', inputs : {'formElementName' : {'name':name,'value':value,'type':type, 'disabled':disabled,'subtype':subtype, 'id':id, 'clicked':clicked}},numInputs : 0
		 * @name Request.forms
		 * @memberOf Request#
		 * @type Array
		 */
		request.forms = [];
		
		/**
		 * The last URL redirect followed before self.state==4, default is empty
		 * @name Request.redirect
		 * @memberOf Request#
		 * @type String
		 */
		request.redirect = '';
		
		/**
		 * Was the request successful? Flag set to false when explicit failure is detected
		 * @name Request.success
		 * @memberOf Request#
		 * @type Boolean
		 */
		request.success = true;
		
		/**
		 * If !request.success, and we know what type of error occured, a programmer's definition of the error will be present in Request.error
		 * @name Request.error
		 * @memberOf Request#
		 * @type String
		 */
		request.error = "";
		
		/**
		 * <pre>Array of {@link av.string.parseURL}(url) objects: 
		 * 	{
		 *		protocol	: protocol,
		 *		user		: user,
		 *		password	: pass,
		 *		port		: port,
		 *		server		: server,
		 *		path		: path,
		 *		query		: query,
		 *		queryString	: queryString,
		 *		hash		: hash,
		 *		hashString	: hashString,
		 *		url			: url,
		 *	}</pre>
		 * @name Request.redirects
		 * @memberOf Request#
		 * @type Array
		 */
		request.redirects = [];
		
		/**
		 * Boolean used to determine if a signature will be used in sending a request - NOT IMPLEMENTED
		 * @name Request.sign
		 * @memberOf Request#
		 * @type Boolean
		 */
		request.sign = false;
		
		/**
		 * An object that contains all information needed to sign a request; for oauth this includes a key/token; others as needed - NOT IMPLEMENTED
		 * @name Request.signature
		 * @memberOf Request#
		 * @type Object
		 * @example request.signature = {method:'oauth2.0', key:'blah', token:''}//token will be inserted after a token is received.
		 * //you should, after a request, in the onreadystatechange method, capture self.signature in order to set the token in future requests.
		 */
		request.signature = {method:'',key : '', token : ''};
		
		//request "methods"
		
		/**
		 * Given an new XMLHttp() object, will replace the internal XMLHttp object used by av.net.createRequest()
		 * @name Request.replaceXMLHttp
		 * @memberOf Request#
		 * @function
		 * @param {XMLHttp} obj a fresh XMLHttp object to use for a request or to follow a redirect.
		 */
		request.replaceXMLHttp = function(obj){
			x = obj;//override the previous XMLHttp object with the argument "obj" by reference
			
			return x;
		}
		
		
				
		request.retry = function(){
			var origHeaders = request.headers;
			request.newXMLHttp(true);
			
			//if(typeof(origHeaders['Content-Type']) != 'undefined') delete origHeaders['Content-Type'];//redirects do not re-post form data
			//request.setRequestHeaders(origHeaders);
			
			request.open(request.method, request.url, request.async);
			return request.send(request.params);
		}
		
		/**
		 * Attaches a form at the end of the current forms[] array (empty to start on a fresh av.net.createRequest()); 
		 * @name Request.attachForm
		 * @memberOf Request#
		 * @function
		 * @param {form} form A form as returned and updated via av.net.createForm()
		 * @example
		 * //(a) send a request with extractForms flag set to true,
		 * var request = av.net.createRequest();
		 * 	   request.extractForms = true;
		 * 	   request.onreadystatyechange = function(state){
		 *        if(state == 4){
		 *           var form = self.forms[0];//(b) use one of the forms that was auto-parsed from the response - var form = self.forms[0]
		 *           	 form.setValue('username','Chad');
		 *           	 form.clickButton('login_button');
		 *           var sendLogin = av.net.createRequest();
		 *               sendLogin.attachForm(form);
		 *               sendLogin.onreadystatechange = function(state){
		 *               	if(state == 4) print('The response of the form submission was: ' + self.responseText);
		 *               }
		 *               //(c) submit the form (extracts the URL from the form.action that was found within the form),
		 *               //and chooses "post" or "get" based on the form attribute for method="get/post"
		 *               sendLogin.sendForm(true);//use async
		 *        }
		 *     }
		 *     //(a) continued - start the process by sending a request for the login page so we can get the login form
		 *     request.open("GET","http://www.someeURLwithALoginForm.com/login.aspx",true);//use async
		 *     request.send("");
		 */
		request.attachForm = function(form){
			form.request = request;
			request.forms.push(form);
			//attach the request to the form
		}
		
		/**
		 * Submit a form to the action URL provided
		 * @name Request.sendForm
		 * @memberOf Request#
		 * @function
		 * @param {Boolean} async
		 * @param {Number} formIndex Default is 0, for the first form, if more than one form has been attached to this requests, send its 0-based index here.
		 * @example //@see {attachForm}
		 */
		request.sendForm = function(async, formIndex){
			if(typeof(formIndex) == 'undefined' || isNaN(parseInt(formIndex)) || self.forms.length <= parseInt(formIndex)) formIndex=0;
			else formIndex = parseInt(formIndex);
			
			var f = request.forms[formIndex], action = f.action, method = f.method, query = f.serialize(), post = '';
			
			
			//VALIDATE the argument "async"
			if(typeof(async) == 'undefined'){
				throw Error("av.net.createRequest.sendForm(async, formIndex) - expected a Boolan for async, received NULL.");	
			}else{
				async = Boolean(async);
			}
			//VALIDATE the "action"
			if(action == ''){
				throw Error("av.net.createRequest.sendForm(async, formIndex) - form #" + formIndex + " has an empty action URL, cannot send request.");
			}
			
			//BUILD QUERY (for post or action string)
			//put the query string in the post body if it is a post, otherwise append to the "action" url
			if(method == 'post'){
				post = query;
			}else{
				action += (action.indexOf('?') != -1 ? '?' : '&') + query; 
			}
			
			request.forms = [];//clear out forms
			
			//OPEN THE REQUEST
			request.open(method, action, async);
			request.send(post);
		}
		/**
		 * Create a new XMLHttpRequest and replace the existing one, preserving request headers if requested. 
		 * @name Request.newXMLHttp
		 * @memberOf Request#
		 * @function
		 * @param {Boolean} preserveHeaders Should current request headers be preserved
		 */
		request.newXMLHttp = function(preserveHeaders){
			if(typeof(preserveHeaders) == 'undefined') preserveHeaders = false;
			var xx = new XMLHttpRequest();
			xx.used = false;
			xx.request = this;
			xx.onreadystatechange = xx.onReadyStateChange = x.onreadystatechange;
			
			//reset variables that are added POST open/send
			self.resetXMLHttpDefault(this);//initialize the request
			
			request.replaceXMLHttp(xx, preserveHeaders);
		}
		
		/**
		 * Set the content-type header of the current request, only useful if method is POST
		 * @name Request.setContentType
		 * @memberOf Request#
		 * @function
		 * @param {String} contentType String representing the content type of the POST body
		 */
		request.setContentType = function(contentType){
			self.log.debug("Content-Type on request set to: " + contentType)
			request.contentType = contentType;
		}
		
		/**
		 * Method that should be overridden by callee to encapsulate their onreadystatechange processing (after we process things of interest); IMPORTANT - the scope under which the callback executes is Request.
		 * @name Request.onreadystatechange
		 * @memberOf Request#
		 * @function
		 * @param {Number} state This function is called implicitly and is a placeholder which you should override
		 * @example var r = av.net.createRequest(); r.onreadystatechange = function(s){av.log.debug("State: " + s + ", responseText: " + this.responseText)}
		 */
		request.onreadystatechange = function(state){
			self.log.debug("av.net.onreadystatechange() - either you did not override the onreadystatechange() method, or you are running a SYNCHRONOUS request.");
		}
		
		/**
		 * Open a request - identical to XMLHttpRequest.open() except that additional user/password parameters can be used.
		 * @name Request.open
		 * @memberOf Request#
		 * @function
		 * @param {String} [method=GET] The method to use, GET or POST
		 * @param {String} url The URL to open a request to, remember to encodeURIComponent() any special characters in the query-string first.
		 * @param {Boolean} [async=true] Use asynchronous XMLHttp or synchronous, async=true will force asynchronous mode.
		 * @param {string} [user=Empty String] If simple authentication is desired, provide a username in this parameter
		 * @param {string} [password=Empty String] If simple authentication is desired, provide a password in this parameter
		 */
		request.open = function(method, url, async, user, password){
			//self.log.debug("Header being set")
			if (x.used) {
				self.newXMLHttp();	
			}
			
			async = typeof(async) != 'boolean' ? true : async;//default for XMLHttp is async = true, @see http://www.w3.org/TR/XMLHttpRequest/#event-handler-attributes
			method = typeof(method) != 'string' ? 'get' : method.toLowerCase();
			
			//copy over properties to the XMLHttp object from "request" (this)
			
			x.enableHeaderCookies = request.enableHeaderCookies;
			
			//only enable native XMLHttp redirect following if header cookies are disabled, otherwise we process redirects
			//to be able to accept cookies from each redirect
			x.redirectPolicy = (request.enableHeaderCookies && request.redirectPolicy) ? 0 : request.redirectPolicy;//don't follow redirects, we will do it programatically
			
			self.log.debug("redirect policy: " + x.redirectPolicy + " derived from self.enableHeaderCookies="+self.enableHeaderCookies + ", and self.redirectPolicy = " + self.redirectPolicy);
			
			x.useragent = request._userAgent = self._userAgent;//don't update the user agent on "request", do it at tha av.net.setUserAgent(ua) level
			x.checkCertificate = request.checkCertificate;
			x.contentType = request.contentType;
			
			//wrap some of the properties of the XMLHttp object into the request for read-access
			request.async = async;
			request.url 	= url.replace(/([^\:])(\/\/)/, '$1/');//replace all instances of // with / when not following http(s):// 
			request.method = method;
			request.user = typeof(user) == 'undefined' ? null : user;
			request.password = typeof(password) == 'undefined' ? null : password;
			
			request.stateHistory = [];//clear out states of previous requests
			
			x.open(method, url, async);
			
			if(method == 'post') request.setRequestHeader('Content-Type',request.contentType);//allow them to override if raw XML or JSON/etc
			
			request.readyState = x.readyState;
		}
		
		/**
		 * After calling Request.open(), the request is only in state==1, you must call Request.open() to actually begin the full request.
		 * @name Request.send
		 * @memberOf Request#
		 * @function
		 * @param {Object} params The post body of the request, ready to use (URL encoded or raw post); make sure if params is not URL encoded, to call Request.setContentType() first.
		 */
		request.send = function(params){
			
			x.used = true;
			params = typeof(params) != 'string' ? '' : params;
			self.log.debug("Params were"+params);
			//self.log.debug('params'+params);
			request.params = params;
			
			//SET HEADERS, MUST BE CALLED AFTER .open() as otherwise browser XMLHttpRequest fails
			//moved header insertion here so that it is only the final list of merged headers and can persist from request to request
			self.log.debug('headers',request.headers)
			for(var headerName in request.headers){
				//self.log.debug("Header being set ")
				try{
					x.setRequestHeader(headerName, request.headers[headerName]);
					self.log.debug('X: set header '+ headerName);
				}catch(eNotAllowed){
					self.log.debug("X: Not allowed to set header: " + headerName + " - " + eNotAllowed.message);
				}
				//_self.log.debug("Just in time for open() Header added. Header["+headerName+"] = " + self.headers[headerName]);
			}
			
			
			//just-in-time insertion of the user agent string
			request.setRequestHeader('User-Agent',request._userAgent);
			
			//not yet implemented
			if(request.sign){
				self.signRequest(request,params);
			}
			
			//_self.log.debug("send() - to url \n\t" + self.url + " \n\tparams: " + params);
			//_self.log.debug("REQUEST Headers:");
			/*for(var headerName in request.headers){
				self.log.debug(headerName + ": " + self.headers[headerName]);
			}*/
			
			if(request.originalURL == '') request.originalURL = request.url;
			if(request.params){
				x.setRequestHeader('Content-Type',request.contentType);
			}
			
			self.logRequest(request);
			//self.log.debug("SENDING *********************" + request.async);
			if(request.async){
				x.send(params);
			//if synchronous, we need to proceed 	
			}else{
				var sendReponse = x.send(params);
				
				//call the async onreadystatechange. This ensures cookies are parsed and that redirects are followed
				var readyStateChangeResponse = x.onreadystatechange.apply(x,[4]);
				return readyStateChangeResponse;
			}
		}
		
		/**
		 * @name Request.removeRequestHeader
		 * @memberOf Request#
		 * @function
		 * @param {String} headerName
		 */
		request.removeRequestHeader = function(headerName){
			if(typeof(request.headers[headerName]) != 'undefined') delete request.headers[headerName];
		}
		
		request.getContentType = function(){
			if(request.contentType && request.params){
				return request.contentType;
			}
			return '';	
		}
		
		/**
		 * @name Request.setRequestHeader
		 * @memberOf Request#
		 * @function
		 * @param {String} name
		 * @param {String} val
		 */
		request.setRequestHeader = function(name,val){
			self.log.debug("setRequestHeader("+name+", " + val+")");
			if(name.toLowerCase() == 'content-type'){
				request.setContentType(val)
			}else{
				request.headers[name] = val;
			}
			return true;
		}
		/**
		 * @name Request.setRequestHeaders
		 * @memberOf Request#
		 * @function
		 * @param {Array} headers
		 */
		request.setRequestHeaders = function(headers){
			for(headerName in headers){
				request.setRequestHeader(headerName, headers[headerName]);
			}
			request.removeRequestHeader('Authorization');//remove any signatures
		}
		/**
		 * @name Request.getRequestHeader
		 * @memberOf Request#
		 * @function
		 * @param {String} headerName
		 */
		request.getRequestHeader = function(headerName){
			self.debug('getRequestHeader('+headerName+') - ' + request.headers[headerName]);
			return typeof(request.headers[headerName]) != 'undefined' ? request.headers[headerName] : '';
		}
		/**
		 * @name Request.getResponseHeader
		 * @memberOf Request#
		 * @function
		 * @param {String} headerName
		 */
		request.getResponseHeader = function(headerName){
			av.log.debug(headerName);
			var headerVal = null;
			try{headerVal = x.getResponseHeader(headerName);}catch(headerNotPresent){}
			return headerVal;
		}
		/**
		 * Retrieve a hash map (object) of all response headers received from the server by the request.
		 * @name Request.getAllResponseHeaders
		 * @memberOf Request#
		 * @function
		 */
		request.getAllResponseHeaders = function(){
			var headerString = x.getAllResponseHeaders();
			return headerString;
		}
		
		/**
		 * Abort the request - note that this does not call the synchronous XMLHttpRequest.abort() but simply ignores the response to avoid freezing applications whilst aborting.
		 * @name Request.abort
		 * @memberOf Request#
		 * @function
		 */
		request.abort = function(){
			x.onreadystatechange = function(state){self.log.debug("XMLHttp.abort() already called - onreadystatechange("+state+") will be ignored.");}
			return x.abort();
		}
		
		//set default headers on the request
		request.setRequestHeader('Accept',"text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8");
		request.setRequestHeader('Accept-Language','en-us,en;q=0.5');
		if(!av.isBrowser){
			request.setRequestHeader('Accept-Encoding','none');
			request.setRequestHeader('Accept-Charset','ISO-8859-1,utf-8;q=0.7,*;q=0.7');
		}
		
		//onreadystatechange BEGIN
		
		/**
		 * @private
		 */
		x.onreadystatechange = x.onReadyStateChange = function(state){
			if(typeof(state) != 'number'){
				var state = this.readyState; 
			}
			request.state = request.readyState = state;//set state on object mimicking XMLHttp for user to reference
			request.stateHistory.push(state);
			//because status is being updated throughout a requst, it often is "no longer usable" per AVE XMLHttp object implementation
			var x = this;
			self.log.debug("State: " + state + " from " + request.url);
			//PASS UP SOME XMLHttp PROPERTIES AND VALUES
			try {request.status = x.status;}catch(eStatusBeingUsed){}
			try {request.statusText = x.statusText;}catch(eStatusBeingUsed){}
			//try {request.status = self.status;}catch(eStatusBeingUsed){}
			//try {request.status = self.status;}catch(eStatusBeingUsed){}
			self.log.debug("Received Response at: " + (new Date().toGMTString()));
			
			if(state == 1 && request.redirectPolicy != 0){
				var redirect = request.getResponseHeader('location');
				if(redirect != '') request.redirects.push( av.string.parseURL(redirect));	
			}
			
			
			if(state == 4){				
				//EXTRACT A REDIRECT IF PRESENT
				var redirect = request.getResponseHeader('location');
				if (redirect != '') {
					request.redirect = av.string.parseURL(redirect);
					request.redirects.push(redirect);
					
					if(request.enableHeaderCookies && request.redirectPolicy > 0){
						redirect.replace("%3A%3A","%3A");
						self.log.debug("Redirect #" + (request.redirects.length) + ", Redirecting request to url: " + redirect);
						
						var origHeaders = request.headers;
						request.newXMLHttp(true);
						
						if(typeof(origHeaders['Content-Type']) != 'undefined') delete origHeaders['Content-Type'];//redirects do not re-post form data
						request.setRequestHeaders(origHeaders);
						
						request.open('get', redirect, request.async);
						
						request.send('');
						return;//DO NOT CONTINUE PROCESSING THE RESPONSE TEXT
					}
				}
				
				//No redirect present? Proceed to extract response
				
				
				
				
				var response = '';//used throughout to determine response text/object/xml to insert into request.responseText
				request.responseText = x.responseText;
				self.log.debug("RESPONSE TEXT ----------------------" + request.url);
				self.log.debug(x.responseText);
				
				//if the status is 4xx-5xx range, we failed
				var statusNumeric = parseInt(x.status);
				if(!isNaN(statusNumeric) && typeof(self.errors[statusNumeric]) == 'string'){
					request.success = false;
					request.error = statusNumeric + ' ' + self.errors[statusNumeric];
				}
				
				try {
					self.log.debug("Status: " + request.status + ", responseText: " + request.responseText.substr(0,100)+"...");
					var type = x.getResponseHeader('Content-Type'), canDetermineType = typeof(type) == 'string', response = '';
					self.log.debug("Content-type: " + type);
					if (canDetermineType) {
						self.log.debug('type: ' + type);
						type = type.toLowerCase();
						//removed dependency on server for content type
						if (request.evalJSON && request.responseText.toString().indexOf('<') !== 0) {//(type.indexOf('json') != -1 || type.indexOf('javascript') != -1)
							try {
								self.log.debug("request.evalJSON === true - attempting to decode JSON");
								response = request.responseText.toString();
								request.responseJSON =  eval('(' + request.responseText.toString() + ')');
							} 
							catch (eNotJSON) {
								response = request.responseText.toString();
								request.success = false;
								request.error = "Invalid JSON received: " + eNotJSON.message;
							}
						}else if(request.convertXML){//} && type.indexOf('xml') != -1 ){
							try{
								av.require('data.xml');
								response = av.data.xml.xml2json(request.responseText);
								request.responseJSON = response;
							}catch(eNotValidXML){
								response = request.responseText.toString();
								request.success = false;
								request.error = "Invalid XML received or could not convert to JSON: " + eNotValidXML.message;
				
							}
							
						}
						else if (request.evalXML){//} && type.indexOf('xml') != -1) {
								if (typeof(request.responseText) == 'string') {//ave 1.4.1+ already evals XML
									try {
										self.log.debug("request.evalXML === true - attempting to decode XML");
										var d = new XMLDocument();
										var start = (new Date()).getTime();
										self.log.debug("XML TO LOAD: " + request.responseText);
										
										var xml = request.responseText;
										if(request.removeExternalXMLDependencies){
											self.log.debug("Removing external dependencies in the response XML");
											//@todo use regex buddy to build a regex replacement/removal for external DTD/DOCTYPE references
											
										}
										
										d.loadString(av.string.trim(request.responseText));
										var end = (new Date()).getTime();
										
										self.log.debug("Loaded xml into XMLDocument. This load alone took: " + (end-start) + ' ms');
										var xml = d.documentElement;
										if (xml == null){
											response = request.responseText;
											request.success = false;
											request.error = "Invalid XML received, parsed as NULL";
										}else{
											response = xml;
											request.responseXML = xml;
										}
									} 
									catch (eNotXML) {
										self.log.warn("Could not parse XML: (" + e.lineNumber +") - " + eNotXML.message);
										response = request.responseText;
										request.success = false;
										request.error = "Invalid XML received: Could not parse XML: (" + e.lineNumber +") - " + eNotXML.message;
									}
								}
								else {
									var d = request.responseText;
									try {
										var xml = d.documentElement;
										if (xml == null) 
											response = request.responseText;
										else 
											if(typeof(request.responseXML) == 'undefined') request.responseXML = d.documentElement;//insert response XML into responseXML
											response = d.documentElement;
									} 
									catch (eNotXML) {
										response = request.responseText;
										request.success = false;
										request.error = "Invalid XML received, unable to determine documentElement: " + eNotXML.message;
									}
								}
						}else{//content type not yet auto-manageable by av.net - treat as plain-text
							self.log.debug("canDetermineType, but xml and json either not it or evalJSON and evalXML is not set to true.")
							//print(self.responseText);
							//_self.log.debug(self.responseText)
							response = request.responseText;
						}
					}else{
						response = request.responseText;
					}
					
				//if an unforseen error occured in parsing the response or preparing it, return it raw
				}catch (eProblemsParsing) {
					response = request.responseText;
					request.success = false;
					request.error = "Unable to process responseText: " + eProblemsParsing.message;
				}
				
				//_self.log.debug("response=");//+self.responseText);
				//print(response);
				//now use whatever is in response, and assign it to request.responseText
				request.originalResponse = request.responseText;
				request.responseText = response;
				
				
				if(request.extractForms && request.success){
					request.forms = [];
					self.log.debug("extractForms == true, extracting now...");
					self.extractForms(request);
				}
				
				//If there was not success, and callee has requested retries, make retries
				if(!request.success && request.retries < request.maxRetries){
					request.retries++;
					return request.retry();//called recursively to satisfy returning a "request" object
				}
				
				
				//determine if there is a redirect that we need to follow
				self.log.debug("av.net.onreadystatechange("+state+") - calling final callee's onreadystatechange");
				request.onreadystatechange.apply(request,[state]);//scope is set to the XMLHttp object
							
			}else{//end process readystate 4
				
				request.onreadystatechange.apply(request,[state]);//scope is set to the XMLHttp object
			}
			
			
		}//onreadystatechange END
		
		return request;
	}
	
	/**
	 * Sign a request using oauth - not implemented.
	 * @name av.NetContainer.signRequest
	 * @methodOf av.NetContainer#
	 */
	self.signRequest = function(request, params){
		//SIGN THE REQUEST, USING the request.token (oauth token, if present) and request.key (consumer key)
		
		//canned sig
		var oauthSignature = 'OAuth realm="http://sp.example.com/",oauth_consumer_key="0685bd9184jfhq22",oauth_token="ad180jjd733klru7",oauth_signature_method="HMAC-SHA1",oauth_signature="wOJIO9A2W5mFwDgiDvZbTSMK%2FPY%3D",oauth_timestamp="137131200",oauth_nonce="4572616e48616d6d65724c61686176",oauth_version="1.0"';
		
		request.setRequestHeader('Authorization',oauthSignature);
	}
	
	/**
	 * Logs all request headers and parameters being posted in a request, similar to a profiling tool in the browser.
	 * @name av.NetContainer.logRequest
	 * @methodOf av.NetContainer#
	 */
	self.logRequest = function(request){
		
		var now = (new Date()).toGMTString();
		var dstring = "\n\t------------------------------- REQUEST (" + request.method.toUpperCase()+") @ " + now + " -------------------------------";
		dstring += "\n\t\tURL_____________________________________\n\t\t\t" + request.url;
		dstring += "\n\t\tREQUEST HEADERS_________________________";
		for(var headerName in request.headers)
			dstring += "\n\t\t\t"+headerName+":\n\t\t\t\t" + request.headers[headerName];
		dstring += "\n\t\t\tContent-Type:\n\t\t\t\t" + request.getContentType();	
		dstring += "\n\t\tPARAMS__________________________________\n\t\t\t" + request.params;
		dstring += "\n\t------------------------------- END REQUEST @ " + now + " -------------------------------";				
		self.log.debug(dstring);
		/*
		 
		 A string of the format:
		 
		 	------------------------------- REQUEST (GET)  @ Sat, 31 Jul 2010 00:48:52 GMT -------------------------------
		 		URL_____________________________________
		 			https://graph.facebook.com/oauth/authorize?client_id=112151428835887&type=web_server&display=wap&redirect_uri=http:%3A%2F%2Flocalhost%2Frpc%2Frest%2Fconnect%2FauthorizeReturn.json&scope=user_photos,email,user_birthday,user_online_presence
		 		REQUEST HEADERS_________________________
					Accept: 
						text/html,application/xhtml+xml,application/xml;q=0.9
					Accept-Language:
						en-us,en;q=0.5
					Accept-Encoding:
						Accept-Charset: ISO-8859-1,utf-8;q=0.7,*;q=0.7
					User-Agent:
						Mozilla/5.0 (iPhone; U; CPU like Mac OS X; en) AppleWebKit/420+ (KHTML, like Gecko) Version/3.0 Mobile/1A543 Safari/419.3'
				PARAMS__________________________________
					charset_test=%E2%82%AC%2C%C2%B4%2C%E2%82%AC%2C%C2%B4%2C%E6%B0%B4%2C%D0%94%2C%D0%84&email=freechad%40yahoo.com&pass=tedjones&login=Log%20In'
				
		 	------------------------------- END REQUEST @ Sat, 31 Jul 2010 00:48:52 GMT -------------------------------	
		 
		 */
		
	}
	
	
	/**
	 * Matches any FORM tags within a Request.responseText body and converts them into an array of Form objects
	 * @param {Request} request A request which has completed and has responseText, forms will be added to the request by reference Request.forms (an Array of FormRequest objects)
	 * @name av.NetContainer.extractForms
	 * @methodOf av.NetContainer#
	 * @return {Array[FormRequest]} All forms in the request.responseText will be extracted into objects of type FormRequest and returned in an Array.
	 */
	self.extractForms = function(request){
		var xml = request.responseText, xmlLower = xml.toLowerCase(),start = (new Date()).getTime(), end=0;
		if(!xml) return false;
		
		//now because of the drawbacks of parsing the entire XML document, let's do a string search for <form> and </form> and only parse those
		var forms = [], formStart = xmlLower.indexOf('<form',0), formEnd = 0;
		while(formStart != -1){
			
			formEnd = xmlLower.indexOf("/form>", formStart);
			var formString = xml.substring(formStart,formEnd+6);
			//insert a test select box
			//formString = formString.substring(0,formString.indexOf(">")+1) + '<select name="country" id="countrySelect" multiple="multiple"><option value="">none</option><option value="China">China</option><option value="USA" selected="selected">U.S.A.</option><option value="Canada" selected="selected">Canada</option></select>' + formString.substring(formString.indexOf(">")+1)
			self.log.debug(formString);
			forms.push(formString);
			
			var newStart = xmlLower.indexOf('<form',formEnd);
			if(newStart <= formStart){
				formStart = -1;
			}else{
				formStart = newStart;
			}
		}
		var d = new XMLDocument(), types = ['input','select','button','textarea'];
		for(var i=0; i<forms.length; i++){
			var f = self.createForm();
			d.loadString(forms[i]);
			
			var formXML = d.documentElement;
			
			f.setName(formXML.getAttribute('name'));
			f.setAction(formXML.getAttribute('action'));
			f.setMethod(formXML.getAttribute('method'));
			
			for(var t=0; t < types.length; t++){
				var type = types[t];//input, etc
				var elements = formXML.getElementsByTagName(type);
				if(elements.length){
					for(var e=0; e<elements.length; e++){
						f.addInput(elements.item(e));
					}
				}
			}
			
			
			request.forms.push(f);
		}
		
		end = (new Date()).getTime();
		self.log.debug("Total time to parse forms from responseText: " + (end-start) + ' ms ');
		return request.forms;
		//parse for forms
		
		/*
		var forms = xml.getElementsByTagName('form');
		
		for(var i=0; i < forms.length; i++){
			
			var form = forms.item(i);
			
			var at = node.attributes.item(i);
			attributes[at.nodeName.toLowerCase()] = at.text;
		}*/
		
	}
	
	/**
	 * Creates an empty {@link FormRequest} for usage and submission.
	 * @name av.NetContainer.createForm
	 * @methodOf av.NetContainer#
	 * @returns {FormRequest} A {@link FormRequest} which can be used to populate a new request.
	 */
	self.createForm = function(){
		var _self = this;
		
		/**
		 * An object that represents a form that can be loaded when exists within request.responseText, or by calling av.net.createForm(action,method,name) directly {@link av.NetContainer.createForm}
		 * @constructor
		 * @name FormRequest
		 */
		var form = new Function;//within "form", ~this~ refers to "form", _self refers to av.net
		
		/**
		 * The
		 * @memberOf FormRequest#
		 * @name FormRequest.name
		 * @type string
		 */
		form.name = '';
		/**
		 * The id of the form within the DOM hierarchy of XML
		 * @memberOf FormRequest#
		 * @name FormRequest.id
		 * @type string
		 */
		form.id = '';
		/**
		 * The
		 * @memberOf FormRequest#
		 * @name FormRequest.method
		 * @type string
		 */
		form.method = 'post';
		/**
		 * The submit action of the form, a URL string that can be loaded from an XML/HTML form or overridden using this read/write property
		 * @memberOf FormRequest#
		 * @name FormRequest.action
		 * @property
		 * @type string
		 */
		form.action = '';//where to submit the form to
		
		/**
		 * The parsed inputs or manually added inputs representing the inputs that belong to a form.
		 * @memberOf FormRequest#
		 * @name FormRequest.inputs
		 * @type Object
		 * @property
		 */
		form.inputs = {};
		
		/**
		 * The number of inputs currently in this FormRequest
		 * @memberOf FormRequest#
		 * @name FormRequest.numInputs
		 * @type Number
		 */
		form.numInputs = 0;
		
		/**
		 * Set the action of the form to the provided URL
		 * @memberOf FormRequest#
		 * @name FormRequest.setAction
		 * @function
		 * @param {String} action
		 */
		form.setAction = function(action){
			if(typeof(action) != 'undefined') form.action = av.string.trim(action);
		}
		/**
		 * Set the name of the form, for logging and alias purposes, to the provided name.
		 * @memberOf FormRequest#
		 * @name FormRequest.setName
		 * @function
		 * @param {String} name
		 */
		form.setName = function(name){
			if(typeof(name) != 'undefined') form.name = av.string.trim(name);
		}
		/**
		 * Set the method of the FormRequest so that this type of request method is used when submitting the form, used internally when parsing a form from HTML/XML so that the developer can introspect on the form.
		 * @memberOf FormRequest#
		 * @name FormRequest.setMethod
		 * @function
		 * @param {String} method GET or POST or PUT or HEAD or DELETE or TRACE or CONNECT  
		 */
		form.setMethod = function(method){
			if(typeof(method) != 'undefined') form.method = av.string.trim(method.toLowerCase());
		}
		/**
		 * Set the ID of the FormRequest, used internally when parsing a form from HTML/XML so that if multiple forms programatically locating the form with the desired ID is possible.
		 * @memberOf FormRequest#
		 * @name FormRequest.setID
		 * @function
		 * @param {String} id
		 */
		form.setID = function(id){
			if(typeof(id) != 'undefined') form.id = av.string.trim(id);
		}
		
		/**
		 * Set/update the value of a FormInput
		 * @memberOf FormRequest#
		 * @name FormRequest.setValue
		 * @function
		 * @param {String} name The name of the form input, will be used as the key in the key/value pair of this input during submissiuon/serialization of the FormRequest.
		 * @param {String} [value=Empty String] The value of the form input, empty string is acceptable.
		 */
		form.setValue = function(name, value){
			if(form.inputs[name] != null){
				form.inputs[name].value = typeof(value) === 'undefined' ? '' : value.toString();
				return true;
			}
			return false;
		}
		
		/**
		 * At runtime, the toRequest() method is called last to convert the form into a request, attach itself to the new Request, and be returned for use.
		 * @memberOf FormRequest#
		 * @name FormRequest.toRequest
		 * @function
		 * @return {Request} A Request object
		 */
		form.toRequest = function(){
			var request = form.createRequest();
			request.attachForm(form);
			return request;
		}
		
		
		/**
		 * Add/override an input in the FormRequest
		 * @memberOf FormRequest#
		 * @name FormRequest.addInput
		 * @type method
		 * @param {Object,String} nameOrXMLNode The name of the element, or an XML element representing the Input in an HTML DOM
		 * @param {String} value
		 * @param {String} type
		 * @param {String} subtype
		 * @param {Boolean} disabled
		 * @param {Array} options [{{name:name,value:value,selected:selected}]
		 * @return {FormInput}
		 */
		form.addInput = function(nameOrXMLNode, id, value, type, subtype, disabled, options, multiple, clicked){
			//extract the XML from this DOM XML Node
			if(typeof(nameOrXMLNode) != 'string'){
				var x = nameOrXMLNode;
				//type
				type = x.nodeName.toLowerCase();
				//subtype
				subtype = x.getAttribute('type');
				//name
				name = x.getAttribute('name');
				//id
				id = x.getAttribute('id');
				//multiple
				var _multiple = x.getAttribute('multiple');
				if(_multiple !== '') multiple = 'multiple';
				//disabled
				var _disabled = x.getAttribute('disabled');
				if(_disabled !== '') disabled = 'disabled';
				
				clicked = false;//we don't know if it was clicked, heck - it's not even being submitted yet!
				
				
				//value
				if(type == 'textarea'){
					value = x.text;
					self.log.debug('xmltext: ' + x.text);
				}else if(type == 'input' || type == 'button'){
					var _valAtt = x.getAttribute('value');
					value = _valAtt == null ? '' : _valAtt;	
				}else if(type == 'select'){
					//extract the options, and if we come accross one or more that is "selected", keep track of it in an array and 
					//afterward we'll join it with commas
					var selectedOptions = [];
					options = [];
					var _options = x.getElementsByTagName('option');
					for(var i=0; i<_options.length; i++){
						var _o = _options.item(i);
						var _s = _o.getAttribute("selected"), _l = _o.text, _v = _o.getAttribute('value').toString() ;
						if(_s != ''){selectedOptions.push(_v)};
						self.log.debug("_S:" + _s);
						options.push({
							label : _l,
							value : _v,
							selected : _s != '',
						});
					}
					//print('selected options: ' + uneval(selectedOptions));
					value = selectedOptions.join(',');
				}
				self.log.debug("from xml type=" + type+", subtype="+subtype);
				
			}else{
				name = nameOrXMLNode;
				type = typeof(type) == 'undefined' ? '' : type;
				subtype = typeof(type) == 'undefined' ? '' : subtype;
				value = typeof(type) == 'undefined' ? '' : value;
				clicked = typeof(clicked) == 'undefined' ? '' : clicked;
			}
			
			//Now do some general processing on the updated argument list, which either came as args or as extracted from the XML node
			
			//name
			name = typeof(name) != 'string' ? form.numInputs : av.string.trim(name);
			//disabled
			disabled = typeof(disabled) != 'undefined' && disabled != null ? true : false;//presense of disabled ==> it is disabled  
			//value
			value = typeof(value) != 'undefined' ? av.string.trim(value.toString()) : '';
			//type
			type = typeof(type) != 'string' ? 'input' : av.string.trim(type.toLowerCase());
			
			if (type == 'select') {
				multiple = typeof(multiple) != 'undefined' ? true : false;
				options = typeof(options) != 'undefined' ? options : [];
			}
			//subtype
				/*	input{hidden,text,password,checkbox,radio,submit,reset,file,hidden,image,button}
				 * 	button{button,submit,reset}
				 *  select
				 */
			subtype = typeof(subtype) != 'string' ? (type == 'input' ? 'text' : (type == 'button' ? 'button' : '') ) : av.string.trim(subtype);//input.text is the default subtype for 
			
			//push this element into our "form" object
			/**
			 * @name FormInput
			 * @class
			 */
			form.inputs[name.toLowerCase()] = {'name':name,'value':value,'type':type, 'disabled':disabled,'subtype':subtype, 'id':id, 'clicked':clicked}
			//attach options to this input if it is a select, even if just empty options
			if(type == 'select'){
				form.inputs[name].multiple = multiple;
				form.inputs[name].options = options;
			}
			
			//increase "numInputs" which is used to allow form.inputs.length to be known without a subsequent form loop, and allows us to name un-named inputs (rare)
			form.numInputs++;
			return form.inputs[name];
		};
		
		/**
		 * @todo - wrap up async and sync style posts using av.net.createRequest()
		 */
		form.submit = function(async){
			if(form.request == null){
				throw Error("av.net.form.submit() - please attach to a request via var request = form.toRequest() before submitting.");
			}
			var qs = form.serialize();
			self.log.debug("Would submit via method="+form.method+" to action url: " + form.action);
			
			self.log.debug("Query string: " + qs);
			
			form.request.sendForm(true);
		}
		
		form.clickButton = function(name){
			var foundInput = false;
			var nonClickedButtons = [];
			for(inputName in form.inputs){
				if (inputName == name && form.inputs[inputName].type == 'input' && form.inputs[inputName].subtype == 'submit') {
					form.inputs[inputName].clicked = true;
					foundInput = true;
				}else{
					nonClickedButtons.push(inputName);
				}
			}
			
			//unclick all of the other buttons
			if(foundInput){
				for(var i=0; i < nonClickedButtons.length; i++) form.inputs[nonClickedButtons[i]].clicked = false;
				return true;
			}else{
				return false;
			}
		}
		
		/**
		 * serialize the form inputs into a format suitable for use in a query string or as part of the body of a request via XMLHttp.send(query-string-here);
		 */
		form.serialize = function(){
			var inputs = form.getInputsAsObject();
			var qs = _av.string.arrayToQueryString(inputs);
			
			return qs;
		}
		
		form.getInputsAsObject = function(){
			var value;
			//gather the inputs
			var inputs = {};
			
			//loop over the inputs and extract the value that has been set
			for(n in form.inputs){
				var input = form.inputs[n];
				if(input.type != 'select'){
					if (input.type == 'input' && input.subtype == 'submit') {
						if(input.clicked) inputs[input.name] = input.value;
					}else{
						inputs[input.name] = input.value;
					}
				}else{
					var options = input.options, selectedValues = [];
					for(var i=0; i<options.length; i++){
						var option = options[i];
						if(option.selected){
							selectedValues.push(option.value);
							if(!input.multiple) i=options.length;//terminate gathering more values, none are needed past 1 selection
						}
					}
					value = selectedValues.join(",");
					if(value == '') value = options.length ? options[0].value : '';//act similar to a web page, if none are selected, the 0th one is chosen
					inputs[input.name] = value;
				}
			}
			
			form.inputValues = inputs;
			return inputs;
		}
		
		
		
		return form;
	}
	
	/**
	 * An instance of av.Log used and namespaced for av.net
	 * @name av.NetContainer.log
	 * @type {av.Log}
	 * @property
	 * @memberOf av.NetContainer#
	 */
	self.log = new av.Log(av.getEffectiveLogLevel('net'),'av.net');

	self.init();
	
	return self;
}

/**
 * @name av.net
 * @namespace <pre>Instance of new {@link av.NetContainer}()
 * 
 * Load using av.require('Net');
 * 
 * This can be used for 99% of all requests that need to be made for data, with the
 * default userAgent string/etc throughout.
 * 
 * If you find yourself needing to have multiple instances of NetContainer objects
 * outside of av.net, for example if you plan to scrape a page and want to override 
 * the userAgent and retryCount in a sandbox without affecting other requests in 
 * your application.
 * 
 * To see all methods callable from av.net, see @link av.NetContainer, which defined
 * a class which this av.net namespace is an instance of.
 * </pre>
 * @type av.NetContainer
 * @class
 * @example av.require('net');
 * av.net.makeRequest('http://www.yahoo.com',)
 */
av.net = new av.NetContainer();