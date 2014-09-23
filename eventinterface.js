/**
 * @fileoverview EventInterface wrapper for native and user defined objects
 */
if(!av.exists('av.EventInterface')){
	/**
	 * </p>Creates a new EventInterface, either attaching itself to the given object directly or as the Object.eventInterface property
	 * @class Extends the scope of the argument to the constructor to contain a generic event interface
	 * to have methods:</p>
	 * 		<ol><li>resetEventListeners</li>
	 * 		<li>addEventListener</li>
	 * 		<li>removeEventListener</li>
	 * 		<li>hasEventListener</li>
	 * 		<li>dispatchEvent</li></ol>
	 * <p>This class is VERY useful as a simple way to extend any object or other class
	 * to have an Event engine, see <a href="https://github.com/alexyoung/turing.js/blob/master/turing.events.js" target=_blank>Let's make a framework: Turing events</a> for 
	 * similar types of programming paradigms.</p><p>Mirrors DOMEvent with some additional functions or
	 * see <a href="https://github.com/Wolfy87/EventEmitter/blob/master/src/EventEmitter.js" target=_blank>EventEmitter</a></p>
	 * @param Object scopeToExtend
	 * @param Boolean[false] can be used to attach directly to the scope, otherwise added as scope.eventInterface
	 * 
	 * @example //Create a Student object, which has "change", "increase", and "decrease" events
    	 * var Student = function(){
    	 * 		var self = this;
    	 * 		var curGrade = 100;
    	 * 		av.require('EventInterface', true);
    	 * 	
    	 * 		self.updateGrade = function(newPercent){
    	 * 			var change = newPercent - curGrade;
    	 * 			curGrade = newPercent;
    	 * 			
    	 * 			//fire specific events for increase/decrease
    	 * 			if(dir > 0){ self.dispatchEvent('increase',{change:change, grade : newPercent}); }
    	 * 			else if(dir < 0){ self.dispatchEvent('decrease',{change:change, grade : newPercent}); }
    	 * 			
    	 * 			//fire 1 extra event, a generic "change" event with just the new score
    	 * 			self.dispatchEvent('change', newPercent);
    	 * 		}
    	 * }
    	 * 
    	 * var s = new Student();
    	 * 
    	 * s.addEventListener('change', function(evt){
    	 * 		document.getElementById('score').innerHTML = 'Current Score: ' + evt.data;
    	 * })
    	 * 
    	 * 
    	 * 
    	 * @example //Create a "class" called TweetPoller, extend it with an EventInterface, and 
    	 * //subscribe to the "newtweet" event that it emits. 
    	 * var TweetPoller = function(){
    	 * 		var self = this;//so scope is not lost during XMLHttpRequest.onreadystatechange	
    	 * 		av.require('EventInterface');
    	 * 		this.request = null;		
    	 * 
    	 *		//extend this to have EventInterface methods at top level
    	 * 		new av.EventInterface(this, true);		
    	 * 		
    	 * 		var curId = '';
    	 * 		var poll = function(){
    	 * 			var twitterURL = 'http://search.twitter.com/search.json?q=@cnn';
    	 * 			if(curId){twitterURL += '&since_id=' + curId}
    	 * 			self.request = new XMLHttpRequest();
    	 * 			self.request.open("GET", twitterURL, true);//async
    	 * 			self.request.onreadystatechange = onReadyStateChange;//defined below
    	 * 			self.request.send();
    	 * 		}
    	 * 
    	 * 		var onReadyStateChange = function(){
    	 * 			if(self.request.readyState == 4){
    	 * 				var tweets = JSON.parse(self.request.responseText);
    	 * 				if(tweets.results && tweets.results.length){
    	 * 					//Send an event to any listeners that we have new tweets
    	 * 					curId = tweets.max_id_str;//keep track of highest ID
    	 * 
    	 * 					this.dispatchEvent('newtweets', tweets.results);
    	 * 				}
    	 * 			}
    	 * 		}
    	 * 		window.setInterval(poll, 30000);//check every 30 seconds
    	 * 		poll();//fire off the first immediately
    	 * 
    	 * 		return this;
    	 * }
    	 * 
    	 * var t = new TweetPoller();
    	 * 
    	 * //Subscribe to the "newtweets" event, tweets will be 
    	 * //inside of the event argument, "evt.data"
    	 * t.addEventListener('newtweets',function(evt){
    	 * 		console.log("There were new tweets", evt.data)
    	 * })
    	 * 
    	 * //would log
    	 * //There were new tweets, 
    	 * [
   {
      "created_at":"Thu, 05 Apr 2012 15:24:02 +0000",
      "from_user":"KennyCurtis",
      "from_user_id":88950653,
      "from_user_id_str":"88950653",
      "from_user_name":"OptimusK",
      "geo":null,
      "id":187923557119041540,
      "id_str":"187923557119041537",
      "iso_language_code":"en",
      "metadata":{
         "result_type":"recent"
      },
      "profile_image_url":"http://a0.twimg.com/profile_images/2006364648/image_normal.jpg",
      "profile_image_url_https":"https://si0.twimg.com/profile_images/2006364648/image_normal.jpg",
      "text":"@CNN and the difference is......?",
      "to_user":"CNN",
      "to_user_id":759251,
      "to_user_id_str":"759251",
      "to_user_name":"CNN",
      "in_reply_to_status_id":187920236333379600,
      "in_reply_to_status_id_str":"187920236333379585"
   },
   {

   }
]

		 * //There were new tweets
		 * [
   {
      "created_at":"Thu, 05 Apr 2012 15:24:02 +0000",
      "from_user":"KennyCurtis",
      "from_user_id":88950653,
      "from_user_id_str":"88950653",
      "from_user_name":"OptimusK",
      "geo":null,
      "id":187923557119041540,
      "id_str":"187923557119041537",
      "iso_language_code":"en",
      "metadata":{
         "result_type":"recent"
      },
      "profile_image_url":"http://a0.twimg.com/profile_images/2006364648/image_normal.jpg",
      "profile_image_url_https":"https://si0.twimg.com/profile_images/2006364648/image_normal.jpg",
      "text":"@CNN and the difference is......?",
      "to_user":"CNN",
      "to_user_id":759251,
      "to_user_id_str":"759251",
      "to_user_name":"CNN",
      "in_reply_to_status_id":187920236333379600,
      "in_reply_to_status_id_str":"187920236333379585"
   },
   {

   }
]
	 */
	av.EventInterface = function(scopeToExtend, attachToRoot){
		var self = this;
		var attachToRoot = typeof(attachToRoot == 'boolean') ? attachToRoot : false;
		
		/**
		 * Add to the scope of the callee
		 */
		if(attachToRoot){
			self = scopeToExtend;
		}else{
			scopeToExtend.eventInterface = self;
		}
		
		
		var listeners = {};
		/**
		 * If object being extended does not have logging built in, add it with a generic scope.
		 */
		if(!scopeToExtend.log){
			self.log = new av.Log(av.getEffectiveLogLevel('EventInterface'),'av.EventInterface');
		}else{
			self.log = scopeToExtend.log;
		}
		
		//PRIVATE METHODS
		
		/**
		 * Returns a clone of the native DOMEvent event. Can be used to simulate a DOM event 
		 * @private
		 */
		var createEvent = function(type, args){
			var e = new Function();
			e.stopped = false;
			e.prevented = false;
			e.type = type;
			if(args && args.length ==1){
				e.data = args[0];//1 value only, includes only that value, for example a message
			}else{
				e.data = args;//raw array
			}
			
			e.stopPropagation = function(){
				e.stopped = true;
			}
			e.preventDefault = function(){
				e.prevented = true;
			}
			return e;
		}
		
		/**
		 * @private
		 */
		var registerEventType = function(evt){
			if(!listeners[evt]){listeners[evt] = []}
		}
		/**
		 * @private
		 */
		var removeOrphanedListeners = function(evt){
			registerEventType(evt);
			var end = listeners[evt].length;
			for(var i=0; i<end; i++){
				if(typeof(listeners[evt][i]) != 'function'){
					self.log.debug("Removing orphaned function at listners[" + evt +"][" + i + "]")
					
					listeners[evt].splice(i, 1);//remove function orphan
					
					end--;
					i--;//move i back 1 and end back 1 to match new length
				}
			}
		}
		
		//PUBLIC METHODS
		
		/**
		 * Get all event listeners as an array of type 'evt' 
    	 * @param {string} [evt=''] The name of the event in interest, can be left null or empty to return all events in the Interface
    	 * @return {Array[Function],Object{Array[Function]}} An array of event listeners, where each event listener is a function, or an object with such arrays per event if no particular evt was requested.
    	 * @name av.EventInterace.getListeners
    	 * @methodOf av.EventInterface#
		 */
		self.getListeners = function(evt){
			if(evt){
				registerEventType(evt);
			}
			return evt ? listeners[evt] : listeners; 
		}
		
		/**
		 * Remove all event listeners from this object registered under the event name 'evt' 
    	 * @param {string} evt The name of the event to unregister all event listeners from
    	 * @name av.EventInterace.resetEventListeners
    	 * @methodOf av.EventInterface#
		 */
		self.resetEventListeners = function(evt){
			registerEventType(evt);
			listeners[evt] = [];//remove references to old event listeners
		}
		
		/**
		 * Fire off an event of type evt, this will call all event listeners in order
		 * of registration, until it reaches the last one or one updates the dispatched event property
		 *  evt.stopped to false; Passes args as evt.data to each event listener.  
    	 * @param {string} evt The name of the event to fire off
    	 * @param {Mixed,Array} If array, the array will be present in the dispatched Event.data, else 
    	 * a direct assignment will be made where Event.data == args in the dispatched Event.
    	 * @name av.EventInterace.dispatchEvent
    	 * @methodOf av.EventInterface#
		 */
		self.dispatchEvent = function(evt, args){
			var e = createEvent(evt, args);
			var dispatched = false;
			
			registerEventType(evt);
			removeOrphanedListeners(evt);
			
			//this logic works and is needed when splicing mid-for-loop, see
			//a = [-1,-2,-3,-4]; var end = a.length; for(var i=0; i<end; i++){console.log(a[i]); var x = a.splice(i,1); end--; i--;} 
			for(var i=0; i<listeners[evt].length; i++){
				self.log.debug("dispatchEvent("+evt+", args) - sending args to listener #" + (i+1))
				dispatched = true;
				listeners[evt][i].apply(av.doc.defaultView, [e]);//navigator is the scope used
				if(e.stopped){
					self.log.debug("Stopped on the " + i +"th event lisetener for " + evt + " since event was stopped via evt.stopPropagation()")
					break;
				}
				if(e.prevented){//@TODO figure out if we need to prevent anything, if anything may be dispatching of the event on the current WINDOW through av.doc.defaultView ?
					
				}
			}
			
			if(!dispatched){
				self.log.debug("dispatchEvent("+evt+", args) - NO EVENT LISTENERS to notify");
			}
		}
		
		//return false to cancel event
		/**
		 * Add an event listener 'func' to listen to events of type 'evt'  
    	 * @param {string} evt The name of the event to listen for
    	 * @param {Function} func A function that accepts an Event as its first and only argument 
    	 * @name av.EventInterace.addEventListener
    	 * @methodOf av.EventInterface#
    	 * 
    	 * 	
		 */
		self.addEventListener = self.on = function(evt, func){
			registerEventType(evt);
			if(self.hasEventListener(evt, func) === false){
				listeners[evt].push(func);
			}
		}
		/**
		 * Alias for {@link av.EventInterface.addEventListener}
    	 * @name av.EventInterace.on
    	 * @methodOf av.EventInterface#
		 */


        //return false to cancel event
        /**
         * Add an event listener 'func' to listen to events of type 'evt'
         * @param {string} evt The name of the event to listen for
         * @param {Function} func A function that accepts an Event as its first and only argument
         * @name av.EventInterace.addEventListener
         * @methodOf av.EventInterface#
         *
         *
         */
        self.removeEventListeners = self.offAll = function(){
            listeners = {};
        }
        /**
         * Alias for {@link av.EventInterface.addEventListener}
         * @name av.EventInterace.on
         * @methodOf av.EventInterface#
         */


		
		
		/**
		 * Same as {@link av.EventInterface.addEventListener}, except will only execute the callback func
		 * a single time, and then unregister func from the event listeners.
		 * @name av.EventInterface.once
		 * @methodOf av.EventInterface#
		 * @param {String} evt An event to register for
		 * @param {Function} func The function to call when the event occurs, will only be called on FIRST OCCURRENCE OF EVENT
		 */
		self.once = function(evt, func){
			//create an inner function to wrap the listener
			var toCall = (function(e,f){
				var callback;
				/**
				 * @private
				 */
				callback = function(){
					f.apply(self,arguments);
					self.removeEventListener(e, callback);
				}
				return callback; 
			})(evt,func);
			self.addEventListener(evt, toCall);
		}
		
		/**
		 * Remove the event listener 'func' from events of type 'evt'  
    	 * @param {string} evt The name of the event to remove subscription from
    	 * @param {Function} func The original function that was used in .once() or .addEventListener(); must be handle to original, cannot be redefined
    	 * @name av.EventInterace.removeEventListener
    	 * @methodOf av.EventInterface#
		 */
		self.removeEventListener = function(evt, func){
			var index = self.hasEventListener(evt, func);
			if(index !== false){
				listeners[evt].splice(index, 1);//remove that element from the array
			}
		}
		
		/**
		 * Check to see if an event listener 'func' is subscribed to to events of type 'evt'  
    	 * @param {string} evt The name of the event to check
    	 * @param {Function} func The original function that was used in .once() or .addEventListener(); must be handle to original, cannot be redefined
    	 * @name av.EventInterace.hasEventListener
    	 * @methodOf av.EventInterface#
		 */
		self.hasEventListener = function(evt, func){
			if(!listeners[evt]){return false;}
			else{
				for(var i=0; i<listeners[evt].length; i++){
					if(listeners[evt][i] == func){
						return i;
					}
				}
			}
			return false;
		}
		
		
		return self;
		
	}
}
