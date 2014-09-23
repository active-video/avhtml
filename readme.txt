


============================================================
Version History - Current Version 2.1.2, released 9/23/2014
============================================================


v2.0.0 - 2/17/2012
	- added new library debug.js, version 1.0.0
	- updated core av.js library to support event registration, with 1 event fired accross pages
		"keydown"
		Updated version av.js - 2.1.0
	
v 2.0.01 - 02/27/2012
	- fixed bug when CDATA spans multiple lines within av.data.xml.xml2json
	- added new core method av.hasProperty(nameSpace[, scope]) where scope is by default av
	  but can be set to anything.
	- added new mode for av.data.xml.xml2json and av.data.xml.getNodeData called "reduce"
	  which by default is true, but for more consistency with the XML document original
	  schema, some users may with to never reduce text nodes to a text value, but keep
	  the {attributes:{},_text:"text value"} structure in tact. This is the case
	  especially when a text node may or may not contain attributes so that the implementor
	  may reduce their dependence on type checks ( 	if(typeof(node)) == 'string' ){}else{} )
	  
	  This reduce operator, when set to false, also converts all nodes that have children into
	  an array so that one can consistently handle the 1+ children case, without having to 
	  type-check the child type as an Object vs Array.
	- av.data.xml.xml2json - removed thge & --> &amp; replacement that _cleanup was doing as
	  it broke links.
	  
	  
v 2.0.02 - 03/07/2012

	- av.client: Uses new USM methods, will re-integrate into avhtml. Also re-factored to use the EventInterface wrappers for the client class.
			- Changed it to require intitialization so that he client
			library can be used to send messages and tune without forcing the app dev to see long polling
			when not required by their application.

v 2.0.03 - 03/14/2012
	- av.dom:
		- new methods for calculating coordinates of edge mid-points for dom elements.
			- getCoordinates(elem, side)
			- getXY(elem, direction) 
		- fix to all references to an HTMLElement. Aparantly, if a child page is loaded and the 
		  window.opener compares a DOM node to the window.opener's HTMLElement native object,
		  it will fail to be an instance of it. So (av.doc.createElement('div') instanceof HTMLElement)
		  would be false in child documents. So now we do 
		  (av.doc.createElement('div') instanceof av.doc.defaultView.HTMLElement) to compare a node
		  in that current doc with the native HTMLElement in that doc itself.
	- ads.js, ads.vast.js
		- added support for companion banners
		- handle parent container <video> or <div> now
		- @TODO still need to make sure the position of the ad video player is relative
		  to the body top when nested more deeply in the DOM. May be overly simplistic
		  in that the current calculation method is geared for the ad player container
		  being a direct child of the document.body, not a deeper descendant.  
	- navigation.js
		- offers a new chaser navigation library for layered/grouped elements that can mix
		  spatial navigation with overrides for elements that have explicit navigation needs.
		- uses nearest-edge calculation to determine euclidean distance between 2 nodes in 
		  realation to the top left side of the window/document body.
		  
v 2.0.04 - 03/21/2012
	- client.js depricated
	- session.js replaces client.js

v 2.0.5 - 4/02/2012
	- dom.js
		- added 2nd parameter to dom.js::focus() which allows one to smooth scroll
		  only as much as is needed to get the element into the current view
		- added new method av.dom.scrollIntoView()
	- navigation.js
		- utilizes dom.js::scrollIntoView() to minimize user agent jumping
		  when focusing the next element, which is the default behavior and is
		  generally undesireale.
		  
v 2.0.06
	- dom.js
		- removed accidental global function for getting height of element
	- others
		- added documentation to many functions
	- av.js 
		- rewrote Function.prototype.bind to be overloaded to work 
		  as specified in ECMA-262, 5th edition

