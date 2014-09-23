/**
 * @fileoverview Provides a generic interface for tracking, which by default tracks to CloudTV Insight, but 
 * can be extended to track elsewhere
 */

av.require('EventInterface')
if(typeof(av.tracker) != 'function'){
    /**
     * @namespace av.tracker 
     * @requires av.EventInterface ({@link av.EventInterface})
     * @requires av.net ({@link av.net}) 
     * @extends av.EventInterface
     */
    av.tracker = new (function(){
        var self = this;
        self.keyPressCount  = 0;
        self.startTime      = Date.now(); 
        
        self.onkeypress = function(evt){self.keyPressCount++;}
        av.addEventListener('keydown', self.onkeypress);
        
        /**
         * Contains the version of the av.tracker library that is being used; Released 06 / 12 / 2012 ; 
         * @name av.tracker.version
         * @type String
         */
        self.version = '1.1.0';
        
        var loc = location.href.split('/');
        var appName = loc.length > 2 ? loc.slice(-3,-2).join('_') : loc.slice(-2).join('_');
        
        self.appName = av.getConfigValue('app.appName', appName);
        self.appVersion = av.getConfigValue('app.version', '');
        
        self.autoAppStop = av.getConfigValue('tracker.autoAppStop', true);
        
        /**
         * Will contain required properties for each type of message, based on schema for INSITE, and can be used
         * to throw error messages that are developer friendly... only required fields are included here, optional
         * fields are in typesOptional
         */
        self.types = {
            'page-view' : {'url' : "The URL of the page, including hash if page within a page", 'title' : 'The page title'},//cat,subcat optional
            'click' : {title : "A description of the click, such as 'ok'", page : "The URL or description of the page, such as 'Details - Terminator - Rent - 'OK'"},
            
            'app-stop' : {},
            'app-start' : {},
            
            'video-start' : {url : "The video URL", title : "The title of the video"},
            'video-pause' : {url : "The video URL", title : "The title of the video", sUtc:"Start time of the most recent video play() in UTC milliseconds, try Date.now()"},
            'video-end' : {url:"Source URL of the video",sUtc:"Start time of the most recent video play() in UTC milliseconds, try Date.now()"},
            
            'mosaictile-view' : {url : "The URL of the mosaic tile",title : "The title of the mosaic tile, for example 'Basketball'"},
            
            'vod-usage' : {
                act:"'infoView' when the user visits info screen of an item, 'preview' when an item is previewed by the user, 'watchDialog' when s(he) visits the watch dialog, 'watch' when s(he) watches it, 'rentDialog' when s(he) visits the rent dialog, 'rent' when an item is rented, 'subscribe' when the user chooses to subscribe (indicator for upsell), 'save' when the user saves an item.",
                src:"Source of the event – search, poster, title, savedPrograms, infoScreen.",
                pSid:"Parent session id",
                previewPAID : "Programmer ID Asset ID (PAID) of the preview sourced from UDB.",
                PAID : "Programmer ID Asset ID (PAID) of the asset sourced from UDB.",
                path : "vod or iguide",
            },
            "vod-perf" : {
                 keyStart : "Keystroke start time in UTC ms."
            },
            'vod-err' : {"error":"Description of error that occured"},
            
            'api-req' : {api : "The name of the API, for example 'facebook' or 'twitter'", act : "The action performed in this API call, for example 'like', 'unlike', 'retweet'"},
            'api-res' : {api : "The name of the API, for example 'facebook' or 'twitter'", act : "The action performed in this API call, for example 'like', 'unlike', 'retweet'"},
            'api-error' : {api : "The name of the API, for example 'facebook' or 'twitter'", act : "The action performed in this API call, for example 'like', 'unlike', 'retweet'"},
            'data' : {act : "The action which ended in data, such as 'set-zipcode'"},
            
            'error' : {cat : "The category of the error, for example 'api', or 'ui'"},
            
            '*' : {'subject' : "This event must have a 'subject' property"}
        }
        
        self.typesOptional = {
            'page-view' : {cat : "The category of the page", subcat : "The sub-category of the page"},
            'app-stop' : {target : "The target of this stop, for example tv://123 or tv://last or 'apps channel main' or 'tag://bejeweled'", keyPresses : "The number of keypresses logged throughout the session", exitType : "The type of exit this is, contextually can be any value"},
            'click' : {url : 'The URL of the page that is being navigated to because of this click', cat : "The category of this click", subcat : "The sub-category of this click"},

            'api-error' : {cat : 'category of error', error : 'Any additonal specific information'},
            'api-req' : {message : 'Any additonal information'},
            'api-res' : {message : 'Any additonal information'},
            
            
            'video-start' : {fid : "The Funnel ID of the asset", cat : "The category of the video", subcat : "The subcat of the video"},
            'video-pause' : {fid : "The Funnel ID of the asset", cat : "The category of the video", subcat : "The subcat of the video"},
            'video-end' : {fid : "The Funnel ID of the asset", cat : "The category of the video", subcat : "The subcat of the video"},
            
            'mosaictile-view' : {fid : "The Funnel ID of the asset", cat : "The category of the video", subcat : "The subcat of the video"},
            
            'data' : {val : "The value of the data"},
            
            'error' : {subcat : "The sub-category of the error, for example '404', or 'unreachable', or 'timeout'. This can later be used to report on the number of errors based on a header like 404 or 500, and any other segmentation that the app developer sees as a good segment to have.", severity : "One of info, warning, error, or fatal", uri : "The URI of the error, either to the API or relevant endpoint. If UI, include the URI of the current page and any hash needed to identify the state of that page, i.e 'http://localhost/app/index.html#videoPreview'", message : "A message of no more than 1024 characters in length, including all spaces, that can help later identify the state of the app or anything needed to understand this error."},
            
            'vod-usage' : {
                desc:"Description of the event (for search, this should be the search term).",
                prev : "1 if previewed before vod event, 0/emtpy otherwise",
                free : "1 if free, 0/emtpy otherwise",
                saved : "1 if the asset was a saved asset, 0/empty otherwise",
                paren : "1 if parental controls are enabled, 0/empty otherwise",
                pur : "1 if purcase pin is set/enabled, 0/empty otherwise",
                subs : "1 if a subscribed asset, 0/empty otherwise",
                ret : "Return code from the 3rd party client"
            },
            "vod-perf" : {
                 udb : "UDB call name",
                 udbStart : "UDB call start time in UTC ms",
                 udbRet : "UDB call end time in UTC ms",
                 start : "Start position",
                 max : "Max items"
            }
        }
        
        //templates for certain properites that are used in messages
        self.templates = {
            "page-view" : {
                "url" : function(){return av.doc.defaultView.location.href;},
                "title" : function(){var t = av.doc.querySelector('title'); return t ? t.innerHTML : '';}
            },
            "video-start" : {
                "utc" : function(){return Date.now();}
            },
            "video-pause" : {
                "sUtc" : "video-start.utc",
                "title": "video-start.title",
                 "url": "video-start.url",
                 "fid": "video-start.fid",
                 "cat": "video-start.cat",
            },
            "video-end" : {
                "sUtc" : "video-start.utc",
                "title": "video-start.title",
                "url": "video-start.url",
                "fid": "video-start.fid",
                "cat": "video-start.cat",
            },
            
            'vod-usage' : {
                pSid:function(){return "";},
                previewPAID : function(){return "";},
            },
            "app-stop" : {
                keyPresses : function(){return self.keyPressCount;},
                sUtc       : function(){return self.startTime;},
            },
            "vod-perf" : {
                keyStart   : function(){return Date.now();}
            }
           
        }
        
        self.init = function(){
            if(self.autoAppStop){
                
            }
        }
        
        /**
         * Because some events expect state, and knowledge of a previous event, we keep track of 
         * certain state properties in this object when tracking an event that may have 2 parts
         * like a load and unload, where the unload needs knowledge of something from the load
         */
        self.states = {
            'video-start.utc' : false,
            'video-start.title' : false,
            'video-start.url' : false,
            'video-start.cat' : '',
            'video-start.fid' : '',
        }
        
        /**
         * A an av.Log object that can be used internally and from inner objects/functions to manage
         * logging verbosity
         * @private
         */
        self.log = new av.Log(av.getEffectiveLogLevel('tracker'),'av.tracker');
        
        self.getTypes = function(type){
            return {
                types : self.types,
                optional_params : self.typesOptional
            };
        }
        
        //EXTEND TO generic EventInterface type
        new av.EventInterface(self, true);
        
        
        /**
         * Track an event
         * @param {String,Object} typeOrObj This method is overloaded, you can send the event type as the first argument and it will be inserted into the object
         * @param {Object} obj The object to serialize which contains all tracking attributes, see INSIGHT documentation.
         */
        self.track = function(typeOrObj, obj){
            
            if(typeof(typeOrObj) == 'string'){
                var obj = typeof(obj) == 'undefined' ? {} : obj;
                obj.event = typeOrObj; 
            }else{
                var obj = typeOrObj;
            }
            
            if(typeof(obj) != 'object'){
                throw new TypeError("av.tracker.track(obj) - obj is '"+typeof(obj)+"', required 1st parameter of type 'object' not received");
            }
            if(!obj.appName){obj.appName = self.appName;}
            if(!obj.appVersion){obj.appVersion = self.appVersion;}
            
            //insert any state from a previous event, if expected in self.templates[obj]
            self.require(obj, {'event':"An event type is required"}, 'track(obj) ')
            if(self.templates[obj.event]){
                obj = self.insertTemplate(obj, self.templates[obj.event]);
                //alert(JSON.stringify(obj))
            }
            //obj.exactTime = (new Date()).toGMTString();
            
            //make sure it matches required schema
            self.validate(obj);
            var message = self.toMessage(obj);
            
            
            //find where to track it to (which console)
            var target = av.top && av.top.defaultView && av.top.defaultView.console ? av.top.defaultView.console : console;//current page console if can't tie it to top page... helps for developmen
            
            self.dispatchEvent('track',{
                type : typeof(obj) == 'object' && obj.type ? obj.type : '',
                message : message,
                object : obj,
            })
            
            target.info(message)
            //self.log.debug("Logged reporting message: " + message);
            
            //Save any variables that are considered part of the state
            for(var prop in obj){
                //try{console.log(obj.event +'.'+ prop, self.states[obj.event +'.'+ prop]);}catch(e){}
                if(typeof(obj[prop]) != 'undefined' && typeof(self.states[obj.event +'.'+ prop]) != 'undefined'){
                    self.states[obj.event +'.'+ prop] = obj[prop]; 
                }
            }
        }
        
        /**
         * Given a template of "vars", populate obj from either grabbing the string from self.states[prop] or executing the function vars[prop].apply(self,[]) if vars[prop] is a Function;
         * If any property is already present in obj, it will be skipped.
         * @param {Object} obj
         * @param {Object[String,Function]} {Each property is a String or a Function}, execute the function or use self.state[prop] when the property is a string. 
         */
        self.insertTemplate = function(obj, vars){
            //console.log('template', obj, vars)
            for(var prop in vars){
                if(typeof(obj[prop]) != 'undefined'){continue;}//application can override any defaults
                
                if(typeof(vars[prop]) == 'function'){
                    obj[prop] = vars[prop].apply(self,[]);//call the function with "this===self";
                }else{
                    obj[prop] = typeof(self.states[vars[prop]]) != 'undefined' ? self.states[vars[prop]] : '';  
                }
            }
            return obj;
        }
        
        /**
         * Using self.types[obj.event] as the basis, we require a message to contain a valid property for each of the listed props.
         * @param {Object} obj An object to iterate over and look for props in
         * @param {Object} props An object containing required keys, with the value of each props[key] being the error message to throw if not present
         * @param {message} The prefix for any thrown error messages "av.tracker" + message.
         */
        self.require = function(obj, props, message){
            var props = typeof(props) != 'undefined' && typeof(props) == 'object' ? props : {};
            var message = typeof(message) == 'string' ? message : 'require(obj, props) for the given event';
            for(var prop in props){
                if(typeof(obj) != 'object' || typeof(obj[prop]) == 'undefined'){
                    throw new TypeError("av.tracker." + message + " - tracking object is missing required property '" + prop +"': " + props[prop] );
                }
            }
            return true;
        }
        
        self.validate = function(obj){
            self.require(obj, {'event':"An event type is required"}, 'track(obj) ')
            
            var type = obj.event;
            if(self.types[type]){
                self.require(obj, self.types[type])
            }else{
                self.require(obj, self.types['*'], " you provided a custom event '"+type+"' which is ok, but custom events require certain properties");//custom event
            }
        }
        
        /**
         * Convert an object into a properly formated event that can be logged
         * @param {Object} obj An object to convert into a reporting message
         * @returns String A stringified message suitable for INSIGHT, or false if object is not useable
         */
        self.toMessage = function(obj){
            if(typeof(obj) == 'object'){
                return "report_event:" + JSON.stringify(obj);   
            }else{
                return false;
            }
            
        }
        
        
        return self;
    })
}
