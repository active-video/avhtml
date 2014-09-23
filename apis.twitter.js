/**
 * @fileoverview Interact with Twitter via their asynchronous JSON-p APIs
 */

if(!av.exists('av.apis.witter')){
	av.require('net','data.json', 'string');
	
	av.apis.Twitter = function(){
		var self = this;
		
		self.log = new av.Log(av.getEffectiveLogLevel('apis.twitter'),'av.apis.twitter');
		
		self.urls = {
			'search' : 'http://search.twitter.com/search.json?q=[[query]]&from=[[from]]&geocode=[[geocode]]&since_id=[[since_id]]&rpp=[[rpp]]',
			'user_tweets' : 'http://api.twitter.com/1/statuses/user_timeline.json?screen_name=[[screen_name]]&since_id=[[since_id]]&include_entities=[[include_entities]]&count=[[count]]&filter=[[filter]]',
			'user'	: 'http://api.twitter.com/1/users/lookup.json?screen_name=[[screen_name]]&user_id=[[user_id]]&include_entities=[[include_entities]]',
			'details' : 'https://api.twitter.com/1/statuses/show.json?include_entities=true&contributor_details=[[contributor_details]]&id=[[id]]',
			'images' : 'http://search.twitter.com/search.json?q=[[query]]+.jpg&geocode=[[geocode]]&include_entities=true&rpp=[[rpp]]',
			'user_images' : 'https://api.twitter.com/1/statuses/media_timeline.json?offset=0&count=100&score=true&filter=false&include_entities=true&screen_name=[[screen_name]]',
		}
		
		/**
		 * The twitter class comes predefined with several 
		 */
		self.addURL = function(objectOrString, val){
			if(typeof(objectOrString) != 'string'){
				for(var urlName in objectOrString){
					self.addURL(urlName, objectOrString[urlName]);
				}
			}else{
				self.urls[objectOrString] = val;
			}
		}
		
		/**
		 * Call a method in the 
		 * @param {String} name of api method to call, must be one of av.twitter.urls{}
		 * @param {String,Function} a string that represents a global function ,else an actual function
		 * @param 
		 * 
		 */
		self.call = function(method, callback, options){
			var url = av.getProperty(self.urls, method, '');
			
			if(!url){
				self.log.error("Cannot call twitter API method '" + method + "' method does not exist" );
				callback(false);
				return false;
			}
			console.log('options:'); console.log(options);
			
			var url = typeof(options) == 'object' ? av.string.populateTemplate(self.urls[method], options) : self.urls[method];
			
			return av.net.jsonp(url, callback)
		}
		
		
		return self;
	}
	
	
	av.apis.twitter = new av.apis.Twitter();//single instance so that users can have more than 1 outside of the av.apis namespace if they like
}
