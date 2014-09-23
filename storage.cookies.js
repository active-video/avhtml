

av.nameSpace('av.storage.cookies');
/**
 * av.storage.cookies
 * @namespace 
 */
av.storage.cookies = new (function() {
	av.require('string');
	var self = this;
	self.log = new av.Log(av.getEffectiveLogLevel('storage.cookies'),'av.cookies');
	self.config = av.getConfig('storage.cookies');

	if(typeof(uneval) != 'function'){av.require('data.json'); var uneval = function(v){return av.data.json.stringify(v);}}
		
	self.version      = '1.3.2';//released 05.11.2011

	/**
	 * Caching of cookies, this works because there is never more than 1 application running at a given time sharing cookies
	 */
	self.cookies = {};
	self.numCookies = 0;
	self.loadedCookies = false;
	self.cookieServer = false;
	
	/**
	 * @param {String} cookieName a valid string name for the cookie
	 * @param {Mixed} a native javascript object or other serializable object, or a string to be saved to cookies
	 * @param {Number,Date} expiresDateObject a date object, or for convenience an epoch time (in milliseconds) representing when the cookie should expire
	 * @example var success = av.storage.cookies.set('testCookie',{a:123}, Date.now()+5000);
	 * //set a cookie with value {a:123} expiring in 5 seconds (5000 milliseconds) 
	 */
	self.set = function(cookieName, cookieValue, expiresDateObject) {
		
		if (( cookieName=="" )) {//cookieValue == "" is synonymous with self.remove
			self.log.error("ERROR: set() - Error with setting cookie - no cookieName passed to function");
			return false;
		}
		var ret = false;
		try {
			self.log.debug("set() - Cookie value before uneval/encodeURIComponent = " + cookieValue);
			
			try{
				var cookieValueEncoded = encodeURIComponent(uneval(cookieValue));//added uneval to allow for serialized variables of ALL types, not just the .toString() version of a complex data type.. Chad, 20100409
			}catch(eNoUnevel){
				var cookieValueEncoded = encodeURIComponent(av.data.json.stringify(cookieValue));
			}	
			
			self.log.debug("set() - Cookie value after uneval/encodeURIComponent = " + cookieValueEncoded);
			var hasExpDate = (typeof(expiresDateObject) == 'object' && expiresDateObject.toUTCString != null && typeof(expiresDateObject.toUTCString) == 'function');
			if(!hasExpDate && typeof(expiresDateObject) == 'number' && expiresDateObject > 0){
				expiresDateObject = new Date(expiresDateObject);
				hasExpDate = true;
			}
			
			var expDate = hasExpDate ? expiresDateObject : new Date(2029, 00, 01, 00, 00, 00);
			
			//External cookie server?
			if(cookieServer){
				return cookieServer.set(cookieName, cookieValue, expDate.getTime());//@TODO implement expirations in cookie server
			}
			
			var cookie = cookieName + "=" + cookieValueEncoded + "; expires=" + expDate.toUTCString();
			av.doc.cookie = cookie;
			
			//if cookie doesn't yet exist, we have just added a cookie increment our cookie count of cached cookies by 1
			if(typeof(self.cookies[cookieName]) != 'undefined'){
				self.numCookies++;
			}
			self.cookies[cookieName] = cookieValue;
			
			ret = true; 
		} catch(err) {
			self.log.error("set() - Error with setting cookie - " + err);
		}
		return ret;

	};
	/**
	 * 
	 */
	self.loadCookies = function(forceReload){
		forceReload = typeof(forceReload) == 'boolean' ? forceReload : false;
		if((!forceReload && self.numCookies > 0) && !self.loadedCookies) return;
		
		self.numCookies = 0;
		self.cookies = {};
		
		//read-sync document cookies with external cookie server
		if(cookieServer){
			return cookieServer.load();
		}
		
		var cookieString = av.doc.cookie.toString();
		if(typeof(cookieString) != 'string' || cookieString == ''){
			return;
		}
		//self.log.debug("Raw cookie string: " + cookieString);
		var cookies = av.string.parseString(cookieString || '', ';');//pass by value, not reference
		for(var c in cookies){
			var value = decodeURIComponent(cookies[c]);
			//self.log.debug("cookies["+c+"] = '" + value + "'");
			try{value = eval('('+value+')');}
			catch(eNotEvalable){
				av.require('data.json');
				try{
					value = av.data.json.parse(value);
				}catch(eNotParseable){
					/*only legacy cookies are not JSON, use string as-is*/
				}
			}
			//self.log.debug("cookies["+c+"] = " + value);
			self.cookies[av.string.trim(c)] = value;
			self.numCookies++;
		}
		self.log.debug("Loaded cookies, they are (from string: " + cookieString + "):");
		self.log.debug(self.cookies);
	}

	self.get = function(cookieName, forceReload) {
		forceReload = typeof(forceReload) == 'boolean' ? forceReload : false;
		self.loadCookies(forceReload);//load cookies at first use
		
		if(cookieServer){return cookieServer.get(cookieName);}
		
		return self.cookies[cookieName] || '';
	};
	/**
	 * Replaces the cookie.del method
	 */
	self.remove = function(cookieName) {
		if ( cookieName=="" ) {
			self.log.warn("del() - Error with deleting cookie - no cookieName passed to function");
			return ret;
		}
		
		if(cookieServer){
			return cookieServer.remove(cookieName);
		}

		var ret = false;
		try {
		
			av.doc.cookie = cookieName + "=; expires=Fri, 31 Dec 1970 00:00:01 GMT;";
			if(typeof(self.cookies[cookieName]) != 'undefined'){
				delete self.cookies[cookieName];
				self.numCookies--;
			}
			
			self.log.debug("remove() - cookie '" + cookieName + "' has been deleted");
			ret = true;
		} catch( err ) {
			self.log.error("del() - Error with deleting cookie - " + err.message);
		}
		return ret;
	};
	
	self.init = function() {
		return self;
	};	
	
	/**
	 * Keeps document.cookie in sync with the cookie server when no native cookies are available
	 */
	//console.log("readCookie: " + JSON.stringify(self.config) + " and userAgent = " + av.userAgent)
	if(av.userAgent.indexOf('cloud') != -1 && av.getProperty(self.config, 'server')){
		av.require('data.json');
		
		var serverURL = av.getProperty(self.config, 'server');
		var cookieServer = {
			init : function(){
				this.scope 	= encodeURIComponent(av.clientid);
				//file/path will be the server URI to the current document when av.js was loaded
				this.file		= av.string.sanitize(location.href.substr(0, location.href.lastIndexOf('/')));
				this.writeURL 	= self.config.server + "writeCookie.php?dir="+ this.scope +"&file="+this.file;
				this.readURL 	= self.config.server + "readCookie.php?dir="+ this.scope +"&file=" + this.file;
				return this;
			},
			
			remove : function(cookieName){
				if(typeof(self.cookies[cookieName]) != 'undefined'){
					delete self.cookies[cookieName];
					return this.writeSync();
				}else{
					return true;//no sync needed, as cookie didn't exist
				}
			},
			writeSync : function(){
				//prune any expired cookies
				this.prune();
				self.log.debug(this.writeURL);
				
				//now send to cookie server
				var cookies = av.data.json.stringify(self.cookies);
				//send cookies
				var x = new XMLHttpRequest();
				x.open("POST",this.writeURL,false);
				x.send(cookies);
				
				return x.status && x.status == 200;
			},
			
			prune : function(){
				var curTime = Date.now();
				var deletedAny = false;
				for(var cookieName in self.cookies){
					if(!self.cookies[cookieName] || !self.cookies[cookieName].expDate || self.cookies[cookieName].expDate < curTime){
						delete self.cookies[cookieName];
						deletedAny = true;
					}
				}
				return deletedAny;
			},
			
			readSync : function(){
				return this.load();
			},
			
			set : function(key, value, expDate){
				self.cookies[key] = {value : value, expDate : expDate};
				return this.writeSync();
			},
			
			get : function(cookieName){
				return self.cookies[cookieName] && 
					   typeof(self.cookies[cookieName].value) != 'undefined' && 
					   self.cookies[cookieName].expDate >= Date.now() ?  
					   		self.cookies[cookieName].value : 
					   		null;
			},
			
			load : function(){
				self.log.debug(this.readURL);
				var x = new XMLHttpRequest();
				x.open("GET",this.readURL,false);
				x.send("");
				if(x && x.status == 200){//could read cookies
					try{
						self.cookies = av.data.json.parse(x.responseText);
						//if we prune any that are expired, writeSync to the cookie server WITHOUT those pruned
						if(this.prune()){
							self.log.debug("Removed 1 or more old cookies on load. Performing a writeSync() with the cookie server.");
							this.writeSync()
						};
						self.loadedCookies = true;
						return true;
					}catch(eBadCookies){
						self.cookies = {};
						return false;
					}
				}else if(x && x.status == 400){//no cookies exist, that's ok, none written ==> 400 status
					self.cookies = {};
					return true;
				}else{//cookie server was unreachable, as we expect only statuses of 200 or 400
					self.cookies = {};
					return true;
				}
			}
		}.init();
	}
	
	self.init();
	return self;
	
})();
