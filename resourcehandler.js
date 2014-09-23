if(!av.ResourceHandler){
    av.require('EventInterface');
    
    /**
     * ResourceHandler is a generic image loading function which has some more 
     * versatile abilities including memory management than your typical pre-loading
     * script (although it can be used for pre-loading as well).
     * 
     * It is a first-in, first-out image caching preloader which ensures that images
     * persist in memory beyond their initial load. It is simple though in the sense
     * that it is first-in, first-out. The only sophisticated mechanism we have to
     * refresh the cache is that upon triggering a new "addLinkedResource" we reuse and 
     * move to the top of the cache any URL that already existed - hence keeping most
     * recently USED items at the top. 
     * 
     * To benefit from this caching, you should call ResourceHandler.addLinkedResource(url, elem)
     * every time you want to set the source of an image that MAY LIVE in the cache
     */
    av.ResourceHandler = function(){
        var self = this;
        self.version = '1.0.2';
        
        new av.EventInterface(self, true);
        
        /**
         * Should we call .load() each time an element is added?
         */
        self.autoLoad = av.getConfigValue('ResourceHandler.autoLoad', false);
        
        /**
         * An instance of a new av.Log()
         */
        self.log = new av.Log(av.getEffectiveLogLevel('ResourceHandler'),'av.ResourceHandler');
        
        /**
         * To reduce overhead, we need to know the logLevel internally to decide
         * if we will getStats() after we are done loading
         */
        self.logLevel = av.getEffectiveLogLevel('ResourceHandler');
        
        /**
         * Controls the number of connections to resources, no more than this many simultaneously
         */
        self.maxConcurrentConnections = av.getConfigValue('ResourceHandler.concurrency', 5);
        
        /**
         * Peak concurrency observed
         */
        self.peakConcurrency = 0;
        
        
        /**
         * The number of resources to hold until purging from the resource array
         */
        self.maxCacheSize = av.getConfigValue('ResourceHandler.cacheSize', 100);
        
        /**
         * The state of the ResourceHandler - valid states are "loading" and "ready".
         * Note that after ready, subsequent calls to .load() can trigger the "loading"
         * state again
         */
        self.state = '';
        
        /**
         * @TODO Some basic statistics
         */
        self.stats = {}
        
        /**
         * Will not load any URL if it still exists in resources, which represents the cache
         * we hold onto to ensure memory management can serve images from cache and not from
         * disk on subsequent loads of the same images. This assumes that we have no memory
         * managed cache (in CloudTV we do not to reduce memory footprint per-session)
         * 
         * We went with an Object instead of an Array because every image that gets
         * added will require a search to see if it's already there, so adding N
         * images requires N! total searhces. Using an object we can call the native 
         * Object.keys(resources) to get a list of urls, and then Object.keys(resources).indexOf(url)
         * to determine the index of the URL and iterate to the next one WITHOUT a for(var prop in resources)
         * to get there. This makes up a lot of the speed difference we may have encountered
         * in searching for a URL position or the "next" URL position. 
         * 
         * @private
         */
        var resources = self.resources = {};
        
        /** 
         * The number of assets we are currently loading
         * @private
         */
        var resourcesCurrentlyLoading = 0;
        
        /**
         * Keep track of the last url we tried to load, this is like our offset in 
         * the resources={} object, as "i" might be in an array
         */
        var lastURL = '';//the last URL we loaded
        
        /**
         * Set the number of simultaneous resources that can be loaded in parallel
         * @param {Number} n The number of concurrent resources that can be loaded, also able 
         * to be set using window.config.ResourceHandler.concurrency = 20, for example.
         */
        self.setConcurrency = function(n){
            var n = parseInt(n, 10), isNumeric = !isNaN(n);
            if(isNumeric){
                self.maxConcurrentConnections = n;
                return true;
            }
            return false;
        }
        
        /**
         * Set the number of resources that can be cached before we trigger internal
         * memory cleanup of older resources
         * @param {Number} n The number of concurrent resources that can be loaded, also able 
         * to be set using window.config.ResourceHandler.concurrency = 20, for example.
         */
        self.setCacheSize = function(n){
            var n = parseInt(n, 10), isNumeric = !isNaN(n);
            if(isNumeric){
                self.maxCacheSize = n;
                return true;
            }
            return false;
        }
        
        self.getStats = function(){
            var errors = success = queued = loading = total =  0, totalTime = 0, avg = 0, startBatch = Date.now(), endBatch = 0;
            for(var url in resources){
                total++;
                if(resources[url].elapsed){
                    totalTime+=resources[url].elapsed;
                    avg++;
                    startBatch = Math.min(startBatch, resources[url].start);
                    endBatch = Math.max(endBatch, resources[url].end);
                    
                }
                switch(resources[url].state){
                    case 'error':
                        errors++;
                        break;
                    case 'ready':
                        success++;
                        break;
                    case 'loading':
                        loading++;
                        break;
                    case '':
                    default:
                        queued++;
                        break; 
                }
            }
            return {
                success : success,
                loading : loading,
                errors : errors,
                queued : queued,
                currentlyLoading : resourcesCurrentlyLoading,
                maxConcurrency : self.maxConcurrentConnections,
                cacheSize    : total,
                state   : self.state,
                averageLoadTime : avg ? (totalTime/avg + 'ms') : Math.infinity,
                peakConcurrency : self.peakConcurrency,
                batchStart : startBatch,
                batchEnd : endBatch,
                totalTime : (endBatch - startBatch) + 'ms',
                lastUrlLoaded : lastURL,
            }
        }
        
        self.getResources = function(){
            return resources;
        }
        
        self.setImage = function(url, elem, background, evt){
            var background = typeof(background) =='boolean' ? background : false;
            var curUrl = elem.getAttribute('currentAsset');
            if(curUrl == url){
                if(evt){
                    self.log.debug("Image for element " + elem + " was loaded in " + evt.data.elapsed + " ms: " + url);
                }
                elem.removeAttribute('currentAsset');
                if(background){
                    elem.style.backgroundImage = "url('"+url+"')"
                }else{
                    elem.src = url; 
                }
                
            }else{
                self.log.debug("Image for element " + elem + " was stale by the time it loaded: " + url + ", should be " + curUrl);
            }
            
        }
        
        self.addResources = function(resources){
            var resources = typeof(resources) != 'undefined' ? resources : [];
            for(var index in resources){
                if(typeof(resources[index]) == 'string'){
                    self.addResource(resources[index]);
                }else{
                    var e = resources[index];
                    self.addResource(e.url, e.elem, e.background);
                }
            }
        }
        
        self.addResource = function(url, elem, background){
            var background = typeof(background) =='boolean' ? background : false;
            var elem = typeof(elem) != 'undefined' ? av.dom.get(elem) : false;
            if(typeof(url) != 'string'){
                throw new TypeError("av.ResourceManager.addLinkedResource() expects argument 1 to be a URL string, received " + url);
            }
            
            //Still cached? Move to top of cache
            if(resources.hasOwnProperty(url)){
                var r = resources[url];
                delete(resources[url]);
                resources[url] = r;
                //already loaded? Just set the src and skip it
                if(r.state == 'ready' && elem){
                    
                    if(background){
                        elem.style.backgroundImage = "url('"+url+"')"
                    }else{
                        elem.src = url; 
                    }
                    
                    return true;
                }else if(elem){
                    r.addEventListener('load', self.setImage.bind(self, url, elem, background));
                }
            }else{
                //move into queue
                var r = new av.ResourceHandlerResource(url);
                if(elem){
                    r.addEventListener('load', self.setImage.bind(self, url, elem, background));
                }
                r.addEventListener('load', self.decrementLoading)
                r.addEventListener('error', self.decrementLoadingFailed.bind(self, url));
                
                resources[url] = r;
            }
            
            //Keep track of current asset loading, any older ones loaded that this 
            //element may have been subscribed to will be ignored.
            
            if(elem){
                elem.setAttribute('currentAsset', url);
            }
            
            self.log.debug("Added asset " + url + " to the queue");
        }
        
        /**
         * Handles the simple reduction of current count, and chains that with logic
         * that might need to resume when resource load goes down
         */ 
        self.decrementLoading = function(){
            resourcesCurrentlyLoading--;
            self.processQueue();
            
        }
        
        self.decrementLoadingFailed = function(url, evt){
            
            resourcesCurrentlyLoading--;
            delete resources[url];
            self.log.info("Error loading '" + url+"'");
            
            self.processQueue();
        }
        
        /**
         * Will iterate over images until queue is full to self.maxConcurrentConnections,
         * and can be called whenever resourcesCurrentlyLoading-- occurs. Also triggered
         * when .load() is called.
         * 
         * @return {Number} number of items we started loading during this iteration or any
         * recursive calls during this iteration
         */
        self.processQueue = function(){
            var prev = lastURL
                ,next=0
                ,keys = Object.keys(resources);
            
            if(resourcesCurrentlyLoading >= self.maxConcurrentConnections){
                return 0;//no slots left in concurrency
            }else if(!keys.length){
                self.state = '';
                return 0;
            }
            
            //if we have a previous image, go find it, so we can step on to the next one
            if(prev){
                var current = keys.indexOf(prev);
                if(current != -1){
                    next = current+1;   
                }
            }
            
            //don't process any already loaded or currently loading ('ready' or 'loading') resources
            while(resources[keys[next]] && resources[keys[next]].started()){
                next++;
            }
            
            //if we hit the end and didn't find any needing to be loaded still, return
            if(!resources[keys[next]]){
                if(self.state == 'ready'){
                    //some threads still out, but no more left to run, notify ready.
                    
                    //@TODO there still could be MaxConcurrency images left which are not yet ready
                    return;
                }
                if(!self.logLevel){
                    var stats = self.getStats();
                    self.dispatchEvent('ready', stats)
                    self.log.debug("Done with this round of resource loading", stats);
                }else{
                    self.dispatchEvent('ready',{total:keys.length, state : self.state});
                }
                self.state = 'ready';
                return 0;//no more resources that need processing
            }
            
            //start a load
            self.state = 'loading';
            resourcesCurrentlyLoading++;
            self.peakConcurrency = Math.max(self.peakConcurrency, resourcesCurrentlyLoading);
            
            lastURL = resources[keys[next]].getUrl();//update global private variable with the current URL
            resources[keys[next]].load();
            
            return 1 + self.processQueue();//recursively go until we max out the queue
        }
        
        self.load = function(){
            if(self.state == 'loading'){
                return 1;
            }else{
                self.state = 'loading';
                self.processQueue();
            }
        }
        
        
        
        
        
        /**
         * Private method which will cleanup any images beyond what was loaded
         */
        var cleanHouse = function(){
            var keys = Object.keys(resources), toRemove = keys.length-self.maxCacheSize;
            if(keys.length > self.maxCacheSize){
                for(var i=0; i<toRemove; i++){
                    //if this does not do what we want, check resources[keys[i]].state != 'loading' if you desire the laoding to stick around
                    delete resources[keys[i]];
                }
            }
        }
        
        
        return self;
    }
    
    av.ResourceHandlerResource = function(url){
        var  self = this
            ,src = url;
        
        self.state = '';//empty or "ready"
        self.type = 'img';//in future allow others
        self.start = 0;
        self.end = 0;
        self.elapsed = 0;
        
        self.getState = function(){
            return self.state;
        }
        
        /**
         * Returns a boolena, true if already started loading, false otherwise
         */
        self.started = function(){
            return self.state != '';
        }
        
        self.getUrl = function(){
            return src;
        }
        
        self.resource = new Image();
        
        self.load = function(){
            if(!self.state){
                self.start = Date.now();
                self.state = 'loading';
                self.resource.src = src;
                return true;
            }else{
                //should we fire off a "ready" event again? It was already ready, so what should this
                //re-referenced state be called?
                
                return 1;//let 1 === return vs true === return be the differentiator in terms of what we did. 1 means it was already loaded
            }
            
        }
        
        new av.EventInterface(self, true);
        
        /**
         * Register for the onload and onerror events
         */
        self.resource.onload = self.resource.onerror = function(evt){
            //update the state of the ResourceHandlerResource
            if(evt.type == 'error'){
                self.state = 'failed';
            }else{
                self.state = 'ready';
            }
            self.end = Date.now();
            self.elapsed = self.end - self.start; 
            
            evt.elapsed = self.elapsed;
            
            self.dispatchEvent(evt.type, evt);
            
            //remove event listeners to conserve memory
            if(evt.type == 'load'){
                self.resetEventListeners('error');
                self.resetEventListeners('load');
            }else{
                self.resetEventListeners('error');
            }
        }
        
        return self;
    }
}