v 2.0.7 
	- dom.js
		- scope lost when app is more than 1 page deep and av.dom is loaded in the bottom window
		  during calculation of av.dom.visible() since elem == document is checking if the parentNode
		  was the document where <script scr="dom.js"></script> was loaded. Replaced with elem == av.doc
		  which is the global CURRENT reference to the focused HTMLDocument.
	- ads.js, ads.vast.js
		- added support for iframe/html companions
		- tracking fixes
		- configuration mode fixes for iframe preferences (preferred, not preferred, not allowed)
	- av.js
		- core fix to how av scope is detected, previouslly was using location.href.lastIndexOf('/')
		  to locate if in same directory. Changed to use location.pathname.lastIndexOf('/') since
		  query string could cause a false positive. The importance of this is to ensure that when
		  an app running at /appname/index.html launches an app at /app2name/index.html, it is detected
		  that the path changed and the "av" scope is reinitialized (if it isn't they'd have the same
		  av scope which would not be acceptable to share scope - that was the entire purpose of the 
		  _isOpenerSame(window.opener) function).
		- modified av.load() to load all libraries in the context of the TOP document. This is necessary
		  to ensure that any functions that are used in the included libraries that reside in window
		  do not lose scope. This IS THE CASE with, for example, parseFloat, which is actually defined 
		  in the window scope (window.parseFloat) as is setTimeout
	- apis.funnel.js
		- feedName in the API post body is now feedNames, and is not a comma separated list but
		  an actual array of feed names
	- reader.js
		- allow for media_content which is the JSON interpretation of media:content based on the latest
		  version of data.xml.js (all ":" are mapped to "_" in node names to ensure javascript friendly
		  key/value pairs can be used with x.y syntax in any script eval()'ing the JSON).
		- added a version number to reader

v 2.0.8
	- ads.js, ads.vast.js
		- added support for video ads that are tagged as "streaming", but stream over HTTP so are
		  actually compatible and should be allowed to return true from canPlay()
	- reader.js 
		- added support for additional enclosure types in the function to detect video source file

v 2.0.9
	- session.js
		- added method for getClientInfo()
		- added ERROR thrown whenever a method is called from the browser if navigator.userAgent does 
		  not contain the string "cloud"
	- av.js
		- added new requireHead, and av.html.loadScriptDocumentWrite() to allow for synchronous and 
		  cache friendly and console.log(line number) friendly script insertion. Must use in script block
		  all by itself to work
		  
v 2.0.10
	- added new config option, av.logServer, of the format ws://someserver.com:somePort/ which will
	  send all log messages to the server in addition to console
	- ResourceHandler.js
	   - added EventInterface to outer ResourceHandler object, this way you can be notified when all images 
	     have loaded. Note, it fires prematurely which we can fix later, it fires at (TotalImageCount - MaxConcurrency + 1)
	     images loaded 
		
v 2.0.11 (07/15/2012)
    - av.js
        - resolves bug in av.addEventListener() where only 1 event listener was allowed for load/refocus/focus 
          events.
        - added new event on the av object called "unload" which gets fired when the primary page is unloaded. This 
          will only fire when launching a new HTML page as the platform does not respect unload on session end.
    - tracker.js
        - added tracker library
        - provides events suitable for use by 3rd party developers, although CloudTV Insight's logging specification is
          evolving, most events are locked in. 
          - page-view (whenever a page is update to a new page, even if ajax style div swap)
          - video-start/video-end/video-pause (we also keep track of the Funnel video id in resp.posts[0].id back from Funnel and include that with each reporting event for that video
          - app-stop – when the user exits the application, track the app stop
          - api-req/api-resp – we track all api calls, to measure when they started and subsequently in the api-resp event we track the total time spent
          - data – if gathering the zip code of a user, or a search term, or other user input, you can use the data event to track that the data was captured, and if not sensitive, you can also include the data input by the user
v 2.0.12 (7/17/2012)
    - tracker.js
        - added a new 'api-start' event for when an app starts
        - made the error messages a little more friendly to developers
v 2.0.13 (8/13/2012)
    - av.js
        - added CONST style keycodes to av.keyCodes.XXX which can be used in switch statements. Verified on moto STBs
    - All library files have had session.*** depricated from dhtml  
    
v 2.1.0
    - av.js
        - turned av.Log into a configurable log level, so calling av.log.setLogLevel(?) one can update the log level. Any 
          instance of logger can be update this way (av.dom.log.updateLogLevel(0) for example)
          
v 2.1.1
    -av.js
        - minor bug fixes, code level, no api changes   
       
v 2.1.2
    -av.js
	-no changes.
    -keyboard.js
        - conversion of keyboard.js - images replaced with css.
