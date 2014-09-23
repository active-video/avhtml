/**
 * @author Chad Wagner, c.wagner@avnetworks.com
 * @fileoverview av.data.xml provides functions that allow the developer to interact with an XML document without the need to parse through nodes; more of a "give me everything" set of functions
 * @version 1.0.20100318
 */

/**
 * av.data.xml provides functions that allow the developer to interact with an XML document without the need to parse through nodes; more of a "give me everything" set of functions - NOTE: av.data.xml is a static object when included, do not re-instantiate instances of av.data.xml; MOST USEFUL FUNCTION: {@link #.xml2json}
 * @namespace av.data.xml provides functions that allow the developer to interact with an XML document without the need to parse through nodes; more of a "give me everything" set of functions; -------!!!!!IMPORTANT!!!!!-------: ALL TAG NAMES ARE CONVERTED TO lowercase (in tag and attribute names), AND ":" colons are replaced with "_" underscores (in tag names); MOST USEFUL FUNCTION: {@link #.xml2json}
 * @version 1.0.20100317
 */

new (function(av){
	var self = this
	av.data.xml = self;
	av.require('string');
	self._version = self.version = "1.0.20100317"
	self._times = [];//
	
	//HTML5 workaround, define XMLDocument locally based on the browser's native XML parser DOMParser
	try{var x = new XMLDocument(); delete x;}catch(eNotYetImplemented){var XMLDocument = function(){var me = this; me['native'] = new DOMParser(); me.loadString = function(str){var d = me['native'].parseFromString(str,"application/xhtml+xml"); me.documentElement = d.documentElement; return me.documentElement;}; return me;}}
	
	
	

//PUBLIC METHODS
	/**
	 * @return {Object} An overview of information related to the version of {@link av.data.xml} being used.
	 * @example print(av.data.xml.about());
	 * //{version:'1.0.20100.18',about:'av.data.xml, namespace to allow interaction to and from XML documents and strings'}
	 */
	self.about = function(){
		return {version : self._version, about : 'av.data.xml, namespace to al...' };
	}
	
	/**
	 * Every time that an XML document is parsed, we store a small amount of information on how efficient it was for you to decide if further efficiency should be considered (ie if it takes 300 ms to parse your XML, and all you need are a few of the child nodes, consider only running xml2array(thoseChildNodes))
	 * @return {Array} An array of each xml2json request completed, useful for judging efficiency
	 * @example var xml = '&lt;items&gt;&lt;item name="product 1"&gt;Cool prod&lt;/item&gt;' +
	 * 		'&lt;item name="product 2"&gt;&lt;price&gt;$35 - great deal!&lt;/price>'
	 * 	+ '&lt;/item&gt;&lt;/items&gt;';
	 * var xmlAsJson = av.data.xml.xml2json(xml);
	 * print(av.data.xml.getElapsedTimes);
	 * [
	 *     {
	 *       "tag": "items",
	 *       "time to parse": "0 (+ or - 20ms)",
	 *       "XML String length (if parsed from string)": 116,
	 *       "result": "({items:{item:[{_attributes:{name:\"produ..."
	 *     }
	 * 
	 */
	self.getElapsedTimes = function(){
		return self._times;
	}
	
	/**
	 * Every time that an XML document is parsed, we store a small amount of information on how efficient it was for you to decide if further efficiency should be considered (ie if it takes 300 ms to parse your XML, and all you need are a few of the child nodes, consider only running xml2array(thoseChildNodes))
	 * @return {Object} { "tag": "items", "time to parse": "0 (+ or - 20ms)",  "XML String length (if parsed from string)": 116, "result": "JSON Object would be here"}]}})"
	 * @example //see getElapsedTimes() - last element of the array in the 
	 * //response is what is returned from   getLastAnalysis()
	 * //Basically same as:
	 * av.data.xml.getElapsedTimes()[av.data.xml.getElapsedTimes().length-1)]
	 */
	self.getLastAnalysis = function(){
		return self._times.length ? self._times[self._times.length-1] : self._times;
	}
	
	/**
	 * Convert any XML-string/documentElement/XML-node into JSON (preserves top level tag name) - while we TRY to cleanup invalid XML; you may want to give it a 2nd pass using some techniques on regexp's if your xml is not parsed as expected, or update the "_clean()" method in the core library (found at https://developer.mozilla.org/En/Core_JavaScript_1.5_Reference/Objects/String/Replace).
	 * @param {String, Object} xmlOrNode Send an XML string or the top level document element, the rest will be done recursively.
	 * @param {Boolean} verbose Set to true for a recursive dive into the object/xml, set to 0 to only return the top level documentElement (ie {'rss':XMLNode} )
	 * @param {Boolean} reduce[true] Should the text nodes and elements with no children be reduced to a simple string data type (true) or kept as {_attributes;{},_text:""} (false) 
	 * @return {Object} The object will contain (a) for each text node, _attributes, _text and (b) for each non-text node, _attributes, _xxx, _yyy (where _xxx and _yyy are similarly nested arrays/objects. Each element whether text or a node will contain an array... even if there is only 1 tag nested at that level.  
	 * @example var xml = '&lt;items&gt;&lt;item name="product 1"&gt;Cool prod&lt;/item&gt;' +
	 * 		'&lt;item name="product 2"&gt;&lt;price&gt;$35 - great deal!&lt;/price>'
	 * 	+ '&lt;/item&gt;&lt;/items&gt;';
	 * var xmlAsJson = av.data.xml.xml2json(xml);
	 * print(JSON.stringify(xmlAsJson));//would result in the object
	 * { 
	 *  "items": {
	 * 	'item':[
	 * 			{
	 * 			 _attributes:{name:"product 1"},
	 * 			 _text:"Cool prod"
	 * 			},
	 * 			{
	 * 			 _attributes: {name:"product 2"},
	 * 			 price:"$35 - great deal!"
	 * 			}
	 * 		]
	 * 	}
	 * }
	 */
	self.xml2json = function(xmlOrNode, verbose, reduce){
		var verbose = verbose == undefined || verbose == null ? true : Boolean(verbose);//default is true, get full tree as a JSON object
		var reduce 
		
		var toReturn = new Object();
		
		//INITIAL CALL ONLY
		self._log.debug("Type="+typeof(xmlOrNode))
		var mainDocumentNode = self.getDocumentElementFromString(xmlOrNode);
		
		if(!mainDocumentNode){
			self._log.error("xml2json() - no top level documentElement found for the XML string received.")
			return null;
		}else{
			self._log.debug({"av.data.xml.xml2json() - top level element":mainDocumentNode})
		}
		
		var tagName = mainDocumentNode.nodeName;
		
		//efficiency tracking
		var start = (new Date()).getTime();
		
		//get the children, or just myself if that's all they want
		toReturn[tagName] = self.getNodeData(mainDocumentNode,verbose, reduce);
		
		//efficiency tracking
		var end = (new Date()).getTime();
		var elapsed = end - start;
		self._log.info("xml2json() - Took " + elapsed + " milliseconds to parse the XML document");
		var xmlStringLength = (typeof(xmlOrNode) == 'string') ? xmlOrNode.length : 'no xmlString, xmlNode sent in';
		self._addTime(tagName, elapsed, xmlStringLength, JSON.stringify(toReturn).substring(0,200));
		
		//all done
		self._log.debug("returning an " + typeof(toReturn))
		return toReturn;
	}
	
	/**
	 * Helper function to allow you to avoid the need to check the "type" of an object before parsing it - plus, we sanitize the string before parsing it, and do a few other techniques if it fails that will save you some hair.
	 * @param {Object, String, XMLNode} xmlOrNode send it (a)an actual XMLDocument, (b) an XML string, (c) an XML Node, and it will give back the first descendant at the top level as an XML node (usually the documentElement, but can be an array of children if you give it an XML string that does not have a valid top level document)
	 * @todo possibly handle a node list?
	 * @example //assume responseText is the XMLHttp.responseText from an RSS feed
	 * var myTopLevelXMLNode = av.data.xml.getNodeData(responseText);
	 * print(myTopLevelXMLNode);
	 * //<rss></rss>   NOTE: the print() statement of XML documents, nodes, and 
	 * //node lists WILL NOT show the children, only the tag name. The
	 * //data is there, it's just accessible via native XMLNode functions
	 * //or by using the av.data.xml helpers 
	 */
	self.getDocumentElementFromString = function(xmlOrNode){
		//parse string into XMLDocument and return documentElement
		if(typeof(xmlOrNode) == 'string'){
			var start = (new Date()).getTime();
			
			var xmlString = self._cleanup(xmlOrNode);
			
			var doc =new XMLDocument();
				doc.validate = true;
				doc.PreserveWhitespace = false;
				//self._log.error("getDocumentElementFromString() - bad XML" + doc.validate);
				try{doc.loadString(xmlString);}catch(eBadXML){}//xerces will throw an error if not caught
			if(doc.documentElement == null || doc.documentElement == undefined){
				self._log.error("getDocumentElementFromString() - no top level documentElement found for the XML string received.")
				
				//FINALLY, try 1 more trick... sometimes people give things like <item>1</item><item>2</item> without a valid top level document element, so allow for this				
				doc.loadString("<document>"+xmlString+"</document>");
				
				if(doc.documentElement == null || doc.documentElement == undefined){
					self._log.debug("STILL UN-ABLE to turn the xml into a valid document - even after further manipulation, by adding a <document> tag at the top level. Sorry, returning null...")
					toReturn = null;	
				}else{
					self._log.debug("SUCCESS IN turning the xml into a valid document - by adding a <document> tag at the top level we were able to turn the xml into a valid document. Proceeding")
					toReturn = doc.documentElement; 
				}
			}else{
				toReturn = doc.documentElement;
			}
		//extract documentElement from the XML Object argument "xmlOrNode", which was already a valid XML document	
		}else if(xmlOrNode && xmlOrNode.documentElement){
			toReturn = xmlOrNode.documentElement;
		//must have already been a node	
		}else{
			toReturn = xmlOrNode;
		}
		
		return toReturn;
	}
	
	/**
	 * This function will convert a string or xml node into a JSON object, nesting _attributes and _text and each childNode, yet has the simplicity of getting just a string if a node has no attributes or non-cdata/non-text children; hence it can be used recursively when verbose = true; NOTE: all tag names are converted to lowercase, and ":" is replaced with "_" in tag names.
	 * @param {Object,String} xmlOrNode Either an XML Node object or a string that can be interpreted as a valid XML document (ie no more than 1 top level element)
	 * @param {Object} verbose
	 * @param {Boolean} reduce[true] Should the text nodes and elements with no children be reduced to a simple string data type (true) or kept as {_attributes;{},_text:""} (false)
	 * @return {Object,String} When a node contains more than 1 child, an array is returned
	 * 			attributes and/or child nodes, an object is returned otherwise. 
	 * 			NOTE: to preserve the full XMLDocument including top level node use {@link #.xml2json}
	 * @example //assume responseText is the XMLHttp.responseText from an RSS feed
	 * var responseJSON = av.data.xml.getNodeData(responseText);
	 * print(JSON.stringify(responseJSON));//would result in the object
	 * //NOTICE: That the top level documentElement "rss" is not present,
	 * //only the content of the top level documentElement is present
	 * {
	 * 	{
	 * 	 _attributes:{
	 * 		 version:"2.0",
	 * 		 'xmlns:amg':"http://rsp.activemediagroup.com/amg/1.0/"
	 * 		},
	 * 	 channel: {
	 * 		title:"Traffic Cams null",
	 * 		description:"Dynamic traffic camfeed for null region",
	 * 		ttl:"1",
	 * 		item:[
	 * 		 '......'
	 * 		],
	 * 	 }
	 * 	}
	 * }
	 * 	 
	 * @todo determine if there is a way to know early on in the function execution whether or not _attributes==null and there is only a singular child node, that way we can just return the text and be done with less iterative logic and improve efficiency.
	 */
	self.getNodeData = function(xmlOrNode, verbose, reduce){
		var verbose = Boolean(verbose);
		var reduce = typeof(reduce) == 'undefined' ? true : Boolean(reduce);
		
		var mainNode;
		
		//XML String handling: Do we need to 1st convert a string to a XMLDocument.documentElement???
		if(typeof(xmlOrNode) == 'string'){
			var xmlString =xmlOrNode;
			mainNode = self.getDocumentElementFromString(xmlString);
			if(!mainNode){
				self._log.error("xml2json() - no top level documentElement found for the XML string received...");
				return null;
			}else{
				self._log.debug('We have an xml documentElement: ' + mainNode);
			}
		}else{
			mainNode = xmlOrNode;
		}
		
		//verbose == false? Return just the xmlOrNode element as an XML object vs continuing 
		//to extract attributes and child nodes if all they want is a valid XML object
		if(!verbose) return mainNode;
		else var toReturn = {};//Continue on getting the attributes and children if verbosity is requested (default)
		
		//for debug purposes
		var tagName = mainNode.nodeName;
		
		//1. Extract attributes (if any)
		var atts = self.xmlNodeGetAttributes(mainNode, verbose);
		if(atts != null) toReturn._attributes = atts;
		
		//1. are there children?
		if(!mainNode.hasChildNodes()){
			//self._log.debug("MAIN NODE nodelist!!!"); //avlogger was confusing arrays and nodelists
			//self._log.debug(mainNode.childNodes);
			//if no attributes, we'll just return the text
			if (atts == null && reduce) {
				toReturn = self.getNodeText(mainNode);
			}else{
				toReturn._text = self.getNodeText(mainNode);
			}
		//There ARE children, let's go grab them!	
		}else{
			var numberOfNonTextChildren = 0;
			for(var i=0; i < mainNode.childNodes.length; i++){
				var child = mainNode.childNodes.item(i);
				var childName = child.nodeName;
				if (childName == '#text' || childName == '#cdata-section') {
					self._log.debug("For " + tagName + " found text node w/ text: " + self.getNodeText(child));
					continue;
				}
				
				numberOfNonTextChildren++;
				self._log.debug("Getting " + (1+i) + " of " + mainNode.childNodes.length + " children for top level " + tagName + ",... " + childName);
				//create an array for child node(s) with this name
				if (!toReturn[childName]) {
					self._log.debug("Child: " + childName + " requires a new array, first " + childName)
					toReturn[childName] = [];
				}
				//add this child node to the array for this childName
				var childData = self.getNodeData(child, verbose, reduce);//verbose passing fix
					self._log.debug({'child data received':childData,'typof(childData)':typeof(childData)});
					self._log.debug("Adding to the array that currently has .length = " + toReturn[childName].length)
					self._log.debug(toReturn[childName]);
				var pos = toReturn[childName].length;
				toReturn[childName].push(childData)
					self._log.debug("Added!");
					self._log.debug(toReturn[childName]);
			}
			
			for(var childName in toReturn){
				if(toReturn[childName] instanceof Array && toReturn[childName].length == 1 && reduce){
					toReturn[childName] = toReturn[childName][0];
				}	
			}
				
			//If there are no attributes and only a singular text node, then nullify the 
			//now overly-complicated data object we were planning to return
			//and just return the text node!
			if (!numberOfNonTextChildren && atts == null && reduce) {
				toReturn = self.getNodeText(mainNode);
			}else if(!numberOfNonTextChildren){
				self._log.debug("Only found text for " + tagName + ", using '" + self.getNodeText(mainNode));
				toReturn._text = self.getNodeText(mainNode);
			}
			
			/*self._log.debug({'all our findings for top level children':toReturn,'with tag name':tagName,'and typeof the toReturn object':typeof(toReturn),'and typeof the first child':typeof(toReturn[tagName]),'and array indicator typeof(firstchild.length':typeof(toReturn[tagName].length),'is array?':(toReturn[tagName] instanceof Array)})
			for(key in toReturn){
				for(key2 in toReturn[key]) self._log.debug({'parent':key,'key2':key2,'val':toReturn[key][key2]})
			}*/
			self._log.debug("Give it all!");
			//self._log.debug(JSON.stringify(toReturn));
			//toReturn = eval(JSON.stringify(toReturn));
		}
		
		return toReturn;
			
	}
	
	/**
	 * Get the attributes of an XMLNode as a name/value paired object; NOTE: all tag names are converted to lowercase, and ":" is replaced with "_" in tag names.
	 * @param {Object} node
	 * @return {Object} null if no attributes, otherwise a name/value paired object
	 */
	self.xmlNodeGetAttributes = function(node){
		var attributes = {};
		
		//if there are attributes
		if (node.attributes && node.attributes.length) {
			for (var i = 0; i < node.attributes.length; i++) {
				var at = node.attributes.item(i);
				attributes[at.nodeName.toLowerCase()] = self.getNodeText(at);
			}
		}else{
			return null;
		}
		self._log.debug(attributes);
		return attributes;
	}
	
	
//PRIVATE METHODS
	self._addTime = function(tagName, elapsed, xmlStringLength, result){
		self._times.push({tag:tagName,"time to parse":elapsed.toString() + ' (+ or - 20ms)','XML String length (if parsed from string)': xmlStringLength, result:result});
	}
	
	self._log = new av.Log(av.getEffectiveLogLevel('data.xml'),'av.data.xml');
	
	/**
	 * Used to replace all <tag:format> with <tag_format> and make all tags lower case. 
	 */
	self._cleanup = function(str){		
		//trim both ends
		str = av.string.trim(str);
		var cleanedString = '';
		var lastCharPointer = 0, i=0;
		//now make replacements of all node names that are not properly formatted... let's start with the namespace:nodeName tags that AVE doesn't understand
		var myregexp = /(<[?:\s|\/*]?[\w]*:?[\w]*)/img;
		
		cleanedString = str.replace(myregexp, 
			//takes in a regular expression match and returns the replacement, where p1...pN are the N parenthetical matched arguments per match
			function(st, p1, offset, s){
				var newMatchedString = st.replace(/:/g, "_").toLowerCase();
				return newMatchedString;
			}
		);
		return cleanedString;
	}
	
	self.getNodeText = function(node){
		return typeof(node.textContent) == 'string' ? av.string.trim(node.textContent) : 
			(	typeof(node.text) == 'string' ?
				node.text : 
				(
					(typeof(node.childNodes) != 'undefined' && 
					node.childNodes.length && 
					typeof(node.childNodes[0].nodeValue) == 'string'
					) 
					? node.childNodes[0].nodeValue : ''
				)
			);
	}
	
	self._getTopLevelNode = function(str){
		str = self._cleanup(str);
		var xmlDoc = new XMLDocument;
		xmlDoc.loadString(str);
	}
	
	return self;
})(av);

//backward compatability
AVXML = av.data.xml;
