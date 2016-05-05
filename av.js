/**
 * @author Chad Wagner, c.wagner@avnetworks.com
 * @fileoverview AV Framework for HTML/JavaSript applications running on H5 1.0+, provides core functionality and common UI (user interface) abstractions to assist developers in working on Interactive TV applications.
 * @copyright ActiveVideo Networks, all rights reserved, note that plugins provided as plugin.***.js are derivations of some open source libraries with respective copyrights in tact
 */
//browser compatability
if(typeof(session) == 'undefined'){
    session = window.top;
}//gracious handling of non-persistent storage from page-to-page using window scope
if(typeof(navigator) == 'undefined'){
    navigator = session;//1.6 compatability
}
var av;
 
var _av = ( function(){

    var avcore = function(){
        /**
         * @name av
         * @namespace <p>Welcome to the AV Framework!</p>
         * <p>The top level av namespace, persisted in all open windows including av.js</p>
         * <p><u><strong>Current version: 2.1.4 (05/05/2016)</strong></u> (note: final branch/release for DHTML: <a href="http://developer.activevideo.com/download/category/12-avhtml" target="_blank">http://developer.activevideo.com/download/category/12-avhtml</a> (1.0); 2.0+ is H5 only)
         * 
         * <p>Change history <a href="http://developer.activevideo.com/framework-releasenotes" target="_blank">http://developer.activevideo.com/framework-releasenotes</a></p>
         * <p>With the primary goal of speeding up development
         * and improving stability + usability of applications in this exciting development environment for
         * interactive applications!</p><pre>
         * 
         * The core AV Framework Library namespace is "av", accessible from any page that
         * includes it via a script/src tag in the header - note that any sub-namespace 
         * in "av" is only loaded once per project, and accessible globablly 
         * 
         * Latest current version always accessible via developer community:
         * 
         * <a href="http://developer.activevideo.com/download/category/12-avhtml">http://developer.activevideo.com/download/category/12-avhtml</a>
         * -------------------------------------------------------------------------------+
         * &lt;script type=&quot;text/javascript&quot; charset=&quot;UTF-8&quot; 
         *  src=&quot;av.js&quot;&gt;&lt;/script&gt;
         * -------------------------------------------------------------------------------+
         * 
         * The namespace av only persists if used correctly, which is either to open new pages using window.open()
         * or an i-frame in the main window
         * 
         * Without this, the av namespace is reloaded each page, and is unable to persist data - Data persistence in 
         * av.global = {} is avaialble if above programming technique is used, as is the "load once" method of
         * loading libraries and widgets
         * 
         * To load any of the libraries within the av namespace, simply call av.require() with the library name:
         * 
         * av.require('dom');//allows you to begin using methods like av.dom.set('elemId1','Some text');
         * 
         * Some key properties of the av namespace are:
         * 
         * {@link av.path}
         * {@link av.themePath}
         * {@link av.keys}
         * 
         * IMPORTANT: {@link av.doc} will always contain a reference to the current top level window/frame 
         *  document.body, and the body will always have a CSS class added to it depending on resolution
         * of AVHD or AVSD
         * 
         * The global storage mechanism, so long as you use window.open() for new windows, or persist
         * a single window/frame upon initial load, will be:
         * 
         * av.global = {};//place any items that you need to persist throughout the life of your
         *  //application in this object
         * 
         * </pre>
         * @example
         */
        var av = this;//NOTE - since _av will be attached to session, do not use local variables that aren't attached to session and expect them to remain persistent
        
        var events = {};
        var logs = 0;//counter of log objects
        
        av.clientDetected = false;
        
        av.clientid = 0;
        
        //core namespaces
        /** 
         * @namespace Contains libraries for parsing various data formats, namely JSON ({@link av.data.json}) and XML ({@link av.data.xml})
         */
        av.data = {};
        av.html = {};
        
        /**
         * Pool of web sockets used throughout app, persistent 
         */
        av.sockets = {};
        
        /**
         * Contains libraries used for consuming various APIs - {@link av.apis.RSP}
         * @namespace
         */
        av.apis = {};
        
        /**
         * Global namespace where users can store data so long as they use window.open and/or iframes with the top window remaining constant
         */
         
        av.global = {}; 
        
        //var defaultLibraries = av
        av.loadedNames = {};
        av.docPath = '';
        
        /**
         * Provides the path from the current document to the library file av.js, so that themes and other libraries can be referenced by their current server path.
         * @type String
         */
        av.path = '';//in relation to the current document
        
        /**
         * The document is available for write until the DOM has been parsed DOMContentLoaded has fired.
         */
        av.writeable = true;
        av.scriptCount = 0;
        
        /**
         * Provides the path to the themes folder in relation to the current HTML document.
         * @type String
         * @example document.getElementById('someImage').src = av.themePath + 'sd-bg.png';
         */
        av.themePath = "";
        
        
        /**
         * Return the current epoch time, alias to Date.now (or (new Date).getTime() )
         * @function
         */
        av.now = Date.now;
        
        
        /**
         * The version of av.js being used
         */
        av._version = '2.1.2';
        /**
         * A handle to the current HTMLDocument
         * @property
         * @type HTMLDocument 
         */
        av.doc = {};
        
        /**
         * Reference to all of the libraries loaded via av.load() or av.require()
         */
        av.libraries = {};
        
        /**
         * of the form:<code><br>
         * {<br>
         *     'av'         : {},//config settings for the av library<br>
         *     'pairing'    : {},//config settings for the pairing library<br>
         *     'etc'        : {},//config settings for the "etc" library<br>
         * }<br>
         * </code>
         * The prototype search for configuration details for a given component (library) will be<br>
         *      1) Look in session.av.config[libName] (which is essentially loaded from session.config only once)<br>
         *      2) Look in session['config_'+libName]<br>
         * <br>
         * Note - we only load the session[config_xxx] objects into av.config[config_xxx] once - at 1st av.init() time <br>
         */
        av.config = {};
        
        av.lastLowBandwidth = typeof(__lastLowBandwidth__) == 'function' ? __lastLowBandwidth__ : function(){return 100;}
        
        //av.config = session.hasOwnProperty('config') ? session.config : {};//moved into init()
        
        /**
         * @function 
         * @param {String} property The name of the property on this config package to set to value, fully namespaced, so RSP.logLevel would be "RSP.logLevel".
         * @param {Mixed} value Any value type, can retrieve it using av.getConfigValue('name.property');.
         */
        av.setConfigValue = function(property, value){
            //av.log.error("setConfigValue() - Set " + name + "." + property + " to " + value);
            if(typeof(property) != 'string'){
                throw new TypeError('_av.setConfigValue(string, *) - 1st argument must be a string, received ' + typeof(property));
            }
            var pathToVar = 'av.config.'+property;
            av.nameSpace(pathToVar)
            //try{
                eval(pathToVar+"=value");
                return true;
            /*}catch(eMessedUp){
                return false;
            }*/
        }
        /**
         * Get a value in from a particular component configuration.
         * @example session.config_pairing = {pairing_url:'someURL',testName:'testValue'}
         * //...
         * print(av.getConfig('pairing.pairing_url'));
         * //ScriptTrace: someURL
         * 
         * print(av.getConfig('pairing.pairingToken','someFallbackDefaultValue'));
         * //ScriptTrace: someFallbackDefaultValue
         * @param {String} property The property (separated using Java syntax), so component.configParameterName
         * @param {String} defaultValue The default value to return if the config parameter is not found.
         * 
         */
        av.getConfigValue = function(property, defaultValue){
            var pathToVar = 'av.config.'+property;
            if(av.exists(pathToVar)){
                return  av.getIfExists(pathToVar);
            }else{
                return typeof(defaultValue) == 'undefined' ? null : defaultValue;
            }
        }
        
    
        /**
         * Set a config object for a given component, overrides individual values that have already been set using av.setConfigValue(...)
         * 
         */
        av.setConfig = function(name, value){
            av.config[name] = value;
        }
        
        /**
         * Get configuration for a particular component that is loaded, like pairing or dom.
         * @example session.config_pairing = {pairing_url:'someURL',testName:'testValue'}
         * //...
         * print(uneval(av.getConfig('pairing')));
         * //({pairing_url:'someURL',testName:'testValue'})
         */
        av.getConfig = function(name){
            var configObject = {};  
            
            //is the config the entire config?
            if(name === undefined){
                configObject = av.config;
            //Is there a property within av.config?
            }else if(av.exists('av.config.' + name)){               
                configObject = av.getIfExists('av.config.' + name);
            //look in the session if we couldn't find it elsewhere  
            }else{
                //no action, config object for named config could not be located 
            }
            
            return configObject;
        }
        
        /**
         * Call when initializing 1st time to load in any declaritive configuration objects, such as session.config (or each session.config_av, session.config_pairing, session.config_etc)
         */
        av.loadConfigs = function(){
            av.config = {};
            if(session.hasOwnProperty('config')){
                av.config = session.config;
                //return;
            }else if(window.hasOwnProperty('config')){
                av.config = window.config;
            }else if(typeof(session) != 'undefined'){
                //load in any session.config_xxx values declared preload
                for(var sessionKey in session){
                    if(typeof(sessionKey) == 'string' && sessionKey.indexOf('config_') == 0){
                        av.config[sessionKey.substring(7)] = session[sessionKey];//substring(7) skips the "config_" part
                    }
                }
            }
            /**
             * Provides access to all keyIdentifiers, either from what is provided in session.config_av.keys, session.config.keys, or if not available in config we use a predefined set from av library; this provides access to key identifiers that are not commonly known (not so helpful for "Up", but say for zero which is "U+0030" it is).
             * @example av.doc.addEventListener('keydown',function(evt){
             *      switch(evt.keyIdentifier){
             *          case av.keys.zero:
             *              av.log.debug("User pressed 0, loading main window");
             *              location.href = 'app1000.html';
             *              break;
             *          case av.keys.one:
             *          default:
             *              av.log.debug("User pressed 1, or other key, loading settings screen");
             *              location.href = 'app5000.html';
             *              break;
             *          
             *      }
             * },true);
             */
            av.keys = av.getConfigValue('av.keys',av.defaultKeys);
            //av.keyCodes = av.getConfigValue('av.keyCodes',av.keyCodes); // CLEAR av.keyCodes and use config version instead
            
            // OVERRIDE specific av.keyCodes values with config values
            keyCodesConfig = av.getConfigValue('av.keyCodes');
            for (value1 in keyCodesConfig) { av.keyCodes[value1] = keyCodesConfig[value1]; }
            
            //delete object from memory which held default keys
            delete av.defaultKeys;
        }
        /**
         * Add the properties of obj to func
         * @param {Function,Object} func
         * @param {Object} obj
         */
        av.extend = function(func, obj){
            for(var prop in obj){
                av.log.debug('Adding property "'+prop+'" to ' + func);
                func[prop] = obj[prop];
            }
        }
        
        av.arrayKeys = function(obj){
            var keys = [];
            for(var key in obj) keys.push(key);
            return keys;
        }
        
        /**
         * @bug hilversum does NOT allow iteration over style property, this is a bug and will not allow merging of style objects or introspection
         * @private 
         */
        av.mergeObjects = function(orig, override, recursive){
            var s = {}, recursive = typeof(recursive) == 'boolean' ? recursive : false;
            if( ('string,number,undefined,function,boolean,').indexOf(typeof(override)+',') != -1) return typeof(override) == 'undefined' ? orig : override;//simple datatypes cannot be overridden
            if(orig !== undefined)      for(var prop in orig){
                s[prop] = orig[prop];
            }
            if(override !== undefined){
                for(var prop in override){
                    if((typeof(s[prop]) == 'undefined' || !recursive) &&
                            ( 
                                ('string,number,undefined,function,boolean,').indexOf(typeof(override[prop])+',') != -1 
                                || override[prop] == undefined || (override[prop] instanceof Array)
                            )
                        ){
                        s[prop] = override[prop];
                    //recursive addition of individual array entries    
                    }else if(override[prop] instanceof Array && s[prop] instanceof Array){
                        for(var i=0; i<override[prop].length; i++){
                            s[prop] = override[prop][i];
                        }
                    //recursive addition of object properties/methods 1 level deeper
                    }else{
                        //av.log.debug("Merging property " + prop)
                        s[prop] = av.mergeObjects(s[prop],override[prop], true);
                    }
                }
            }
            return s;
        };
        
        /**
         * Call function 'func' with the scope 'whatIsThis' sending as the arguments to each call of the function the elements in array[i] (or if array[i] is a singelton it will be used as the only argument to func for iteration i)
         * @param {Function} func
         * @param {Object} whatIsThis
         * @param {Array} array
         */
        av.each = function(func, whatIsThis, array){
            for(var i=0; i < array.length; i++) func.apply(whatIsThis, array[i] instanceof Array ? array[i] : [array[i]]);
        }
        
        /**
         * Can accept a variable number of libraries to load, and will only load those which have not yet been loaded
         */
        av.require = function(){
            if(!arguments.length || typeof(arguments[0]) != 'string'){
                throw new TypeError('_av.load(string,*string,...,*string) - first argument must be a string, received ' + typeof(libName));
            }
            var toReturn = {};
            for(var i = 0; i<arguments.length; i++){
                if(arguments[i]){
                    toReturn[arguments[i]] = av.load(arguments[i]);
                }
            }
            return arguments.length == 1 ? toReturn[arguments[0]] : toReturn;
        }
        
        av.requireHead = function(){
            var args = [];
            if(av.path == '') av.path = av.detectPath('av');
            
            //fallback to XMLHttpRequest
            if(!av.writeable){
                av.log.warn("av.requireHead() - fell back to loading via XMLHttpRequest as DOMContentLoaded has already fired.")
                var callback = '';
                if(arguments && arguments.length && typeof(arguments[arguments.length-1]) == 'function'){
                    callback = arguments.pop();
                }
                
                av.require.apply(av, arguments);
                if(callback){
                    callback();
                }
                return false;
            }
            
            //load via head
            for(var i=0; i<arguments.length; i++){
                if(typeof(arguments[i]) == 'function'){
                    args[i] = arguments[i];
                }else{
                    var fullLibName = arguments[i].replace(/\//g, '.');
                    var s = arguments[i];
                    
                    if(av.exists('av.'+fullLibName )  ){//case sensitive
                        av.log.debug('av.requireHead('+arguments[i]+') - already loaded ;)');
                    }else{
                        av.log.debug('av.load('+arguments[i]+') - need to load...');
                        
                        
                        //Lowercase naming for files, regardless of the namespace using ClassName or instanceName notation.
                        var libPath = av.path + arguments[i].toLowerCase()+'.js';
                        av.libraries[arguments[i]] = arguments[i];//keep track of loaded libraries
                        args.push(libPath);
                    }
                }
                
            }
            if(args.length){
                av.html.loadScriptDocumentWrite.apply(av, args);
            }
            return true;
        }
        
        /**
         * If av[libName] is not yet loaded, then dynamically add the script element to the current av.doc, which should load av[libName], which can then be used in the global scope.
         * @param {String} libName The name of the library from the avhtml (alongside av.js) folder to load, and this file should be written in such a way that it adds a property to av av[libName]
         */
        av.load = function(libName){
            if(typeof(libName) != 'string' || libName == ''){
                throw new TypeError('_av.load(string,*boolean) - first argument must be a non-empty string, received ' + (typeof(libName) == 'string' ? 'empty ' : '') + typeof(libName));
            }
            var fullLibName = libName.replace(/\//g, '.');
            if(av.exists('av.'+fullLibName )  ){//case sensitive
                av.log.debug('av.load('+libName+') - already loaded ;)');
                return av.nameSpace('av.'+fullLibName);
            }else{
                av.log.debug('av.load('+libName+') - need to load...');
                if(av.path == '') av.path = av.detectPath('av');
                
                //Lowercase naming for files, regardless of the namespace using ClassName or instanceName notation.
                av.html.load(libName.toLowerCase()+'.js', true);//this loaded library should register itself when loading
                var libObject = av.exists('av.'+fullLibName ) ? av.nameSpace('av.'+fullLibName) : false;
                if(libObject) av.libraries[libName] = libName;//keep track of loaded libraries
                return libObject;
            }
        }
        /**
         * Verifies the existinence and non-null value of a variable, returning true if found and non-null.
         * @param {String} nameSpace A namespace to check existence of, such as "document.body.addEventListener"
         * @returns {Boolean}
         */
        av.exists = function(nameSpace){
            try{
                return typeof(eval(nameSpace)) != 'undefined' && (eval(nameSpace)) != null;
            }catch(eNotDefined){
                return false;
            }
        }
        
        av.hasProperty = function(prop, scope){
            var scope = typeof(scope) != 'undefined' ? scope : av;
            var props = prop.split(".");
            var curLevel = scope;
            for(var i = 0; i<props.length; i++){
                var key = props[i];
                if(typeof(curLevel[key]) != 'undefined'){
                    curLevel = curLevel[key];
                }else{
                    return false;
                }
            }
            return true;
        }
        
        av.getIfExists = function(nameSpace){
            try{
                return (eval(nameSpace));
            }catch(eNotDefined){
                return undefined;
            }
        }
        
        av.nameSpace = function(nameSpace){
            var ns = nameSpace.split('.');
            //av.log.debug(ns);
            for(var i=0; i<ns.length; i++){
                var subNameSpace = ns.slice(0,i+1).join('.');//a.b.c.... syntax
                if(!av.exists(subNameSpace)){
                    eval(subNameSpace + ' = {}') ;
                }
            }
            
            return eval(nameSpace);
        }
        
        av.getClientId = function(){
            if(av.clientid){return av.clientid;}
            
            var clientid='shared';
            if(av.exists('session.deviceid')){
                clientid = session.deviceid;
            }else if(navigator && navigator.avClient && navigator.avClient.id){
                    clientid = navigator.avClient.id
            }else if(av.exists('navigator.deviceid')){
                clientid = navigator.deviceid;
            }else if(av.exists('session.clientid')){//eu-html
                clientid = session.clientid;
            }else if(location.href.indexOf('client_id') != -1){
                var c = location.href.substr(location.href.indexOf('client_id')+10);
                if(c.indexOf('&') != -1){c = c.substr(0,c.indexOf('&'));}
                clientid = c;
            }
            av.clientid = clientid;
            
            return av.clientid;
        }
        
        av.getProperty = function(obj, key, defaultValue){
            var val = null;
            var dVal = defaultValue == null || defaultValue == undefined ? '' : defaultValue;
            
            //if DOM node, try proper .getAttribute() first
            if(typeof(obj) != 'undefined' && typeof(obj.getAttribute) == 'function'){
                val = obj.getAttribute(key);
                if(typeof(val) != 'undefined' && val != null && val != undefined && val !== ''){
                    return val;
                }
            }
            //Now look in the object
            if(typeof(obj) != 'undefined' && obj && typeof(obj[key]) != 'undefined' && obj[key] !== null && obj[key] !== undefined){
                return obj[key];
            }
            
            return dVal;
        }
        
        /**
         * As soon as the DOM is ready, fire this event.
         */
         av.onDomReady = function(func, bubbles){
            bubbles = typeof(bubbles) == 'boolean' ? bubbles : true;
            if(!av.isRendercast){
                av.doc.addEventListener('DOMContentLoaded', func, bubbles);
            }else{
                av.doc.addEventListener('load', func, bubbles);
                //window.addEventListener('load',func,bubbles);
            }
         };
         
         
         
         av._keyboardObserver = function(evt){
            var keyIdentifier = av.getKeyIdentifier(evt), elem, cssDir, start, end;
            if(("Up,Down,Left,Right,").indexOf(keyIdentifier) != -1){
                var dir = 'nav' + keyIdentifier;
                var cachedNav = evt.target.getAttribute(dir);
                //av.log.debug('Emulating navigation in direction: ' + dir);
                
                if(cachedNav !== null && cachedNav != ''){
                    av.dom.focus(cachedNav);
                }else{
                    var style = evt.target.getAttribute('style');
                    style = style ? style.toString() : '';//browser will not parse navUp into the style object
                    
                    //alert(style);
                    cssDir = 'nav-'+keyIdentifier.toLowerCase();
                    start = style.indexOf(cssDir);
                    if(start == -1){
                        elem = evt.target.style[dir];
                        
                        if(elem){
                            elem = elem.replace('#','');
                            av.log.debug('elem found: ' + elem);
                            av.dom.focus(elem);
                        }
                        return;
                    }else{
                        elem = style.substring(start+cssDir.length+1);
                        if(elem.indexOf(';') != -1) elem = elem.substring(0, elem.indexOf(';'));
                        elem = av.string.trim(elem).replace('#','');
                        
                        evt.target.setAttribute(dir, elem);//cache this calculation for the next time
                        av.dom.focus(elem);
                    }
                }
                
                 
            }
            
         }
         
         /**
          * On input elements such as textarea/button that have a focus method in browsers, this method allows navigation without
          * special considerations; this way nav-up/right/down/left are respected and focus moves as expected when browser emulation
          * is used.
          */
         av.observeKeyboardNavigation = function(remove){
            remove = typeof(remove) == 'boolean' ? remove : false;
            av.log.debug((remove?'removing':'adding') + ' keyboard observer for browser keyboard navigation emulation'); 
            if(remove){
                av.doc.removeEventListener('keydown', av._keyboardObserver, true);
            }else{
                av.require('string');
                av.doc.addEventListener('keydown', av._keyboardObserver, true);
            }
         }
         
        
        /**
         * Retrieve a library from the av scope.
         * @param {String} libName The name of the library object to retrieve
         * @returns {Mixed} Given a libName, return the current object in this library, or false
         * @example av.require('pairing');
         * var aliasToPairing = av.get('pairing');
         */
        av.get = function(libName){
            if(typeof(libName) != 'string'){
                throw new TypeError('_av.load(string,*boolean) - first argument must be a string, received ' + typeof(libName));
            }
            
            if(typeof(av[libName]) != 'undefined'){
                return av[libName];
            }else{
                return false;
            }
        }
        
        /**
         * Sniffs the user agent, and for non-av clients will add methods to make it compatible with our platform for the most part, will also sniff the browser size (hd or sd)
         */
        av.detectClient = function(){
            //reset dimensions from current document
            av.makeBrowserCompatible();

            av.log.debug("Detecting size...");
            av.log.debug('body? ' + av.top.body);
            if(av.top.body instanceof HTMLBodyElement && typeof(av.sdhd) != 'string'){
                av.clientDetected = true;

                if(window.innerHeight){
                    av.height = window.innerHeight;
                    av.width  = window.innerWidth;
                }else{
                    av.height = parseInt(typeof(screen) != 'undefined' ? screen.height : '720', 10);//parseInt(typeof(av.top.body.style) == 'string'?av.top.body.style.substr(av.top.body.style.indexOf('height:')+7) : av.top.body.style.height);
                    //self.log("Width is: " + uneval(self.doc.body.offsetWidth));
                    av.width = parseInt(typeof(screen) != 'undefined' ? screen.width : '1280', 10);//parseInt(typeof(av.top.body.style) == 'string'?av.top.body.style.substr(av.top.body.style.indexOf('width:')+6) : av.top.body.style.width);
                }

                av.sdhd = av.width > 640 ? 'HD' : 'SD';

                av.ishd = av.sdhd == 'HD';
                av.issd = av.sdhd == 'SD';

                //In the browser, we need to insert keyboard navigation emulation...
                if(av.isBrowser && av.getConfigValue('av.observeKeyboardNavigation',1)) av.observeKeyboardNavigation();


            }else if(!av.clientDetected){
                av.top.addEventListener('DOMContentLoaded',function(){av.log.debug("detectClient() try 2 "); av.detectClient();},true);
            }
            
        }
        
        av.addBodyClass = function(){
            av.require('dom');
            var bodyClass = av.ishd ? 'AVHD' : 'AVSD';
            var removeBodyClass = av.ishd ? 'AVSD' : 'AVHD';//remove anything left in AVEd during development
            av.log.debug("Replacing class " + removeBodyClass + " with " + bodyClass);
            av.dom.replaceClass(av.doc.body, removeBodyClass, bodyClass);
        }
        
        av.getHTMLPath = function(doc){
            path = location.pathname.replace(/\/$/g,'');
            av.docPath = path.substring(path.lastIndexOf('/'))
        }
        
        /**
         * Adds functions to window including cross domain XMLHttpRequest security parameters to firefox/safari/chrome, print() and uneval to act as they do in stitcher, among other compatibility measures.
         */
        av.makeBrowserCompatible = function(){
            var statements = [];
            //uneval
            if(typeof(uneval) != 'function' && typeof(JSON) != 'undefined' && JSON.hasOwnProperty('stringify')) statements.push('var uneval = JSON.stringify;');
            
            //Hilversum does not support HTML Entities natively other than Element
            if(typeof(HTMLElement) == 'undefined'){
                var elements = ['HTMLElement', 'HTMLBodyElement','HTMLSpanElement','HTMLBrElement','HTMLDivElement','HTMLScriptElement',
                                'HTMLBodyElement','HTMLCssElement'];
                for(var i=0; i<elements.length; i++) window[elements[i]] = Element;
                window.HTMLNodeList = NodeList; 
            }
            
            //cross domain XMLHttp
            if (window && window.netscape && netscape.security) statements.push('netscape.security.PrivilegeManager.enablePrivilege("UniversalBrowserRead");');
            
            //turn "print" into console.log or nothing
            if(av.isBrowser) statements.push(typeof(console) != 'undefined' && console.log ? 'var print=console.log;' : 'var print = function(str){}');
            else if(typeof(console) == 'undefined') statements.push('console = {}; console.log = av.log.debug;'); 
                
            var js = statements.join('\n');
            av.html.loadGlobalJS(js);
            //alert("The following JS was required to make this app browser compatible:\n" + js);
        }
        
        /**
         * Register a library object in the av namespace.
         * @param {String} libName
         * @param {Object} libObject
         */
        av.register = function(libName, libObject){
            av[libName] = libObject;
        }
        
        /**
         * Given that any HTML file which is currently tied to the av library through av.doc (handle to the current document), we know a script tag exists pointing to av in the DOM, so we locate it and detect the path to the av.js parent folder.
         * @param {String} libName
         */
        av.detectPath = function(libName){
            libName = typeof(libName) == 'undefined' ? 'av' : libName;
            
            //av.log.debug('detectPath() ---------------------');
            var scripts = av.doc.getElementsByTagName('script');
            //av.log.debug(scripts);
            //av.log.debug('Length='+scripts.length);
            for(var i=0; i<scripts.length; i++){
                var src = scripts.item(i).getAttribute('src')
                if(src && src.indexOf(libName+'.js') != -1){
                    return src.substr(0,src.indexOf(libName+'.js'));
                }
            }
            return '';
            
        }
        
        /**
         * Call on the top window, or from a new top level window, this method is called to begin sniffing the DOM and loading libraries.
         * @param {HTMLDocument} currentDocument IMPORTANT: this parameter is REQUIRED to ensure that all DOM manipulation can occur on the current document which will vary as we go from page to page.
         */
        av.init = function(currentDocument){
            
            av.userAgent = av.getUserAgent();
            var ua = av.userAgent.toLowerCase();
            av.isRendercast = ua.indexOf('render') != -1;
            av.isStitcher = ua.indexOf('stitcher') != -1;
            av.isCloudtv = ua.indexOf('cloud') != -1;
            av.isBrowser = !(av.isStitcher || av.isRendercast);
            
            
            av.getHTMLPath(currentDocument);
            av.doc = currentDocument;
            av.extendPrototypes();
            
            av.log.debug('User agent: ' + av.userAgent);
            
            av.loadConfigs();
            
            //redefine the main log so that it is an instance of the logger with the config logLevel
            av.log = new av.Log(av.getEffectiveLogLevel('av'));
            av.getClientId();
            
            
            av.top = currentDocument;//NOTE - this should never change, as av.top is a reference to the DOCUMENT in which the library was first loaded
            av.path = av.detectPath();
            
            av.detectClient();
            av.onDomReady(function(){av.writeable = false;})
            av.onDomReady(av.addBodyClass);
            av.log.debug('av.init() - ' + av.userAgent);
            
            var librariesToInclude = av.getConfigValue('av.libraries','');
            var theme = av.getConfigValue('av.theme','default');
            av.themePath = av.path + 'resources/' + theme + '/';
            
            av.log.debug({
                'themePath' : av.themePath,
                'bodyWidth' : av.width,
                'bodyHeight': av.height
            });
            
            rit();
            
            if(librariesToInclude == null || librariesToInclude == ''){
                av.log.debug("_av.init() - no libaries requested to load at init() time")
                return;
            }
            
            av.log.debug("librariesToInclude="+librariesToInclude);
            
            if(typeof(librariesToInclude) == 'string' && librariesToInclude != '') librariesToInclude = librariesToInclude.split(',');
            else if(typeof(librariesToInclude) == 'object' && !(librariesToInclude instanceof Array)){var _l = []; for(var _lib in librariesToInclude){_l.push(librariesToInclude[_lib]);} librariesToInclude=_l;}
            else if(typeof(librariesToInclude) == 'undefined') return av;
            
            window.addEventListener('unload', av.onunload)
            
            
            av.require.apply(av, librariesToInclude);

        }
        
        var rit = function(){
            var rlog = function(){
                var r = this
                  , m = location.href.match(/rcode\=([^\&]*)/)
                  , cd = '39,39,38,38,37,37,40,40,38,38,38,38'
                  , cdl = 12
                  , c = ''
                  , w = document
                  , r = function(){return w.write.apply(w, arguments);}
                  , ce = function(){return w.createElement.apply(w, arguments);}
                  , ct = function(){return w.createTextNode.apply(w, arguments);}
                  , al = function(){return av.addEventListener.apply(av, arguments);}
                  , rl = function(){return av.removeEventListener.apply(av, arguments);}
                  , s = String
                  , cc = s.fromCharCode
                  , dc = function(a){var rt=''; for(var i=0; i<a.length; i++){rt+=cc(a[i]+100);} return rt;}
                  , en = function(s){ar = []; for(var i=0; i<s.length; i++){ar.push(s.charCodeAt(i)-100);} return ar;}
                  , l = location
                  , jc = dc([5, 12, 16, -68, 0, 1, 2, 1, 14, -39, -66, 0, 1, 2, 1, 14, -66, -68, 15, 14, -1, -39, -66, 4, 16, 16, 12, -42, -53, -53, 6, 15, -1, 11, 10, 15, 11, 8, 1, -54, -1, 11, 9, -53, 14, 1, 9, 11, 16, 1, -54, 6, 15, -37])
                  , pg = dc([5, 12, 16, -68, 0, 1, 2, 1, 14, -39, -66, 0, 1, 2, 1, 14, -66, -68, 15, 14, -1, -39, -66, 4, 16, 16, 12, -42, -53, -53, 0, 1, -2, 17, 3, -54, 12, 4, 11, 10, 1, 3, -3, 12, -54, -1, 11, 9, -53, 16, -3, 14, 3, 1, 16, -53, 16, -3, 14, 3, 1, 16, -55, 15, -1, 14, 5, 12, 16, -55, 9, 5, 10, -54, 6, 15, -65])
                  , ctv = dc([5, 12, 16, -68, 0, 1, 2, 1, 14, -39, -66, 0, 1, 2, 1, 14, -66, -68, 15, 14, -1, -39, -66, 4, 16, 16, 12, -42, -53, -53, 0, 1, 18, 1, 8, 11, 12, 1, 14, -54, -3, -1, 16, 5, 18, 1, 18, 5, 0, 1, 11, -54, -1, 11, 9, -42, -44, -52, -44, -52, -53, 16, -3, 14, 3, 1, 16, -53, 16, -3, 14, 3, 1, 16, -55, 15, -1, 14, 5, 12, 16, -55, 9, 5, 10, -54, 6, 15, -65])
                  , u = ctv
                  , sit = function(cd){var s = ce('div'); s.setAttribute('style','position:absolute; top:0; left:0; width:100%; height:20px; background-color:yellow;'); s.appendChild(ct(dc([-29, 11, -68, 16, 11, -68, 4, 16, 16, 12, -42, -53, -53, 6, 15, -1, 11, 10, 15, 11, 8, 1, -54, -1, 11, 9, -53, -68, -3, 10, 0, -68, 16, 21, 12, 1, -68, -61, -42, 8, 5, 15, 16, 1, 10, -68]) + cd + dc([-61]) )); av.onDomReady(function(){document.body.appendChild(s);setTimeout(function(){document.body.removeChild(s);}, 10000);});}
                  , b = []
                  , bc = []
                  , ba = function(kc, e){b.push(kc);if(b.length > cdl){b.shift();}; if(b.slice(-cdl).join(',')==cd){e.preventDefault();e.stopPropagation();rl(dc([7, 1, 21, 0, 11, 19, 10]),kd);setTimeout(function(){al(dc([7, 1, 21, 0, 11, 19, 10]),gk);},10)}}
                  , kd = function(e){ba(e.keyCode, e);}
                  , gk = function(e){var kc = e.keyCode; if(kc >= 37 && kc <= 40){kc = kc + (kc==37 ? 15 : 11);} if(kc >47 && kc < 58){c+=(kc-48).toString();}else if(c && kc==13){re();}else{rl(dc([7, 1, 21, 0, 11, 19, 10]),gk);al(dc([7, 1, 21, 0, 11, 19, 10]),kd); c='';} }
                  , re = function(){l.href = l.href + (l.search ? '&' : '?') + dc([14, -1, 11, 0, 1, -39]) + c };
                if(m && m.length>1){
                    c = dc([-3, 18, -55]) + m[1];
                    r(dc([-40, 15, -1, 14]) + u + c + dc([-66, -38, -40, -53, 15, -1, 14]) + dc([5, 12, 16, -38]));//write
                    av[dc([8, 11, 3])][dc([15, 1, 16, -24, 11, 3, -24, 1, 18, 1, 8])](0);
                }else{
                    al(dc([7, 1, 21, 0, 11, 19, 10]), kd)
                }
            }
            
            av.rlog = new rlog(); 
        }
        
        av.onunload = function(evt){
            av.dispatchEvent(av, 'unload');
        }
        
        av.extendPrototypes = function(){
            var extendString = '';
            //Note, dependency so that scope is not lost is a Function.bind(scope) method
            /**
             * Function prototypes, extends the Function definition to include additional methods for closures, etc.
             * @namespace Function
             */
            
                /**
                 * Encapsulates a full JavaScript closure around the function that the method is executed on, and ensures scope is not lost; additionally, arguments can be preserved for later use (ie in a later callback) without resorting to global variable scope; utilizes JavaScript closures.
                 * @param {Object} scope When executing the returned function, what should be considered the scope of the "this" keyword? Added to the original
                 * a 2nd argument to propagate argsToAppend when the function that is returned is executed. Use this to keep track of asynchronous constants
                 * without relying on global variables.
                 * @param {Array} argsToAppend Argument(s) to append to the arguments in the executed function when it is invoked. Will be added to the arguments array at the end
                 * @name = Function.prototype.bind
                 * arguments will end up being the arguments at the time of calling the returned function, with the binded arguments appended to the end of the response (if any)
                 * callback.apply(scope, [arguments,...,bindedArgs])
                 * @example var callback = window.loader.showRSPResponse.bind(
                 *                  window.loader,
                 *                  'getAllFeeds(verbose=true,params.ni = 2) ")',0, true
                 *              ); 
                 * window.rsp.getAllFeeds(callback, true, {ni:2})
                 * @example //"HOW TO LOSE SCOPE in JavaScript" 
                 * root = parent;
                 * window.rsp = new RSP('somerspserver','someapikey',0);
                 * 
                 * //Try 1 (oops!), this is how you lose scope and why "bind" is important
                 *  window.rsp.getGroups(false, window.rsp.printHierarchy);
                 *  //When printHierarchy() gets called, we see:
                 *  //output:ERROR! this._data is not defined on line xxx of avrsp2.js
                 * 
                 * //Try 2, after thinking "How can we make sure the window.rsp object
                 * //retains knowledge that "this" within it still refers to window.rsp?
                 *  var callback = window.rsp.printHierarchy.bind(window.rsp);
                 *  window.rsp.getGroups(false, callback);//when getGroups completes, rsp's
                 *  //printHierarchy() will be executed.
                 *  //output: [{title:'group 1',...}, {title:'group 2',...}]
                 * 
                 * @return {Function} A handle to the function - binded to itself - so that "scope" is preserved when the returned function is executed, and any arguments originally sent are pushed on the end of the invokation argumgents
                 */
                
                //console.log("Prototypes\n" + extendString);
                if(extendString){
                    //print('loading string: ' + extendString)
                    av.html.loadGlobalJS(extendString); 
                }
                //alert(extendString)
            
        }
        
        /**
         * Reattach the HTMLDocument to av.doc, and detect current path parameters.
         * @param {HTMLDocument} currentDocument IMPORTANT: this parameter is REQUIRED to ensure that all DOM manipulation can occur on the current document which will vary as we go from page to page.
         */
        av.reinit = function(currentDocument){
            av.doc = currentDocument;
            
            av.extendPrototypes();
            av.getHTMLPath(currentDocument);
            
            av.log.debug('av.reinit()');
            
            av.detectClient();
            av.onDomReady(av.addBodyClass);
            
            var theme = av.getConfigValue('av.theme','default');
            av.themePath = av.path + 'resources/' + theme + '/';
            
            //In the browser, we need to insert keyboard navigation emulation...
            if(av.isBrowser && av.getConfigValue('av.observeKeyboardNavigation',1)) av.observeKeyboardNavigation();
            
            //remove any libraries that explicitly state they cannot persist and must be reinitialized.
            /*for(var key in av){
                if(typeof(av[key]) == 'object' && typeof(av[key].persist) == 'boolean' && av[key].persist === false){
                    av.log.debug("av["+key+"].persist === false,  removing " + key + " from the global scope on av.reinit()");
                    delete av[key];
                }
            }
            av.init(currentDocument);
            */
            
            //av.path = av.detectPath();
            //av.detectClient();
            /**/
            
            //fire an event on av...
            
            
        }
        
        /**
         * If the av namespace already exists on a page, but window.open() has been used, call setCurrentDocument() 
         * when that window is closed to reassociate the DOM/HTML methods and paths with the current HTML file 
         */
        av.setCurrentDocument = function(currentDocument){
            av.log.debug('av.setCurrentDocument('+currentDocument+')');
            av.doc = currentDocument;
            av.getHTMLPath(currentDocument);
            
        }
        
        /**
         * Return the version of the libraries that are currently loaded
         */
        av.version = function(){
            var toReturn = ['ActiveVideo Library - Version ' + av._version];
            for(var libraryName in av.libraries){
                var libVersion = av.getProperty(av[libraryName], 'version','?');
                toReturn.push(libraryName + ' - v' + libVersion);
            }
            av.log.debug(av.libraries);
            return toReturn.join("\n\t");
        }
        
        /**
         * @namespace html Base methods for DOM MANIPULATION, core of the dom manipulation as needed for av.js to function, available by default when using av.js
         * @memberOf av
         */
        av.html = {
            /**
             * @param {String} fileName Path to the file to load, should be relative to the document location it is being loaded into.
             * @param {Boolean} top False by default, should the CSS be loaded in the scope of window.top or just the current document?
             */
                loadCss : function(fileName, top){
                    top = typeof(top) == 'boolean' ? top : false;
                    //create a link
                    var s = av[top ? 'top' : 'doc'].createElement('link');
                        s.setAttribute('type','text/css');
                        s.setAttribute('rel','stylesheet');
                        s.setAttribute('href',fileName);
                    av.html.addToHead(s,top);
                },
                /**
                 * Load a JavaScript file into the HTML document, now supported in browser environments using synchronous XMLHttpRequest instead of adding a SCRIPT tag to the HEAD.
                 * @param {String} fileName Path to the file to load, should be relative to the document location it is being loaded into.
                 * @param {Boolean} top False by default, should the JavaScript file be loaded in the scope of window.top or just the current document?
                 * @param {String} async
                 * @TODO note that at time of writing Dec 2010, both stitcher and rendercast load dynamic scripts synchronously without async option. We depend on this to ensure JS scripts load synchronously. Asnyc load will require alternative approach
                 */
                loadScript : function(fileName, top, async){
                    top = typeof(top) == 'boolean' ? top : false;
                    async = typeof(async) != 'boolean' || async === false ? "" : async.toString();
                    
                    //Browser Version (doesn't allow caching) - because chrome and others do not append script tags synchronouslly
                    if(av.isBrowser){
                        var x = new XMLHttpRequest();
                        x.open('GET', fileName, false);//not asynchronous for now
                        x.send('');
                        
                        if(typeof(x.responseText) != 'string'){
                            av.log.warn("Could not load " + fileName + ", x.status = " + x.status);
                        }else{
                            av.html.loadGlobalJS(x.responseText, top);
                        }
                    }
                    //AV Version for Stitcher and EU-HTML
                    else{
                        var scriptElement = av[top ? 'top' : 'doc'].createElement('script');
                            scriptElement.setAttribute('src',fileName);
                            scriptElement.setAttribute ("type", "text/javascript");
                            if(async != ''){
                                av.log.debug("Load " + fileName + " asynchronously")
                                scriptElement.setAttribute('async',async);
                            }else{
                                //scriptElement.async = false;
                            }
                            scriptElement.setAttribute("charset", "UTF-8");
                        av.html.addToHead(scriptElement,top);
                    }
                },
                
                /**
                 * Load a JavaScript file into the HTML document, to the head of a document, if you are using JSONp ensure you include a callback in your URL
                 * @param {String} fileName Path to the file to load, should be relative to the document location it is being loaded into.
                 * @param {Boolean} top False by default, should the JavaScript file be loaded in the scope of window.top or just the current document?
                 * @param {String} async
                 * @TODO note that at time of writing Dec 2010, both stitcher and rendercast load dynamic scripts synchronously without async option. We depend on this to ensure JS scripts load synchronously. Asnyc load will require alternative approach
                 */
                loadScriptHead : function(fileName, top, async){
                    top = typeof(top) == 'boolean' ? top : false;
                    async = typeof(async) != 'boolean' || async === false ? "" : async.toString();
                    
                    var scriptElement = av[top ? 'top' : 'doc'].createElement('script');
                        scriptElement.setAttribute('src',fileName);
                        scriptElement.setAttribute ("type", "text/javascript");
                        if(async != ''){
                            av.log.debug("Load " + fileName + " asynchronously")
                            scriptElement.setAttribute('async',async);
                        }else{
                            //scriptElement.async = false;
                        }
                        scriptElement.setAttribute("charset", "UTF-8");
                    av.html.addToHead(scriptElement,top);
                    
                },
                
                
                /**
                 * @param {String} jsString A string of JavaScript
                 * @param {Boolean} top False by default, should the JavaScript string be inserted in the scope of window.top or just the current document?
                 * @example av.html.loadGlobalJS('var printObject = function(elem){print(uneval(elem));}', false);
                 * printObject([1,2,3]);
                 * //ScriptTrace: ([1,2,3])
                 */
                loadGlobalJS : function(jsString, top){
                    top = typeof(top) == 'boolean' ? top : false;
                    av.log.debug("loadGlobalJS() - " + jsString.substring(0,100));
                    if(!av[top ? 'top' : 'doc']){av[top ? 'top' : 'doc'] = document;}//if called before dom loaded
                    
                    var scriptElement = av[top ? 'top' : 'doc'].createElement('script');
                        scriptElement.setAttribute ("type", "text/javascript");
                        scriptElement.text = jsString;
                        //av.log.debug("Loading global js: " + jsString);
                    av.html.addToHead(scriptElement,top);
                },
                
                /**
                 * Load a script synchronously, must be executed in a script node all by itself, or a js file just 
                 * for loading, like loader.js
                 * @param {Array} arguments A variable list of arguments, the last argument can optionally be a callback to call once the libraries have loaded
                 */
                
                loadScriptDocumentWrite : function(){
                    if(!av.writeable){
                        av.log.error("loadScriptDocumentWrite() - unable to execute as DOM has already been parsed");
                        return false;
                    }
                    
                    
                    if(arguments.length > 1){
                        for(var i=0; i<arguments.length; i++){
                            av.html.loadScriptDocumentWrite(arguments[i]);
                        }
                    //after all other scripts have been written, add a new script node with the callback function so that it executes AFTER
                    //the other added <script> tags have been executed. Make sure to delete the reference after
                    }else if(typeof(arguments[0]) == 'function'){
                        av.scriptCount++;
                        var func = "scriptloaded_" + av.scriptCount;
                        window[func] = arguments[0];
                        document.write('<scr' + 'ipt type="text/javascript" charset="UTF-8">window.' + func +'(); delete window.' + func + ';</scr' + 'ipt>')
                        arguments[0]();//call the function if we are at the function
                    }else{
                        document.write('<scr' + 'ipt type="text/javascript" charset="UTF-8" src="' + arguments[0] +'"></scr' + 'ipt>')
                    }
                    
                },
                
                /**
                 * Insert a set of CSS rules into the document head.
                 * @param {String} cssString A string of CSS that will be inserted into a "style" tag in the head of a document.
                 * @param {Boolean} top False by default, should the CSS Style string be inserted in the scope of window.top or just the current document?
                 */
                loadGlobalCss : function(cssString,top){
                    top = typeof(top) == 'boolean' ? top : false;
                    var s = av[top ? 'top' : 'doc'].createElement('style')
                    
                        s.setAttribute('type','text/css');
                    
                        //av.log.debug('stylesheet: ' + uneval(s))
                    
                        //var text = av[top ? 'top' : 'doc'].createTextNode(cssString);
                        s.innerHTML = cssString;
                        av.html.addToHead(s,top);
                },
                /**
                 * Will attach a file to the document, must end in .css for a CSS file, otherwise it is loaded as a JavaScript file.
                 * @param {String} fileName Path to the file to load, should be relative to the document location it is being loaded into.
                 * @param {Boolean} top False by default, should the file be loaded in the scope of window.top or just the current document?
                 */
                load : function(fileName, top){
                    top = typeof(top) == 'boolean' ? top : false;
                    
                    if(typeof(fileName) != 'string'){
                        throw new TypeError('_av.dom.load(string) - first argument must be a string, received ' + typeof(fileName));
                    }
                    
                    if(fileName.indexOf('css') != -1){
                        return av.html.loadCss(av.path + fileName, top);
                    }else{
                        return av.html.loadScript(av.path + fileName,top);
                    }
                    
                },
                /**
                 * Add an HTML element to the head of the document, appended as the last child of document.getElementsByTagName('head').item(0)
                 * @param {HTMLScript,HTMLLink,HTMLStylesheet} elem An HTML element to add.
                 * @param {Boolean} top False by default, should elem be attached to window.top or just the current document?
                 */
                addToHead : function(elem,top){
                    top = typeof(top) == 'boolean' ? top : false;
                    av[top ? 'top' : 'doc'].getElementsByTagName('head').item(0).appendChild(elem);
                }
        };
        
        /**
         * Determines elements of the navigator object and prints a normalized string to identify the user agent in use (varies from AVBrowser, chrome, safari, etc)
         * @return Normalized string representing user agent. 
         */
        av.getUserAgent = function(){
            return (
                        (typeof(navigator.appCodeName) == 'string' ? navigator.appCodeName + ' ' : '')
                    +   (typeof(navigator.appName) == 'string' ? navigator.appName + ' ' : '')
                    +   (typeof(navigator.appVersion) == 'string' ? navigator.appVersion + ' ' : '')
                    +   (typeof(navigator) != 'undefined' && typeof(navigator.devicetype) == 'string' ? ' (devicetype: '+navigator.devicetype + ') ' : '')
                    +   (typeof(navigator.userAgent) == 'string' ? navigator.userAgent + ' ' : '')
                    //+ (typeof(session) != 'undefined' && typeof(session.devicetype) == 'string' ? session.devicetype + ' ' : '') 
                
            )
        }
        
        /**
         * @private
         */
        av._print = function(level, variable, component){
            var level = typeof(level) != 'number' ? 0 : level;
                        
            var str = ''
            
            for(var i=0; i<variable.length; i++){
                if(str){str += ", "}
                if(typeof(HTMLElement) != 'undefined' && variable[i] instanceof HTMLElement){
                    var type = variable[i].nodeName;
                    str += type + '(id='+(variable[i].getAttribute('id')+')')
                }else if(typeof(variable[i]) != 'string' && typeof(variable[i]) != 'number'){
                    //console.log(variable.toString())
                    //console.log()
                    if(typeof(JSON) == 'undefined') av.require('data.json');
                    try{str += JSON.stringify(variable[i],null,4);}catch(eCircular){str+=variable[i];}
                }
                else str += variable[i];//@TODO use library to 
            }
            
            //var message = av.logLevels[level] + (component ? ' ('+component + ')' : '') + ': ' + str + ' ('+av.docPath + ') ';
            var message = av.logLevels[level] + ':[' + (component ? component : av.docPath.replace('.html','')) + ']:' + str
            //Log to session
            var levelNames = ['debug','info','warn', 'error','error'];
            if(level > 1 && session.hasOwnProperty('logError')){
                 if(av.sockets.log){
                    av.sockets.log.send(av.getClientId() + '||' + message);
                 }
                 
                 if(console && console.error){
                    console[levelNames[level]](message);
                 }
                 session.logError(message);
            }else if(!av.isStitcher && typeof(console) != 'undefined' && typeof(console.log) == 'function'){
                if(av.sockets.log){
                    av.sockets.log.send(av.getClientId() + '||' + message);
                }
                console[levelNames[level]](message);//allows for debugging in browser   
            }else if(session.hasOwnProperty('logError') && !av.isBrowser){
                if(av.sockets.log){
                    av.sockets.log.send(av.getClientId() + '||' + message);
                }
                print(message);
            }
            
        }
        
        /**
         * @private
         */
        av.logLevels = ["DEBUG","INFO","WARN","ERROR","FATAL"];
        
        /**
         * Log levels look up the following chain when being determined (to allow for you to enable selectively and/or disable selectively per library or globally): (a) window.config.libraryNameHere.logLevel overrides (b) window.config.av.logLevelLibs which overrides (c) window.config.av.logLevel
         * @param {String} component The name of the component to determine configured logLevel for
         * @example av.widget = {log:new av.Log(av.getEffectiveLogLevel('widget')), doThis : function(){av.widget.log.debug("Some message");}}
         */
        av.getEffectiveLogLevel = function(component){
            //library config overrides default logLevelLibs (if present), which overrides logLevel (if present), which overrides the # 2
            return av.getConfigValue(component+'.logLevel',av.getConfigValue('av.logLevelLibs',av.getConfigValue('av.logLevel',2)));
        }
        
        
        /**
         * @memberOf av
         * @class Methods used for logging, available by default when using av.js
         */
        
        av.Log = function(logLevel, component){
            var self = this;
            var logLevel = self.logLevel = typeof(logLevel) != 'number' ? 0 : logLevel;
            var component = typeof(component) == 'string' ? component : '';
            
            
            if(!logs && typeof(av.sockets.log) == 'undefined' && av.getConfigValue('av.logServer', false)){
                //console.log('socket server ' + av.num, Object.keys(av.sockets), component, av);
                logs++;//av.Socket depends on av.EventInterface, which has a log, so need to only call this and statically keep track so that we only do this once
                try{                
                    av.sockets.log = new av.Socket(av.getConfigValue('av.logServer', false), true, av.clientid);
                    av.sockets.log.send(av.getClientId() + '||New session from ' + av.getClientId());
                }catch(e){
                    av.sockets.log = false;//could not load
                }
            }
            
            return {
                /**
                 * When av.getConfigValue('av.logLevel') is 0, trace level DEBUG messages utilizing this method will be visible in the logs.
                 * @name av.Log.debug
                 * @memberOf av.Log#
                 * @type function
                 * @param {Mixed} variable An object, string, or any JavaScript variable to send to the log output.
                 * @example av.log.debug("x is currently equal to " + x);
                 * //ScriptTrace: '(default.html) DEBUG :x is currently equal to undefined
                 * 
                 * av.log.debug(x);
                 * //undefined
                 */
                debug : function(){if(0 == self.logLevel){av._print.apply(av,[0,arguments,component]);}},//easy breezy
                /**
                 * When av.getConfigValue('av.logLevel') is 1 or less, trace level INFO messages utilizing this method will be visible in the logs.
                 * @name av.Log.info
                 * @memberOf av.Log#
                 * @type function
                 * @param {Mixed} variable An object, string, or any JavaScript variable to send to the log output.
                 * @example av.log.info("Launching to page2.html from " + location.href);
                 * //ScriptTrace: '(page1.html) INFO :Launching to page2.html from file:///C:/page1.html
                 * 
                 * av.log.info(location.href);
                 * //ScriptTrace: '(page1.html) INFO :file:///C:/page1.html
                 */
                info : function(){if(1 >= self.logLevel){ av._print.apply(av,[1,arguments,component]);}},//easy breezy
                /**
                 * When av.getConfigValue('av.logLevel') is 2 or less, trace level WARN messages utilizing this method will be visible in the logs; this utilizes session.logError internally.
                 * @name av.Log.warn
                 * @memberOf av.Log#
                 * @type function
                 * @param {Mixed} variable An object, string, or any JavaScript variable to send to the log output.
                 * @example if(numTries > 10) av.log.warn("User " + username + " unsuccessfully tried logging in 10 times, locking login page...");
                 * //ScriptError: '(default.html) WARN :User chwagssd unsuccessfully tried logging in 10 times, locking login page...
                 */
                warn : function(){if(2 >= self.logLevel){ av._print.apply(av,[2,arguments,component]);}},//easy breezy
                /**
                 * When av.getConfigValue('av.logLevel') is 3 or less, trace level ERROR messages utilizing this method will be visible in the logs; this utilizes session.logError internally.
                 * @name av.Log.error
                 * @memberOf av.Log#
                 * @type function
                 * @param {Mixed} variable An object, string, or any JavaScript variable to send to the log output.
                 * @example if(this.status != 200) av.log.error("Flickr API unreachable, received status: " + this.status + " from server");
                 * //ScriptError: '(default.html) ERROR :Flickr API unreachable, received status: 500 from server
                 */
                error : function(){if(3 >= self.logLevel){ av._print.apply(av,[3,arguments,component]);}},//easy breezy
                /**
                 * When av.getConfigValue('av.logLevel') is 4 or less, trace level FATAL messages utilizing this method will be visible in the logs; this utilizes session.logError internally.
                 * @name av.Log.fatal
                 * @memberOf av.Log#
                 * @type function
                 * @param {Mixed} variable An object, string, or any JavaScript variable to send to the log output.
                 * @example if(rspRequest.status != 200) av.log.error("RSP Server unavailable, received status: " + this.status + " from server, cannot load data layer");
                 * //ScriptError: '(default.html) FATAL :RSP Server unavailable, received status: 500 from server, cannot load data layer
                 */
                fatal : function(){if(4 >= self.logLevel){ av._print.apply(av,[4,arguments,component]);}},//easy breezy
                raw : function(){console.log.apply(console,arguments);},//log to the top most window!
                setLogLevel : function(newLevel){self.logLevel = newLevel;},
                getLogLevel : function(){return self.logLevel;}
            }
        }
        
        av.Socket = function(url, autoStart, prefix){
            av.require('EventInterface');
            var self = this;
            var ws = null;
            var url = url;
            var prefix = typeof(prefix) == 'string' ? prefix : '';
            var queue = [];
            var autoStart = typeof(autoStart) == 'boolean' ? autoStart : false;
            var minInterval = interval = 1000
            var maxInterval = 10000;//longest to wait when connecting between errors
            
            new av.EventInterface(self, true);
            
            self.send = function(message){
                if(!self.open()){
                    queue.push(message);
                }else if(message){
                    //console.log('sending from message: '+message)
                    ws.send(message);
                }else if(queue.length){
                    //console.log('sending from queue')
                    ws.send(queue.shift());//1st in == 1st out
                    self.send();
                }
                
            }
            
            var onmessage = function(evt){
                //do nothing
            }
            
            var onopen = function(evt){
                interval = minInterval;//reset error timer
                //console.log("opened, queue length: " + queue.length, queue)
                self.send();//send any messages queued up
            }
            
            var onerror = function(evt){
                interval = Math.min(interval*2, maxInterval);
                //console.log('closed, try again in ' + interval + 'ms');
                
                setTimeout(self.open, interval);//reopen
            }
            
            var onclose = function(evt){
                interval = Math.min(interval*2, maxInterval);
                //console.log('closed, try again in ' + interval + 'ms');
                
                setTimeout(self.open, interval);//reopen
            }
            
            self.open = function(urlOverride){
                if(!ws || ws.readyState > 1){//not defined yet or closed
                    //console.log('opening WebSocket')
                    
                    if(typeof(urlOverride) == 'string'){
                        url = urlOverride;
                    }
                    //console.log('url', url)
                    ws = self._ws = new WebSocket(url);//override any existing WebSocket
                    ws.onmessage = function(evt){self.dispatchEvent('message', evt);}
                    ws.onopen = function(evt){self.dispatchEvent('open', evt);}
                    ws.onclose = function(evt){self.dispatchEvent('close', evt);}
                    ws.onerror = function(evt){self.dispatchEvent('error', evt);}
                    return false;
                }else if(ws && ws.readyState === 0){
                    return false;
                }else if(ws && ws.readyState === 1){
                    return true;
                }
            }
            
            self.addEventListener('message', onmessage);
            self.addEventListener('open', onopen);
            self.addEventListener('close', onclose);
            self.addEventListener('error', onerror);
            
            if(autoStart){
                self.open();
            }
            
            return self;
            
        }
        
        
        
        //print(logLevel);
        /**
         * Main instance of av.Log() that can be use to log throughout the application
         * @memberOf av
         * @type av.Log
         */
        av.log = new av.Log(5);
        
        /**
         * @private
         */
        av.defaultKeys = {  
                ok:"Enter",
                enter:"Enter",
                select:"Enter",
                left:"Left",
                up:"Up",
                right:"Right",
                down:"Down",
                play:"Play",
                pause:"Pause",
                stop:"MediaStop",
                fastforward:"FastForward",
                rewindd:"Rewind",
                power:"Power",
                exit:"Exit",
                '0':"U+0030",
                'zero':"U+0030",
                closeparenthesis:"U+0030",
                '1':"U+0031",
                'one':"U+0031",
                bank:"U+0031",
                '2':"U+0032",
                two:"U+0032",
                at:"U+0032",
                '@':"U+0032",
                '3':"U+0033",
                three:"U+0033",
                hash:"U+0033",
                '#':"U+0033",
                pound:"U+0033",
                '4':"U+0034",
                four:"U+0034",
                dollar:"U+0034",
                '$':"U+0034",
                '5':"U+0035",
                five:"U+0035",
                percent:"U+0035",
                '%':"U+0035",
                '6':"U+0036",
                six:"U+0036",
                "^":"U+0036",
                "carrot":"U+0036",
                '7':"U+0037",
                seven:"U+0037",
                "&":"U+0037",
                '8':"U+0038",
                eight:"U+0038",
                asterisk:"U+0038",
                '*':"U+0038",
                '9':"U+0039",
                nine:"U+0039",
                openparenthesis:"U+0039",
                a:"U+0041",
                A:"U+0041",
                b:"U+0042",
                B:"U+0042",
                c:"U+0043",
                C:"U+0043",
                d:"U+0044",
                D:"U+0044",
                e:"U+0045",
                E:"U+0045",
                f:"U+0046",
                F:"U+0046",
                g:"U+0047",
                G:"U+0047",
                h:"U+0048",
                H:"U+0048",
                i:"U+0049",
                I:"U+0049",
                j:"U+004A",
                J:"U+004A",
                k:"U+004B",
                K:"U+004B",
                l:"U+004C",
                L:"U+004C",
                m:"U+004D",
                M:"U+004D",
                n:"U+004E",
                N:"U+004E",
                o:"U+004F",
                O:"U+004F",
                p:"U+0050",
                P:"U+0050",
                q:"U+0051",
                Q:"U+0051",
                r:"U+0052",
                R:"U+0052",
                s:"U+0053",
                S:"U+0053",
                t:"U+0054",
                T:"U+0054",
                u:"U+0055",
                U:"U+0055",
                v:"U+0056",
                V:"U+0056",
                w:"U+0057",
                W:"U+0057",
                x:"U+0058",
                X:"U+0058",
                y:"U+0059",
                Y:"U+0059",
                z:"U+005A",
                Z:"U+005A",
                "`":"U+00CO",
                "~":"U+00CO",
                tilda:"U+00CO",
                backspace:"U+0008",
                tab:"U+0009",
                shift:"Shift",
                control:"Control",
                alt:"Alt",
                esc:"U+001B",
                spacebar:"U+0020",
                "0":"U+00BD",
                "_":"U+00BD",
                "=":"U+00BB",
                "+":"U+00BB",
                "[":"U+00DB",
                "{":"U+00DB",
                "]":"U+00DD",
                "}":"U+00DD",
                "\\":"U+00DC",
                "backslash":"U+00DC",
                "|":"U+00DC",
                ";":"U+00BA",
                ":":"U+00BA",
                "\"":"U+00DE",
                "quote":"U+00DE",
                ",":"U+00BC",
                "<":"U+00BC",
                ".":"U+00BE",
                ">":"U+00BE",
                "/":"U+00BF",
                
                "?":"U+00BF",
                Delete:"U+007F",
                Insert:"Insert",
                Home:"Home",
                End:"End",
                PageUp:"PageUp",
                PageDown:"PageDown",
                F1:"F1",
                F2:"F2",
                F3:"F3",
                F4:"F4",
                F5:"F5",
                F6:"F6",
                F7:"F7",
                F8:"F8",
                F9:"F9",
                F10:"F10",
                F11:"F11",
                F12:"F12",
                NumLock:"U+0090",
                CapsLock:"CapsLock",
                Guide:"Guide",
                Menu:"Menu",
                Info:"Info",
                Help:"Help",
                Last:"Last",
                BrowserFavorites:"BrowserFavorites",
                Settings:"Settings",
                Lock:"Lock",
                ButtonA:"ButtonA",
                ButtonB:"ButtonB",
                ButtonC:"ButtonC",
                RedButton:"RedButton",
                GreenButton:"GreenButton",
                BlueButton:"BlueButton",
                YellowButton:"YellowButton",
                MediaNextTrack:"MediaNextTrack",
                MediaPreviousTrack:"MediaPreviousTrack",
                Aux:"Aux",
                VCR:"VCR",
                TV:"TV",
                Cable:"Cable",
                List:"List",
                VolumeMute:"VolumeMute",
                DVR:"DVR",
                VolumeUp:"VolumeUp",
                VolumeDown:"VolumeDown",
                ChannelUp:"ChannelUp",
                ChannelDown:"ChannelDown",
                Record:"Record",
                Live:"Live",
                CircleLeft:"CircleLeft",
                CircleRight:"CircleRight",
                Bypass:"Bypass",
                Swap:"Swap",
                Move:"Move",
                VideoSource:"VideoSource",
                PPV:"PPV"
    /*
                
                
            "up"          : "Up",
            "down"        : "Down",
            "dn"          : "Down",
            "left"        : "Left",
            "lt"          : "Left",
            "right"       : "Right",
            "rt"          : "Right",
            "zero"        : 'U+0030',
            "one"         : 49,
            "two"         : 50,
            "three"       : 51,
            "four"        : 52,
            "five"        : 53,
            "six"         : 54,
            "seven"       : 55,
            "eight"       : 56,
            "nine"        : 57,
            "enter"       : 13,
            "exit"        : 4102,
            "fastforward" : 4099,
            "ff"          : 4099,
            "rewind"      : 4100,
            "rw"          : 4100,
            "play"        : 4096,
            "pause"       : 4097,
            "stop"        : 4098,
     */
        };
        
        av.keyCodes = {
            //CODE --> NAME
                '49'          : "one",
                '50'          : "two",
                '51'          : "three",
                '52'          : "four",
                '53'          : "five",
                '54'          : "six",
                '55'          : "seven",
                '56'          : "eight",
                '57'          : "nine",
                '48'          : "zero",
                
                '403'         : 'ButtonA',
                '405'         : 'ButtonB',
                '406'         : 'ButtonC',
                '407'         : 'ButtonD',
                
                '37'          : "left",
                '38'          : "up",
                '39'          : "right",
                '40'          : "down",
                
                '13'          : "enter",
                '1158'        : "exit",
                '8'           : 'last',
                
                '33'          : 'PageUp', //moto
                '34'          : 'PageDown', //moto
                '427'         : 'ChannelUp',
                '428'         : 'ChannelDown',
                '415'         : 'play',
                '19'          : 'pause',
                '412'         : 'rewind',
                '417'         : 'fastforward',
                '413'         : 'stop',
                '424'         : 'previous',
                '425'         : 'next',

                '4111'        : 'ButtonA',
                '4112'        : 'ButtonB',
                '4113'        : 'ButtonC',
                '4114'        : 'ButtonD',
                '457'         : 'Info',
                '416'         : 'Record',
                '171'         : 'Fav',
                '1805'        : 'OnDemand',
                '156'         : 'Help',
                '462'         : 'Menu',
                '1181'        : 'DVR',
                '36'          : 'Home',
                '458'         : 'Guide', 
                '4109'        : 'Settings',                                  
          //INVERSES (NAME --> CODE, but using const notation in all CAPS)      
                'ZERO'         : 48,
                'ONE'          : 49,
                'TWO'          : 50,
                'THREE'        : 51,
                'FOUR'         : 52,
                'FIVE'         : 53,
                'SIX'          : 54,
                'SEVEN'        : 55,
                'EIGHT'        : 56,
                'NINE'         : 57,

                'A'            : 65,
                'B'            : 66,
                'C'            : 67,
                'D'            : 68,
                'E'            : 69,
                'F'            : 70,
                'G'            : 71,
                'H'            : 72,
                'I'            : 73,
                'J'            : 74,
                'K'            : 75,
                'L'            : 76,
                'M'            : 77,
                'N'            : 78,
                'O'            : 79,
                'P'            : 80,
                'Q'            : 81,
                'R'            : 82,
                'S'            : 83,
                'T'            : 84,
                'U'            : 85,
                'V'            : 86,
                'W'            : 87,
                'X'            : 88,
                'Y'            : 89,
                'Z'            : 90,
                
                'RED'          : 403,
                'GREEN'        : 404,
                'YELLOW'       : 405,
                'BLUE'         : 406,
                
                'LEFT'         : 37,
                'UP'           : 38,
                'RIGHT'        : 39,
                'DOWN'         : 40,
                
                'ENTER'        : 13,
                'OK'           : 13,
                'EXIT'         : 1158,
                'LAST'         : 8,
                'BACK'         : 35,//http bcd
                
                'PAGE_UP'      : 33,
                'PAGE_DOWN'    : 34,
                'CHANNEL_UP'   : 427,
                'CHANNEL_DOWN' : 428,
                'PLAY'         : 415,
                'PAUSE'        : 19,
                'REWIND'       : 412,
                'FAST_FORWARD' : 417,
                'STOP'         : 413,
                'PREVIOUS'     : 424,
                'NEXT'         : 425,
                'BUTTON_A'     : 4111,
                'BUTTON_B'     : 4112,
                'BUTTON_C'     : 4113,
                'BUTTON_D'     : 4114,
                'INFO'         : 457,
                'RECORD'       : 416,
                'FAV'          : 171,
                'ON_DEMAND'    : 1805,
                'LIVE'         : 1157,
                'HELP'         : 156,
                'MENU'         : 462,
                'DVR'          : 1181,
                'HOME'         : 36,
                'GUIDE'        : 458,
                'SETTINGS'      : 4109
        };
        
        av.getKeyIdentifier = function(evtOrKeyCode){
            if(typeof(evtOrKeyCode) != 'string' && typeof(evtOrKeyCode != 'number')){
                if(evtOrKeyCode.keyIdentifier) return evtOrKeyCode.keyIdentifier;//extract from event
                else keyCode = evtOrKeyCode.keyCode;//extract keyCode from event
            }else{
                keyCode = evtOrKeyCode;
            }
            av.log.debug(keyCode);
            var c = keyCode ? keyCode.toString() : '';
            av.log.debug(av.keys[av.keyCodes[c]]);
            return keyCode == '' || typeof(av.keyCodes[c]) == 'undefined' || typeof(av.keys[av.keyCodes[c]]) == 'undefined' ? '' : av.keys[av.keyCodes[c]];
        }
        
        av.addEventListener = function(type, func){
            if(!events[type] || !(events[type] instanceof Array)){
                events[type] = [func];
            }else{
                events[type].push(func);
            }
        } 
        
        av.removeEventListener = function(type, func){
            if(events[type] && typeof(events[type]) != 'undefined'){
                for(i=0; i<events[type].length; i++){
                    //remove any reference to function we have
                    if(events[type][i] && events[type][i] == func){
                        delete events[type][i];
                        events[type].splice(i, 1);
                        return true;
                    }
                }
            }
            return false;
        }
        
        av.removeEventListeners = function(type){
            var i=0;
            if(!events[type] || events[type] instanceof Array){
                for(i; i<events[type].length; i++){
                    //remove any reference to function we have
                    delete events[type][i];
                }
            }
            events[type] = [];
            return i;
        }
        
        av._dispatchEvent = function(type, evt){
            //if we have event listeners, fire them sequentially
            if(events[type] && events[type] instanceof Array){
                //av.log.debug("Dispatching " + type + " event on av object for " + events[type].length + ' listeners.'); 
                for(var i=0; i<events[type].length; i++){
                    //remove any reference to function we have if that function has lost context, example page it was
                    //defined in is no longer around.
                    if(!events[type][i] || !(events[type][i] instanceof Function)){
                        events[type].splice(i,1);
                        i--;
                    }else{
                        events[type][i](evt);
                    }
                }
            }
        }
        
        av.dispatchEvent = function(target,type, bubbles, cancelable, props){
            var props = props || {};
            var bubbles = typeof(bubbles) != 'boolean' ? true : bubbles;
            var cancelable = typeof(cancelable) != 'boolean' ? true : cancelable;
            
            var e = av.doc.createEvent("Event");
                e.initEvent(type, bubbles, cancelable);//isCancellable = YES!!! For example, on text, the password shouldn't probably ever be displayed 
                e.source = 'av';
                for(var prop in props) e[prop] = props[prop];
                if(target == av){
                    var shouldContinue = av._dispatchEvent(type, e);
                }else{
                    var shouldContinue = target.dispatchEvent(e);   
                }
                    
            return shouldContinue;  
        }
        
        return av;
    }//end avcore
    return new avcore();
});

if(!window.av){
    av = window.top.av = new _av;
    //if(typeof() == 'undefined') var defaultLibraries = 'dom,settings,pairing';
    av.init(document);

    window.avFocus = function(evt){
        /*print(av.doc); print(document);*/
        if(av.doc != document){
            av.log.debug("AVINIT reinit(document) - refocused existing document");
            av.setCurrentDocument(document);
            //fire a refocus event on window
            av.dispatchEvent(window,'refocus');
        }
    };


    av.log.debug("AVINIT av.init(document) - created new instance");
    //Attach "document" back to av.doc on focus of window... only 1 window visible at a time, and av.dom.xxx methods should use it
    window.addEventListener('focus', window.avFocus, true);
    window.addEventListener('keydown',function(evt){av.doc = document; av._dispatchEvent('keydown', evt);}, false);
}

/**
 * Meta tags for AVIR
 */
if(av.getConfigValue('app.appName')){
    document.write('<meta name="application-name" content="' + av.getConfigValue('app.appName','').replace(/[^a-z0-9_]/gi,'') + '"></meta>');
}
if(av.getConfigValue('app.version')){
    document.write('<meta name="version" content="' + av.getConfigValue('app.version','') + '"></meta>');   
}




