/**
 *  @fileoverview reader.js creates a static class used for reading remote RSS and other feeds
 */

if(typeof(av.Reader) != 'function'){
	
(function(av){
	av.require('string','data.xml', 'data.json', 'net', 'list');
	/**
	 * 
	 * @constructor
	 * @param {Object} [config.params={}] An object with the default parameters to use in all requests URLs, such as a common api-key if your feed URLs require it
	 * @param {String} [config.itemLocation=item] The tag/property to consider, at whatever depth it occurs, as a "item" to include in the response - so if books or book hold the value, send "book" as we default to "item" as is standard in RSS 2.0
	 * @param {Boolean} [config.convertXML=true] If you would prefer not to receive parsed XML and just want an array of all XML Elements matching your itemLocation name, then set this flag to false
	 * @param {String} [config.itemHTML=<article><h1>[[title]]</h1><p>[[imageHTML]][[description]]</p>] If config.convertXML is true, the item data will be used to create an "html" property in the returned object; it will contain the itemHTML provided here populated items.length time with all item data
	 * @param {String} [config.f=a] A comma-separated list of all tags  
	 */
	av.Reader = function(config){
		var self = this;
		self.version = "1.0.1";
		
		var config = av.mergeObjects(av.getConfig('reader'), config);
		var defaultConfig = {
			params : {},
			itemLocation : 'item',
			convertXML : true,	
			stripTags : 'a,embed,object,applet,img,iframe',
			detailsHTML : '',
		}
		config = av.mergeObjects(defaultConfig, config, false);
		
		
		var options = {convertXML:false, evalXML: true, evalJSON : true};
		
		var log = new av.Log(av.getEffectiveLogLevel('dom'),'av.dom')
		
		/**
		 * Set the options used in XMLHttp Requests, such as maxTries, etc - @see av.Net.createRequest
		 */
		self.setOptions = function(name, value){
			options[name] = value;
		}
		
		/**
		 * Load a feed from a given URL, which will trigger a chain of call + parse + normalize on the data URL, your callback will receive this normalized data
		 * @param {String} url The URL to request, containing named variables like [[format]] is OK as we do a pass to av.string.populateTemplate() with the url and any params (3rd argument)
		 * @param {Function} callback The function to call when the data from the feed has been retrieved - you will receive an object with the properties: data, elapsed (parse time), end (timestamp), items, itemsRaw (if XML), start, and html (
		 	
		 )
		 */
		self.load = function(url, callback, params){
			var params = av.mergeObjects(config.params, typeof(params) == 'object' ? params : {});
			var url = av.string.populateTemplate(url, params);
			var cback = self.onLoadURL.bind(self,callback);
			
			return av.net.makeRequest(url, cback, null, null, options);
		}
		
		self.getImage = function(item){
			var image = '';
			if(item.image){image = item.image;}
			else if(item['media:thumbnail'] && item['media:thumbnail']._attributes && item['media:thumbnail']._attributes.url){image = item['media:thumbnail']._attributes.url;}
			else if(item['media_thumbnail'] && item['media_thumbnail']._attributes && item['media_thumbnail']._attributes.url){image = item['media_thumbnail']._attributes.url;}
			else if(item['media:content'] && item['media:content']._attributes && item['media:content']._attributes.url && ( (item['media:content']._attributes.type && item['media:content']._attributes.type.indexOf('image') != -1) || item['media:content']._attributes.url.indexOf('.jp') != -1 )){image = item['media:content']._attributes.url;}
			else if(item['media_content'] && item['media_content']._attributes && item['media_content']._attributes.url && ( (item['media_content']._attributes.type && item['media_content']._attributes.type.indexOf('image') != -1) ||  item['media_content']._attributes.url.indexOf('.jp') != -1)  ){image = item['media_content']._attributes.url;}
			//enclosure
			else if(item.enclosure && item.enclosure._attributes && item.enclosure._attributes.type && item.enclosure._attributes.type.indexOf('image') != -1){image = item.enclosure._attributes.url}
			else if(item['media:thumbnail']){image = item['media:thumbnail'];}
			else if(item['itunes:image'] && item['itunes:image'].href){image = item['itunes:image'].href;}
			else if(item['itunes_image'] && item['itunes_image'].href){image = item['itunes_image'].href;}
			else{
				var images = av.data.json.jsonPath(item,'$..media:thumbnail');
				if(!images){images = av.data.json.jsonPath(item,'$..media_thumbnail');}
				//alert(images);
				//console.log('images', JSON.stringify(item));
				if(images.length && images[0] && images[0]._attributes && images[0]._attributes.url){
					var image = images[0]._attributes.url;
				}
			}
			return image;
		}
		
		self.getVideo = function(item){
			var video = '';
			if(item.video){video = item.video;}
			//enclosure
			else if(item.enclosure && item.enclosure._attributes && item.enclosure._attributes.type && item.enclosure._attributes.type.indexOf('video') != -1){video = item.enclosure._attributes.url}
			else if(item['media:content'] && item['media:content']._attributes && item['media:content']._attributes.url && item['media:content']._attributes.type && item['media:content']._attributes.type.indexOf('video') != -1){video = item['media:content']._attributes.url;}
			else if(item['media_content'] && item['media_content']._attributes && item['media_content']._attributes.url && item['media_content']._attributes.type && item['media_content']._attributes.type.indexOf('video') != -1 ){video = item['media_content']._attributes.url;}
			//else if(item['media:thumbnail']){image = item['media:thumbnail'];}
			
			return video;
		}
		
		self.getJSONElementByName = function(elemName, obj){
			var elems = []
			for(var prop in obj){
				if(prop == elemName){return obj;}
				else{elems.push(elemName);}
			}
			for(var i=0; i<elems.length; i++){
				var resp = self.getJSONElementByName(obj[elems[i]]);
			}
		}
		
		self.onLoadURL = function(cback, request){
			log.debug("Loaded data from " + request.url);
			
			//for(var prop in request){log.debug('request.'+prop); log.debug(request[prop]);}
			//log.debug(request.responseXML);
			log.debug("responseXML xml");
			log.debug(request.responseXML);
			var xml = request.responseXML;
			var json = request.responseJSON;
			var response = {
				data : json ? json : xml,
				html : '',	
			};
			
			//for(var prop in request){console.log(prop, request[prop]);}
			
			var items = [];
			
			//is it JSON
			if(json){
				response.items = [];
				var itemsFound = av.data.json.jsonPath(json, '$..' + config.itemLocation);
				if(itemsFound && itemsFound.length){
					items = itemsFound[0];
					for(var i=0; i<items.length; i++){
						items[i].image = self.getImage(items[i]);
						if(items[i].image){items[i].imageHTML = '<img src="' + items[i].image + '" />'; }
					}
				} 
			//is it JUNK?		
			}else if(typeof(xml) == 'undefined'){
				response.error = 'No XML Returned from ' + request.url;
				
			//is it XML?
			}else{
				response.start = Date.now();
				itemsXML = xml.getElementsByTagName(config.itemLocation);
				response.itemsRaw = itemsXML;
				if(config.convertXML && itemsXML.length){for(var i=0; i<itemsXML.length; i++){
					//log.debug(itemsXML[i])
					var json = av.data.xml.xml2json(itemsXML[i]);
					var item = json[config.itemLocation.toLowerCase()];
					
					//normalize image location
					item.image = self.getImage(item);
					if(item.image){item.imageHTML = '<img src="' + item.image + '" />'; }
					
					//normalize video location
					item.video = self.getVideo(item);
					if(item.video){item.videoHTML = '<video src="' + item.video + '"></video>'; }
					
					items.push(item);
				}}else{
					//alert(itemsXML);
					response.items = Array.prototype.slice.call(itemsXML);
					items = null;
				}
				
				response.end = Date.now();
				response.elapsed = response.end - response.start;
				log.debug("Took " + response.elapsed + 'ms to parse XML'); 
			}
			
			if(items){
				var lastIndex = items.length-1;
				for(var i=0; i<items.length; i++){
					if(items[i].description){
						items[i].description = av.string.decodeEntities(items[i].description);//.replace(/\&amp;/g,'&').replace(/\&lt;/g,'<').replace(/\&gt;/g,'>');
						if(config.stripTags){
							console.log('stripping', items[i].description);
							if(typeof(config.stripTags) == 'function'){
								items[i].description = items[i].description ? config.stripTags(items[i].description) : items[i].description;
							}else{
								items[i].description = av.string.stripTags(items[i].description, config.stripTags);	
							}
						}else{
							console.log('not')
						}
					}
					items[i].previous = i ? i-1 : 0;
					items[i].next = i == lastIndex ? i : i+1;
				}
				response.items = items;
				var l = new av.List({itemHTML : config.itemHTML, items: items, detailsHTML : config.detailsHTML, holder: config.holder});
				
				var list = l.getList();
				response.html = list.html;
				//alert(response.html);
			}
			
			log.debug("Response:");
			
			av.require('data.json');
			//for(var i in response.items) log.debug("\n"+av.data.json.stringify(response.items[i]));
			
			
			cback(response);
		}
		
		
		return self;
	}
	
	av.reader = new av.Reader();
})(av);	
	
	
}
