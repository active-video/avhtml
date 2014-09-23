/**
 * @fileoverview Advertising wrappers and utility methods
 */
if(!av.exists('av.ads')){
	av.require('dom','data.xml','data.json','net', 'EventInterface', 'string');
	/**
	 * @namespace Manages ads and ad events
	 * NOTE: av.ads is part of the premium developer library package and is only available
	 * upon request.
	 */
	av.ads = new (function(){
		var self = this;
		
		
		/**
		 * Whether or not proxying of ad requests and trackers should be enabled
		 * @name av.ads.proxy
		 * @type Boolean
		 * @default false
		 * @fieldOf av.ads# 
		 */
		self.proxy = av.getConfigValue('ads.proxy', false);
		
		/**
		 * The URL of a proxy script to use, the ad requests and trackers
		 *  will all use (if defined) this ad proxy script and append the URL to the proxy string
		 *  to form each request URL; useful for running in a browser without web security disabled
		 * @name av.ads.proxyURL
		 * @type String
		 * @default av.path + 'proxy.php?url='
		 * @fieldOf av.ads# 
		 */
		self.proxyURL = av.getConfigValue('ads.proxyURL', av.path + 'proxy.php?url=');
		
		/**
		 * A fallback URL to be used
		 * if the video player cannot play the video requested, this will only be used
		 * if the configuration mode is USE_FALLBACK_VIDEO, the default of PRODUCTION
		 * mode will not show a video if non is returned as compatible.
		 * @name av.ads.fallbackAd
		 * @type String
		 * @default ../videos/ad.mp4
		 * @fieldOf av.ads# 
		 */
		self.fallbackAd = av.getConfigValue('ads.fallback', '../videos/ad.mp4');
		
		
		/**
		 * If set to true, once an ad is loaded
		 * will automatically be inserted into the DOM and shown to the user, this is
		 * by default false to allow for pre-loading of the ad and use in mid-roll/post-roll
		 * applications.
		 * @name av.ads.autoplay
		 * @type Boolean
		 * @default false
		 * @fieldOf av.ads# 
		 */
		self.autoplay = av.getConfigValue('ads.autoplay', false);
		
		/**
		 * Should click URLs in ad packages
		 * be followed or ignored; in some applicaitons this may be set to false
		 * if the inventory is using WEB ads which we display only (CPM without
		 * 	click through)
		 * @name av.ads.enableLinks
		 * @type Boolean
		 * @default true
		 * @fieldOf av.ads# 
		 */
		self.enableLinks = av.getConfigValue('ads.enableLinks', true);
		
		/**
		 * Once an ad impression
		 * is completed and the video is removed from the DOM, should we 
		 * persist any companion banners that were displayed or remove them
		 * from the DOM as well; many advertisers require companion banners
		 * to remain visible beyond the video impression, for example during
		 * the play-back of the long-form content that supersedes the pre-roll.
		 * @name av.ads.persistCompanions
		 * @type Boolean
		 * @default true
		 * @fieldOf av.ads# 
		 */
		self.persistCompanions = av.getConfigValue('ads.persistCompanions', true);
		
		
		/**
		 * Have we followed a link? 
		 * (if so, ignore events that fire on page unload) this is used
		 * internally but can be introspected upon; read-only 
		 * @name av.ads.followed
		 * @type Boolean
		 * @default false
		 * @fieldOf av.ads# 
		 */
		self.followed = false;
		
		
		/**
		 * The modes that the av.ads service can run in;
		 * read-only and current options are USE_FALLBACK_VIDEO or PRODUCTION
		 * @name av.ads.modes
		 * @type Object
		 * @default {...}
		 * @fieldOf av.ads# 
		 */
		self.modes = {
			USE_FALLBACK_VIDEO : 'fallback',
			PRODUCTION		   : 'production',
			PRODUCTION_PLUS_STREAMING : 'productionstreaming'
		}
		
		/**
		 * 0 = not allowed, -1 = allowed but use a static resource if it exists at the 
		 * desired size before using an iFrame, 1 = allowed and preferred over static
		 * resources.
		 * @name av.ads.iframeModes
		 * @type Object
		 * @default NOT_ALLOWED
		 * @fieldOf av.ads# 
		 */
		self.iframeModes = {
			NOT_PREFERRED : -1,
			NOT_ALLOWED : 0,
			PREFERRED : 1
		}
		
		/**
		 * Some events are open to interpretation, such as a change in the 
		 * currentTime of a video more than deltas.FAST_FORWARD seconds will be considered
		 * a fast forward and not just a normal time update.
		 * @name av.ads.deltas
		 * @type Object
		 * @default {REWIND:0.5,FAST_FORWARD:0.5,LINK:100}
		 * @fieldOf av.ads# 
		 */
		self.deltas = {
			REWIND : 0.5, //1/2 second is considered a rewind
			FAST_FORWARED : 0.5, //1/2 second is considered a fast-forward
			LINK	: 100, //100ms allowed to link out
		}
		
		/**
		 * The various ways we can follow a link, the simplest being to follow, but also need
		 * support in the future for generating a QR code and/or sending to mobile device
		 * or email
		 * @name av.ads.linkModes
		 * @type Object
		 * @default {FOLLOW:function(){...}}
		 * @fieldOf av.ads# 
		 */
		self.linkModes = {
			'FOLLOW' : function(url){
				var go = function(){
					self.followed = true;
					av.doc.defaultView.location.href = url;
				}
				//for debugging purposes, since most redirect, we need to see the URL before following it
				//(otherwise we'll likely end up at a top level domain with no notion of the parameters
				//sent in the initial click URL). Will be ignored by CloudTV
				try{av.doc.defaultView.alert("Loading: " + url + "(Note: this popup message only appears when testing in browsers.)");}catch(eNotBrowser){}
				//allow any trackers to be fired
				setTimeout(go, self.deltas.LINK);
			}
		}
		
		/**
		 * One of av.ads.iframeModes, the current mode dictating how we deal with iframe ad units
		 * @name av.ads.iframeMode
		 * @type String
		 * @default NOT_ALLOWED
		 * @fieldOf av.ads# 
		 */
		self.iframeMode = self.iframeModes[av.getConfigValue('ads.iframeMode', 'NOT_PREFERRED')];
		
		/**
		 * One of av.ads.modes, the current mode that determines how we are running; currently
		 * only affects how we deal with FLV/WMF/Non-supported browser videos during development
		 * @name av.ads.mode
		 * @type String
		 * @default PRODUCTION
		 * @fieldOf av.ads# 
		 */		
		self.mode = self.modes[av.getConfigValue('ads.mode', 'PRODUCTION')];
		
		/**
		 * A countdown message string template, with [[seconds]] present in the string;
		 * (we'll replace that with the actual remaining time in an ad as it plays); Set 
		 * to false explicitly to not use countdown timer
		 * @name av.ads.countDown
		 * @type String
		 * @default Your contentwill begin in [[seconds]].
		 * @fieldOf av.ads# 
		 */
		self.countDown = av.getConfigValue('ads.countDown', 'Your content will begin in [[seconds]].');
		
		/**
		 * @private
		 */
		self.types = {};
		
		/**
		 * A set of functions that handle common tasks across 
		 * ads/events/creatives; currently "link" and "canPlay"
		 * @name av.ads.helpers
		 * @type Object
		 * @default {link:function(url){}, canPlay:function(mimeType){}}
		 * @fieldOf av.ads# 
 		 */
		self.helpers = {
			/**
			 * Follow a url link
			 */
			link : function(url){
				self.linkModes.FOLLOW(url);
			},
			
			/**
			 * Given a mimeType, determine if it can be played by a video object in current
			 * User-Agent
			 */
			canPlay : function(mimeType){
				var v = av.doc.createElement('video');
				return v.canPlay(mimeType);
			}
		}
		/**
		 * Set the count-down timer DOM text to the text provided
		 * @name av.ads.setCountDownText
		 * @methodOf av.ads#
		 * @param {String} text The text to set the count-down timer to.
		 */
		self.setCountDownText = function(text){
			self.countDown = text;
		}
		
		/**
		 * Enable ads to use proxying
		 * @name av.ads.enableProxy
		 * @methodOf av.ads#
		 */
		self.enableProxy = function(){
			self.proxy = true;
		}
		
		/**
		 * Disable proxying within ads
		 * @name av.ads.disableProxy
		 * @methodOf av.ads#
		 */
		self.disableProxy  = function(){
			self.proxy = false;
		}
		
		/**
		 * Create and return a new instance of an av.Ad, extended by the "type" provided,
		 * should be referencing any type available in the ads namespace, av.ads.[[type]].js
		 * must be provided
		 * @name av.ads.create
		 * @methodOf av.ads#
		 * @param {String} type The type of ad to create, currently only "vast" is available
		 * @return {av.Ad}
		 */
		self.create = function(type){
			if(typeof(self.types[type]) != 'function'){
				av.require('ads.' + type);
			}
			var ad = new self.types[type]();
			
			return ad;
		}
		
	})();
	
	
	if(!av.exists('av.Ad')){
		
		/**
		 * @class <p>An advertising object, which can be extended by each of the 
		 * ad "types" defined in ads.[[type]].js; provides a standard
		 * ad object has known methods that all ad integrations
		 * will likely need; currently supports things shared between
		 * VAST and potential other formats</p>
		 * 
		 * <p><strong>NOTE: av.Ad is part of the premium developer library package and is only available
		 * upon request.</strong></p>
		 * @extends av.EventInterface
		 */
		av.Ad = function(adType){
			//extend self to be an EventInterface
			var self = this;
			self.log = new av.Log(av.getEffectiveLogLevel('ads.' + adType),'av.ads.' + adType);
			
			new av.EventInterface(self, true);
			
			/**
			 * 
			 * The type of ad this is, as provided in the constructor
			 * @name av.Ad.type
			 * @type String
			 * @property 
			 */
			self.type = adType;
			
			/**
			 * 
			 * A DOM reference to the player/div that will be the container for the ad player.
			 * @name av.Ad.name
			 * @type String
			 * @property 
			 */
			self.sourcePlayer = null;
			
			/**
			 * 
			 * Desc
			 * @name av.Ad.name
			 * @type String
			 * @property 
			 */
			self.parser = null;
			self.companions = [];
			self.creatives = {};
			
			self.autoplay = av.ads.autoplay;
			self.enableLinks = av.ads.enableLinks;
			self.persistCompanions = av.ads.persistCompanions;
			
			self.responses = [];
			
			self.toSeconds = function(str){
				if(!str){return 0;}
				else if(typeof(str) == 'number'){return str;}
				
				var ts = str.toString();
				if(ts.indexOf(':') != -1){
					return 60*60*parseInt(ts.substr(0,2), 10) + 60*parseInt(ts.substr(3,2), 10) + parseInt(ts.substr(6,2), 10);
				}else{
					return parseInt(ts, 10);
				}
			}
			
			self.show = function(){
				
				
			}
			
			//what else does an ad do?
			self.setPlayer = function(elemOrId){
				self.sourcePlayer = av.dom.get(elemOrId);
			}
			
			/**
			 * Set a companion holder in the page, width/height are optional and will be calculated if not provided.
			 */
			self.setCompanion = function(elemOrId, width, height){
				var size = width + 'x' + height;
				var comp = {
					elem : av.dom.get(elemOrId),
					width : width == undefined ? 0 : parseFloat(width),
					height : height == undefined ? 0 : parseFloat(height)
				}
				if(!comp.elem){
					throw new TypeError("The element " + elemOrId + " provided to av.Ad.setCompanion(elemOrId[, width, height]) is not a valid element in the DOM of the current HTMLDocument.");
				}
				
				comp.id = comp.elem.id;
				if(!comp.width){comp.width = comp.elem.offsetWidth;}
				if(!comp.height){comp.height = comp.elem.offsetHeight;}
				
				self.companions.push(comp);
			}
			
			/**
			 * Return the companion closest to the size requested, false if no companion slot within the permissible tolerance is found
			 */
			self.getCompanion = function(width, height, tolerance, skipThese){
				var tolerance = typeof(tolerance) == 'number' ? tolerance : 0.1;//no more than 10% variance in either the width or height.
				var toReturn = false;
				
				compLoop:
				for(var i=0; i< self.companions.length; i++){
					var c = self.companions[i];
					var w = c.width && !isNaN(c.width) ? c.width : c.offsetWidth;
					var h = c.height && !isNaN(c.height) ? c.height : c.offsetHeight;
					var dX = Math.abs((width-w)/width);
					var dY = Math.abs((height-h)/height);
					
					
					if((w == width || dX <= tolerance) && (h == height || dY <= tolerance)){
						if(skipThese){
							for(var s=0; s<skipThese.length; s++){
								if(c.elem == skipThese[s]){
									continue compLoop;//continue in the outer loop
								}
							}
						}
						
						toReturn = av.mergeObjects(c, {
							scale : 1 - Math.max(dX, dY)//add a scale property to the result to return, but not the original object "c"
						});	
					}
				}
				
				return toReturn
			}
			
			/**
			 * Set the parser, for example Ad.setParser(av.dom.xml2json)
			 */
			self.setParser = function(p){
				self.parser = p;
			}
			
			self.load = function(url, params, post){
				var params = params ? params : {};
				params.timestamp = (new Date()).getTime(); 
				var fullUrl = av.string.populateTemplate(url, params);
				
				if(av.ads.proxy){
					fullUrl = av.ads.proxyURL + encodeURIComponent(fullUrl)
				}
				
				if(self.autoplay){
					self.addEventListener('ready', self.show)
				}
				
				var method = post ? 'post' : 'get';
				av.net.makeRequest(fullUrl, self.parse, method, post, {
					evalJSON : false,
					evalXML  : false,
					convertXML : false,
					extractForms : false
				});
			}
			
			self.parse = function(request){
				self.log.debug("Got response: for " + self.type + ", using parser " + typeof(self.parser));
				var resp = request.responseText; 
				if(self.parser !== null){
					resp = self.parser(resp);
				}
				
				//notify any subscribers that we have loaded an ad, even if intermediary ad
				self.dispatchEvent('parsed', resp);
			}
			
			self.getAsString = function(jsonNodeOrString){
				if(typeof(jsonNodeOrString) == 'string'){
					return jsonNodeOrString;
				}else if(jsonNodeOrString && jsonNodeOrString._text){
					return jsonNodeOrString._text;
				}else{
					return "";
				}
			}
			
			self.track = function(trackerType, url, params){
				var params = params || {};
					params.timestamp = (new Date()).getTime(); 
				var fullUrl = av.string.populateTemplate(url, params);
				
				self.log.debug("Tracking (" + trackerType +") - " + fullUrl);
				
				if(av.ads.proxy){
					fullUrl = av.ads.proxyURL + encodeURIComponent(fullUrl)
				}
				
				var req = av.net.createRequest();
				req.open("get", av.string.populateTemplate(fullUrl, params), true);
				req.send(''); 
			}
			
			self.createTracker = function(trackerType, url){
				return function(params){
					var params = params || {};
					self.track(trackerType, url, params);
				}	
			}
			
			
			self.addEventListener('response', self.parse);
			
		}
	}
	
	if(!av.exists('av.AdCreative')){
		/**
		 * @class An advertising creative object
		 * NOTE: av.AdCreative is part of the premium developer library package and is only available
		 * upon request.
		 * @param {String} creativeType Used in logging and debug, such as "Linear", "Companion", "etc"
		 */
		av.AdCreative = function(creativeType){
			//extend self to be an EventInterface
			var creativeType = creativeType || 'Generic';
			var self = this;
			
			//events include the playback events, as well as the click event
			self.log = new av.Log(av.getEffectiveLogLevel('ads.AdCreative'),'av.ads.AdCreative' + creativeType);
			
			self.duration = 0;
			self.click = '';
			self.link = '';
			
			self.media = {
				images 	: [],
				videos 	: [],
				urls 	: [],
				htmls	: []
			};
			
			new av.EventInterface(self, true);
			
			self.track = function(trackerType, url, params){
				var params = params || {};
					params.timestamp = (new Date()).getTime(); 
				var fullUrl = av.string.populateTemplate(url, params);
				
				self.log.debug("Tracking (" + trackerType +") - " + fullUrl);
				
				if(av.ads.proxy){
					fullUrl = av.ads.proxyURL + encodeURIComponent(fullUrl)
				}
				
				var req = av.net.createRequest();
				req.open("get", av.string.populateTemplate(fullUrl, params), true);
				req.send(''); 
			}
			
			self.has = function(mediaType){
				var mediaType = mediaType + 's';
				return self.media[mediaType] && self.media[mediaType].length;
			}
			
			self.get = function(mediaType, start, count){
				var mediaType = mediaType + 's';
				var ms = self.media[mediaType] && self.media[mediaType].length ? self.media[mediaType] : false;
				if(ms && typeof(start) == 'number'){
					var count = typeof(count) == 'number' ? count : 1;
					return count <= 1 ? ms[start] : ms.slice(start, count);
				}
				return ms;
			}
			
			self.createTracker = function(trackerType, url){
				return function(params){
					var params = params || {};
					self.track(trackerType, url, params);
				}	
			}
			
			self.addMedia = function(mediaType, media){
				self.media[mediaType+'s'].push(media);
			}
			
			self.createClickThrough = function(url){
				self.link = url;
				return function(){
					av.ads.helpers.link(url);
				}
			}
			
			self.linkElement = function(elem){
				elem.addEventListener('keydown', self.onKeyDown, false);
			}
			
			self.onKeyDown = function(evt){
				var key = av.getKeyIdentifier(evt);
				switch(key){
					case 'Enter':
						self.dispatchEvent('click', {});
						break;
				}
			}
			
			
			return self;
		}
		
	}
	
	if(!av.exists('av.AdPlayer')){
		/**
		 * @class An advertising video player object
		 * NOTE: av.AdPlayer is part of the premium developer library package and is only available
		 * upon request.
		 */
		av.AdPlayer = function(creative){
			var self = this;
			self.log = new av.Log(av.getEffectiveLogLevel('ads.AdPlayer'),'av.ads.AdPlayer');
			//new av.EventInterface(self, true);
			
			//self.nativeDispatchEvent = self.dispatchEvent;
			
			var creative = creative;
				creative.player = self;//circular back-reference
			
			self.player = null;
			self.container = null;
			
			self.duration = NaN;
			self.durationCheckId = 0;
			self.declaredDuration = NaN;//what did the ad unit say it's length was in seconds?
			self.stopped = true;
			
			self.countDown = false;
			self.countDownHolder = false;
			self.currentCountDown = '';
			
			self.currentPosition = 0;
			self.doc = null;
			
			//Dimensions
			self.width = 0;
			self.height = 0;
			
			self.state = 'unititialized';
			self.muted = false;

			//Native Events
			self.events = {
				"loadstart" : 0,
				"progress" : 0,
				"suspend" : 0,
				"abort" : 0,
				"error" : 0,
				"emptied" : 0,
				"stalled" : 0,
				"loadedmetadata" : 0,
				"loadeddata" : 0,
				"canplay" : 0,
				"canplaythrough" : 0,
				"playing" : 0,
				"waiting" : 0,
				"seeking" : 0,
				"seeked" : 0,
				"ended" : 0,
				"durationchange" : 0,
				"timeupdate" : 0,
				"play" : 0,
				"pause" : 0,
				"ratechange" : 0,
				"volumechange" : 0,
				
				//ad specific events
				"start"	: 0,
				"firstQuartile" : 0,
				"midpoint" : 0,
				"thirdQuartile" : 0,
				"complete"	: 0,
				"mute" : 0,
				"unmute" : 0,
				"pause" : 0,
				"rewind" : 0,
				"resume" : 0,
				"fullscreen" : 0,
				"expand" : 0,
				"collapse" : 0,
				"acceptInvitation" : 0,
				"close" : 0,
				"creativeView" : 0,
			}
			
			self.setContainer = function(elemOrId){
				self.container = av.dom.get(elemOrId);
			}
			
			self.setupContainer = function(){
				if(self.container && self.container.tagName == 'VIDEO'){
					//@TODO wrap in try/catch
					self.container.pause();
				}
				
				 
				
				self.width = (self.container.offsetWidth);
				self.height = (self.container.offsetHeight);
				self.top = (av.dom.getCoordinates(self.container,'top').y);
				self.left = (av.dom.getCoordinates(self.container,'left').x);
				
				/**
				 * Look into the main ads package for countdown text
				 */
				if(av.ads.countDown){
					self.setupCountDown(av.ads.countDown);
				}
			}
			
			self.setupCountDown = function(txt){
				self.countDown = txt;
				var h = av.doc.createElement('p');
				h.setAttribute('class','adCountDownTimer');
				
				var top = self.top + self.height;
				var right = av.doc.defaultView.innerWidth - (self.left + self.width);
				
				
				self.countDownHolder = h;
				av.html.loadGlobalCss('.adCountDownTimer{background-color:black; padding:5px; color:white; position:absolute; top:' + top + 'px; right:' + right + 'px; z-index:10000;')
				
				creative.addEventListener('complete', self.removeCountDownTimer);
				creative.addEventListener('start', self.updateCountDown);
			}
			
			self.removeCountDownTimer = function(){
				self.countDownHolder.parentElement.removeChild(self.countDownHolder);
				//self.log.debug('events', self.events)
			}
			
			self.updateCountDown = function(){
				if(!self.countDown){return;}
				
				var s = self.duration-self.player.currentTime;
				if(isNaN(s)){return;}
				var txt = self.countDown.replace("[[seconds]]", Math.max(0,Math.round(s)) + (s == 1 ? ' second' : ' seconds'));
				if(txt != self.currentCountDown){
					//self.log.debug("countdown text: " + txt);
					self.currentCountDown = txt;
					
					self.countDownHolder.innerHTML = txt;
				}
			}
			
			self.canPlay = function(){
				var vid = av.doc.createElement('video'), backup = false;
				for(var i=0; i<creative.media.videos.length; i++){
					var v = creative.media.videos[i];
					
					//can we play it?
					var cplay = vid.canPlayType(v.type)
						,isHttp = v.src.indexOf('http') === 0;
						
					if(v.delivery == 'streaming' && cplay && v.src && isHttp){
						
						backup = i;
						continue;
					}else if(v.delivery == 'streaming' && !isHttp){
						continue;//can't stream over other protocol in transcoder
					}
					
					if(cplay != ''){//probably or maybe is acceptable
						return i;
					}else{
						continue;
					}
				}
				
				
				//if allowing streaming or fallback, try streams first
				var shouldUseBackup = backup !== false && (av.ads.mode == av.ads.modes.PRODUCTION_PLUS_STREAMING || av.ads.mode == av.ads.modes.USE_FALLBACK_VIDEO);
				av.log.debug("selectMedia using streaming shouldUseBackup=" + shouldUseBackup);
				if(shouldUseBackup){
					av.log.debug("canPlay using streaming backup=" + backup);
					return backup;
				}else if(av.ads.mode == av.ads.modes.USE_FALLBACK_VIDEO){
					return 0;
				}
				return false;
			}
			
			self.selectMedia = function(){
				var toReturn = false, backup = false;
				for(var i=0; i<creative.media.videos.length; i++){
					var v = creative.media.videos[i];
					
					//can we play it?
					if(self.player.canPlayType(v.type)){
						var isHttp =  v.src && v.src.indexOf('http') === 0;
						//can only stream over HTTP
						if(v.delivery == 'streaming' && isHttp){
							backup = v.src;
							continue;
						}else if(v.delivery == 'streaming' && !isHttp){
							continue;
						}
						//alert('can play ' + v.type)
					}else{
						continue;
					}
					
					toReturn = v.src;
					break;
				}
				
				av.log.debug("selectMedia using streaming backup=" + backup);
				/**
				 * Only use the fallback video if the user agent has indicated that it CAN NOT play 
				 * any of the provided ad videos
				 */
				if(backup !== false && !toReturn && (av.ads.mode == av.ads.modes.PRODUCTION_PLUS_STREAMING || av.ads.mode == av.ads.modes.USE_FALLBACK_VIDEO)){
					av.log.debug("selectMedia using streaming backup=" + backup);
					return backup;
				}else if(av.ads.mode == av.ads.modes.USE_FALLBACK_VIDEO && !toReturn){
					self.log.debug("In USE_FALLBACK_VIDEO mode, otherwise would have played: " + toReturn)
					return av.ads.fallbackAd;
				}else{
					return toReturn;
				}
			}
			
			self.onKeyDown = function(evt){
				switch(av.getKeyIdentifier(evt)){
					case 'Enter':
						var params = {};
						params.pos = params.position = self.player.currentTime;//added for now, but not scalable, each link 
						//from an advertiser may require inserting metrics like currentTime, volume, sessionId, etc
						//but until that is standardized we only insert a "pos/position" paramter.
						
						creative.dispatchEvent('click', params);
						break;
				}
			}
			
			self.onProgress = function(evt){
				var steps = {
					'firstQuartile' : self.duration*1/4,
					'midpoint'	: self.duration*1/2,
					'thirdQuartile' : self.duration*3/4,
					'complete'	: self.duration-1
				};
				for(var tracker in steps){
					if(self.player.currentTime > steps[tracker] && !self.events[tracker]){
						//Fire that quartile/etc tracker if we are past it and have not yet
						self.dispatchEvent(tracker, {
							time : self.player.currentTime
						});
					}
				}
				 
				//is this a rewind?
				if(self.player.currentTime + av.ads.deltas.REWIND < self.currentTime && !self.player.paused){
					//console.log('timeupdate', self.player.currentTime, self.currentTime)
					//@BUG in CloudTV fires a rewind event on unload of a video, so track page unload via links
					//and disable rewind event if that "followed" flag is true.
					if(!av.ads.followed){
						self.dispatchEvent('rewind', evt.data);
					}
				}
				
				self.currentTime = self.player.currentTime;
				self.updateCountDown();
				self.dispatchEvent('progress',evt);
			}
			
			/**
			 * Tracks the "muted" property of the video player, changes to volume directly
			 * will not be tracked
			 */
			self.onVolumeChange = function(evt){
				//self.log.debug("Video Player Volume: " + self.player.volume);
				if(self.player.muted && !self.muted){//throw out the case where the volume is changing but muted is true
					self.muted = self.player.volume;
					self.dispatchEvent('mute', evt.data);	
				}else if(self.muted && self.muted == self.player.volume){//unless the volume didn't change, we are not an unmute event... unmute preserves volume value
					self.muted = false;
					self.dispatchEvent('unmute', evt.data);
				}else if(self.player.muted){
					self.muted = self.player.volume;//update the current volume setting 
				}
			}
			
			self.onPlay = function(evt){
				//alert('played')
				//console.log('played', self.events.start);
				if(self.events.start){
					self.dispatchEvent('resume', evt.data)
				}else{
					self.dispatchEvent('start', evt.data);
				}
			}
			
			//@TODO - if the user hits BACK and the app responds to it by closing the page, then
			// we should be aware of the "back"/"unload" functionality by subscribing to it at 
			// the av.doc.defaultView.addEventListner('unload',...) level. This also requires
			// us to, at the end of a video ('complete') remove this window event listener, lest
			// it fire after an ad completes
			self.onClose = function(evt){
				//stop checking for duration if we still are
				av.log.debug("TOTALLY CLOSED**************");
				self.clearDurationCheck();
				self.removeCloseListener(evt);
			}
			
			//should remove the event listener for CLOSE when, (a) the video completes, (b) the window closes
			self.removeCloseListener = function(evt){
				av.log.debug("self.removeCloseListener()")
				av.doc.defaultView.removeEventListener('unload', self.onClose, false);
			}
			
			self.onPause = function(evt){
				self.dispatchEvent('pause', evt.data);
			}
			
			self.onError = function(evt){
				self.log.error("There was an error playing back the video ad");
				for(var prop in evt){
					self.log.error('error.' + prop + ' : ', evt[prop]);
				}
				self.closeIfOpen(evt);
			}
			
			self.dispatchEvent = function(type, params){
				self.events[type]++;
				var params = params || {};
				if(self.player){
					params.pos = params.position = self.player.currentTime;
				}
				self.log.debug("dispatchEvent", params);
				if(type == 'complete'){
					self.stop();
				}
				
				//self.dispatchEvent(type, evt.data);
				creative.dispatchEvent(type, params);
			}
			
			self.registerEvent = function(type, func){
				return function(evt){
					func.apply(self, [type, evt]);
				}
			}
			
			self.addEventListener = function(evt, func){
				creative.addEventListener(evt, func);
			}
			
			/**
			 * Given creative.duration is a number, we will use that until 
			 * the player reports back a duration
			 */
			self.setDuration = function(){
				//av.doc.defaultView.alert('duration: ' + creative.duration + ' , self.player.duration=' + self.player.duration)
				if(!self.player.duration || isNaN(self.player.duration) 
						&& creative.duration 
						&& !isNaN(parseFloat(creative.duration))
				){
					self.declaredDuration = parseFloat(creative.duration);
				}
			}
			
			self.clearDurationCheck = function(){
				if(self.durationCheckId){
					try{clearTimeout(self.durationCheckId);}catch(eDoesntExist){}
					self.durationCheckId = 0;
				}
			}
			
			self.detectDuration = function(){
				self.clearDurationCheck();
				self.log.debug("Checking for a duration, currently: " + self.player.duration);
				//if(!self.player || !self.player.ownerDocument || self.player.ownerDocument.defaultView != av.doc){
				if(self.doc != av.doc){
					return;//page was closed or focus lost, either way if player is not in foreground we stop this nonsense!
				}
				
				//look in player itself
				if(self.player.duration && !isNaN(self.player.duration) && isFinite(self.player.duration)){
					self.duration = self.player.duration;	
				}else{
					//set timeout in the DOM this is being viewed in
					self.durationCheckId = av.doc.defaultView.setTimeout(self.detectDuration, 500);
					//use whatever was in the ad package if it has been set
					self.duration = self.declaredDuration;
				}
				
			}
			
			self.start = function(){
				if(!self.container){
					throw new TypeError("av.AdPlayer.start() - expects av.AdPlayer.setContainer() to have been called with a DOM element or ID, but currently set to:" + self.container);
				}
				if(self.state == 'showing'){
					throw new Error("av.AdPlayer.start() - cannot show the same player more than once, is a function in your script calling .start() multiple times?");
				}
				
				
				self.setupContainer();
				
				//pause parent video if any
				if(self.getType(self.container) == 'video'){
					self.stopContainer();
				}
				
				if(!self.player){
					self.player = av.doc.createElement('video');
					self.player.setAttribute('tabindex',0);//focusable
					self.player.setAttribute('autoplay', 'autoplay');
					self.player.setAttribute('class','adPlayer');
					
					av.html.loadGlobalCss('.adPlayer{position:absolute; z-index:10000; width: ' + self.width +'px; height: ' + self.height + 'px; left: ' + self.left +'px; top: ' + self.top + 'px;}')
					
					self.player.addEventListener('keydown', self.onKeyDown, false);
					
					/*for(var evtName in self.events){
						self.player.addEventListner(evtName, self.registerEvent(evtName, self.handleEvent), false);
					}*/
					
					//register for the events related to a player "highlevel" events
					self.player.addEventListener('play', self.onPlay, false);
					self.player.addEventListener('timeupdate', self.onProgress, false);
					self.player.addEventListener('ended', self.closeIfOpen, false);
					
					
					
					self.player.addEventListener('play', self.onPlay, false);
					self.player.addEventListener('volumechange', self.onVolumeChange, false);
					self.player.addEventListener('pause', self.onPause, false);	
					
					self.doc = av.doc;
					
					//if we unload, then trigger the onClose() function
					av.doc.defaultView.addEventListener('unload', self.onClose, false);
					
					//if it completes, stop listening for onClose
					creative.addEventListener('complete', self.removeCloseListener);
					
					
					//@TODO why does the "complete" event always get followed by the "error" event in both Chrome and our platform? Must 
					// be some race condition. Need to find.
					//self.player.addEventListener('error', self.onError, false);
				}
				
				self.state = 'showing';
				
				
				/*
				 * @TODO need to determine if we should be including the window.pageYOffset and window.pageXOffset too
				 */
				av.doc.body.appendChild(self.player);
				if(self.countDownHolder){
					av.doc.body.appendChild(self.countDownHolder);
				}
				
				var src = self.selectMedia();
				self.log.debug("Over container " + self.container + " playing video: " + src);
				
				self.setDuration();
				self.detectDuration();
				self.player.src = src;
				
				
				//self.player.innerHTML = 'Loading'
				
				self.dispatchEvent('creativeView',{src : src});
				
			}
			
			self.getType = function(elem){
				return elem.tagName.toLowerCase();
			}
			
			self.stopContainer = function(){
				self.containerTime = self.container.currentTime;
				self.log.debug("Container time at time of stopping: " + self.containerTime);
				
				self.containerSource = self.container.src;
				self.clearDurationCheck();
				self.container.src = '';
				self.container.load();
			}
			
			self.resumeContainer = function(){
				self.container.src = self.containerSource;
				self.container.load();
				
				self.log.debug("Moving currentTime to " + self.containerTime);
				
				//create a listener for metadata that will update the current time then automatically remove itself
				//@TODO our platform really should fire a 'loadedmetadata' event, but seems not to.
				//waiting for a timeupdate in chrome and h5 works, so use that.
				var setCurrentTime = {};
				setCurrentTime.removeListener = function(){
					self.container.removeEventListener('timeupdate', setCurrentTime.start);
				}
				setCurrentTime.start = function(){
					self.container.currentTime = self.containerTime;
					setCurrentTime.removeListener();
				}
				self.container.addEventListener('timeupdate', setCurrentTime.start)
				
			}
			
			self.focus = function(){
				if(!self.player){
					throw new TypeError("av.AdPlayer.focus() - expects av.AdPlayer.start() to have been called to create an ad. Cannot focus non-existent ad player.")
				}
				self.previousFocus = av.doc.activeElement;
				self.player.focus();
			}
			
			/**
			 * If we are using a synthetic duration (i.e. that provided by the 
			 * advertiser) we need to make sure that should the actual duration
			 * if it is reported as longer than it actually is, will trick
			 * our onprogress event listener, which fires "complete" when
			 * it gets 1 second from the end
			 */			
			self.closeIfOpen = function(){
				if(!self.stopped){
					//console.log("Sythetic stop! **********************")
					self.dispatchEvent('complete');
				}
			}
			
			self.stop = function(){
				self.stopped = true;
				self.clearDurationCheck();
				
				self.player.parentElement.removeChild(self.player);
				self.player.src = '';
				self.player.load();
				self.log.debug("I FINISHED *****************");
				if(self.getType(self.container) == 'video'){
					self.resumeContainer();
				}
				
				av.log.debug("previousFocus", self.previousFocus);
				if(self.previousFocus){
					av.dom.focus(self.previousFocus);
				}
			}
			
			
			return self;
		}
	}

}
