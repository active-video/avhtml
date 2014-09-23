/**
 * @fileoverview Funnel API wrapper and utility methods, chainable API
 */
av.nameSpace('av.apis');
if(!av.exists('av.apis.Funnel')){
	av.require('data.json','net');
	/**
	 * @class Helper class for consumer of Funnel service, also see http://developer.activevideo.com
	 * 
	 * @param {String} [apiKey=window.config.apis.funnel.apiKey] The API Key
	 * @param {String} [serverURL=window.config.apis.funnel.serverURL] Location of the server.
	 * @param {Number} [logLevel=window.config.logLevelLibs | window.config.apis.funnel.logLevel] Value which determines the type of log messages to be displayed. 
	 * @example //1. Create a new Funnel object declaratively
	 * av.global.funnel = new av.apis.Funnel('556677', 'http://10.200.100.56:8080', 0);
	 * 
	 * //2. set at runtime//API Configurations
		window.config = {
			apis : {
				//FUNNEL SETTINGS
				funnel : {
					serverURL : 'http://10.200.100.56:8080',
					apiKey	: '556677',
					logLevel: 0,
					maxTries: 2,
				},
				
			}
		}
		av.global.funnel = new av.apis.Funnel();//will look in config for apiKey, serverURL, and logLevel
	 * 
	 */
	av.apis.Funnel = function(apiKey, serverURL, logLevel){
		var self = this;
		
		/**
		 * Sets the current value of the apikey to the value specified in the initialization argument (apiKey) for the Funnel class.
		 * @memberOf av.apis.Funnel#
		 * @name av.apis.Funnel.apiKey
		 * 
		 * @type String
		 * @default ""
		 */
		self.apiKey = apiKey;		
		
		/**
		 * Sets the current serverURL value to the string specified in the initialization argument (serverURL) for the Funnel class.
		 * @memberOf av.apis.Funnel#
		 * @name av.apis.Funnel.serverURL
		 * @type String
		 * @default ""		 
		 */
		self.serverURL = serverURL;
		
		/**
		 * Sets the logLevel to the value specified in the initialization argument (logLevel) for the Funnel class.
		 * @memberOf av.apis.Funnel#
		 * @name av.apis.Funnel.logLevel
		 * @type Int
		 * @default ""		 
		 */
		self.logLevel = logLevel;
		
		/**
		 * Stores the headers variable. These are added in the init() method.
		 * @memberOf av.apis.Funnel#
		 * @name av.apis.Funnel.headers
		 * @type Object
		 * @default "{}"	 
		 */
		self.headers = {};
		
		/**
		 * @memberOf av.apis.Funnel#
		 * @name av.apis.Funnel.log
		 */
		self.log = {};
		
		/**
		 * @memberOf av.apis.Funnel#
		 * @name av.apis.Funnel.config
		 * @type Object
		 * @default "window.config.apis.funnel"
		 */
		self.config = av.getConfig('apis.funnel');
		
		/**
		 * @memberOf av.apis.Funnel#
		 * @name av.apis.Funnel.endpoints
		 * @type Object
		 * @default "{search:..., list:...}"
		 */
		self.endpoints = {
			'search' 	: {url:'/api/search', method : "POST"},
			'list' 		: {url:'/api/getfeedinfo', method : "GET"},
		}
		
		/**
		 * Initializes basic configuration settings [apiKey, serverURL, logLevel, headers]. 
		 * @name av.apis.Funnel.init
    	 * @methodOf av.apis.Funnel#
    	 * @returns {Obj} Returns a copy of itself which contains the updated configuration variables.
		 */
		self.init = function(){
			//alert(self.apiKey)
			var apiKey = typeof(self.apiKey) == 'undefined' ? av.getProperty(self.config,'apiKey','') : self.apiKey;
			var serverURL = typeof(self.serverURL) == 'undefined' ? av.getProperty(self.config,'serverURL','') : self.serverURL;
			if(!apiKey){
				throw(new TypeError("av.apis.Funnel expects argument 1 of constructor to be an API-KEY of type string, received " + typeof(self.apiKey)));
			}else if(!serverURL){
				throw(new TypeError("av.apis.Funnel expects argument 2 of constructor to be a SERVER-URL of type string, received " + typeof(self.serverURL)));
			}	
			
			//all good? put the determined settings back into self
			self.apiKey = apiKey;
			self.serverURL = serverURL;
			self.logLevel = typeof(self.logLevel) == 'number' ? self.logLevel : av.getEffectiveLogLevel('apis.funnel');
			
			self.log = new av.Log(self.logLevel,'av.apis.Funnel');
			
			self.headers = {
					'x-avnf-api-key' 	: self.apiKey,
					'x-avnf-device-id' 	: av.clientid,
					'x-avnf-edge-node'	: 0,
					'content-type'		: 'application/json'
			};
			
			return self;
		}
		
		/**
		 * Returns a request for a search query.
		 * @name av.apis.Funnel.get
    	 * @methodOf av.apis.Funnel#
    	 * @returns {FunnelSearch} Object containing a search query
    	 * 
    	 * @example 
    	 * av.global.funnel.get('cnn')
    	 * //Assuming there is a feed titled 'cnn'
		 * 
		 */
		self.get = function(){
			
			var request =  new FunnelSearch();
			request.endpoint = 'search';
			
			if(arguments.length){
				request.feed.apply(request, arguments);
			}
			
			return request
		}
		
		/**
		 * Returns a request for a list, which has not yet been fired off - make sure to call .run() on the returned object.
		 * @name av.apis.Funnel.getList
    	 * @methodOf av.apis.Funnel#
    	 * @returns {FunnelList} A Funnel list object
    	 * 
    	 * @example 
    	 * var l = av.global.funnel.getList('cnn', 'hbo'); //,etc )
    	 * //Assuming are feeds titled 'cnn', 'hbo', and 'etc' is a valid feed
    	 * var callback = function(resp){console.log(resp);}
    	 * l.run(callback);
    	 * 
    	 * //would eventually log the data returned from the Asynchronous API call:
    	 * [
   {
      "feedName":"CNN - Video World",
      "feedId":12,
      "aliases":{
         "key8":"Licensing_Window_Start",
         "key11":"Run_Time",
         "key10":"Actors",
         "key0":"Display_As_New",
         "key6":"Closed_Captioning",
         "key12":"Rating",
         "key2":"Billing_ID",
         "key4":"Suggested_Price"
      }
   },
   {
      "feedName":"HBO Movies",
      "feedId":6,
      "aliases":{
         "key8":"Licensing_Window_Start",
         "key11":"Run_Time",
         "key10":"Actors",
         "key0":"Display_As_New",
         "key6":"Closed_Captioning",
         "key12":"Rating",
         "key2":"Billing_ID",
         "key4":"Suggested_Price"
      }
   }
]
		 */
		self.getList = function(feedName){
			var request =  new FunnelList();
			request.endpoint = 'list';
			
			if(arguments.length){
				request.feed.apply(request, arguments);
			}
			
			return request;
		}
		
		
		/**
		 * Send a request to the serverURL
		 * @name av.apis.Funnel.sendRequest
    	 * @methodOf av.apis.Funnel#
		 * 
		 * @param {String} endpoint The query to be returned [search or list]
		 * @param {String} postBody Extra parameters to be appended to the serverURL.
		 * @param {function/string} callback The message to be returned
		 * 
		 */
		self.sendRequest = function(endpoint, postBody, callback){
			if(typeof(callback) != 'function'){
				var message = "av.apis.Funnel.sendRequest(postBody, callback) - expected callback to be a Function, received: " + typeof(callback);
				av.log.error(message);
				throw new TypeError(message);
			}
			if((typeof(postBody) != 'string' || !postBody) && self.endpoints[endpoint].method == 'POST'){
				var message = "av.apis.Funnel.sendRequest(postBody, callback) - expected postBody to be a non-empty JSON String, received: " + typeof(postBody);
				av.log.error(message);
				throw new TypeError(message);
			}
			
			//all good? start request.
			var options = {
				headers		: self.headers,
				evalJSON 	: true
			};
			var url = self.serverURL + self.endpoints[endpoint].url;
			//console.log('postBody',postBody)
			//append parameters to URL if needed
			if(self.endpoints[endpoint].method == 'GET'){
				url += '?' + postBody;
				postBody = '';
			}
			
			var cback = self.wrapCallback(callback);
			
			av.net.makeRequest(url, cback, self.endpoints[endpoint].method, postBody, options);
			
		}
		
		/**
		 * Wrapper for a callback method
		 * @name av.apis.Funnel.wrapCallback
    	 * @methodOf av.apis.Funnel#
		 * 
		 * @param {String} callback 
		 * @return {function} cback 
		 * 
		 */
		self.wrapCallback = function(callback){
			
			
			/**
			 * callback request
			 * @name cback
	    	 * @methodOf av.apis.Funnel.wrapCallback#
			 * 
			 * @param {String} request 
			 * 
			 */
			var cback = function(request){
				var response = false;
				if(request.responseJSON){
					response = request.responseJSON;
				}else{
					try{
						response = av.data.json.parse(request.responseText);
					}catch(eNotJSON){}
				}
				
				self.log.debug("Response From Funnel for request " + request.url + " and post " + request.post)
				self.log.debug(response);
				
				callback.apply(request,[response]);
			}
			
			
			return cback;
		}
		
		/**
		 * @class Builds an object comprised of feed and run requests. 
		 * Only available by calling Funnel.getList(), the returned object is of type FunnelList
		 * as documented here
		 * @name FunnelList
		 * 
		 */
		var FunnelList = function(){
			var request = this;
			request.method = 'GET';
			request.endpoint = 'list';
						
			var params = {
				'feed_name' : ''
			}
			
			/**
			 * Given a list of string arguments, add them to the list of feeds we are querying Funnel for.
			 * @methodOf FunnelList#
			 * @name FunnelList.feed()
			 * @param {String} feed1Name
			 * @param {String} feed2Name
			 * @param {String} feedNName
			 */
			request.feed = function(){
				for(var i=0; i<arguments.length; i++){
					//params.feeds.push[arguments[i]];
					params.feed_name += params.feed_name === '' ? arguments[i] : ',' + arguments[i];
				}
				return self;
			}
			
			/**
			 * <p>Get the list of data sources in funnel, if feed() was called then it will only return data
			 * about that feed</p><p>This method is ASYNCHRONOUS</p>
			 * @methodOf FunnelList#
			 * @name FunnelList.run
			 * 
			 * @example 
			 * var f = new av.apis.Funnel('1234');
			 * 
			 * //get ALL feeds belonging to the API-KEY "1234"
			 * var l = f.getList('').run(function(resp){console.log('response from funnel', resp);})
			 * 
			 * //would eventually log the data returned from the Asynchronous API call:
	    	 * [
   {
      "feedName":"CNN - Video World",
      "feedId":12,
      "aliases":{
         "key8":"Licensing_Window_Start",
         "key11":"Run_Time",
         "key10":"Actors",
         "key0":"Display_As_New",
         "key6":"Closed_Captioning",
         "key12":"Rating",
         "key2":"Billing_ID",
         "key4":"Suggested_Price"
      }
   },
   {
      "feedName":"CNN Video - Business",
      "feedId":6,
      "aliases":{
         "key8":"Licensing_Window_Start",
         "key11":"Run_Time",
         "key10":"Actors",
         "key0":"Display_As_New",
         "key6":"Closed_Captioning",
         "key12":"Rating",
         "key2":"Billing_ID",
         "key4":"Suggested_Price"
      }
   }
]
			 */
			request.run = function(callback){
				self.sendRequest(request.endpoint, av.string.arrayToQueryString(params), callback);
				return request;	
			
			}
			
			return request;
		}
		
		
		/**
		 * 
		 * @class Builds an object based on a variety of search parameters, which contains where/limit/field clauses much
		 * like an SQL query would, and by calling the .toString() method one can obtain a valid JSON post
		 * body for a request to Funnel 
		 * @name FunnelSearch
		 * 
		 */		
		var FunnelSearch = function(){
			var request = this;
			request.method = 'POST';
			request.endpoint = 'search';
			
			/**
			 * @private
			 */
			var params = {
				feeds : [],
				where : [],//will be an array of arrays. In each sub-array, element 0 is intial where clause followed by and and/or elements to be grouped in that where. Currently limited to OR/AND in allowed within a single field only
				fields : [],
				start : '',
				limit : '',
				endpoint : 'search',
				order : [],//each child element is an array, where element 0 is the field, element 1 is the direction ASC or DESC. NOTE - currently only 1 sort condition is allowed
			}
			/**
			 * @private
			 */
			var postBody = '';
			/**
			 * @private
			 */
			var curWhereClause = -1;
			/**
			 * @private
			 */
			var curWhereGroup = -1;
			
			/**
			 * Reference that gets set after a request is submitted for introspection - holds the body of the post as a string.
			 * @memberOf FunnelSearch#
			 * @name FunnelSearch.post
			 */
			request.post = '';
			
			/**
			 * Updates the param.fields to include pre-specified argument values
			 * @name FunnelSearch.fields
	    	 * @methodOf FunnelSearch#
			 * 
			 * @return {FunnelSearch} Returns "this" instance of a FunnelSearch, chainable 
			 * 
			 */
			request.fields = function(){
				if(arguments.length){
					for(var i=0; i<arguments.length; i++){
						params.fields.push(arguments[i]);
					}
				}
				return request;
			}
			
			/**
			 * Updates the param.feeds to include pre-specified argument values
			 * @name FunnelSearch.feed
	    	 * @methodOf FunnelSearch#
			 * 
			 * @return {FunnelSearch} Returns "this" instance of a FunnelSearch, chainable
			 * 
			 */
			request.feed = function(){
				for(var i=0; i<arguments.length; i++){
					//params.feeds.push[arguments[i]];
					params.feeds.push(arguments[i]);
				}
				return request;
			}
			
			/**
			 * WHERE CLAUSES
			 * @name FunnelSearch.where
	    	 * @methodOf FunnelSearch#
	    	 * @param {String} column 
	    	 * @param {String} operator One of =,&lt;, &lt;=, &gt;, &gt;=, !=, RegEx and substring
	    	 * @param {String} value 
	    	 * @param {boolean} dontAppendToCurrentGroup If true, will trigger a new WHERE group, meaning any previous groups will be logically && with this one in the filter request.
			 * 
			 * @return {FunnelSearch} Returns "this" instance of a FunnelSearch, chainable
			 * 
			 */
			request.where = function(column, operator, value, dontAppendToCurrentGroup){
				//add a where clause
				curWhereClause++;
				if(!dontAppendToCurrentGroup || curWhereGroup == -1){
					curWhereGroup++;
					curWhereClause = 0;//reset to 0
					params.where[curWhereGroup] = [];
				}
				
				params.where[curWhereGroup][curWhereClause] = [];
				
				params.where[curWhereGroup][curWhereClause].push([column,operator,value]);
				
				return request;
			}
			
			/**
			 * Merges the current WHERE condition with the arguments sent here, using AND to join the conditions.
			 * @name FunnelSearch.and
	    	 * @methodOf FunnelSearch#
	    	 * @param {String} column 
	    	 * @param {String} operator One of =,&lt;, &lt;=, &gt;, &gt;=, !=, RegEx and substring
	    	 * @param {String} value 
			 * 
			 * @return {FunnelSearch} Returns "this" instance of a FunnelSearch, chainable
			 * 
			 */
			request.and = function(column, operator, value){
				//add a where clause
				if(curWhereClause < 0){request.where(column, operator, value);}
				else{params.where[curWhereGroup][curWhereClause].push([column,operator,value,'and']);}
				
				return request;
			}
			
			/**
			 * Merges the current WHERE condition with the arguments sent here, using OR to join the conditions.
			 * @name FunnelSearch.or
	    	 * @methodOf FunnelSearch#
	    	 * @param {String} column 
	    	 * @param {String} operator One of =,&lt;, &lt;=, &gt;, &gt;=, !=, RegEx and substring
	    	 * @param {String} value 
			 * 
			 * @return {FunnelSearch} Returns "this" instance of a FunnelSearch, chainable
			 * 
			 */
			request.or = function(column, operator, value){
				//add a where clause
				if(curWhereClause < 0){request.where(column, operator, value);}
				else{params.where[curWhereGroup][curWhereClause].push([column,operator,value,'or']);}
				
				return request;
			}
			
			//END WHERE CLAUSES
			
			//ORDERING CLAUSES
			/**
			 * Order search results by this field, in either ASC or DESC order.
			 * @name FunnelSearch.orderBy
	    	 * @methodOf FunnelSearch#
	    	 * @param {String} field Name of a field to sort by
	    	 * @param {String} direction One of ASC or DESC
			 * 
			 * @return {FunnelSearch} Returns "this" instance of a FunnelSearch, chainable
			 * 
			 */
			request.orderBy = function(field, direction){
				if(typeof(direction) != 'string'){direction = 'DESC';}//newest first by default
				params.order.push([field,direction]);
				return request;
			}
			
			/**
			 * alias for orderBy, linguistically sounds better to orderBy(x,'ASC').then(y,'DESC');
			 * @name FunnelSearch.then
	    	 * @methodOf FunnelSearch#
	    	 * @param {String} field 
	    	 * @param {String} dir
			 * 
			 * @return {FunnelSearch} Returns "this" instance of a FunnelSearch, chainable 
			 * 
			 */
			request.then = function(field, dir){
				return request.orderBy(field,dir);
			}
			
			//END ORDERING CLAUSES
			
			
			//START/LIMIT CLAUSE
			/**
			 * Sets the response's start value
			 * @name FunnelSearch.startingAt
	    	 * @methodOf FunnelSearch#
	    	 * @param {String} start new value of which the request to begin with
			 * 
			 * @return {FunnelSearch} Returns "this" instance of a FunnelSearch, chainable
			 * 
			 */
			request.startingAt = function(start){
				params.start = start;
				return request;
			}
			
			/**
			 * Sets the response's limit value
			 * @name FunnelSearch.limitTo
	    	 * @methodOf FunnelSearch#
	    	 * @param {String} limit new limit value
			 * 
			 * @return {FunnelSearch} Returns "this" instance of a FunnelSearch, chainable
			 * 
			 */
			request.limitTo = function(limit){
				params.limit = limit;
				return request;
			}
			
			//END START/LIMIT CLAUSE 
			
				
			/**
			 * Returns the request
			 * @name FunnelSearch.settings
	    	 * @methodOf FunnelSearch#
			 * 
			 * @return {FunnelSearch} Returns "this" instance of a FunnelSearch, chainable 
			 * 
			 */		
			request.settings = function(){			
				return request;
			}
			
			/**
			 * Convert the post body into a string
			 * @name FunnelSearch.toString
	    	 * @methodOf FunnelSearch#
	    	 * @param {String} customJSONPost custom json value
			 * 
			 * @return {String} The raw POST body which can be used in a request to Funnel, derived from the properties of "this" FunnelSearch object.
			 * 
			 */
			request.toString = function(customJSONPost){
				if(customJSONPost){
					postBody = av.data.json.stringify(customJSONPost);
				}else{
					
						/*
						 var params = {
								where : [],//will be an array of arrays. In each sub-array, element 0 is intial where clause followed by and and/or elements to be grouped in that where
								fields : [],
								start : 0,
								limit : 1000000,
								order : [],//each child element is an array, where element 0 is the field, element 1 is the direction ASC or DESC
							}
						 */
						var pbody = {};
						
						if(params.feeds.length){pbody.feedNames = params.feeds}
						if(params.start !== ''){pbody.offset = params.start;}
						if(params.limit != ''){pbody.limit = params.limit;}
						if(params.fields.length){pbody.outputFields = params.fields;}
						if(params.order.length){
							for(var i=0; i<1; i++){//@TODO update to allow multiple sort conditions when that feature becomes avaialble
								pbody.sortField = params.order[i][0];
								pbody.orderDirection = params.order[i][1];
							}
						}
						
						//WHERE
					if(params.where && params.where.length){
							var whereArray = [];
							//GROUPS LOOP
							for(var g=0; g<=curWhereGroup;g++){
								
								var curGroup = params.where[g];
								self.log.debug(params);
								
								var where = {}, 
								curField = '',//TOP LEVEL WHERE CLAUSE field
								curCondition = 0;//WITHIN A FIELD, the main OR clauses 
								
								//loop over the where groups
								for(var i=0; i<curGroup.length; i++){
									//within each where group, loop over the joined conditions per parameter
									var column = curGroup[i];
									for(var f=0; f<column.length; f++){
										var field = column[f];
										if(field[0] != curField){
											if(where[field[0]] && where[field[0]] instanceof Array){
												throw Error("FunnelSearch.toString() expected where clauses to be ordered with conditions for each field occuring in order, however received a condition for '" + field[0]+"' after previouslly processing it. We are now on '" + curField +"', please resubmit query and keep the field '"+field[0]+"' occuring one after the other." );
											}
											curField = field[0];
											curCondition = 0;//reset
											//BEGIN A NEW CONDITION
											where[curField] = [ [{"op":field[1], "data":field[2]}] ];
										}else{
											if(typeof(field[3]) == 'string' && field[3].toLowerCase() == 'or'){
												curCondition++;
												//BEGIN A NEW CONDITION "AFTER" the current one by pushing IT INTO A NEW ELEMENT, THIS INDICATES "OR"
												where[curField].push([{"op":field[1], "data":field[2]} ]);
											//default	
											}else{
												//PUSH INTO THE current condition of this field ANOTHER ELEMENT, THIS INDICATES "AND"
												where[curField][curCondition].push({"op":field[1], "data":field[2]});
											}
										}
										
										//
										
										
									}
									
									whereArray.push(where);
								}//end inner for loop for this group
								
							
						}//end loop over groups
						
						pbody.filters = whereArray;					
					}else{
						//alert('backup')
						pbody.filters = [];//bug in Funnel requires filters
					}
					
					self.log.debug("postbody: ");
					self.log.debug(pbody);
					
					postBody = av.data.json.stringify(pbody);
				}
				
				return postBody;
			}
						
			/**
			 * Run Request
			 * @name FunnelSearch.run
	    	 * @methodOf FunnelSearch#
	    	 * @param {String} callback method for the return 
	    	 * @param {String} customJSONPost custom json value
			 * 
			 * @return {FunnelSearch} Returns "this" instance of a FunnelSearch, chainable
			 * 
			 */
			request.run = function(callback, customJSONPost){
				//GET METHODS
				var postData = {};
				if(customJSONPost){
					postData = request.toString(customJSONPost)
				}else{
					postData = request.toString();
				}
				
				request.post = postData;
				
				self.sendRequest(request.endpoint, request.post, callback);
				
				return request;
			}
			
			
			return request;
		}
		
		
		return self.init();
	}
}
