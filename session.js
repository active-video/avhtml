/**
 * @fileoverview Provides session/client communication methods
 */
if(!av.exists('av.session')){
	av.require('net', 'EventInterface');
	
	/**
	 * @namespace av.session Methods to communicate with the client through the USM (Universal Session Manager) using
	 * this namespace; provides mechanisms to interface throughout the life of the applicaiton with the
	 * client
	 * 
	 * Emits the events "tune", "message", and "error" through the inheritted av.EventInterface event listeners.
	 * 
	 * @requires av.EventInterface ({@link av.EventInterface})
	 * @requires av.net ({@link av.net}) 
	 * @extends av.EventInterface
	 * @todo finish 
	 */
	av.session = new (function(){
		var self = this;
		new av.EventInterface(self, true);//extend "this" to support a generic EventInterface
		
		/**
		 * Contains the version of the av.session library that is being used; Released 06 / 21 / 2012 ; Supports USM for H5 1.0
		 * @name av.session.version
		 * @type String
		 * @default 1.2.0
		 */
		self.version = '1.2.0';
		
		/**
		 * Flag to indicate weather the given session is being run on an ActiveVideo client
		 * @name av.session.IS_AVN
		 * @type Boolean
		 */
		self.IS_AVN = navigator.userAgent.match(/cloud/i);
		self.bitrate = null;
		self.clientInfo = null;
        self.sessionInfo = null;

		/**
		 * NOT COMPLETE
		 */
		self.ratings = {
			ictvprot : {
				binary : {
					tv : {
						0x001 : "TVY",
						0x002 : "TVY7",
						0x400 : "TVG",
						0x800 : "TVPG",
						0x020 : "TV14",
						0x040 : "TVMA"
					},
					mpaa : 
					{
						0x000 : "NR", 
						0x004 : "G",
						0x008 : "PG",
						0x010 : "PG13",
						0x080 : "R",
						0x100 : "NC17",
						0x200 : "ADULT"
					},
				}, 
				decimal : {
					tv 	: 
					{
						0 : "TVNR", 
						1 : "TVY",
						2 : "TVY7",
						3 : "TVG",
						4 : "TVPG",
						5 : "TV14",
						6 : "TVMA"
					},
					mpaa : 
					{
						0 : "NR", 
						1 : "G",
						2 : "PG",
						3 : "PG13",
						4 : "R",
						5 : "NC17",
						6 : "ADULT"
				}
			}
		}
		}

		/**
		 * NOT COMPLETE
		 * @private
		 */
		self.updateClientInfo = function(){
			var c, ratings = {};
			if(typeof(self.clientInfo) == 'undefined'){
				c = self.clientInfo;
			}else{
				c = self.getClientInfo();
			}
			
			if(c && ratings[self.protocol]){
				var r = ratings[self.protocol];
			}
			return ratings;
		}
		
		/**
		 * Given an event, with evt.data being a message back from the client, try to extract ratings if their
		 * NOT COMPLETE
		 * @private
		 */
		self.updateRatings = function(evt){
			if(self.protocol == 'ictvprot' && evt.data && /(TV\=|MV\=)/.exec(evt.data)){
				av.require('string');
				var message = av.string.parseString(evt.data, ',');//split on ','
				
				
			}
		}
		
		/**
		 * A an av.Log object that can be used internally and from inner objects/functions to manage
		 * logging verbosity
		 * @private
		 */
		self.log = new av.Log(av.getEffectiveLogLevel('session'),'av.session');
		
		/**
		 * The client plugin reference in messages to the USM, one of ictvprot,
		 * avn_bcd, avn_bcp, avn_ebif, avn_fixedstream, avn_rfbtv
		 * @name av.session.protocol
		 * @fieldOf av.session#
		 * @type String
		 * @default ictvprot 
		 * @example //set via config
		 * window.config.client.protocol = 'avn_rfbtv';
		 * 
		 * //set at runtime
		 * av.require('client');
		 * av.session.protocol = 'avn_rfbtv';
		 */
		self.protocol = av.getConfigValue('session.protocol', 'ictvprot');//@TODO need a more sophisticated way to detect the client, maybe a user sniff on navigator.avClient.id but that will soon be obfuscated
		
		/**
		 * The deployment specific API key 
		 * @name av.session.apiKey
		 * @fieldOf av.session#
		 * @type String
		 * @default
		 * @example //set via config
		 * window.config.client.apiKey="111-bcaf-315"; 
		 */
		self.apiKey = av.getConfigValue('session.apiKey', '');
		
		/**
		 * The URLs to be used for client communication
		 * @name av.session.urls
		 * @type Object
		 * @example
		 * //Default Value
		 * {
		 * 		'pollForMessages' : 'http://session/client/poll?protocolid=' + self.protocol,
		 * 		'sendMessage': 'http://session/client/send?protocolid=' + self.protocol
		 * }
		 */
		self.urls = {
			'pollForMessages' 	: 'http://session/client/poll?protocolid=' + self.protocol,
			'sendMessage'		: 'http://session/client/send?protocolid=' + self.protocol,
			'clientInfo'		: 'http://session/client/properties.json?key=' + self.apiKey,
            'tune'		        : 'http://session/client/tuners/1?channel=',
            'setBitrate'		: 'http://session/setBitrateProfile?name=',
            'sessionInfo'		: 'http://session/properties.json?key=' + self.apiKey
		};
		
		var listener = null;
				
		var shouldListen = false;
		
		
		/**
		 * When a non-200 response (i.e. an error) is encountered, this is the timeout we will set to retry;
		 * this is very useful during browser development as without it you will see many many 404 error
		 * messages every second as the library re-opens connections; Will double with each failed attempt
		 * to avoid flooding.
		 * @name av.session.defaultTimeBetweenListens
		 * @fieldOf av.session#
		 * 
		 * @type Number
		 * @default 2000 (ms)
		 */
		self.defaultTimeBetweenListens = 2000;
		
		var timeBetweenListens = self.defaultTimeBetweenListens;
		
		var listen = function(){
			if(shouldListen){
				self.listen();
			}
		}
		
		var onSendMessage = function(request, callback){
			self.log.debug("client.onSendMessage response: (POSTED DATA: " + request.params + ") " + request.responseText);
			
			//if the client returned a message, we need to dispatch that event
			if(request.responseText){
				self.dispatchEvent('message', [request.responseText]);
			}
			
			if(typeof(callback) == 'function'){
				callback(request);
			}
		}
		
		/**
		 * Place holder for future setup requirements - begin listening, and setup any run level events
		 * @name av.session.defaultTimeBetweenListens
		 * @name av.session.init
    	 * @methodOf av.session#
    	 * 
    	 * @private
		 */
		self.init = function(){
			//we do not need to force listening. A developer may wish to use client.js to simply send messages.
			//self.listen();
			
			//@TODO need to perhaps create an interval to check on the health of this listener, since failures that
						  //come back are handled. But timeouts that remain open and never reach readyState 4 may end long-polling
		}
		
		/**
		 * Send a message to the client device, depending on self.protocol this message body will change (url encoded/binary/other)
		 * @name av.session.sendMessage
    	 * @methodOf av.session#
		 * 
		 * @param {String} message The message to send the client
		 * @param {Function} [callback=null] A callback function to send the response to, default is none.
		 * 
		 * @example av.session.sendMessage("this is a message");
		 * 
		 */
		self.sendMessage = function(message, callback){
			if(!self.IS_AVN){
				av.log.debug("av.session.sendMessage() is only available on the CloudTV Platform, ignoring.");
				return false;
			}
			
			var url = self.urls.sendMessage;
			var options = {
				headers : {
					'Content-Type' : 'text/plain',
				}
			}
			//self.log.debug(options);
			var cback = function(request){
				onSendMessage.apply(self, [request, callback]);
			};
			
			self.log.info("Sending message to client: " + message); 
			
			av.net.makeRequest(url, cback, 'POST', message, options);
			
			
			return true;
		}

        self.setBitrate = function(bitrate){
            console.info("Setting bitrate to " + bitrate);
            if(self.bitrate == bitrate){
                console.log("Bitrate already " + bitrate + " ignoring");
            }

            self.bitrate = bitrate;

            if(!self.IS_AVN){
                av.log.debug("av.session.setBitrate() is only available on the CloudTV Platform, ignoring.");
                return false;
            }else{
                var url = self.urls.setBitrate + bitrate;
                av.net.makeRequest(url);
            }
        },
		
		/**
		 * Get the session setup parameters that were used during the client session initiation/negotiation
		 * @name av.session.getClientInfo
         * @methodOf av.session#
         *  
		 * @param {Function} [callback=null] A callback function if you would like to execute asynchronously, 
		 * if omitted the function is executed <i>SYNCHRONOUSLY</i>
		 * @returns {Object,Request} The session setup object is returned when the callback parameter 
		 * is omitted, otherwise the Request object is returned.
		 * 
		 * @example console.log( JSON.stringify( av.session.getClientInfo() ) );//log response
		 * // {"avcdcConfigHD":"1", "keyMap":"StandardBCD", 
		 * //"abps":"128", "audioCodec":"mp2", 
		 * // "initialIFrames":"1", "bitrateMode":"vbr", 
		 * // "TSProgramPID":"64", "TSProgramID":"1",
		 * // "TSPcrPID":"67", "display":"720p29.97", "lang":"en", 
		 * // "sessionDebug":"", "TSVideoPID":"65", 
		 * // "transport":"http", "clientIDPattern":"^mpeg2avplay.*", 
		 * // "deviceClass":"MPEG2DevelopmentHTTPClient", 
		 * // "achannels":"2", "videoCodec":"mpeg2", "TSAudioPID":"66", 
		 * // "avcdcConfigSD":"0", "TSLogPID":"68"}
		 */
		self.getClientInfo = function(callback){
			var url = self.urls.clientInfo;
			var getData = function(req){ 
				var r = req && req.responseJSON ? req.responseJSON : false; 
				self.clientInfo = r;
				
				if(callback){
					callback(r);
				}else{
					return r;		
				}
			};
			
			if(!self.IS_AVN){
				av.log.error("av.session.getClientInfo() is only available on the CloudTV Platform, ignoring.");
				return false;
			}
			
			if(callback){
				try{
					av.net.makeRequest(url, getData, 'GET','',{evalJSON:true});
				}catch(e){
					callback(false);
				}
			}else{
				var x = {};
				try{
					x = av.net.makeRequest(url, null, 'GET','',{evalJSON:true});
				}catch(e){}
				return getData(x); 
			}
		}

        self.getSessionInfo = function(callback){
            var url = self.urls.sessionInfo;
            var getData = function(req){
                var r = req && req.responseJSON ? req.responseJSON : false;
                self.sessionInfo = r;

                if(callback){
                    callback(r);
                }else{
                    return r;
                }
            };

            if(!self.IS_AVN){
                av.log.debug("av.session.getSessionInfo() is only available on the CloudTV Platform, ignoring.");
                return false;
            }

            if(callback){
                try{
                    av.net.makeRequest(url, getData, 'GET','',{evalJSON:true});
                }catch(e){
                    callback(false);
                }
            }else{
                var x = {};
                try{
                    x = av.net.makeRequest(url, null, 'GET','',{evalJSON:true});
                }catch(e){}
                return getData(x);
            }
        };

        self.tuneTuner = function(channel){
            console.info("Tuning to channel " + channel);
            if (window.__openUrl__){
                self.log.info("Using Tuner API");
                var url = self.urls.tune + channel;

                av.net.makeRequest(url);
            }else{
                self.log.info("In browser, not tuning to " + channel);
            }
        },
		
		/**
		 * Tune to a given string, channel, source id, vod asset, etc
		 * @name av.session.tune
    	 * @methodOf av.session#
    	 *  
		 * @param {String} tuneString A string to send to the client with a termination message, in the format expected by the client (varies by client/protocol)
		 */
		self.tune = function(tuneString){
			self.log.debug("Tuning client with string: " + tuneString);
			
			//a11, h5, and chrome support
			 //H5 beta
			 if (window.__openUrl__){
			 	self.log.info("Using window.__openUrl__(" + tuneString +")");
			 	window.__openUrl__(tuneString);
			 //A11
			 }else if (window.openApplication){
			 	self.log.info("Using window.openApplication(" + tuneString +")");
			 	window.openApplication(tuneString);
			 //Future gen
			 }else{
			     self.log.info("In browser, not tuning to " + tuneString);
			 	//self.log.info("Using window.location = " + tuneString);
			 	//window.location = tuneString;
			 }
			
			/*try{}catch(e){
				self.log.warn("The current user agent may not support window.openApplication. Error message: " + e.message);
				return false;
			}*/
			self.dispatchEvent('tune',true);

			
			return true;
		}
		
		
		// METHODS TO LISTEN/LONG POLL THE SESSION FOR CLIENT MESSAGES
		
		/**
		 * Determine if a listener is out right now for messages, will be false if we are in between polling.
		 * @name av.session.isListening
    	 * @methodOf av.session#
    	 * @returns {Boolean} true if we are already listening for client messages, false otherwise
    	 * 
    	 * @example if(!av.session.isListening()){
    	 * 		av.session.listen();
    	 * 		av.log.debug("Ok, we are listening now.")
    	 * }
		 */
		self.isListening = function(){
			if(listener !== null && !listener.error){
				return true;
			}
			return false;
		}
		
		/**
		 * Begin listening for messages from client, can be stopped later by calling av.session.stopListening();
		 * @name av.session.listen
    	 * @methodOf av.session#
    	 * 
    	 * @param {Function} [callback=null] Optional shorthand to add an event listener
    	 * 
    	 * @example av.require('session');
    	 * 
    	 * var callback = function(evt){
    	 * 		//on receiving a message from the client
    	 * 		av.log.debug("We got this message: ", evt.data)
    	 * }
    	 * 
    	 * //add add an event listener and then listen
    	 * av.session.addEventListener('message', callback);
    	 * av.session.listen();
    	 * 
    	 * //call it and add an event listener using the 1st argument
    	 * av.session.listen(callback);
		 */
		self.listen = function(callback){	
			if(!self.IS_AVN){
				av.log.error("av.session.listen() is only available on the CloudTV Platform, ignoring.");
				return false;
			}
					
			//Setup listener
			shouldListen = true;
			if(self.isListening()){
				self.log.debug("Already listening.")
			}else{
				//http://chad.inthecloud.tv/AVApplications/AMG/web_services/tests/headerError.php?
				var url = self.urls.pollForMessages;
				var options = {
					headers : {
						'Content-Type' : 'text/plain',
					}
				}
				
				av.net.makeRequest(url, self.onListenResponse, 'POST', '', options);
				if(typeof(callback) == 'function'){
					self.addEventListener('message', callback)
				}
			}
		}
		
		/**
		 * Stop listening for messages from the client, and ignore any requests for messages still out.
		 * @name av.session.stopListening
    	 * @methodOf av.session#
		 */
		self.stopListening = function(){
			shouldListen = false;
			delete listener;
			listener = null;
			
			return true;
		}
		
		/**
		 * Event handler when a polling message gets a response
		 * @name av.session.onListenResponse
    	 * @methodOf av.session#
    	 * @private
		 */
		self.onListenResponse = function(request){
			delete listener;
			listener = null;
			
			/*Note: "shouldListen == false" means we are no longer interested in responses*/
			self.log.debug("Should listen? " + shouldListen);
			//IF COULD NOT REACH SESSION MANAGER
			if(shouldListen && (!request.status || request.status != 200 )){
				setTimeout(listen, timeBetweenListens);
				
				timeBetweenListens = Math.min(20000, timeBetweenListens + 1000);//extend to
				self.log.warn("Client event listener in av.session.listen() cannot reach " + request.url +", status was " + request.status + " (if in browser, ignore) - responseText: " + request.responseText);
			//NO PROB, LONG POLLING DONE, RE-OPEN CONNECTION
			}else if(shouldListen){
				timeBetweenListens = self.defaultTimeBetweenListens;//reset to normal
				listen();//restart listener
			}
			
			if(shouldListen && request.responseText){//shouldListen can be set to false mid request, which means we ignore the response
				self.dispatchEvent('message', [request.responseText]);
			}
			
			if(shouldListen && request.status != 200){
				self.dispatchEvent('error',[request]);
			}
		}
		
		
		
		self.init();
		return self;
		
	})();
}
