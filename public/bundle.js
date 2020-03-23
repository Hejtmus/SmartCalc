
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.head.appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function validate_store(store, name) {
        if (!store || typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, callback) {
        const unsub = store.subscribe(callback);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }
    function create_slot(definition, ctx, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, fn) {
        return definition[1]
            ? assign({}, assign(ctx.$$scope.ctx, definition[1](fn ? fn(ctx) : {})))
            : ctx.$$scope.ctx;
    }
    function get_slot_changes(definition, ctx, changed, fn) {
        return definition[1]
            ? assign({}, assign(ctx.$$scope.changed || {}, definition[1](fn ? fn(changed) : {})))
            : ctx.$$scope.changed || {};
    }
    function exclude_internal_props(props) {
        const result = {};
        for (const k in props)
            if (k[0] !== '$')
                result[k] = props[k];
        return result;
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else
            node.setAttribute(attribute, value);
    }
    function set_attributes(node, attributes) {
        for (const key in attributes) {
            if (key === 'style') {
                node.style.cssText = attributes[key];
            }
            else if (key in node) {
                node[key] = attributes[key];
            }
            else {
                attr(node, key, attributes[key]);
            }
        }
    }
    function to_number(value) {
        return value === '' ? undefined : +value;
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        if (value != null || input.value) {
            input.value = value;
        }
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error(`Function called outside component initialization`);
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    function createEventDispatcher() {
        const component = current_component;
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
    }
    // TODO figure out if we still want to support
    // shorthand events, or if we want to implement
    // a real bubbling mechanism
    function bubble(component, event) {
        const callbacks = component.$$.callbacks[event.type];
        if (callbacks) {
            callbacks.slice().forEach(fn => fn(event));
        }
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function flush() {
        const seen_callbacks = new Set();
        do {
            // first, call beforeUpdate functions
            // and update components
            while (dirty_components.length) {
                const component = dirty_components.shift();
                set_current_component(component);
                update(component.$$);
            }
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    callback();
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
    }
    function update($$) {
        if ($$.fragment) {
            $$.update($$.dirty);
            run_all($$.before_update);
            $$.fragment.p($$.dirty, $$.ctx);
            $$.dirty = null;
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    const globals = (typeof window !== 'undefined' ? window : global);

    function get_spread_update(levels, updates) {
        const update = {};
        const to_null_out = {};
        const accounted_for = { $$scope: 1 };
        let i = levels.length;
        while (i--) {
            const o = levels[i];
            const n = updates[i];
            if (n) {
                for (const key in o) {
                    if (!(key in n))
                        to_null_out[key] = 1;
                }
                for (const key in n) {
                    if (!accounted_for[key]) {
                        update[key] = n[key];
                        accounted_for[key] = 1;
                    }
                }
                levels[i] = n;
            }
            else {
                for (const key in o) {
                    accounted_for[key] = 1;
                }
            }
        }
        for (const key in to_null_out) {
            if (!(key in update))
                update[key] = undefined;
        }
        return update;
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        if (component.$$.fragment) {
            run_all(component.$$.on_destroy);
            component.$$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            component.$$.on_destroy = component.$$.fragment = null;
            component.$$.ctx = {};
        }
    }
    function make_dirty(component, key) {
        if (!component.$$.dirty) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty = blank_object();
        }
        component.$$.dirty[key] = true;
    }
    function init(component, options, instance, create_fragment, not_equal, prop_names) {
        const parent_component = current_component;
        set_current_component(component);
        const props = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props: prop_names,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty: null
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, props, (key, ret, value = ret) => {
                if ($$.ctx && not_equal($$.ctx[key], $$.ctx[key] = value)) {
                    if ($$.bound[key])
                        $$.bound[key](value);
                    if (ready)
                        make_dirty(component, key);
                }
                return ret;
            })
            : props;
        $$.update();
        ready = true;
        run_all($$.before_update);
        $$.fragment = create_fragment($$.ctx);
        if (options.target) {
            if (options.hydrate) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment.l(children(options.target));
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, detail));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
        text.data = data;
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
    }

    const subscriber_queue = [];
    /**
     * Creates a `Readable` store that allows reading by subscription.
     * @param value initial value
     * @param {StartStopNotifier}start start and stop notifications for subscriptions
     */
    function readable(value, start) {
        return {
            subscribe: writable(value, start).subscribe,
        };
    }
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (let i = 0; i < subscribers.length; i += 1) {
                        const s = subscribers[i];
                        s[1]();
                        subscriber_queue.push(s, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }
    /**
     * Derived value store by synchronizing one or more readable stores and
     * applying an aggregation function over its input values.
     * @param {Stores} stores input stores
     * @param {function(Stores=, function(*)=):*}fn function callback that aggregates the values
     * @param {*=}initial_value when used asynchronously
     */
    function derived(stores, fn, initial_value) {
        const single = !Array.isArray(stores);
        const stores_array = single
            ? [stores]
            : stores;
        const auto = fn.length < 2;
        return readable(initial_value, (set) => {
            let inited = false;
            const values = [];
            let pending = 0;
            let cleanup = noop;
            const sync = () => {
                if (pending) {
                    return;
                }
                cleanup();
                const result = fn(single ? values[0] : values, set);
                if (auto) {
                    set(result);
                }
                else {
                    cleanup = is_function(result) ? result : noop;
                }
            };
            const unsubscribers = stores_array.map((store, i) => store.subscribe((value) => {
                values[i] = value;
                pending &= ~(1 << i);
                if (inited) {
                    sync();
                }
            }, () => {
                pending |= (1 << i);
            }));
            inited = true;
            sync();
            return function stop() {
                run_all(unsubscribers);
                cleanup();
            };
        });
    }

    function regexparam (str, loose) {
    	if (str instanceof RegExp) return { keys:false, pattern:str };
    	var c, o, tmp, ext, keys=[], pattern='', arr = str.split('/');
    	arr[0] || arr.shift();

    	while (tmp = arr.shift()) {
    		c = tmp[0];
    		if (c === '*') {
    			keys.push('wild');
    			pattern += '/(.*)';
    		} else if (c === ':') {
    			o = tmp.indexOf('?', 1);
    			ext = tmp.indexOf('.', 1);
    			keys.push( tmp.substring(1, !!~o ? o : !!~ext ? ext : tmp.length) );
    			pattern += !!~o && !~ext ? '(?:/([^/]+?))?' : '/([^/]+?)';
    			if (!!~ext) pattern += (!!~o ? '?' : '') + '\\' + tmp.substring(ext);
    		} else {
    			pattern += '/' + tmp;
    		}
    	}

    	return {
    		keys: keys,
    		pattern: new RegExp('^' + pattern + (loose ? '(?=$|\/)' : '\/?$'), 'i')
    	};
    }

    /* node_modules/svelte-spa-router/Router.svelte generated by Svelte v3.12.1 */
    const { Error: Error_1, Object: Object_1 } = globals;

    function create_fragment(ctx) {
    	var switch_instance_anchor, current;

    	var switch_value = ctx.component;

    	function switch_props(ctx) {
    		return {
    			props: { params: ctx.componentParams },
    			$$inline: true
    		};
    	}

    	if (switch_value) {
    		var switch_instance = new switch_value(switch_props(ctx));
    	}

    	const block = {
    		c: function create() {
    			if (switch_instance) switch_instance.$$.fragment.c();
    			switch_instance_anchor = empty();
    		},

    		l: function claim(nodes) {
    			throw new Error_1("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			if (switch_instance) {
    				mount_component(switch_instance, target, anchor);
    			}

    			insert_dev(target, switch_instance_anchor, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var switch_instance_changes = {};
    			if (changed.componentParams) switch_instance_changes.params = ctx.componentParams;

    			if (switch_value !== (switch_value = ctx.component)) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;
    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});
    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props(ctx));

    					switch_instance.$$.fragment.c();
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
    				} else {
    					switch_instance = null;
    				}
    			}

    			else if (switch_value) {
    				switch_instance.$set(switch_instance_changes);
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(switch_instance_anchor);
    			}

    			if (switch_instance) destroy_component(switch_instance, detaching);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment.name, type: "component", source: "", ctx });
    	return block;
    }

    /**
     * @typedef {Object} Location
     * @property {string} location - Location (page/view), for example `/book`
     * @property {string} [querystring] - Querystring from the hash, as a string not parsed
     */
    /**
     * Returns the current location from the hash.
     *
     * @returns {Location} Location object
     * @private
     */
    function getLocation() {
    const hashPosition = window.location.href.indexOf('#/');
    let location = (hashPosition > -1) ? window.location.href.substr(hashPosition + 1) : '/';

    // Check if there's a querystring
    const qsPosition = location.indexOf('?');
    let querystring = '';
    if (qsPosition > -1) {
        querystring = location.substr(qsPosition + 1);
        location = location.substr(0, qsPosition);
    }

    return {location, querystring}
    }

    /**
     * Readable store that returns the current full location (incl. querystring)
     */
    const loc = readable(
    getLocation(),
    // eslint-disable-next-line prefer-arrow-callback
    function start(set) {
        const update = () => {
            set(getLocation());
        };
        window.addEventListener('hashchange', update, false);

        return function stop() {
            window.removeEventListener('hashchange', update, false);
        }
    }
    );

    /**
     * Readable store that returns the current location
     */
    const location = derived(
    loc,
    ($loc) => $loc.location
    );

    /**
     * Readable store that returns the current querystring
     */
    const querystring = derived(
    loc,
    ($loc) => $loc.querystring
    );

    function instance($$self, $$props, $$invalidate) {
    	let $loc;

    	validate_store(loc, 'loc');
    	component_subscribe($$self, loc, $$value => { $loc = $$value; $$invalidate('$loc', $loc); });

    	

    /**
     * Dictionary of all routes, in the format `'/path': component`.
     *
     * For example:
     * ````js
     * import HomeRoute from './routes/HomeRoute.svelte'
     * import BooksRoute from './routes/BooksRoute.svelte'
     * import NotFoundRoute from './routes/NotFoundRoute.svelte'
     * routes = {
     *     '/': HomeRoute,
     *     '/books': BooksRoute,
     *     '*': NotFoundRoute
     * }
     * ````
     */
    let { routes = {}, prefix = '' } = $$props;

    /**
     * Container for a route: path, component
     */
    class RouteItem {
        /**
         * Initializes the object and creates a regular expression from the path, using regexparam.
         *
         * @param {string} path - Path to the route (must start with '/' or '*')
         * @param {SvelteComponent} component - Svelte component for the route
         */
        constructor(path, component) {
            if (!component || (typeof component != 'function' && (typeof component != 'object' || component._sveltesparouter !== true))) {
                throw Error('Invalid component object')
            }

            // Path must be a regular or expression, or a string starting with '/' or '*'
            if (!path || 
                (typeof path == 'string' && (path.length < 1 || (path.charAt(0) != '/' && path.charAt(0) != '*'))) ||
                (typeof path == 'object' && !(path instanceof RegExp))
            ) {
                throw Error('Invalid value for "path" argument')
            }

            const {pattern, keys} = regexparam(path);

            this.path = path;

            // Check if the component is wrapped and we have conditions
            if (typeof component == 'object' && component._sveltesparouter === true) {
                this.component = component.route;
                this.conditions = component.conditions || [];
                this.userData = component.userData;
            }
            else {
                this.component = component;
                this.conditions = [];
                this.userData = undefined;
            }

            this._pattern = pattern;
            this._keys = keys;
        }

        /**
         * Checks if `path` matches the current route.
         * If there's a match, will return the list of parameters from the URL (if any).
         * In case of no match, the method will return `null`.
         *
         * @param {string} path - Path to test
         * @returns {null|Object.<string, string>} List of paramters from the URL if there's a match, or `null` otherwise.
         */
        match(path) {
            // If there's a prefix, remove it before we run the matching
            if (prefix && path.startsWith(prefix)) {
                path = path.substr(prefix.length) || '/';
            }

            // Check if the pattern matches
            const matches = this._pattern.exec(path);
            if (matches === null) {
                return null
            }

            // If the input was a regular expression, this._keys would be false, so return matches as is
            if (this._keys === false) {
                return matches
            }

            const out = {};
            let i = 0;
            while (i < this._keys.length) {
                out[this._keys[i]] = matches[++i] || null;
            }
            return out
        }

        /**
         * Dictionary with route details passed to the pre-conditions functions, as well as the `routeLoaded` and `conditionsFailed` events
         * @typedef {Object} RouteDetail
         * @property {SvelteComponent} component - Svelte component
         * @property {string} name - Name of the Svelte component
         * @property {string} location - Location path
         * @property {string} querystring - Querystring from the hash
         * @property {Object} [userData] - Custom data passed by the user
         */

        /**
         * Executes all conditions (if any) to control whether the route can be shown. Conditions are executed in the order they are defined, and if a condition fails, the following ones aren't executed.
         * 
         * @param {RouteDetail} detail - Route detail
         * @returns {bool} Returns true if all the conditions succeeded
         */
        checkConditions(detail) {
            for (let i = 0; i < this.conditions.length; i++) {
                if (!this.conditions[i](detail)) {
                    return false
                }
            }

            return true
        }
    }

    // We need an iterable: if it's not a Map, use Object.entries
    const routesIterable = (routes instanceof Map) ? routes : Object.entries(routes);

    // Set up all routes
    const routesList = [];
    for (const [path, route] of routesIterable) {
        routesList.push(new RouteItem(path, route));
    }

    // Props for the component to render
    let component = null;
    let componentParams = {};

    // Event dispatcher from Svelte
    const dispatch = createEventDispatcher();

    // Just like dispatch, but executes on the next iteration of the event loop
    const dispatchNextTick = (name, detail) => {
        // Execute this code when the current call stack is complete
        setTimeout(() => {
            dispatch(name, detail);
        }, 0);
    };

    	const writable_props = ['routes', 'prefix'];
    	Object_1.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<Router> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ('routes' in $$props) $$invalidate('routes', routes = $$props.routes);
    		if ('prefix' in $$props) $$invalidate('prefix', prefix = $$props.prefix);
    	};

    	$$self.$capture_state = () => {
    		return { routes, prefix, component, componentParams, $loc };
    	};

    	$$self.$inject_state = $$props => {
    		if ('routes' in $$props) $$invalidate('routes', routes = $$props.routes);
    		if ('prefix' in $$props) $$invalidate('prefix', prefix = $$props.prefix);
    		if ('component' in $$props) $$invalidate('component', component = $$props.component);
    		if ('componentParams' in $$props) $$invalidate('componentParams', componentParams = $$props.componentParams);
    		if ('$loc' in $$props) loc.set($loc);
    	};

    	$$self.$$.update = ($$dirty = { component: 1, $loc: 1 }) => {
    		if ($$dirty.component || $$dirty.$loc) { {
                // Find a route matching the location
                $$invalidate('component', component = null);
                let i = 0;
                while (!component && i < routesList.length) {
                    const match = routesList[i].match($loc.location);
                    if (match) {
                        const detail = {
                            component: routesList[i].component,
                            name: routesList[i].component.name,
                            location: $loc.location,
                            querystring: $loc.querystring,
                            userData: routesList[i].userData
                        };
            
                        // Check if the route can be loaded - if all conditions succeed
                        if (!routesList[i].checkConditions(detail)) {
                            // Trigger an event to notify the user
                            dispatchNextTick('conditionsFailed', detail);
                            break
                        }
                        $$invalidate('component', component = routesList[i].component);
                        $$invalidate('componentParams', componentParams = match);
            
                        dispatchNextTick('routeLoaded', detail);
                    }
                    i++;
                }
            } }
    	};

    	return {
    		routes,
    		prefix,
    		component,
    		componentParams
    	};
    }

    class Router extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, ["routes", "prefix"]);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "Router", options, id: create_fragment.name });
    	}

    	get routes() {
    		throw new Error_1("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set routes(value) {
    		throw new Error_1("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get prefix() {
    		throw new Error_1("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set prefix(value) {
    		throw new Error_1("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    function toVal(mix) {
    	var k, y, str='';
    	if (mix) {
    		if (typeof mix === 'object') {
    			if (!!mix.push) {
    				for (k=0; k < mix.length; k++) {
    					if (mix[k] && (y = toVal(mix[k]))) {
    						str && (str += ' ');
    						str += y;
    					}
    				}
    			} else {
    				for (k in mix) {
    					if (mix[k] && (y = toVal(k))) {
    						str && (str += ' ');
    						str += y;
    					}
    				}
    			}
    		} else if (typeof mix !== 'boolean' && !mix.call) {
    			str && (str += ' ');
    			str += mix;
    		}
    	}
    	return str;
    }

    function clsx () {
    	var i=0, x, str='';
    	while (i < arguments.length) {
    		if (x = toVal(arguments[i++])) {
    			str && (str += ' ');
    			str += x;
    		}
    	}
    	return str;
    }

    function isObject(value) {
      const type = typeof value;
      return value != null && (type == 'object' || type == 'function');
    }

    function getColumnSizeClass(isXs, colWidth, colSize) {
      if (colSize === true || colSize === '') {
        return isXs ? 'col' : `col-${colWidth}`;
      } else if (colSize === 'auto') {
        return isXs ? 'col-auto' : `col-${colWidth}-auto`;
      }

      return isXs ? `col-${colSize}` : `col-${colWidth}-${colSize}`;
    }

    function clean($$props) {
      const rest = {};
      for (const key of Object.keys($$props)) {
        if (key !== "children" && key !== "$$scope" && key !== "$$slots") {
          rest[key] = $$props[key];
        }
      }
      return rest;
    }

    /* node_modules/sveltestrap/src/Button.svelte generated by Svelte v3.12.1 */

    const file = "node_modules/sveltestrap/src/Button.svelte";

    // (53:0) {:else}
    function create_else_block_1(ctx) {
    	var button, current_block_type_index, if_block, current, dispose;

    	const default_slot_template = ctx.$$slots.default;
    	const default_slot = create_slot(default_slot_template, ctx, null);

    	var if_block_creators = [
    		create_if_block_2,
    		create_if_block_3,
    		create_else_block_2
    	];

    	var if_blocks = [];

    	function select_block_type_2(changed, ctx) {
    		if (ctx.close) return 0;
    		if (ctx.children) return 1;
    		return 2;
    	}

    	current_block_type_index = select_block_type_2(null, ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	var button_levels = [
    		ctx.props,
    		{ id: ctx.id },
    		{ class: ctx.classes },
    		{ disabled: ctx.disabled },
    		{ value: ctx.value },
    		{ "aria-label": ctx.ariaLabel || ctx.defaultAriaLabel },
    		{ style: ctx.style }
    	];

    	var button_data = {};
    	for (var i = 0; i < button_levels.length; i += 1) {
    		button_data = assign(button_data, button_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			button = element("button");

    			if (!default_slot) {
    				if_block.c();
    			}

    			if (default_slot) default_slot.c();

    			set_attributes(button, button_data);
    			add_location(button, file, 53, 2, 1061);
    			dispose = listen_dev(button, "click", ctx.click_handler_1);
    		},

    		l: function claim(nodes) {
    			if (default_slot) default_slot.l(button_nodes);
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);

    			if (!default_slot) {
    				if_blocks[current_block_type_index].m(button, null);
    			}

    			else {
    				default_slot.m(button, null);
    			}

    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (!default_slot) {
    				var previous_block_index = current_block_type_index;
    				current_block_type_index = select_block_type_2(changed, ctx);
    				if (current_block_type_index === previous_block_index) {
    					if_blocks[current_block_type_index].p(changed, ctx);
    				} else {
    					group_outros();
    					transition_out(if_blocks[previous_block_index], 1, 1, () => {
    						if_blocks[previous_block_index] = null;
    					});
    					check_outros();

    					if_block = if_blocks[current_block_type_index];
    					if (!if_block) {
    						if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    						if_block.c();
    					}
    					transition_in(if_block, 1);
    					if_block.m(button, null);
    				}
    			}

    			if (default_slot && default_slot.p && changed.$$scope) {
    				default_slot.p(
    					get_slot_changes(default_slot_template, ctx, changed, null),
    					get_slot_context(default_slot_template, ctx, null)
    				);
    			}

    			set_attributes(button, get_spread_update(button_levels, [
    				(changed.props) && ctx.props,
    				(changed.id) && { id: ctx.id },
    				(changed.classes) && { class: ctx.classes },
    				(changed.disabled) && { disabled: ctx.disabled },
    				(changed.value) && { value: ctx.value },
    				(changed.ariaLabel || changed.defaultAriaLabel) && { "aria-label": ctx.ariaLabel || ctx.defaultAriaLabel },
    				(changed.style) && { style: ctx.style }
    			]));
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			transition_in(default_slot, local);
    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(if_block);
    			transition_out(default_slot, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(button);
    			}

    			if (!default_slot) {
    				if_blocks[current_block_type_index].d();
    			}

    			if (default_slot) default_slot.d(detaching);
    			dispose();
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_else_block_1.name, type: "else", source: "(53:0) {:else}", ctx });
    	return block;
    }

    // (37:0) {#if href}
    function create_if_block(ctx) {
    	var a, current_block_type_index, if_block, current, dispose;

    	var if_block_creators = [
    		create_if_block_1,
    		create_else_block
    	];

    	var if_blocks = [];

    	function select_block_type_1(changed, ctx) {
    		if (ctx.children) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type_1(null, ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	var a_levels = [
    		ctx.props,
    		{ id: ctx.id },
    		{ class: ctx.classes },
    		{ disabled: ctx.disabled },
    		{ href: ctx.href },
    		{ "aria-label": ctx.ariaLabel || ctx.defaultAriaLabel },
    		{ style: ctx.style }
    	];

    	var a_data = {};
    	for (var i = 0; i < a_levels.length; i += 1) {
    		a_data = assign(a_data, a_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			a = element("a");
    			if_block.c();
    			set_attributes(a, a_data);
    			add_location(a, file, 37, 2, 825);
    			dispose = listen_dev(a, "click", ctx.click_handler);
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, a, anchor);
    			if_blocks[current_block_type_index].m(a, null);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type_1(changed, ctx);
    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(changed, ctx);
    			} else {
    				group_outros();
    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});
    				check_outros();

    				if_block = if_blocks[current_block_type_index];
    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				}
    				transition_in(if_block, 1);
    				if_block.m(a, null);
    			}

    			set_attributes(a, get_spread_update(a_levels, [
    				(changed.props) && ctx.props,
    				(changed.id) && { id: ctx.id },
    				(changed.classes) && { class: ctx.classes },
    				(changed.disabled) && { disabled: ctx.disabled },
    				(changed.href) && { href: ctx.href },
    				(changed.ariaLabel || changed.defaultAriaLabel) && { "aria-label": ctx.ariaLabel || ctx.defaultAriaLabel },
    				(changed.style) && { style: ctx.style }
    			]));
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(a);
    			}

    			if_blocks[current_block_type_index].d();
    			dispose();
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_if_block.name, type: "if", source: "(37:0) {#if href}", ctx });
    	return block;
    }

    // (68:6) {:else}
    function create_else_block_2(ctx) {
    	var current;

    	const default_slot_template = ctx.$$slots.default;
    	const default_slot = create_slot(default_slot_template, ctx, null);

    	const block = {
    		c: function create() {
    			if (default_slot) default_slot.c();
    		},

    		l: function claim(nodes) {
    			if (default_slot) default_slot.l(nodes);
    		},

    		m: function mount(target, anchor) {
    			if (default_slot) {
    				default_slot.m(target, anchor);
    			}

    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (default_slot && default_slot.p && changed.$$scope) {
    				default_slot.p(
    					get_slot_changes(default_slot_template, ctx, changed, null),
    					get_slot_context(default_slot_template, ctx, null)
    				);
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (default_slot) default_slot.d(detaching);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_else_block_2.name, type: "else", source: "(68:6) {:else}", ctx });
    	return block;
    }

    // (66:25) 
    function create_if_block_3(ctx) {
    	var t;

    	const block = {
    		c: function create() {
    			t = text(ctx.children);
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},

    		p: function update(changed, ctx) {
    			if (changed.children) {
    				set_data_dev(t, ctx.children);
    			}
    		},

    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(t);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_if_block_3.name, type: "if", source: "(66:25) ", ctx });
    	return block;
    }

    // (64:6) {#if close}
    function create_if_block_2(ctx) {
    	var span;

    	const block = {
    		c: function create() {
    			span = element("span");
    			span.textContent = "×";
    			attr_dev(span, "aria-hidden", "true");
    			add_location(span, file, 64, 8, 1250);
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    		},

    		p: noop,
    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(span);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_if_block_2.name, type: "if", source: "(64:6) {#if close}", ctx });
    	return block;
    }

    // (49:4) {:else}
    function create_else_block(ctx) {
    	var current;

    	const default_slot_template = ctx.$$slots.default;
    	const default_slot = create_slot(default_slot_template, ctx, null);

    	const block = {
    		c: function create() {
    			if (default_slot) default_slot.c();
    		},

    		l: function claim(nodes) {
    			if (default_slot) default_slot.l(nodes);
    		},

    		m: function mount(target, anchor) {
    			if (default_slot) {
    				default_slot.m(target, anchor);
    			}

    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (default_slot && default_slot.p && changed.$$scope) {
    				default_slot.p(
    					get_slot_changes(default_slot_template, ctx, changed, null),
    					get_slot_context(default_slot_template, ctx, null)
    				);
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (default_slot) default_slot.d(detaching);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_else_block.name, type: "else", source: "(49:4) {:else}", ctx });
    	return block;
    }

    // (47:4) {#if children}
    function create_if_block_1(ctx) {
    	var t;

    	const block = {
    		c: function create() {
    			t = text(ctx.children);
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},

    		p: function update(changed, ctx) {
    			if (changed.children) {
    				set_data_dev(t, ctx.children);
    			}
    		},

    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(t);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_if_block_1.name, type: "if", source: "(47:4) {#if children}", ctx });
    	return block;
    }

    function create_fragment$1(ctx) {
    	var current_block_type_index, if_block, if_block_anchor, current;

    	var if_block_creators = [
    		create_if_block,
    		create_else_block_1
    	];

    	var if_blocks = [];

    	function select_block_type(changed, ctx) {
    		if (ctx.href) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(null, ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(changed, ctx);
    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(changed, ctx);
    			} else {
    				group_outros();
    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});
    				check_outros();

    				if_block = if_blocks[current_block_type_index];
    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				}
    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if_blocks[current_block_type_index].d(detaching);

    			if (detaching) {
    				detach_dev(if_block_anchor);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$1.name, type: "component", source: "", ctx });
    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	

      let { class: className = '', active = false, block = false, children = undefined, close = false, color = 'secondary', disabled = false, href = '', id = '', outline = false, size = '', style = '', value = '' } = $$props;

      const props = clean($$props);

    	let { $$slots = {}, $$scope } = $$props;

    	function click_handler(event) {
    		bubble($$self, event);
    	}

    	function click_handler_1(event) {
    		bubble($$self, event);
    	}

    	$$self.$set = $$new_props => {
    		$$invalidate('$$props', $$props = assign(assign({}, $$props), $$new_props));
    		if ('class' in $$new_props) $$invalidate('className', className = $$new_props.class);
    		if ('active' in $$new_props) $$invalidate('active', active = $$new_props.active);
    		if ('block' in $$new_props) $$invalidate('block', block = $$new_props.block);
    		if ('children' in $$new_props) $$invalidate('children', children = $$new_props.children);
    		if ('close' in $$new_props) $$invalidate('close', close = $$new_props.close);
    		if ('color' in $$new_props) $$invalidate('color', color = $$new_props.color);
    		if ('disabled' in $$new_props) $$invalidate('disabled', disabled = $$new_props.disabled);
    		if ('href' in $$new_props) $$invalidate('href', href = $$new_props.href);
    		if ('id' in $$new_props) $$invalidate('id', id = $$new_props.id);
    		if ('outline' in $$new_props) $$invalidate('outline', outline = $$new_props.outline);
    		if ('size' in $$new_props) $$invalidate('size', size = $$new_props.size);
    		if ('style' in $$new_props) $$invalidate('style', style = $$new_props.style);
    		if ('value' in $$new_props) $$invalidate('value', value = $$new_props.value);
    		if ('$$scope' in $$new_props) $$invalidate('$$scope', $$scope = $$new_props.$$scope);
    	};

    	$$self.$capture_state = () => {
    		return { className, active, block, children, close, color, disabled, href, id, outline, size, style, value, ariaLabel, classes, defaultAriaLabel };
    	};

    	$$self.$inject_state = $$new_props => {
    		$$invalidate('$$props', $$props = assign(assign({}, $$props), $$new_props));
    		if ('className' in $$props) $$invalidate('className', className = $$new_props.className);
    		if ('active' in $$props) $$invalidate('active', active = $$new_props.active);
    		if ('block' in $$props) $$invalidate('block', block = $$new_props.block);
    		if ('children' in $$props) $$invalidate('children', children = $$new_props.children);
    		if ('close' in $$props) $$invalidate('close', close = $$new_props.close);
    		if ('color' in $$props) $$invalidate('color', color = $$new_props.color);
    		if ('disabled' in $$props) $$invalidate('disabled', disabled = $$new_props.disabled);
    		if ('href' in $$props) $$invalidate('href', href = $$new_props.href);
    		if ('id' in $$props) $$invalidate('id', id = $$new_props.id);
    		if ('outline' in $$props) $$invalidate('outline', outline = $$new_props.outline);
    		if ('size' in $$props) $$invalidate('size', size = $$new_props.size);
    		if ('style' in $$props) $$invalidate('style', style = $$new_props.style);
    		if ('value' in $$props) $$invalidate('value', value = $$new_props.value);
    		if ('ariaLabel' in $$props) $$invalidate('ariaLabel', ariaLabel = $$new_props.ariaLabel);
    		if ('classes' in $$props) $$invalidate('classes', classes = $$new_props.classes);
    		if ('defaultAriaLabel' in $$props) $$invalidate('defaultAriaLabel', defaultAriaLabel = $$new_props.defaultAriaLabel);
    	};

    	let ariaLabel, classes, defaultAriaLabel;

    	$$self.$$.update = ($$dirty = { $$props: 1, className: 1, close: 1, outline: 1, color: 1, size: 1, block: 1, active: 1 }) => {
    		$$invalidate('ariaLabel', ariaLabel = $$props['aria-label']);
    		if ($$dirty.className || $$dirty.close || $$dirty.outline || $$dirty.color || $$dirty.size || $$dirty.block || $$dirty.active) { $$invalidate('classes', classes = clsx(
            className,
            { close },
            close || 'btn',
            close || `btn${outline ? '-outline' : ''}-${color}`,
            size ? `btn-${size}` : false,
            block ? 'btn-block' : false,
            { active }
          )); }
    		if ($$dirty.close) { $$invalidate('defaultAriaLabel', defaultAriaLabel = close ? 'Close' : null); }
    	};

    	return {
    		className,
    		active,
    		block,
    		children,
    		close,
    		color,
    		disabled,
    		href,
    		id,
    		outline,
    		size,
    		style,
    		value,
    		props,
    		ariaLabel,
    		classes,
    		defaultAriaLabel,
    		click_handler,
    		click_handler_1,
    		$$props: $$props = exclude_internal_props($$props),
    		$$slots,
    		$$scope
    	};
    }

    class Button extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, ["class", "active", "block", "children", "close", "color", "disabled", "href", "id", "outline", "size", "style", "value"]);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "Button", options, id: create_fragment$1.name });
    	}

    	get class() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set class(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get active() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set active(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get block() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set block(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get children() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set children(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get close() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set close(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get color() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set color(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get disabled() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set disabled(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get href() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set href(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get id() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set id(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get outline() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set outline(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get size() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set size(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get style() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set style(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get value() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set value(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules/sveltestrap/src/Col.svelte generated by Svelte v3.12.1 */

    const file$1 = "node_modules/sveltestrap/src/Col.svelte";

    function create_fragment$2(ctx) {
    	var div, current;

    	const default_slot_template = ctx.$$slots.default;
    	const default_slot = create_slot(default_slot_template, ctx, null);

    	var div_levels = [
    		ctx.props,
    		{ id: ctx.id },
    		{ class: ctx.colClasses.join(' ') }
    	];

    	var div_data = {};
    	for (var i = 0; i < div_levels.length; i += 1) {
    		div_data = assign(div_data, div_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			div = element("div");

    			if (default_slot) default_slot.c();

    			set_attributes(div, div_data);
    			add_location(div, file$1, 51, 0, 1305);
    		},

    		l: function claim(nodes) {
    			if (default_slot) default_slot.l(div_nodes);
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (default_slot && default_slot.p && changed.$$scope) {
    				default_slot.p(
    					get_slot_changes(default_slot_template, ctx, changed, null),
    					get_slot_context(default_slot_template, ctx, null)
    				);
    			}

    			set_attributes(div, get_spread_update(div_levels, [
    				(changed.props) && ctx.props,
    				(changed.id) && { id: ctx.id },
    				(changed.colClasses) && { class: ctx.colClasses.join(' ') }
    			]));
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(div);
    			}

    			if (default_slot) default_slot.d(detaching);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$2.name, type: "component", source: "", ctx });
    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	

      let { class: className = '', id = '' } = $$props;

      const props = clean($$props);

      const colClasses = [];
      const widths = ['xs', 'sm', 'md', 'lg', 'xl'];

      widths.forEach(colWidth => {
        const columnProp = $$props[colWidth];
        if (!columnProp && columnProp !== '') {
          return; //no value for this width
        }

        const isXs = colWidth === 'xs';

        if (isObject(columnProp)) {
          const colSizeInterfix = isXs ? '-' : `-${colWidth}-`;
          const colClass = getColumnSizeClass(isXs, colWidth, columnProp.size);

          if (columnProp.size || columnProp.size === '') {
            colClasses.push(colClass);
          }
          if (columnProp.push) {
            colClasses.push(`push${colSizeInterfix}${columnProp.push}`);
          }
          if (columnProp.pull) {
            colClasses.push(`pull${colSizeInterfix}${columnProp.pull}`);
          }
          if (columnProp.offset) {
            colClasses.push(`offset${colSizeInterfix}${columnProp.offset}`);
          }
        } else {
          colClasses.push(getColumnSizeClass(isXs, colWidth, columnProp));
        }
      });

      if (!colClasses.length) {
        colClasses.push('col');
      }

      if (className) {
        colClasses.push(className);
      }

    	let { $$slots = {}, $$scope } = $$props;

    	$$self.$set = $$new_props => {
    		$$invalidate('$$props', $$props = assign(assign({}, $$props), $$new_props));
    		if ('class' in $$new_props) $$invalidate('className', className = $$new_props.class);
    		if ('id' in $$new_props) $$invalidate('id', id = $$new_props.id);
    		if ('$$scope' in $$new_props) $$invalidate('$$scope', $$scope = $$new_props.$$scope);
    	};

    	$$self.$capture_state = () => {
    		return { className, id };
    	};

    	$$self.$inject_state = $$new_props => {
    		$$invalidate('$$props', $$props = assign(assign({}, $$props), $$new_props));
    		if ('className' in $$props) $$invalidate('className', className = $$new_props.className);
    		if ('id' in $$props) $$invalidate('id', id = $$new_props.id);
    	};

    	return {
    		className,
    		id,
    		props,
    		colClasses,
    		$$props: $$props = exclude_internal_props($$props),
    		$$slots,
    		$$scope
    	};
    }

    class Col extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, ["class", "id"]);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "Col", options, id: create_fragment$2.name });
    	}

    	get class() {
    		throw new Error("<Col>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set class(value) {
    		throw new Error("<Col>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get id() {
    		throw new Error("<Col>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set id(value) {
    		throw new Error("<Col>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules/sveltestrap/src/Container.svelte generated by Svelte v3.12.1 */

    const file$2 = "node_modules/sveltestrap/src/Container.svelte";

    function create_fragment$3(ctx) {
    	var div, current;

    	const default_slot_template = ctx.$$slots.default;
    	const default_slot = create_slot(default_slot_template, ctx, null);

    	var div_levels = [
    		ctx.props,
    		{ id: ctx.id },
    		{ class: ctx.classes }
    	];

    	var div_data = {};
    	for (var i = 0; i < div_levels.length; i += 1) {
    		div_data = assign(div_data, div_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			div = element("div");

    			if (default_slot) default_slot.c();

    			set_attributes(div, div_data);
    			add_location(div, file$2, 14, 0, 295);
    		},

    		l: function claim(nodes) {
    			if (default_slot) default_slot.l(div_nodes);
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (default_slot && default_slot.p && changed.$$scope) {
    				default_slot.p(
    					get_slot_changes(default_slot_template, ctx, changed, null),
    					get_slot_context(default_slot_template, ctx, null)
    				);
    			}

    			set_attributes(div, get_spread_update(div_levels, [
    				(changed.props) && ctx.props,
    				(changed.id) && { id: ctx.id },
    				(changed.classes) && { class: ctx.classes }
    			]));
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(div);
    			}

    			if (default_slot) default_slot.d(detaching);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$3.name, type: "component", source: "", ctx });
    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	

      let { class: className = '', fluid = false, id = '' } = $$props;

      const props = clean($$props);

    	let { $$slots = {}, $$scope } = $$props;

    	$$self.$set = $$new_props => {
    		$$invalidate('$$props', $$props = assign(assign({}, $$props), $$new_props));
    		if ('class' in $$new_props) $$invalidate('className', className = $$new_props.class);
    		if ('fluid' in $$new_props) $$invalidate('fluid', fluid = $$new_props.fluid);
    		if ('id' in $$new_props) $$invalidate('id', id = $$new_props.id);
    		if ('$$scope' in $$new_props) $$invalidate('$$scope', $$scope = $$new_props.$$scope);
    	};

    	$$self.$capture_state = () => {
    		return { className, fluid, id, classes };
    	};

    	$$self.$inject_state = $$new_props => {
    		$$invalidate('$$props', $$props = assign(assign({}, $$props), $$new_props));
    		if ('className' in $$props) $$invalidate('className', className = $$new_props.className);
    		if ('fluid' in $$props) $$invalidate('fluid', fluid = $$new_props.fluid);
    		if ('id' in $$props) $$invalidate('id', id = $$new_props.id);
    		if ('classes' in $$props) $$invalidate('classes', classes = $$new_props.classes);
    	};

    	let classes;

    	$$self.$$.update = ($$dirty = { className: 1, fluid: 1 }) => {
    		if ($$dirty.className || $$dirty.fluid) { $$invalidate('classes', classes = clsx(className, fluid ? 'container-fluid' : 'container')); }
    	};

    	return {
    		className,
    		fluid,
    		id,
    		props,
    		classes,
    		$$props: $$props = exclude_internal_props($$props),
    		$$slots,
    		$$scope
    	};
    }

    class Container extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, ["class", "fluid", "id"]);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "Container", options, id: create_fragment$3.name });
    	}

    	get class() {
    		throw new Error("<Container>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set class(value) {
    		throw new Error("<Container>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get fluid() {
    		throw new Error("<Container>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set fluid(value) {
    		throw new Error("<Container>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get id() {
    		throw new Error("<Container>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set id(value) {
    		throw new Error("<Container>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules/sveltestrap/src/Input.svelte generated by Svelte v3.12.1 */
    const { console: console_1 } = globals;

    const file$3 = "node_modules/sveltestrap/src/Input.svelte";

    // (326:27) 
    function create_if_block_15(ctx) {
    	var select, current, dispose;

    	const default_slot_template = ctx.$$slots.default;
    	const default_slot = create_slot(default_slot_template, ctx, null);

    	var select_levels = [
    		ctx.props,
    		{ id: ctx.id },
    		{ multiple: ctx.multiple },
    		{ class: ctx.classes },
    		{ name: ctx.name },
    		{ disabled: ctx.disabled }
    	];

    	var select_data = {};
    	for (var i = 0; i < select_levels.length; i += 1) {
    		select_data = assign(select_data, select_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			select = element("select");

    			if (default_slot) default_slot.c();

    			set_attributes(select, select_data);
    			add_location(select, file$3, 326, 2, 6114);

    			dispose = [
    				listen_dev(select, "blur", ctx.blur_handler_14),
    				listen_dev(select, "focus", ctx.focus_handler_14),
    				listen_dev(select, "change", ctx.change_handler_14),
    				listen_dev(select, "input", ctx.input_handler_14)
    			];
    		},

    		l: function claim(nodes) {
    			if (default_slot) default_slot.l(select_nodes);
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, select, anchor);

    			if (default_slot) {
    				default_slot.m(select, null);
    			}

    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (default_slot && default_slot.p && changed.$$scope) {
    				default_slot.p(
    					get_slot_changes(default_slot_template, ctx, changed, null),
    					get_slot_context(default_slot_template, ctx, null)
    				);
    			}

    			set_attributes(select, get_spread_update(select_levels, [
    				(changed.props) && ctx.props,
    				(changed.id) && { id: ctx.id },
    				(changed.multiple) && { multiple: ctx.multiple },
    				(changed.classes) && { class: ctx.classes },
    				(changed.name) && { name: ctx.name },
    				(changed.disabled) && { disabled: ctx.disabled }
    			]));
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(select);
    			}

    			if (default_slot) default_slot.d(detaching);
    			run_all(dispose);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_if_block_15.name, type: "if", source: "(326:27) ", ctx });
    	return block;
    }

    // (310:29) 
    function create_if_block_14(ctx) {
    	var textarea, dispose;

    	var textarea_levels = [
    		ctx.props,
    		{ id: ctx.id },
    		{ class: ctx.classes },
    		{ nameToggle: nameToggle },
    		{ disabled: ctx.disabled }
    	];

    	var textarea_data = {};
    	for (var i = 0; i < textarea_levels.length; i += 1) {
    		textarea_data = assign(textarea_data, textarea_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			textarea = element("textarea");
    			set_attributes(textarea, textarea_data);
    			add_location(textarea, file$3, 310, 2, 5883);

    			dispose = [
    				listen_dev(textarea, "input", ctx.textarea_input_handler),
    				listen_dev(textarea, "blur", ctx.blur_handler_13),
    				listen_dev(textarea, "focus", ctx.focus_handler_13),
    				listen_dev(textarea, "keydown", ctx.keydown_handler_13),
    				listen_dev(textarea, "keypress", ctx.keypress_handler_13),
    				listen_dev(textarea, "keyup", ctx.keyup_handler_13),
    				listen_dev(textarea, "change", ctx.change_handler_13),
    				listen_dev(textarea, "input", ctx.input_handler_13)
    			];
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, textarea, anchor);

    			set_input_value(textarea, ctx.value);
    		},

    		p: function update(changed, ctx) {
    			if (changed.value) set_input_value(textarea, ctx.value);

    			set_attributes(textarea, get_spread_update(textarea_levels, [
    				(changed.props) && ctx.props,
    				(changed.id) && { id: ctx.id },
    				(changed.classes) && { class: ctx.classes },
    				(changed.nameToggle) && { nameToggle: nameToggle },
    				(changed.disabled) && { disabled: ctx.disabled }
    			]));
    		},

    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(textarea);
    			}

    			run_all(dispose);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_if_block_14.name, type: "if", source: "(310:29) ", ctx });
    	return block;
    }

    // (72:0) {#if tag === 'input'}
    function create_if_block$1(ctx) {
    	var if_block_anchor;

    	function select_block_type_1(changed, ctx) {
    		if (ctx.type === 'text') return create_if_block_1$1;
    		if (ctx.type === 'password') return create_if_block_2$1;
    		if (ctx.type === 'email') return create_if_block_3$1;
    		if (ctx.type === 'file') return create_if_block_4;
    		if (ctx.type === 'checkbox') return create_if_block_5;
    		if (ctx.type === 'radio') return create_if_block_6;
    		if (ctx.type === 'url') return create_if_block_7;
    		if (ctx.type === 'number') return create_if_block_8;
    		if (ctx.type === 'date') return create_if_block_9;
    		if (ctx.type === 'time') return create_if_block_10;
    		if (ctx.type === 'datetime') return create_if_block_11;
    		if (ctx.type === 'color') return create_if_block_12;
    		if (ctx.type === 'search') return create_if_block_13;
    	}

    	var current_block_type = select_block_type_1(null, ctx);
    	var if_block = current_block_type && current_block_type(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},

    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},

    		p: function update(changed, ctx) {
    			if (current_block_type === (current_block_type = select_block_type_1(changed, ctx)) && if_block) {
    				if_block.p(changed, ctx);
    			} else {
    				if (if_block) if_block.d(1);
    				if_block = current_block_type && current_block_type(ctx);
    				if (if_block) {
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			}
    		},

    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);

    			if (detaching) {
    				detach_dev(if_block_anchor);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_if_block$1.name, type: "if", source: "(72:0) {#if tag === 'input'}", ctx });
    	return block;
    }

    // (290:30) 
    function create_if_block_13(ctx) {
    	var input, dispose;

    	var input_levels = [
    		ctx.props,
    		{ id: ctx.id },
    		{ type: "search" },
    		{ readonly: ctx.readonly },
    		{ class: ctx.classes },
    		{ name: ctx.name },
    		{ disabled: ctx.disabled },
    		{ placeholder: ctx.placeholder }
    	];

    	var input_data = {};
    	for (var i = 0; i < input_levels.length; i += 1) {
    		input_data = assign(input_data, input_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			input = element("input");
    			set_attributes(input, input_data);
    			add_location(input, file$3, 290, 4, 5568);

    			dispose = [
    				listen_dev(input, "input", ctx.input_input_handler_9),
    				listen_dev(input, "blur", ctx.blur_handler_12),
    				listen_dev(input, "focus", ctx.focus_handler_12),
    				listen_dev(input, "keydown", ctx.keydown_handler_12),
    				listen_dev(input, "keypress", ctx.keypress_handler_12),
    				listen_dev(input, "keyup", ctx.keyup_handler_12),
    				listen_dev(input, "change", ctx.change_handler_12),
    				listen_dev(input, "input", ctx.input_handler_12)
    			];
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, input, anchor);

    			set_input_value(input, ctx.value);
    		},

    		p: function update(changed, ctx) {
    			if (changed.value) set_input_value(input, ctx.value);

    			set_attributes(input, get_spread_update(input_levels, [
    				(changed.props) && ctx.props,
    				(changed.id) && { id: ctx.id },
    				{ type: "search" },
    				(changed.readonly) && { readonly: ctx.readonly },
    				(changed.classes) && { class: ctx.classes },
    				(changed.name) && { name: ctx.name },
    				(changed.disabled) && { disabled: ctx.disabled },
    				(changed.placeholder) && { placeholder: ctx.placeholder }
    			]));
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(input);
    			}

    			run_all(dispose);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_if_block_13.name, type: "if", source: "(290:30) ", ctx });
    	return block;
    }

    // (272:29) 
    function create_if_block_12(ctx) {
    	var input, dispose;

    	var input_levels = [
    		ctx.props,
    		{ id: ctx.id },
    		{ type: "color" },
    		{ readonly: ctx.readonly },
    		{ class: ctx.classes },
    		{ name: ctx.name },
    		{ disabled: ctx.disabled },
    		{ placeholder: ctx.placeholder }
    	];

    	var input_data = {};
    	for (var i = 0; i < input_levels.length; i += 1) {
    		input_data = assign(input_data, input_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			input = element("input");
    			set_attributes(input, input_data);
    			add_location(input, file$3, 272, 4, 5260);

    			dispose = [
    				listen_dev(input, "input", ctx.input_input_handler_8),
    				listen_dev(input, "blur", ctx.blur_handler_11),
    				listen_dev(input, "focus", ctx.focus_handler_11),
    				listen_dev(input, "keydown", ctx.keydown_handler_11),
    				listen_dev(input, "keypress", ctx.keypress_handler_11),
    				listen_dev(input, "keyup", ctx.keyup_handler_11),
    				listen_dev(input, "change", ctx.change_handler_11),
    				listen_dev(input, "input", ctx.input_handler_11)
    			];
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, input, anchor);

    			set_input_value(input, ctx.value);
    		},

    		p: function update(changed, ctx) {
    			if (changed.value) set_input_value(input, ctx.value);

    			set_attributes(input, get_spread_update(input_levels, [
    				(changed.props) && ctx.props,
    				(changed.id) && { id: ctx.id },
    				{ type: "color" },
    				(changed.readonly) && { readonly: ctx.readonly },
    				(changed.classes) && { class: ctx.classes },
    				(changed.name) && { name: ctx.name },
    				(changed.disabled) && { disabled: ctx.disabled },
    				(changed.placeholder) && { placeholder: ctx.placeholder }
    			]));
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(input);
    			}

    			run_all(dispose);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_if_block_12.name, type: "if", source: "(272:29) ", ctx });
    	return block;
    }

    // (254:32) 
    function create_if_block_11(ctx) {
    	var input, dispose;

    	var input_levels = [
    		ctx.props,
    		{ id: ctx.id },
    		{ type: "datetime" },
    		{ readonly: ctx.readonly },
    		{ class: ctx.classes },
    		{ name: ctx.name },
    		{ disabled: ctx.disabled },
    		{ placeholder: ctx.placeholder }
    	];

    	var input_data = {};
    	for (var i = 0; i < input_levels.length; i += 1) {
    		input_data = assign(input_data, input_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			input = element("input");
    			set_attributes(input, input_data);
    			add_location(input, file$3, 254, 4, 4950);

    			dispose = [
    				listen_dev(input, "input", ctx.input_input_handler_7),
    				listen_dev(input, "blur", ctx.blur_handler_10),
    				listen_dev(input, "focus", ctx.focus_handler_10),
    				listen_dev(input, "keydown", ctx.keydown_handler_10),
    				listen_dev(input, "keypress", ctx.keypress_handler_10),
    				listen_dev(input, "keyup", ctx.keyup_handler_10),
    				listen_dev(input, "change", ctx.change_handler_10),
    				listen_dev(input, "input", ctx.input_handler_10)
    			];
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, input, anchor);

    			set_input_value(input, ctx.value);
    		},

    		p: function update(changed, ctx) {
    			if (changed.value) set_input_value(input, ctx.value);

    			set_attributes(input, get_spread_update(input_levels, [
    				(changed.props) && ctx.props,
    				(changed.id) && { id: ctx.id },
    				{ type: "datetime" },
    				(changed.readonly) && { readonly: ctx.readonly },
    				(changed.classes) && { class: ctx.classes },
    				(changed.name) && { name: ctx.name },
    				(changed.disabled) && { disabled: ctx.disabled },
    				(changed.placeholder) && { placeholder: ctx.placeholder }
    			]));
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(input);
    			}

    			run_all(dispose);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_if_block_11.name, type: "if", source: "(254:32) ", ctx });
    	return block;
    }

    // (236:28) 
    function create_if_block_10(ctx) {
    	var input, dispose;

    	var input_levels = [
    		ctx.props,
    		{ id: ctx.id },
    		{ type: "time" },
    		{ readonly: ctx.readonly },
    		{ class: ctx.classes },
    		{ name: ctx.name },
    		{ disabled: ctx.disabled },
    		{ placeholder: ctx.placeholder }
    	];

    	var input_data = {};
    	for (var i = 0; i < input_levels.length; i += 1) {
    		input_data = assign(input_data, input_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			input = element("input");
    			set_attributes(input, input_data);
    			add_location(input, file$3, 236, 4, 4641);

    			dispose = [
    				listen_dev(input, "input", ctx.input_input_handler_6),
    				listen_dev(input, "blur", ctx.blur_handler_9),
    				listen_dev(input, "focus", ctx.focus_handler_9),
    				listen_dev(input, "keydown", ctx.keydown_handler_9),
    				listen_dev(input, "keypress", ctx.keypress_handler_9),
    				listen_dev(input, "keyup", ctx.keyup_handler_9),
    				listen_dev(input, "change", ctx.change_handler_9),
    				listen_dev(input, "input", ctx.input_handler_9)
    			];
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, input, anchor);

    			set_input_value(input, ctx.value);
    		},

    		p: function update(changed, ctx) {
    			if (changed.value) set_input_value(input, ctx.value);

    			set_attributes(input, get_spread_update(input_levels, [
    				(changed.props) && ctx.props,
    				(changed.id) && { id: ctx.id },
    				{ type: "time" },
    				(changed.readonly) && { readonly: ctx.readonly },
    				(changed.classes) && { class: ctx.classes },
    				(changed.name) && { name: ctx.name },
    				(changed.disabled) && { disabled: ctx.disabled },
    				(changed.placeholder) && { placeholder: ctx.placeholder }
    			]));
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(input);
    			}

    			run_all(dispose);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_if_block_10.name, type: "if", source: "(236:28) ", ctx });
    	return block;
    }

    // (218:28) 
    function create_if_block_9(ctx) {
    	var input, dispose;

    	var input_levels = [
    		ctx.props,
    		{ id: ctx.id },
    		{ type: "date" },
    		{ readonly: ctx.readonly },
    		{ class: ctx.classes },
    		{ name: ctx.name },
    		{ disabled: ctx.disabled },
    		{ placeholder: ctx.placeholder }
    	];

    	var input_data = {};
    	for (var i = 0; i < input_levels.length; i += 1) {
    		input_data = assign(input_data, input_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			input = element("input");
    			set_attributes(input, input_data);
    			add_location(input, file$3, 218, 4, 4336);

    			dispose = [
    				listen_dev(input, "input", ctx.input_input_handler_5),
    				listen_dev(input, "blur", ctx.blur_handler_8),
    				listen_dev(input, "focus", ctx.focus_handler_8),
    				listen_dev(input, "keydown", ctx.keydown_handler_8),
    				listen_dev(input, "keypress", ctx.keypress_handler_8),
    				listen_dev(input, "keyup", ctx.keyup_handler_8),
    				listen_dev(input, "change", ctx.change_handler_8),
    				listen_dev(input, "input", ctx.input_handler_8)
    			];
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, input, anchor);

    			set_input_value(input, ctx.value);
    		},

    		p: function update(changed, ctx) {
    			if (changed.value) set_input_value(input, ctx.value);

    			set_attributes(input, get_spread_update(input_levels, [
    				(changed.props) && ctx.props,
    				(changed.id) && { id: ctx.id },
    				{ type: "date" },
    				(changed.readonly) && { readonly: ctx.readonly },
    				(changed.classes) && { class: ctx.classes },
    				(changed.name) && { name: ctx.name },
    				(changed.disabled) && { disabled: ctx.disabled },
    				(changed.placeholder) && { placeholder: ctx.placeholder }
    			]));
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(input);
    			}

    			run_all(dispose);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_if_block_9.name, type: "if", source: "(218:28) ", ctx });
    	return block;
    }

    // (200:30) 
    function create_if_block_8(ctx) {
    	var input, input_updating = false, dispose;

    	function input_input_handler_4() {
    		input_updating = true;
    		ctx.input_input_handler_4.call(input);
    	}

    	var input_levels = [
    		ctx.props,
    		{ id: ctx.id },
    		{ type: "number" },
    		{ readonly: ctx.readonly },
    		{ class: ctx.classes },
    		{ name: ctx.name },
    		{ disabled: ctx.disabled },
    		{ placeholder: ctx.placeholder }
    	];

    	var input_data = {};
    	for (var i = 0; i < input_levels.length; i += 1) {
    		input_data = assign(input_data, input_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			input = element("input");
    			set_attributes(input, input_data);
    			add_location(input, file$3, 200, 4, 4029);

    			dispose = [
    				listen_dev(input, "input", input_input_handler_4),
    				listen_dev(input, "blur", ctx.blur_handler_7),
    				listen_dev(input, "focus", ctx.focus_handler_7),
    				listen_dev(input, "keydown", ctx.keydown_handler_7),
    				listen_dev(input, "keypress", ctx.keypress_handler_7),
    				listen_dev(input, "keyup", ctx.keyup_handler_7),
    				listen_dev(input, "change", ctx.change_handler_7),
    				listen_dev(input, "input", ctx.input_handler_7)
    			];
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, input, anchor);

    			set_input_value(input, ctx.value);
    		},

    		p: function update(changed, ctx) {
    			if (!input_updating && changed.value) set_input_value(input, ctx.value);
    			input_updating = false;

    			set_attributes(input, get_spread_update(input_levels, [
    				(changed.props) && ctx.props,
    				(changed.id) && { id: ctx.id },
    				{ type: "number" },
    				(changed.readonly) && { readonly: ctx.readonly },
    				(changed.classes) && { class: ctx.classes },
    				(changed.name) && { name: ctx.name },
    				(changed.disabled) && { disabled: ctx.disabled },
    				(changed.placeholder) && { placeholder: ctx.placeholder }
    			]));
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(input);
    			}

    			run_all(dispose);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_if_block_8.name, type: "if", source: "(200:30) ", ctx });
    	return block;
    }

    // (182:27) 
    function create_if_block_7(ctx) {
    	var input, dispose;

    	var input_levels = [
    		ctx.props,
    		{ id: ctx.id },
    		{ type: "url" },
    		{ readonly: ctx.readonly },
    		{ class: ctx.classes },
    		{ name: ctx.name },
    		{ disabled: ctx.disabled },
    		{ placeholder: ctx.placeholder }
    	];

    	var input_data = {};
    	for (var i = 0; i < input_levels.length; i += 1) {
    		input_data = assign(input_data, input_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			input = element("input");
    			set_attributes(input, input_data);
    			add_location(input, file$3, 182, 4, 3723);

    			dispose = [
    				listen_dev(input, "input", ctx.input_input_handler_3),
    				listen_dev(input, "blur", ctx.blur_handler_6),
    				listen_dev(input, "focus", ctx.focus_handler_6),
    				listen_dev(input, "keydown", ctx.keydown_handler_6),
    				listen_dev(input, "keypress", ctx.keypress_handler_6),
    				listen_dev(input, "keyup", ctx.keyup_handler_6),
    				listen_dev(input, "change", ctx.change_handler_6),
    				listen_dev(input, "input", ctx.input_handler_6)
    			];
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, input, anchor);

    			set_input_value(input, ctx.value);
    		},

    		p: function update(changed, ctx) {
    			if (changed.value) set_input_value(input, ctx.value);

    			set_attributes(input, get_spread_update(input_levels, [
    				(changed.props) && ctx.props,
    				(changed.id) && { id: ctx.id },
    				{ type: "url" },
    				(changed.readonly) && { readonly: ctx.readonly },
    				(changed.classes) && { class: ctx.classes },
    				(changed.name) && { name: ctx.name },
    				(changed.disabled) && { disabled: ctx.disabled },
    				(changed.placeholder) && { placeholder: ctx.placeholder }
    			]));
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(input);
    			}

    			run_all(dispose);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_if_block_7.name, type: "if", source: "(182:27) ", ctx });
    	return block;
    }

    // (164:29) 
    function create_if_block_6(ctx) {
    	var input, dispose;

    	var input_levels = [
    		ctx.props,
    		{ id: ctx.id },
    		{ type: "radio" },
    		{ readonly: ctx.readonly },
    		{ class: ctx.classes },
    		{ name: ctx.name },
    		{ disabled: ctx.disabled },
    		{ placeholder: ctx.placeholder }
    	];

    	var input_data = {};
    	for (var i = 0; i < input_levels.length; i += 1) {
    		input_data = assign(input_data, input_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			input = element("input");
    			set_attributes(input, input_data);
    			add_location(input, file$3, 164, 4, 3418);

    			dispose = [
    				listen_dev(input, "change", ctx.input_change_handler_2),
    				listen_dev(input, "blur", ctx.blur_handler_5),
    				listen_dev(input, "focus", ctx.focus_handler_5),
    				listen_dev(input, "keydown", ctx.keydown_handler_5),
    				listen_dev(input, "keypress", ctx.keypress_handler_5),
    				listen_dev(input, "keyup", ctx.keyup_handler_5),
    				listen_dev(input, "change", ctx.change_handler_5),
    				listen_dev(input, "input", ctx.input_handler_5)
    			];
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, input, anchor);

    			set_input_value(input, ctx.value);
    		},

    		p: function update(changed, ctx) {
    			if (changed.value) set_input_value(input, ctx.value);

    			set_attributes(input, get_spread_update(input_levels, [
    				(changed.props) && ctx.props,
    				(changed.id) && { id: ctx.id },
    				{ type: "radio" },
    				(changed.readonly) && { readonly: ctx.readonly },
    				(changed.classes) && { class: ctx.classes },
    				(changed.name) && { name: ctx.name },
    				(changed.disabled) && { disabled: ctx.disabled },
    				(changed.placeholder) && { placeholder: ctx.placeholder }
    			]));
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(input);
    			}

    			run_all(dispose);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_if_block_6.name, type: "if", source: "(164:29) ", ctx });
    	return block;
    }

    // (145:32) 
    function create_if_block_5(ctx) {
    	var input, dispose;

    	var input_levels = [
    		ctx.props,
    		{ id: ctx.id },
    		{ type: "checkbox" },
    		{ readonly: ctx.readonly },
    		{ class: ctx.classes },
    		{ name: ctx.name },
    		{ disabled: ctx.disabled },
    		{ placeholder: ctx.placeholder }
    	];

    	var input_data = {};
    	for (var i = 0; i < input_levels.length; i += 1) {
    		input_data = assign(input_data, input_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			input = element("input");
    			set_attributes(input, input_data);
    			add_location(input, file$3, 145, 4, 3089);

    			dispose = [
    				listen_dev(input, "change", ctx.input_change_handler_1),
    				listen_dev(input, "blur", ctx.blur_handler_4),
    				listen_dev(input, "focus", ctx.focus_handler_4),
    				listen_dev(input, "keydown", ctx.keydown_handler_4),
    				listen_dev(input, "keypress", ctx.keypress_handler_4),
    				listen_dev(input, "keyup", ctx.keyup_handler_4),
    				listen_dev(input, "change", ctx.change_handler_4),
    				listen_dev(input, "input", ctx.input_handler_4)
    			];
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, input, anchor);

    			input.checked = ctx.checked;

    			set_input_value(input, ctx.value);
    		},

    		p: function update(changed, ctx) {
    			if (changed.checked) input.checked = ctx.checked;
    			if (changed.value) set_input_value(input, ctx.value);

    			set_attributes(input, get_spread_update(input_levels, [
    				(changed.props) && ctx.props,
    				(changed.id) && { id: ctx.id },
    				{ type: "checkbox" },
    				(changed.readonly) && { readonly: ctx.readonly },
    				(changed.classes) && { class: ctx.classes },
    				(changed.name) && { name: ctx.name },
    				(changed.disabled) && { disabled: ctx.disabled },
    				(changed.placeholder) && { placeholder: ctx.placeholder }
    			]));
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(input);
    			}

    			run_all(dispose);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_if_block_5.name, type: "if", source: "(145:32) ", ctx });
    	return block;
    }

    // (127:28) 
    function create_if_block_4(ctx) {
    	var input, dispose;

    	var input_levels = [
    		ctx.props,
    		{ id: ctx.id },
    		{ type: "file" },
    		{ readonly: ctx.readonly },
    		{ class: ctx.classes },
    		{ name: ctx.name },
    		{ disabled: ctx.disabled },
    		{ placeholder: ctx.placeholder }
    	];

    	var input_data = {};
    	for (var i = 0; i < input_levels.length; i += 1) {
    		input_data = assign(input_data, input_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			input = element("input");
    			set_attributes(input, input_data);
    			add_location(input, file$3, 127, 4, 2780);

    			dispose = [
    				listen_dev(input, "change", ctx.input_change_handler),
    				listen_dev(input, "blur", ctx.blur_handler_3),
    				listen_dev(input, "focus", ctx.focus_handler_3),
    				listen_dev(input, "keydown", ctx.keydown_handler_3),
    				listen_dev(input, "keypress", ctx.keypress_handler_3),
    				listen_dev(input, "keyup", ctx.keyup_handler_3),
    				listen_dev(input, "change", ctx.change_handler_3),
    				listen_dev(input, "input", ctx.input_handler_3)
    			];
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, input, anchor);
    		},

    		p: function update(changed, ctx) {
    			set_attributes(input, get_spread_update(input_levels, [
    				(changed.props) && ctx.props,
    				(changed.id) && { id: ctx.id },
    				{ type: "file" },
    				(changed.readonly) && { readonly: ctx.readonly },
    				(changed.classes) && { class: ctx.classes },
    				(changed.name) && { name: ctx.name },
    				(changed.disabled) && { disabled: ctx.disabled },
    				(changed.placeholder) && { placeholder: ctx.placeholder }
    			]));
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(input);
    			}

    			run_all(dispose);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_if_block_4.name, type: "if", source: "(127:28) ", ctx });
    	return block;
    }

    // (109:29) 
    function create_if_block_3$1(ctx) {
    	var input, dispose;

    	var input_levels = [
    		ctx.props,
    		{ id: ctx.id },
    		{ type: "email" },
    		{ readonly: ctx.readonly },
    		{ class: ctx.classes },
    		{ name: ctx.name },
    		{ disabled: ctx.disabled },
    		{ placeholder: ctx.placeholder }
    	];

    	var input_data = {};
    	for (var i = 0; i < input_levels.length; i += 1) {
    		input_data = assign(input_data, input_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			input = element("input");
    			set_attributes(input, input_data);
    			add_location(input, file$3, 109, 4, 2474);

    			dispose = [
    				listen_dev(input, "input", ctx.input_input_handler_2),
    				listen_dev(input, "blur", ctx.blur_handler_2),
    				listen_dev(input, "focus", ctx.focus_handler_2),
    				listen_dev(input, "keydown", ctx.keydown_handler_2),
    				listen_dev(input, "keypress", ctx.keypress_handler_2),
    				listen_dev(input, "keyup", ctx.keyup_handler_2),
    				listen_dev(input, "change", ctx.change_handler_2),
    				listen_dev(input, "input", ctx.input_handler_2)
    			];
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, input, anchor);

    			set_input_value(input, ctx.value);
    		},

    		p: function update(changed, ctx) {
    			if (changed.value && (input.value !== ctx.value)) set_input_value(input, ctx.value);

    			set_attributes(input, get_spread_update(input_levels, [
    				(changed.props) && ctx.props,
    				(changed.id) && { id: ctx.id },
    				{ type: "email" },
    				(changed.readonly) && { readonly: ctx.readonly },
    				(changed.classes) && { class: ctx.classes },
    				(changed.name) && { name: ctx.name },
    				(changed.disabled) && { disabled: ctx.disabled },
    				(changed.placeholder) && { placeholder: ctx.placeholder }
    			]));
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(input);
    			}

    			run_all(dispose);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_if_block_3$1.name, type: "if", source: "(109:29) ", ctx });
    	return block;
    }

    // (91:32) 
    function create_if_block_2$1(ctx) {
    	var input, dispose;

    	var input_levels = [
    		ctx.props,
    		{ id: ctx.id },
    		{ type: "password" },
    		{ readonly: ctx.readonly },
    		{ class: ctx.classes },
    		{ name: ctx.name },
    		{ disabled: ctx.disabled },
    		{ placeholder: ctx.placeholder }
    	];

    	var input_data = {};
    	for (var i = 0; i < input_levels.length; i += 1) {
    		input_data = assign(input_data, input_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			input = element("input");
    			set_attributes(input, input_data);
    			add_location(input, file$3, 91, 4, 2164);

    			dispose = [
    				listen_dev(input, "input", ctx.input_input_handler_1),
    				listen_dev(input, "blur", ctx.blur_handler_1),
    				listen_dev(input, "focus", ctx.focus_handler_1),
    				listen_dev(input, "keydown", ctx.keydown_handler_1),
    				listen_dev(input, "keypress", ctx.keypress_handler_1),
    				listen_dev(input, "keyup", ctx.keyup_handler_1),
    				listen_dev(input, "change", ctx.change_handler_1),
    				listen_dev(input, "input", ctx.input_handler_1)
    			];
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, input, anchor);

    			set_input_value(input, ctx.value);
    		},

    		p: function update(changed, ctx) {
    			if (changed.value && (input.value !== ctx.value)) set_input_value(input, ctx.value);

    			set_attributes(input, get_spread_update(input_levels, [
    				(changed.props) && ctx.props,
    				(changed.id) && { id: ctx.id },
    				{ type: "password" },
    				(changed.readonly) && { readonly: ctx.readonly },
    				(changed.classes) && { class: ctx.classes },
    				(changed.name) && { name: ctx.name },
    				(changed.disabled) && { disabled: ctx.disabled },
    				(changed.placeholder) && { placeholder: ctx.placeholder }
    			]));
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(input);
    			}

    			run_all(dispose);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_if_block_2$1.name, type: "if", source: "(91:32) ", ctx });
    	return block;
    }

    // (73:2) {#if type === 'text'}
    function create_if_block_1$1(ctx) {
    	var input, dispose;

    	var input_levels = [
    		ctx.props,
    		{ id: ctx.id },
    		{ type: "text" },
    		{ readonly: ctx.readonly },
    		{ class: ctx.classes },
    		{ name: ctx.name },
    		{ disabled: ctx.disabled },
    		{ placeholder: ctx.placeholder }
    	];

    	var input_data = {};
    	for (var i = 0; i < input_levels.length; i += 1) {
    		input_data = assign(input_data, input_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			input = element("input");
    			set_attributes(input, input_data);
    			add_location(input, file$3, 73, 4, 1855);

    			dispose = [
    				listen_dev(input, "input", ctx.input_input_handler),
    				listen_dev(input, "blur", ctx.blur_handler),
    				listen_dev(input, "focus", ctx.focus_handler),
    				listen_dev(input, "keydown", ctx.keydown_handler),
    				listen_dev(input, "keypress", ctx.keypress_handler),
    				listen_dev(input, "keyup", ctx.keyup_handler),
    				listen_dev(input, "change", ctx.change_handler),
    				listen_dev(input, "input", ctx.input_handler)
    			];
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, input, anchor);

    			set_input_value(input, ctx.value);
    		},

    		p: function update(changed, ctx) {
    			if (changed.value && (input.value !== ctx.value)) set_input_value(input, ctx.value);

    			set_attributes(input, get_spread_update(input_levels, [
    				(changed.props) && ctx.props,
    				(changed.id) && { id: ctx.id },
    				{ type: "text" },
    				(changed.readonly) && { readonly: ctx.readonly },
    				(changed.classes) && { class: ctx.classes },
    				(changed.name) && { name: ctx.name },
    				(changed.disabled) && { disabled: ctx.disabled },
    				(changed.placeholder) && { placeholder: ctx.placeholder }
    			]));
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(input);
    			}

    			run_all(dispose);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_if_block_1$1.name, type: "if", source: "(73:2) {#if type === 'text'}", ctx });
    	return block;
    }

    function create_fragment$4(ctx) {
    	var current_block_type_index, if_block, if_block_anchor, current;

    	var if_block_creators = [
    		create_if_block$1,
    		create_if_block_14,
    		create_if_block_15
    	];

    	var if_blocks = [];

    	function select_block_type(changed, ctx) {
    		if (ctx.tag === 'input') return 0;
    		if (ctx.tag === 'textarea') return 1;
    		if (ctx.tag === 'select') return 2;
    		return -1;
    	}

    	if (~(current_block_type_index = select_block_type(null, ctx))) {
    		if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	}

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			if (~current_block_type_index) if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(changed, ctx);
    			if (current_block_type_index === previous_block_index) {
    				if (~current_block_type_index) if_blocks[current_block_type_index].p(changed, ctx);
    			} else {
    				if (if_block) {
    					group_outros();
    					transition_out(if_blocks[previous_block_index], 1, 1, () => {
    						if_blocks[previous_block_index] = null;
    					});
    					check_outros();
    				}

    				if (~current_block_type_index) {
    					if_block = if_blocks[current_block_type_index];
    					if (!if_block) {
    						if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    						if_block.c();
    					}
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				} else {
    					if_block = null;
    				}
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (~current_block_type_index) if_blocks[current_block_type_index].d(detaching);

    			if (detaching) {
    				detach_dev(if_block_anchor);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$4.name, type: "component", source: "", ctx });
    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	

      let { class: className = '', type = 'text', size = undefined, bsSize = undefined, checked = false, valid = false, invalid = false, plaintext = false, addon = false, value = '', files = '', readonly, multiple = false, id = '', name = '', placeholder = '', disabled = false } = $$props;

      // eslint-disable-next-line no-unused-vars
      const { type: _omitType, ...props } = clean($$props);

      let classes;
      let tag;

    	let { $$slots = {}, $$scope } = $$props;

    	function blur_handler(event) {
    		bubble($$self, event);
    	}

    	function focus_handler(event) {
    		bubble($$self, event);
    	}

    	function keydown_handler(event) {
    		bubble($$self, event);
    	}

    	function keypress_handler(event) {
    		bubble($$self, event);
    	}

    	function keyup_handler(event) {
    		bubble($$self, event);
    	}

    	function change_handler(event) {
    		bubble($$self, event);
    	}

    	function input_handler(event) {
    		bubble($$self, event);
    	}

    	function blur_handler_1(event) {
    		bubble($$self, event);
    	}

    	function focus_handler_1(event) {
    		bubble($$self, event);
    	}

    	function keydown_handler_1(event) {
    		bubble($$self, event);
    	}

    	function keypress_handler_1(event) {
    		bubble($$self, event);
    	}

    	function keyup_handler_1(event) {
    		bubble($$self, event);
    	}

    	function change_handler_1(event) {
    		bubble($$self, event);
    	}

    	function input_handler_1(event) {
    		bubble($$self, event);
    	}

    	function blur_handler_2(event) {
    		bubble($$self, event);
    	}

    	function focus_handler_2(event) {
    		bubble($$self, event);
    	}

    	function keydown_handler_2(event) {
    		bubble($$self, event);
    	}

    	function keypress_handler_2(event) {
    		bubble($$self, event);
    	}

    	function keyup_handler_2(event) {
    		bubble($$self, event);
    	}

    	function change_handler_2(event) {
    		bubble($$self, event);
    	}

    	function input_handler_2(event) {
    		bubble($$self, event);
    	}

    	function blur_handler_3(event) {
    		bubble($$self, event);
    	}

    	function focus_handler_3(event) {
    		bubble($$self, event);
    	}

    	function keydown_handler_3(event) {
    		bubble($$self, event);
    	}

    	function keypress_handler_3(event) {
    		bubble($$self, event);
    	}

    	function keyup_handler_3(event) {
    		bubble($$self, event);
    	}

    	function change_handler_3(event) {
    		bubble($$self, event);
    	}

    	function input_handler_3(event) {
    		bubble($$self, event);
    	}

    	function blur_handler_4(event) {
    		bubble($$self, event);
    	}

    	function focus_handler_4(event) {
    		bubble($$self, event);
    	}

    	function keydown_handler_4(event) {
    		bubble($$self, event);
    	}

    	function keypress_handler_4(event) {
    		bubble($$self, event);
    	}

    	function keyup_handler_4(event) {
    		bubble($$self, event);
    	}

    	function change_handler_4(event) {
    		bubble($$self, event);
    	}

    	function input_handler_4(event) {
    		bubble($$self, event);
    	}

    	function blur_handler_5(event) {
    		bubble($$self, event);
    	}

    	function focus_handler_5(event) {
    		bubble($$self, event);
    	}

    	function keydown_handler_5(event) {
    		bubble($$self, event);
    	}

    	function keypress_handler_5(event) {
    		bubble($$self, event);
    	}

    	function keyup_handler_5(event) {
    		bubble($$self, event);
    	}

    	function change_handler_5(event) {
    		bubble($$self, event);
    	}

    	function input_handler_5(event) {
    		bubble($$self, event);
    	}

    	function blur_handler_6(event) {
    		bubble($$self, event);
    	}

    	function focus_handler_6(event) {
    		bubble($$self, event);
    	}

    	function keydown_handler_6(event) {
    		bubble($$self, event);
    	}

    	function keypress_handler_6(event) {
    		bubble($$self, event);
    	}

    	function keyup_handler_6(event) {
    		bubble($$self, event);
    	}

    	function change_handler_6(event) {
    		bubble($$self, event);
    	}

    	function input_handler_6(event) {
    		bubble($$self, event);
    	}

    	function blur_handler_7(event) {
    		bubble($$self, event);
    	}

    	function focus_handler_7(event) {
    		bubble($$self, event);
    	}

    	function keydown_handler_7(event) {
    		bubble($$self, event);
    	}

    	function keypress_handler_7(event) {
    		bubble($$self, event);
    	}

    	function keyup_handler_7(event) {
    		bubble($$self, event);
    	}

    	function change_handler_7(event) {
    		bubble($$self, event);
    	}

    	function input_handler_7(event) {
    		bubble($$self, event);
    	}

    	function blur_handler_8(event) {
    		bubble($$self, event);
    	}

    	function focus_handler_8(event) {
    		bubble($$self, event);
    	}

    	function keydown_handler_8(event) {
    		bubble($$self, event);
    	}

    	function keypress_handler_8(event) {
    		bubble($$self, event);
    	}

    	function keyup_handler_8(event) {
    		bubble($$self, event);
    	}

    	function change_handler_8(event) {
    		bubble($$self, event);
    	}

    	function input_handler_8(event) {
    		bubble($$self, event);
    	}

    	function blur_handler_9(event) {
    		bubble($$self, event);
    	}

    	function focus_handler_9(event) {
    		bubble($$self, event);
    	}

    	function keydown_handler_9(event) {
    		bubble($$self, event);
    	}

    	function keypress_handler_9(event) {
    		bubble($$self, event);
    	}

    	function keyup_handler_9(event) {
    		bubble($$self, event);
    	}

    	function change_handler_9(event) {
    		bubble($$self, event);
    	}

    	function input_handler_9(event) {
    		bubble($$self, event);
    	}

    	function blur_handler_10(event) {
    		bubble($$self, event);
    	}

    	function focus_handler_10(event) {
    		bubble($$self, event);
    	}

    	function keydown_handler_10(event) {
    		bubble($$self, event);
    	}

    	function keypress_handler_10(event) {
    		bubble($$self, event);
    	}

    	function keyup_handler_10(event) {
    		bubble($$self, event);
    	}

    	function change_handler_10(event) {
    		bubble($$self, event);
    	}

    	function input_handler_10(event) {
    		bubble($$self, event);
    	}

    	function blur_handler_11(event) {
    		bubble($$self, event);
    	}

    	function focus_handler_11(event) {
    		bubble($$self, event);
    	}

    	function keydown_handler_11(event) {
    		bubble($$self, event);
    	}

    	function keypress_handler_11(event) {
    		bubble($$self, event);
    	}

    	function keyup_handler_11(event) {
    		bubble($$self, event);
    	}

    	function change_handler_11(event) {
    		bubble($$self, event);
    	}

    	function input_handler_11(event) {
    		bubble($$self, event);
    	}

    	function blur_handler_12(event) {
    		bubble($$self, event);
    	}

    	function focus_handler_12(event) {
    		bubble($$self, event);
    	}

    	function keydown_handler_12(event) {
    		bubble($$self, event);
    	}

    	function keypress_handler_12(event) {
    		bubble($$self, event);
    	}

    	function keyup_handler_12(event) {
    		bubble($$self, event);
    	}

    	function change_handler_12(event) {
    		bubble($$self, event);
    	}

    	function input_handler_12(event) {
    		bubble($$self, event);
    	}

    	function blur_handler_13(event) {
    		bubble($$self, event);
    	}

    	function focus_handler_13(event) {
    		bubble($$self, event);
    	}

    	function keydown_handler_13(event) {
    		bubble($$self, event);
    	}

    	function keypress_handler_13(event) {
    		bubble($$self, event);
    	}

    	function keyup_handler_13(event) {
    		bubble($$self, event);
    	}

    	function change_handler_13(event) {
    		bubble($$self, event);
    	}

    	function input_handler_13(event) {
    		bubble($$self, event);
    	}

    	function blur_handler_14(event) {
    		bubble($$self, event);
    	}

    	function focus_handler_14(event) {
    		bubble($$self, event);
    	}

    	function change_handler_14(event) {
    		bubble($$self, event);
    	}

    	function input_handler_14(event) {
    		bubble($$self, event);
    	}

    	function input_input_handler() {
    		value = this.value;
    		$$invalidate('value', value);
    	}

    	function input_input_handler_1() {
    		value = this.value;
    		$$invalidate('value', value);
    	}

    	function input_input_handler_2() {
    		value = this.value;
    		$$invalidate('value', value);
    	}

    	function input_change_handler() {
    		files = this.files;
    		$$invalidate('files', files);
    	}

    	function input_change_handler_1() {
    		checked = this.checked;
    		value = this.value;
    		$$invalidate('checked', checked);
    		$$invalidate('value', value);
    	}

    	function input_change_handler_2() {
    		value = this.value;
    		$$invalidate('value', value);
    	}

    	function input_input_handler_3() {
    		value = this.value;
    		$$invalidate('value', value);
    	}

    	function input_input_handler_4() {
    		value = to_number(this.value);
    		$$invalidate('value', value);
    	}

    	function input_input_handler_5() {
    		value = this.value;
    		$$invalidate('value', value);
    	}

    	function input_input_handler_6() {
    		value = this.value;
    		$$invalidate('value', value);
    	}

    	function input_input_handler_7() {
    		value = this.value;
    		$$invalidate('value', value);
    	}

    	function input_input_handler_8() {
    		value = this.value;
    		$$invalidate('value', value);
    	}

    	function input_input_handler_9() {
    		value = this.value;
    		$$invalidate('value', value);
    	}

    	function textarea_input_handler() {
    		value = this.value;
    		$$invalidate('value', value);
    	}

    	$$self.$set = $$new_props => {
    		$$invalidate('$$props', $$props = assign(assign({}, $$props), $$new_props));
    		if ('class' in $$new_props) $$invalidate('className', className = $$new_props.class);
    		if ('type' in $$new_props) $$invalidate('type', type = $$new_props.type);
    		if ('size' in $$new_props) $$invalidate('size', size = $$new_props.size);
    		if ('bsSize' in $$new_props) $$invalidate('bsSize', bsSize = $$new_props.bsSize);
    		if ('checked' in $$new_props) $$invalidate('checked', checked = $$new_props.checked);
    		if ('valid' in $$new_props) $$invalidate('valid', valid = $$new_props.valid);
    		if ('invalid' in $$new_props) $$invalidate('invalid', invalid = $$new_props.invalid);
    		if ('plaintext' in $$new_props) $$invalidate('plaintext', plaintext = $$new_props.plaintext);
    		if ('addon' in $$new_props) $$invalidate('addon', addon = $$new_props.addon);
    		if ('value' in $$new_props) $$invalidate('value', value = $$new_props.value);
    		if ('files' in $$new_props) $$invalidate('files', files = $$new_props.files);
    		if ('readonly' in $$new_props) $$invalidate('readonly', readonly = $$new_props.readonly);
    		if ('multiple' in $$new_props) $$invalidate('multiple', multiple = $$new_props.multiple);
    		if ('id' in $$new_props) $$invalidate('id', id = $$new_props.id);
    		if ('name' in $$new_props) $$invalidate('name', name = $$new_props.name);
    		if ('placeholder' in $$new_props) $$invalidate('placeholder', placeholder = $$new_props.placeholder);
    		if ('disabled' in $$new_props) $$invalidate('disabled', disabled = $$new_props.disabled);
    		if ('$$scope' in $$new_props) $$invalidate('$$scope', $$scope = $$new_props.$$scope);
    	};

    	$$self.$capture_state = () => {
    		return { className, type, size, bsSize, checked, valid, invalid, plaintext, addon, value, files, readonly, multiple, id, name, placeholder, disabled, classes, tag };
    	};

    	$$self.$inject_state = $$new_props => {
    		$$invalidate('$$props', $$props = assign(assign({}, $$props), $$new_props));
    		if ('className' in $$props) $$invalidate('className', className = $$new_props.className);
    		if ('type' in $$props) $$invalidate('type', type = $$new_props.type);
    		if ('size' in $$props) $$invalidate('size', size = $$new_props.size);
    		if ('bsSize' in $$props) $$invalidate('bsSize', bsSize = $$new_props.bsSize);
    		if ('checked' in $$props) $$invalidate('checked', checked = $$new_props.checked);
    		if ('valid' in $$props) $$invalidate('valid', valid = $$new_props.valid);
    		if ('invalid' in $$props) $$invalidate('invalid', invalid = $$new_props.invalid);
    		if ('plaintext' in $$props) $$invalidate('plaintext', plaintext = $$new_props.plaintext);
    		if ('addon' in $$props) $$invalidate('addon', addon = $$new_props.addon);
    		if ('value' in $$props) $$invalidate('value', value = $$new_props.value);
    		if ('files' in $$props) $$invalidate('files', files = $$new_props.files);
    		if ('readonly' in $$props) $$invalidate('readonly', readonly = $$new_props.readonly);
    		if ('multiple' in $$props) $$invalidate('multiple', multiple = $$new_props.multiple);
    		if ('id' in $$props) $$invalidate('id', id = $$new_props.id);
    		if ('name' in $$props) $$invalidate('name', name = $$new_props.name);
    		if ('placeholder' in $$props) $$invalidate('placeholder', placeholder = $$new_props.placeholder);
    		if ('disabled' in $$props) $$invalidate('disabled', disabled = $$new_props.disabled);
    		if ('classes' in $$props) $$invalidate('classes', classes = $$new_props.classes);
    		if ('tag' in $$props) $$invalidate('tag', tag = $$new_props.tag);
    	};

    	$$self.$$.update = ($$dirty = { type: 1, plaintext: 1, addon: 1, size: 1, className: 1, invalid: 1, valid: 1, bsSize: 1 }) => {
    		if ($$dirty.type || $$dirty.plaintext || $$dirty.addon || $$dirty.size || $$dirty.className || $$dirty.invalid || $$dirty.valid || $$dirty.bsSize) { {
            const checkInput = ['radio', 'checkbox'].indexOf(type) > -1;
            const isNotaNumber = new RegExp('\\D', 'g');
        
            const fileInput = type === 'file';
            const textareaInput = type === 'textarea';
            const selectInput = type === 'select';
            $$invalidate('tag', tag = selectInput || textareaInput ? type : 'input');
        
            let formControlClass = 'form-control';
        
            if (plaintext) {
              formControlClass = `${formControlClass}-plaintext`;
              $$invalidate('tag', tag = 'input');
            } else if (fileInput) {
              formControlClass = `${formControlClass}-file`;
            } else if (checkInput) {
              if (addon) {
                formControlClass = null;
              } else {
                formControlClass = 'form-check-input';
              }
            }
        
            if (size && isNotaNumber.test(size)) {
              console.warn(
                'Please use the prop "bsSize" instead of the "size" to bootstrap\'s input sizing.'
              );
              $$invalidate('bsSize', bsSize = size);
              $$invalidate('size', size = undefined);
            }
        
            $$invalidate('classes', classes = clsx(
              className,
              invalid && 'is-invalid',
              valid && 'is-valid',
              bsSize ? `form-control-${bsSize}` : false,
              formControlClass
            ));
          } }
    	};

    	return {
    		className,
    		type,
    		size,
    		bsSize,
    		checked,
    		valid,
    		invalid,
    		plaintext,
    		addon,
    		value,
    		files,
    		readonly,
    		multiple,
    		id,
    		name,
    		placeholder,
    		disabled,
    		props,
    		classes,
    		tag,
    		blur_handler,
    		focus_handler,
    		keydown_handler,
    		keypress_handler,
    		keyup_handler,
    		change_handler,
    		input_handler,
    		blur_handler_1,
    		focus_handler_1,
    		keydown_handler_1,
    		keypress_handler_1,
    		keyup_handler_1,
    		change_handler_1,
    		input_handler_1,
    		blur_handler_2,
    		focus_handler_2,
    		keydown_handler_2,
    		keypress_handler_2,
    		keyup_handler_2,
    		change_handler_2,
    		input_handler_2,
    		blur_handler_3,
    		focus_handler_3,
    		keydown_handler_3,
    		keypress_handler_3,
    		keyup_handler_3,
    		change_handler_3,
    		input_handler_3,
    		blur_handler_4,
    		focus_handler_4,
    		keydown_handler_4,
    		keypress_handler_4,
    		keyup_handler_4,
    		change_handler_4,
    		input_handler_4,
    		blur_handler_5,
    		focus_handler_5,
    		keydown_handler_5,
    		keypress_handler_5,
    		keyup_handler_5,
    		change_handler_5,
    		input_handler_5,
    		blur_handler_6,
    		focus_handler_6,
    		keydown_handler_6,
    		keypress_handler_6,
    		keyup_handler_6,
    		change_handler_6,
    		input_handler_6,
    		blur_handler_7,
    		focus_handler_7,
    		keydown_handler_7,
    		keypress_handler_7,
    		keyup_handler_7,
    		change_handler_7,
    		input_handler_7,
    		blur_handler_8,
    		focus_handler_8,
    		keydown_handler_8,
    		keypress_handler_8,
    		keyup_handler_8,
    		change_handler_8,
    		input_handler_8,
    		blur_handler_9,
    		focus_handler_9,
    		keydown_handler_9,
    		keypress_handler_9,
    		keyup_handler_9,
    		change_handler_9,
    		input_handler_9,
    		blur_handler_10,
    		focus_handler_10,
    		keydown_handler_10,
    		keypress_handler_10,
    		keyup_handler_10,
    		change_handler_10,
    		input_handler_10,
    		blur_handler_11,
    		focus_handler_11,
    		keydown_handler_11,
    		keypress_handler_11,
    		keyup_handler_11,
    		change_handler_11,
    		input_handler_11,
    		blur_handler_12,
    		focus_handler_12,
    		keydown_handler_12,
    		keypress_handler_12,
    		keyup_handler_12,
    		change_handler_12,
    		input_handler_12,
    		blur_handler_13,
    		focus_handler_13,
    		keydown_handler_13,
    		keypress_handler_13,
    		keyup_handler_13,
    		change_handler_13,
    		input_handler_13,
    		blur_handler_14,
    		focus_handler_14,
    		change_handler_14,
    		input_handler_14,
    		input_input_handler,
    		input_input_handler_1,
    		input_input_handler_2,
    		input_change_handler,
    		input_change_handler_1,
    		input_change_handler_2,
    		input_input_handler_3,
    		input_input_handler_4,
    		input_input_handler_5,
    		input_input_handler_6,
    		input_input_handler_7,
    		input_input_handler_8,
    		input_input_handler_9,
    		textarea_input_handler,
    		$$props: $$props = exclude_internal_props($$props),
    		$$slots,
    		$$scope
    	};
    }

    class Input extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, ["class", "type", "size", "bsSize", "checked", "valid", "invalid", "plaintext", "addon", "value", "files", "readonly", "multiple", "id", "name", "placeholder", "disabled"]);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "Input", options, id: create_fragment$4.name });

    		const { ctx } = this.$$;
    		const props = options.props || {};
    		if (ctx.readonly === undefined && !('readonly' in props)) {
    			console_1.warn("<Input> was created without expected prop 'readonly'");
    		}
    	}

    	get class() {
    		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set class(value) {
    		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get type() {
    		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set type(value) {
    		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get size() {
    		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set size(value) {
    		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get bsSize() {
    		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set bsSize(value) {
    		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get checked() {
    		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set checked(value) {
    		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get valid() {
    		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set valid(value) {
    		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get invalid() {
    		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set invalid(value) {
    		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get plaintext() {
    		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set plaintext(value) {
    		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get addon() {
    		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set addon(value) {
    		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get value() {
    		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set value(value) {
    		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get files() {
    		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set files(value) {
    		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get readonly() {
    		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set readonly(value) {
    		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get multiple() {
    		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set multiple(value) {
    		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get id() {
    		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set id(value) {
    		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get name() {
    		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set name(value) {
    		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get placeholder() {
    		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set placeholder(value) {
    		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get disabled() {
    		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set disabled(value) {
    		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules/sveltestrap/src/ListGroup.svelte generated by Svelte v3.12.1 */

    const file$4 = "node_modules/sveltestrap/src/ListGroup.svelte";

    function create_fragment$5(ctx) {
    	var ul, current;

    	const default_slot_template = ctx.$$slots.default;
    	const default_slot = create_slot(default_slot_template, ctx, null);

    	var ul_levels = [
    		ctx.props,
    		{ class: ctx.classes }
    	];

    	var ul_data = {};
    	for (var i = 0; i < ul_levels.length; i += 1) {
    		ul_data = assign(ul_data, ul_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			ul = element("ul");

    			if (default_slot) default_slot.c();

    			set_attributes(ul, ul_data);
    			add_location(ul, file$4, 17, 0, 298);
    		},

    		l: function claim(nodes) {
    			if (default_slot) default_slot.l(ul_nodes);
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, ul, anchor);

    			if (default_slot) {
    				default_slot.m(ul, null);
    			}

    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (default_slot && default_slot.p && changed.$$scope) {
    				default_slot.p(
    					get_slot_changes(default_slot_template, ctx, changed, null),
    					get_slot_context(default_slot_template, ctx, null)
    				);
    			}

    			set_attributes(ul, get_spread_update(ul_levels, [
    				(changed.props) && ctx.props,
    				(changed.classes) && { class: ctx.classes }
    			]));
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(ul);
    			}

    			if (default_slot) default_slot.d(detaching);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$5.name, type: "component", source: "", ctx });
    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	

      let { class: className = '', flush = false } = $$props;

      const props = clean($$props);

    	let { $$slots = {}, $$scope } = $$props;

    	$$self.$set = $$new_props => {
    		$$invalidate('$$props', $$props = assign(assign({}, $$props), $$new_props));
    		if ('class' in $$new_props) $$invalidate('className', className = $$new_props.class);
    		if ('flush' in $$new_props) $$invalidate('flush', flush = $$new_props.flush);
    		if ('$$scope' in $$new_props) $$invalidate('$$scope', $$scope = $$new_props.$$scope);
    	};

    	$$self.$capture_state = () => {
    		return { className, flush, classes };
    	};

    	$$self.$inject_state = $$new_props => {
    		$$invalidate('$$props', $$props = assign(assign({}, $$props), $$new_props));
    		if ('className' in $$props) $$invalidate('className', className = $$new_props.className);
    		if ('flush' in $$props) $$invalidate('flush', flush = $$new_props.flush);
    		if ('classes' in $$props) $$invalidate('classes', classes = $$new_props.classes);
    	};

    	let classes;

    	$$self.$$.update = ($$dirty = { className: 1, flush: 1 }) => {
    		if ($$dirty.className || $$dirty.flush) { $$invalidate('classes', classes = clsx(
            className,
            'list-group',
            flush ? 'list-group-flush' : false
          )); }
    	};

    	return {
    		className,
    		flush,
    		props,
    		classes,
    		$$props: $$props = exclude_internal_props($$props),
    		$$slots,
    		$$scope
    	};
    }

    class ListGroup extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, ["class", "flush"]);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "ListGroup", options, id: create_fragment$5.name });
    	}

    	get class() {
    		throw new Error("<ListGroup>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set class(value) {
    		throw new Error("<ListGroup>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get flush() {
    		throw new Error("<ListGroup>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set flush(value) {
    		throw new Error("<ListGroup>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules/sveltestrap/src/ListGroupItem.svelte generated by Svelte v3.12.1 */

    const file$5 = "node_modules/sveltestrap/src/ListGroupItem.svelte";

    // (34:0) {:else}
    function create_else_block$1(ctx) {
    	var li, current;

    	const default_slot_template = ctx.$$slots.default;
    	const default_slot = create_slot(default_slot_template, ctx, null);

    	var li_levels = [
    		ctx.props,
    		{ class: ctx.classes },
    		{ disabled: ctx.disabled },
    		{ active: ctx.active }
    	];

    	var li_data = {};
    	for (var i = 0; i < li_levels.length; i += 1) {
    		li_data = assign(li_data, li_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			li = element("li");

    			if (default_slot) default_slot.c();

    			set_attributes(li, li_data);
    			add_location(li, file$5, 34, 2, 796);
    		},

    		l: function claim(nodes) {
    			if (default_slot) default_slot.l(li_nodes);
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);

    			if (default_slot) {
    				default_slot.m(li, null);
    			}

    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (default_slot && default_slot.p && changed.$$scope) {
    				default_slot.p(
    					get_slot_changes(default_slot_template, ctx, changed, null),
    					get_slot_context(default_slot_template, ctx, null)
    				);
    			}

    			set_attributes(li, get_spread_update(li_levels, [
    				(changed.props) && ctx.props,
    				(changed.classes) && { class: ctx.classes },
    				(changed.disabled) && { disabled: ctx.disabled },
    				(changed.active) && { active: ctx.active }
    			]));
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(li);
    			}

    			if (default_slot) default_slot.d(detaching);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_else_block$1.name, type: "else", source: "(34:0) {:else}", ctx });
    	return block;
    }

    // (30:27) 
    function create_if_block_1$2(ctx) {
    	var button, current, dispose;

    	const default_slot_template = ctx.$$slots.default;
    	const default_slot = create_slot(default_slot_template, ctx, null);

    	var button_levels = [
    		ctx.props,
    		{ class: ctx.classes },
    		{ type: "button" },
    		{ disabled: ctx.disabled },
    		{ active: ctx.active }
    	];

    	var button_data = {};
    	for (var i = 0; i < button_levels.length; i += 1) {
    		button_data = assign(button_data, button_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			button = element("button");

    			if (default_slot) default_slot.c();

    			set_attributes(button, button_data);
    			add_location(button, file$5, 30, 2, 682);
    			dispose = listen_dev(button, "click", ctx.click_handler);
    		},

    		l: function claim(nodes) {
    			if (default_slot) default_slot.l(button_nodes);
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);

    			if (default_slot) {
    				default_slot.m(button, null);
    			}

    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (default_slot && default_slot.p && changed.$$scope) {
    				default_slot.p(
    					get_slot_changes(default_slot_template, ctx, changed, null),
    					get_slot_context(default_slot_template, ctx, null)
    				);
    			}

    			set_attributes(button, get_spread_update(button_levels, [
    				(changed.props) && ctx.props,
    				(changed.classes) && { class: ctx.classes },
    				{ type: "button" },
    				(changed.disabled) && { disabled: ctx.disabled },
    				(changed.active) && { active: ctx.active }
    			]));
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(button);
    			}

    			if (default_slot) default_slot.d(detaching);
    			dispose();
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_if_block_1$2.name, type: "if", source: "(30:27) ", ctx });
    	return block;
    }

    // (26:0) {#if href}
    function create_if_block$2(ctx) {
    	var a, current;

    	const default_slot_template = ctx.$$slots.default;
    	const default_slot = create_slot(default_slot_template, ctx, null);

    	var a_levels = [
    		ctx.props,
    		{ class: ctx.classes },
    		{ href: ctx.href },
    		{ disabled: ctx.disabled },
    		{ active: ctx.active }
    	];

    	var a_data = {};
    	for (var i = 0; i < a_levels.length; i += 1) {
    		a_data = assign(a_data, a_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			a = element("a");

    			if (default_slot) default_slot.c();

    			set_attributes(a, a_data);
    			add_location(a, file$5, 26, 2, 574);
    		},

    		l: function claim(nodes) {
    			if (default_slot) default_slot.l(a_nodes);
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, a, anchor);

    			if (default_slot) {
    				default_slot.m(a, null);
    			}

    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (default_slot && default_slot.p && changed.$$scope) {
    				default_slot.p(
    					get_slot_changes(default_slot_template, ctx, changed, null),
    					get_slot_context(default_slot_template, ctx, null)
    				);
    			}

    			set_attributes(a, get_spread_update(a_levels, [
    				(changed.props) && ctx.props,
    				(changed.classes) && { class: ctx.classes },
    				(changed.href) && { href: ctx.href },
    				(changed.disabled) && { disabled: ctx.disabled },
    				(changed.active) && { active: ctx.active }
    			]));
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(a);
    			}

    			if (default_slot) default_slot.d(detaching);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_if_block$2.name, type: "if", source: "(26:0) {#if href}", ctx });
    	return block;
    }

    function create_fragment$6(ctx) {
    	var current_block_type_index, if_block, if_block_anchor, current;

    	var if_block_creators = [
    		create_if_block$2,
    		create_if_block_1$2,
    		create_else_block$1
    	];

    	var if_blocks = [];

    	function select_block_type(changed, ctx) {
    		if (ctx.href) return 0;
    		if (ctx.tag === 'button') return 1;
    		return 2;
    	}

    	current_block_type_index = select_block_type(null, ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(changed, ctx);
    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(changed, ctx);
    			} else {
    				group_outros();
    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});
    				check_outros();

    				if_block = if_blocks[current_block_type_index];
    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				}
    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if_blocks[current_block_type_index].d(detaching);

    			if (detaching) {
    				detach_dev(if_block_anchor);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$6.name, type: "component", source: "", ctx });
    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	

      let { class: className = '', active = false, disabled = false, color = '', action = false, href = null, tag = null } = $$props;

      const props = clean($$props);

    	let { $$slots = {}, $$scope } = $$props;

    	function click_handler(event) {
    		bubble($$self, event);
    	}

    	$$self.$set = $$new_props => {
    		$$invalidate('$$props', $$props = assign(assign({}, $$props), $$new_props));
    		if ('class' in $$new_props) $$invalidate('className', className = $$new_props.class);
    		if ('active' in $$new_props) $$invalidate('active', active = $$new_props.active);
    		if ('disabled' in $$new_props) $$invalidate('disabled', disabled = $$new_props.disabled);
    		if ('color' in $$new_props) $$invalidate('color', color = $$new_props.color);
    		if ('action' in $$new_props) $$invalidate('action', action = $$new_props.action);
    		if ('href' in $$new_props) $$invalidate('href', href = $$new_props.href);
    		if ('tag' in $$new_props) $$invalidate('tag', tag = $$new_props.tag);
    		if ('$$scope' in $$new_props) $$invalidate('$$scope', $$scope = $$new_props.$$scope);
    	};

    	$$self.$capture_state = () => {
    		return { className, active, disabled, color, action, href, tag, classes };
    	};

    	$$self.$inject_state = $$new_props => {
    		$$invalidate('$$props', $$props = assign(assign({}, $$props), $$new_props));
    		if ('className' in $$props) $$invalidate('className', className = $$new_props.className);
    		if ('active' in $$props) $$invalidate('active', active = $$new_props.active);
    		if ('disabled' in $$props) $$invalidate('disabled', disabled = $$new_props.disabled);
    		if ('color' in $$props) $$invalidate('color', color = $$new_props.color);
    		if ('action' in $$props) $$invalidate('action', action = $$new_props.action);
    		if ('href' in $$props) $$invalidate('href', href = $$new_props.href);
    		if ('tag' in $$props) $$invalidate('tag', tag = $$new_props.tag);
    		if ('classes' in $$props) $$invalidate('classes', classes = $$new_props.classes);
    	};

    	let classes;

    	$$self.$$.update = ($$dirty = { className: 1, active: 1, disabled: 1, action: 1, color: 1 }) => {
    		if ($$dirty.className || $$dirty.active || $$dirty.disabled || $$dirty.action || $$dirty.color) { $$invalidate('classes', classes = clsx(
            className,
            active ? 'active' : false,
            disabled ? 'disabled' : false,
            action ? 'list-group-item-action' : false,
            color ? `list-group-item-${color}` : false,
            'list-group-item'
          )); }
    	};

    	return {
    		className,
    		active,
    		disabled,
    		color,
    		action,
    		href,
    		tag,
    		props,
    		classes,
    		click_handler,
    		$$props: $$props = exclude_internal_props($$props),
    		$$slots,
    		$$scope
    	};
    }

    class ListGroupItem extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, ["class", "active", "disabled", "color", "action", "href", "tag"]);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "ListGroupItem", options, id: create_fragment$6.name });
    	}

    	get class() {
    		throw new Error("<ListGroupItem>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set class(value) {
    		throw new Error("<ListGroupItem>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get active() {
    		throw new Error("<ListGroupItem>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set active(value) {
    		throw new Error("<ListGroupItem>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get disabled() {
    		throw new Error("<ListGroupItem>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set disabled(value) {
    		throw new Error("<ListGroupItem>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get color() {
    		throw new Error("<ListGroupItem>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set color(value) {
    		throw new Error("<ListGroupItem>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get action() {
    		throw new Error("<ListGroupItem>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set action(value) {
    		throw new Error("<ListGroupItem>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get href() {
    		throw new Error("<ListGroupItem>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set href(value) {
    		throw new Error("<ListGroupItem>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get tag() {
    		throw new Error("<ListGroupItem>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set tag(value) {
    		throw new Error("<ListGroupItem>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules/sveltestrap/src/Nav.svelte generated by Svelte v3.12.1 */

    const file$6 = "node_modules/sveltestrap/src/Nav.svelte";

    function create_fragment$7(ctx) {
    	var ul, current;

    	const default_slot_template = ctx.$$slots.default;
    	const default_slot = create_slot(default_slot_template, ctx, null);

    	var ul_levels = [
    		ctx.props,
    		{ class: ctx.classes }
    	];

    	var ul_data = {};
    	for (var i = 0; i < ul_levels.length; i += 1) {
    		ul_data = assign(ul_data, ul_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			ul = element("ul");

    			if (default_slot) default_slot.c();

    			set_attributes(ul, ul_data);
    			add_location(ul, file$6, 42, 0, 994);
    		},

    		l: function claim(nodes) {
    			if (default_slot) default_slot.l(ul_nodes);
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, ul, anchor);

    			if (default_slot) {
    				default_slot.m(ul, null);
    			}

    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (default_slot && default_slot.p && changed.$$scope) {
    				default_slot.p(
    					get_slot_changes(default_slot_template, ctx, changed, null),
    					get_slot_context(default_slot_template, ctx, null)
    				);
    			}

    			set_attributes(ul, get_spread_update(ul_levels, [
    				(changed.props) && ctx.props,
    				(changed.classes) && { class: ctx.classes }
    			]));
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(ul);
    			}

    			if (default_slot) default_slot.d(detaching);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$7.name, type: "component", source: "", ctx });
    	return block;
    }

    function getVerticalClass(vertical) {
      if (vertical === false) {
        return false;
      } else if (vertical === true || vertical === 'xs') {
        return 'flex-column';
      }
      return `flex-${vertical}-column`;
    }

    function instance$7($$self, $$props, $$invalidate) {
    	

      let { class: className = '', tabs = false, pills = false, vertical = false, horizontal = '', justified = false, fill = false, navbar = false, card = false } = $$props;

      const props = clean($$props);

    	let { $$slots = {}, $$scope } = $$props;

    	$$self.$set = $$new_props => {
    		$$invalidate('$$props', $$props = assign(assign({}, $$props), $$new_props));
    		if ('class' in $$new_props) $$invalidate('className', className = $$new_props.class);
    		if ('tabs' in $$new_props) $$invalidate('tabs', tabs = $$new_props.tabs);
    		if ('pills' in $$new_props) $$invalidate('pills', pills = $$new_props.pills);
    		if ('vertical' in $$new_props) $$invalidate('vertical', vertical = $$new_props.vertical);
    		if ('horizontal' in $$new_props) $$invalidate('horizontal', horizontal = $$new_props.horizontal);
    		if ('justified' in $$new_props) $$invalidate('justified', justified = $$new_props.justified);
    		if ('fill' in $$new_props) $$invalidate('fill', fill = $$new_props.fill);
    		if ('navbar' in $$new_props) $$invalidate('navbar', navbar = $$new_props.navbar);
    		if ('card' in $$new_props) $$invalidate('card', card = $$new_props.card);
    		if ('$$scope' in $$new_props) $$invalidate('$$scope', $$scope = $$new_props.$$scope);
    	};

    	$$self.$capture_state = () => {
    		return { className, tabs, pills, vertical, horizontal, justified, fill, navbar, card, classes };
    	};

    	$$self.$inject_state = $$new_props => {
    		$$invalidate('$$props', $$props = assign(assign({}, $$props), $$new_props));
    		if ('className' in $$props) $$invalidate('className', className = $$new_props.className);
    		if ('tabs' in $$props) $$invalidate('tabs', tabs = $$new_props.tabs);
    		if ('pills' in $$props) $$invalidate('pills', pills = $$new_props.pills);
    		if ('vertical' in $$props) $$invalidate('vertical', vertical = $$new_props.vertical);
    		if ('horizontal' in $$props) $$invalidate('horizontal', horizontal = $$new_props.horizontal);
    		if ('justified' in $$props) $$invalidate('justified', justified = $$new_props.justified);
    		if ('fill' in $$props) $$invalidate('fill', fill = $$new_props.fill);
    		if ('navbar' in $$props) $$invalidate('navbar', navbar = $$new_props.navbar);
    		if ('card' in $$props) $$invalidate('card', card = $$new_props.card);
    		if ('classes' in $$props) $$invalidate('classes', classes = $$new_props.classes);
    	};

    	let classes;

    	$$self.$$.update = ($$dirty = { className: 1, navbar: 1, horizontal: 1, vertical: 1, tabs: 1, card: 1, pills: 1, justified: 1, fill: 1 }) => {
    		if ($$dirty.className || $$dirty.navbar || $$dirty.horizontal || $$dirty.vertical || $$dirty.tabs || $$dirty.card || $$dirty.pills || $$dirty.justified || $$dirty.fill) { $$invalidate('classes', classes = clsx(
            className,
            navbar ? 'navbar-nav' : 'nav',
            horizontal ? `justify-content-${horizontal}` : false,
            getVerticalClass(vertical),
            {
              'nav-tabs': tabs,
              'card-header-tabs': card && tabs,
              'nav-pills': pills,
              'card-header-pills': card && pills,
              'nav-justified': justified,
              'nav-fill': fill
            }
          )); }
    	};

    	return {
    		className,
    		tabs,
    		pills,
    		vertical,
    		horizontal,
    		justified,
    		fill,
    		navbar,
    		card,
    		props,
    		classes,
    		$$props: $$props = exclude_internal_props($$props),
    		$$slots,
    		$$scope
    	};
    }

    class Nav extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, ["class", "tabs", "pills", "vertical", "horizontal", "justified", "fill", "navbar", "card"]);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "Nav", options, id: create_fragment$7.name });
    	}

    	get class() {
    		throw new Error("<Nav>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set class(value) {
    		throw new Error("<Nav>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get tabs() {
    		throw new Error("<Nav>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set tabs(value) {
    		throw new Error("<Nav>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get pills() {
    		throw new Error("<Nav>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set pills(value) {
    		throw new Error("<Nav>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get vertical() {
    		throw new Error("<Nav>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set vertical(value) {
    		throw new Error("<Nav>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get horizontal() {
    		throw new Error("<Nav>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set horizontal(value) {
    		throw new Error("<Nav>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get justified() {
    		throw new Error("<Nav>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set justified(value) {
    		throw new Error("<Nav>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get fill() {
    		throw new Error("<Nav>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set fill(value) {
    		throw new Error("<Nav>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get navbar() {
    		throw new Error("<Nav>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set navbar(value) {
    		throw new Error("<Nav>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get card() {
    		throw new Error("<Nav>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set card(value) {
    		throw new Error("<Nav>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules/sveltestrap/src/NavItem.svelte generated by Svelte v3.12.1 */

    const file$7 = "node_modules/sveltestrap/src/NavItem.svelte";

    function create_fragment$8(ctx) {
    	var li, current;

    	const default_slot_template = ctx.$$slots.default;
    	const default_slot = create_slot(default_slot_template, ctx, null);

    	var li_levels = [
    		ctx.props,
    		{ class: ctx.classes }
    	];

    	var li_data = {};
    	for (var i = 0; i < li_levels.length; i += 1) {
    		li_data = assign(li_data, li_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			li = element("li");

    			if (default_slot) default_slot.c();

    			set_attributes(li, li_data);
    			add_location(li, file$7, 13, 0, 272);
    		},

    		l: function claim(nodes) {
    			if (default_slot) default_slot.l(li_nodes);
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);

    			if (default_slot) {
    				default_slot.m(li, null);
    			}

    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (default_slot && default_slot.p && changed.$$scope) {
    				default_slot.p(
    					get_slot_changes(default_slot_template, ctx, changed, null),
    					get_slot_context(default_slot_template, ctx, null)
    				);
    			}

    			set_attributes(li, get_spread_update(li_levels, [
    				(changed.props) && ctx.props,
    				(changed.classes) && { class: ctx.classes }
    			]));
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(li);
    			}

    			if (default_slot) default_slot.d(detaching);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$8.name, type: "component", source: "", ctx });
    	return block;
    }

    function instance$8($$self, $$props, $$invalidate) {
    	

      let { class: className = '', active = false } = $$props;

      const props = clean($$props);

    	let { $$slots = {}, $$scope } = $$props;

    	$$self.$set = $$new_props => {
    		$$invalidate('$$props', $$props = assign(assign({}, $$props), $$new_props));
    		if ('class' in $$new_props) $$invalidate('className', className = $$new_props.class);
    		if ('active' in $$new_props) $$invalidate('active', active = $$new_props.active);
    		if ('$$scope' in $$new_props) $$invalidate('$$scope', $$scope = $$new_props.$$scope);
    	};

    	$$self.$capture_state = () => {
    		return { className, active, classes };
    	};

    	$$self.$inject_state = $$new_props => {
    		$$invalidate('$$props', $$props = assign(assign({}, $$props), $$new_props));
    		if ('className' in $$props) $$invalidate('className', className = $$new_props.className);
    		if ('active' in $$props) $$invalidate('active', active = $$new_props.active);
    		if ('classes' in $$props) $$invalidate('classes', classes = $$new_props.classes);
    	};

    	let classes;

    	$$self.$$.update = ($$dirty = { className: 1, active: 1 }) => {
    		if ($$dirty.className || $$dirty.active) { $$invalidate('classes', classes = clsx(className, 'nav-item', active ? 'active' : false)); }
    	};

    	return {
    		className,
    		active,
    		props,
    		classes,
    		$$props: $$props = exclude_internal_props($$props),
    		$$slots,
    		$$scope
    	};
    }

    class NavItem extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, ["class", "active"]);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "NavItem", options, id: create_fragment$8.name });
    	}

    	get class() {
    		throw new Error("<NavItem>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set class(value) {
    		throw new Error("<NavItem>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get active() {
    		throw new Error("<NavItem>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set active(value) {
    		throw new Error("<NavItem>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules/sveltestrap/src/NavLink.svelte generated by Svelte v3.12.1 */

    const file$8 = "node_modules/sveltestrap/src/NavLink.svelte";

    function create_fragment$9(ctx) {
    	var a, current, dispose;

    	const default_slot_template = ctx.$$slots.default;
    	const default_slot = create_slot(default_slot_template, ctx, null);

    	var a_levels = [
    		ctx.props,
    		{ href: ctx.href },
    		{ class: ctx.classes }
    	];

    	var a_data = {};
    	for (var i = 0; i < a_levels.length; i += 1) {
    		a_data = assign(a_data, a_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			a = element("a");

    			if (default_slot) default_slot.c();

    			set_attributes(a, a_data);
    			add_location(a, file$8, 30, 0, 525);

    			dispose = [
    				listen_dev(a, "click", ctx.click_handler),
    				listen_dev(a, "click", ctx.handleClick)
    			];
    		},

    		l: function claim(nodes) {
    			if (default_slot) default_slot.l(a_nodes);
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, a, anchor);

    			if (default_slot) {
    				default_slot.m(a, null);
    			}

    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (default_slot && default_slot.p && changed.$$scope) {
    				default_slot.p(
    					get_slot_changes(default_slot_template, ctx, changed, null),
    					get_slot_context(default_slot_template, ctx, null)
    				);
    			}

    			set_attributes(a, get_spread_update(a_levels, [
    				(changed.props) && ctx.props,
    				(changed.href) && { href: ctx.href },
    				(changed.classes) && { class: ctx.classes }
    			]));
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(a);
    			}

    			if (default_slot) default_slot.d(detaching);
    			run_all(dispose);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$9.name, type: "component", source: "", ctx });
    	return block;
    }

    function instance$9($$self, $$props, $$invalidate) {
    	

      let { class: className = '', disabled = false, active = false, href = '#' } = $$props;

      const props = clean($$props);

      function handleClick(e) {
        if (disabled) {
          e.preventDefault();
          e.stopImmediatePropagation();
          return;
        }

        if (href === '#') {
          e.preventDefault();
        }
      }

    	let { $$slots = {}, $$scope } = $$props;

    	function click_handler(event) {
    		bubble($$self, event);
    	}

    	$$self.$set = $$new_props => {
    		$$invalidate('$$props', $$props = assign(assign({}, $$props), $$new_props));
    		if ('class' in $$new_props) $$invalidate('className', className = $$new_props.class);
    		if ('disabled' in $$new_props) $$invalidate('disabled', disabled = $$new_props.disabled);
    		if ('active' in $$new_props) $$invalidate('active', active = $$new_props.active);
    		if ('href' in $$new_props) $$invalidate('href', href = $$new_props.href);
    		if ('$$scope' in $$new_props) $$invalidate('$$scope', $$scope = $$new_props.$$scope);
    	};

    	$$self.$capture_state = () => {
    		return { className, disabled, active, href, classes };
    	};

    	$$self.$inject_state = $$new_props => {
    		$$invalidate('$$props', $$props = assign(assign({}, $$props), $$new_props));
    		if ('className' in $$props) $$invalidate('className', className = $$new_props.className);
    		if ('disabled' in $$props) $$invalidate('disabled', disabled = $$new_props.disabled);
    		if ('active' in $$props) $$invalidate('active', active = $$new_props.active);
    		if ('href' in $$props) $$invalidate('href', href = $$new_props.href);
    		if ('classes' in $$props) $$invalidate('classes', classes = $$new_props.classes);
    	};

    	let classes;

    	$$self.$$.update = ($$dirty = { className: 1, disabled: 1, active: 1 }) => {
    		if ($$dirty.className || $$dirty.disabled || $$dirty.active) { $$invalidate('classes', classes = clsx(className, 'nav-link', {
            disabled,
            active
          })); }
    	};

    	return {
    		className,
    		disabled,
    		active,
    		href,
    		props,
    		handleClick,
    		classes,
    		click_handler,
    		$$props: $$props = exclude_internal_props($$props),
    		$$slots,
    		$$scope
    	};
    }

    class NavLink extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$9, create_fragment$9, safe_not_equal, ["class", "disabled", "active", "href"]);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "NavLink", options, id: create_fragment$9.name });
    	}

    	get class() {
    		throw new Error("<NavLink>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set class(value) {
    		throw new Error("<NavLink>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get disabled() {
    		throw new Error("<NavLink>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set disabled(value) {
    		throw new Error("<NavLink>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get active() {
    		throw new Error("<NavLink>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set active(value) {
    		throw new Error("<NavLink>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get href() {
    		throw new Error("<NavLink>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set href(value) {
    		throw new Error("<NavLink>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules/sveltestrap/src/Row.svelte generated by Svelte v3.12.1 */

    const file$9 = "node_modules/sveltestrap/src/Row.svelte";

    function create_fragment$a(ctx) {
    	var div, current;

    	const default_slot_template = ctx.$$slots.default;
    	const default_slot = create_slot(default_slot_template, ctx, null);

    	var div_levels = [
    		ctx.props,
    		{ id: ctx.id },
    		{ class: ctx.classes }
    	];

    	var div_data = {};
    	for (var i = 0; i < div_levels.length; i += 1) {
    		div_data = assign(div_data, div_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			div = element("div");

    			if (default_slot) default_slot.c();

    			set_attributes(div, div_data);
    			add_location(div, file$9, 19, 0, 361);
    		},

    		l: function claim(nodes) {
    			if (default_slot) default_slot.l(div_nodes);
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (default_slot && default_slot.p && changed.$$scope) {
    				default_slot.p(
    					get_slot_changes(default_slot_template, ctx, changed, null),
    					get_slot_context(default_slot_template, ctx, null)
    				);
    			}

    			set_attributes(div, get_spread_update(div_levels, [
    				(changed.props) && ctx.props,
    				(changed.id) && { id: ctx.id },
    				(changed.classes) && { class: ctx.classes }
    			]));
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(div);
    			}

    			if (default_slot) default_slot.d(detaching);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$a.name, type: "component", source: "", ctx });
    	return block;
    }

    function instance$a($$self, $$props, $$invalidate) {
    	

      let { class: className = '', noGutters = false, form = false, id = '' } = $$props;

      const props = clean($$props);

    	let { $$slots = {}, $$scope } = $$props;

    	$$self.$set = $$new_props => {
    		$$invalidate('$$props', $$props = assign(assign({}, $$props), $$new_props));
    		if ('class' in $$new_props) $$invalidate('className', className = $$new_props.class);
    		if ('noGutters' in $$new_props) $$invalidate('noGutters', noGutters = $$new_props.noGutters);
    		if ('form' in $$new_props) $$invalidate('form', form = $$new_props.form);
    		if ('id' in $$new_props) $$invalidate('id', id = $$new_props.id);
    		if ('$$scope' in $$new_props) $$invalidate('$$scope', $$scope = $$new_props.$$scope);
    	};

    	$$self.$capture_state = () => {
    		return { className, noGutters, form, id, classes };
    	};

    	$$self.$inject_state = $$new_props => {
    		$$invalidate('$$props', $$props = assign(assign({}, $$props), $$new_props));
    		if ('className' in $$props) $$invalidate('className', className = $$new_props.className);
    		if ('noGutters' in $$props) $$invalidate('noGutters', noGutters = $$new_props.noGutters);
    		if ('form' in $$props) $$invalidate('form', form = $$new_props.form);
    		if ('id' in $$props) $$invalidate('id', id = $$new_props.id);
    		if ('classes' in $$props) $$invalidate('classes', classes = $$new_props.classes);
    	};

    	let classes;

    	$$self.$$.update = ($$dirty = { className: 1, noGutters: 1, form: 1 }) => {
    		if ($$dirty.className || $$dirty.noGutters || $$dirty.form) { $$invalidate('classes', classes = clsx(
            className,
            noGutters ? 'no-gutters' : null,
            form ? 'form-row' : 'row'
          )); }
    	};

    	return {
    		className,
    		noGutters,
    		form,
    		id,
    		props,
    		classes,
    		$$props: $$props = exclude_internal_props($$props),
    		$$slots,
    		$$scope
    	};
    }

    class Row extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$a, create_fragment$a, safe_not_equal, ["class", "noGutters", "form", "id"]);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "Row", options, id: create_fragment$a.name });
    	}

    	get class() {
    		throw new Error("<Row>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set class(value) {
    		throw new Error("<Row>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get noGutters() {
    		throw new Error("<Row>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set noGutters(value) {
    		throw new Error("<Row>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get form() {
    		throw new Error("<Row>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set form(value) {
    		throw new Error("<Row>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get id() {
    		throw new Error("<Row>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set id(value) {
    		throw new Error("<Row>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/Unselectable.svelte generated by Svelte v3.12.1 */

    const file$a = "src/components/Unselectable.svelte";

    function create_fragment$b(ctx) {
    	var div, current;

    	const default_slot_template = ctx.$$slots.default;
    	const default_slot = create_slot(default_slot_template, ctx, null);

    	const block = {
    		c: function create() {
    			div = element("div");

    			if (default_slot) default_slot.c();

    			attr_dev(div, "unselectable", "on");
    			attr_dev(div, "onselectstart", "return false;");
    			attr_dev(div, "onmousedown", "return false;");
    			add_location(div, file$a, 0, 0, 0);
    		},

    		l: function claim(nodes) {
    			if (default_slot) default_slot.l(div_nodes);
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (default_slot && default_slot.p && changed.$$scope) {
    				default_slot.p(
    					get_slot_changes(default_slot_template, ctx, changed, null),
    					get_slot_context(default_slot_template, ctx, null)
    				);
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(div);
    			}

    			if (default_slot) default_slot.d(detaching);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$b.name, type: "component", source: "", ctx });
    	return block;
    }

    function instance$b($$self, $$props, $$invalidate) {
    	let { $$slots = {}, $$scope } = $$props;

    	$$self.$set = $$props => {
    		if ('$$scope' in $$props) $$invalidate('$$scope', $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {};

    	return { $$slots, $$scope };
    }

    class Unselectable extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$b, create_fragment$b, safe_not_equal, []);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "Unselectable", options, id: create_fragment$b.name });
    	}
    }

    /* src/routes/Menu.svelte generated by Svelte v3.12.1 */

    const file$b = "src/routes/Menu.svelte";

    // (53:12) <Col>
    function create_default_slot_13(ctx) {
    	var canvas, t0, h1, t2, h6;

    	const block = {
    		c: function create() {
    			canvas = element("canvas");
    			t0 = space();
    			h1 = element("h1");
    			h1.textContent = "SmartCalc";
    			t2 = space();
    			h6 = element("h6");
    			h6.textContent = "Tool that solves questionable science problems";
    			add_location(canvas, file$b, 53, 16, 1378);
    			add_location(h1, file$b, 54, 16, 1442);
    			add_location(h6, file$b, 55, 16, 1477);
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, canvas, anchor);
    			ctx.canvas_binding(canvas);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, h1, anchor);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, h6, anchor);
    		},

    		p: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(canvas);
    			}

    			ctx.canvas_binding(null);

    			if (detaching) {
    				detach_dev(t0);
    				detach_dev(h1);
    				detach_dev(t2);
    				detach_dev(h6);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_default_slot_13.name, type: "slot", source: "(53:12) <Col>", ctx });
    	return block;
    }

    // (52:8) <Row class="p-5">
    function create_default_slot_12(ctx) {
    	var current;

    	var col = new Col({
    		props: {
    		$$slots: { default: [create_default_slot_13] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	const block = {
    		c: function create() {
    			col.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			mount_component(col, target, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var col_changes = {};
    			if (changed.$$scope || changed.flutterLogoCanvas) col_changes.$$scope = { changed, ctx };
    			col.$set(col_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(col.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(col.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(col, detaching);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_default_slot_12.name, type: "slot", source: "(52:8) <Row class=\"p-5\">", ctx });
    	return block;
    }

    // (62:20) <ListGroupItem action href="#/Math">
    function create_default_slot_11(ctx) {
    	var span;

    	const block = {
    		c: function create() {
    			span = element("span");
    			span.textContent = "Math";
    			add_location(span, file$b, 61, 56, 1758);
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(span);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_default_slot_11.name, type: "slot", source: "(62:20) <ListGroupItem action href=\"/Math\">", ctx });
    	return block;
    }

    // (63:20) <ListGroupItem action href="#/Electro">
    function create_default_slot_10(ctx) {
    	var span;

    	const block = {
    		c: function create() {
    			span = element("span");
    			span.textContent = "Electrical engineering";
    			add_location(span, file$b, 62, 59, 1851);
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(span);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_default_slot_10.name, type: "slot", source: "(63:20) <ListGroupItem action href=\"/Electro\">", ctx });
    	return block;
    }

    // (64:20) <ListGroupItem action href="#/Physics">
    function create_default_slot_9(ctx) {
    	var span;

    	const block = {
    		c: function create() {
    			span = element("span");
    			span.textContent = "Physics";
    			add_location(span, file$b, 63, 59, 1962);
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(span);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_default_slot_9.name, type: "slot", source: "(64:20) <ListGroupItem action href=\"/Physics\">", ctx });
    	return block;
    }

    // (61:16) <ListGroup class="border rounded shadow-lg">
    function create_default_slot_8(ctx) {
    	var t0, t1, current;

    	var listgroupitem0 = new ListGroupItem({
    		props: {
    		action: true,
    		href: "#/Math",
    		$$slots: { default: [create_default_slot_11] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	var listgroupitem1 = new ListGroupItem({
    		props: {
    		action: true,
    		href: "#/Electro",
    		$$slots: { default: [create_default_slot_10] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	var listgroupitem2 = new ListGroupItem({
    		props: {
    		action: true,
    		href: "#/Physics",
    		$$slots: { default: [create_default_slot_9] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	const block = {
    		c: function create() {
    			listgroupitem0.$$.fragment.c();
    			t0 = space();
    			listgroupitem1.$$.fragment.c();
    			t1 = space();
    			listgroupitem2.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			mount_component(listgroupitem0, target, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(listgroupitem1, target, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(listgroupitem2, target, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var listgroupitem0_changes = {};
    			if (changed.$$scope) listgroupitem0_changes.$$scope = { changed, ctx };
    			listgroupitem0.$set(listgroupitem0_changes);

    			var listgroupitem1_changes = {};
    			if (changed.$$scope) listgroupitem1_changes.$$scope = { changed, ctx };
    			listgroupitem1.$set(listgroupitem1_changes);

    			var listgroupitem2_changes = {};
    			if (changed.$$scope) listgroupitem2_changes.$$scope = { changed, ctx };
    			listgroupitem2.$set(listgroupitem2_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(listgroupitem0.$$.fragment, local);

    			transition_in(listgroupitem1.$$.fragment, local);

    			transition_in(listgroupitem2.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(listgroupitem0.$$.fragment, local);
    			transition_out(listgroupitem1.$$.fragment, local);
    			transition_out(listgroupitem2.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(listgroupitem0, detaching);

    			if (detaching) {
    				detach_dev(t0);
    			}

    			destroy_component(listgroupitem1, detaching);

    			if (detaching) {
    				detach_dev(t1);
    			}

    			destroy_component(listgroupitem2, detaching);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_default_slot_8.name, type: "slot", source: "(61:16) <ListGroup class=\"border rounded shadow-lg\">", ctx });
    	return block;
    }

    // (60:12) <Col xs="8">
    function create_default_slot_7(ctx) {
    	var current;

    	var listgroup = new ListGroup({
    		props: {
    		class: "border rounded shadow-lg",
    		$$slots: { default: [create_default_slot_8] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	const block = {
    		c: function create() {
    			listgroup.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			mount_component(listgroup, target, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var listgroup_changes = {};
    			if (changed.$$scope) listgroup_changes.$$scope = { changed, ctx };
    			listgroup.$set(listgroup_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(listgroup.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(listgroup.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(listgroup, detaching);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_default_slot_7.name, type: "slot", source: "(60:12) <Col xs=\"8\">", ctx });
    	return block;
    }

    // (59:8) <Row class="justify-content-center p-4">
    function create_default_slot_6(ctx) {
    	var current;

    	var col = new Col({
    		props: {
    		xs: "8",
    		$$slots: { default: [create_default_slot_7] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	const block = {
    		c: function create() {
    			col.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			mount_component(col, target, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var col_changes = {};
    			if (changed.$$scope) col_changes.$$scope = { changed, ctx };
    			col.$set(col_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(col.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(col.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(col, detaching);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_default_slot_6.name, type: "slot", source: "(59:8) <Row class=\"justify-content-center p-4\">", ctx });
    	return block;
    }

    // (70:16) <Button outline color="dark" class="align-self-start order-1" href="#/news">
    function create_default_slot_5(ctx) {
    	var t;

    	const block = {
    		c: function create() {
    			t = text("Changelog");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(t);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_default_slot_5.name, type: "slot", source: "(70:16) <Button outline color=\"dark\" class=\"align-self-start order-1\" href=\"/news\">", ctx });
    	return block;
    }

    // (71:16) <Button outline color="dark" class="align-self-end order-2" href="#/settings">
    function create_default_slot_4(ctx) {
    	var i;

    	const block = {
    		c: function create() {
    			i = element("i");
    			attr_dev(i, "class", "fa fa-gear");
    			add_location(i, file$b, 70, 94, 2388);
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, i, anchor);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(i);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_default_slot_4.name, type: "slot", source: "(71:16) <Button outline color=\"dark\" class=\"align-self-end order-2\" href=\"/settings\">", ctx });
    	return block;
    }

    // (69:12) <Col class="d-inline-flex justify-content-between align-items-start">
    function create_default_slot_3(ctx) {
    	var t, current;

    	var button0 = new Button({
    		props: {
    		outline: true,
    		color: "dark",
    		class: "align-self-start order-1",
    		href: "#/news",
    		$$slots: { default: [create_default_slot_5] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	var button1 = new Button({
    		props: {
    		outline: true,
    		color: "dark",
    		class: "align-self-end order-2",
    		href: "#/settings",
    		$$slots: { default: [create_default_slot_4] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	const block = {
    		c: function create() {
    			button0.$$.fragment.c();
    			t = space();
    			button1.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			mount_component(button0, target, anchor);
    			insert_dev(target, t, anchor);
    			mount_component(button1, target, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var button0_changes = {};
    			if (changed.$$scope) button0_changes.$$scope = { changed, ctx };
    			button0.$set(button0_changes);

    			var button1_changes = {};
    			if (changed.$$scope) button1_changes.$$scope = { changed, ctx };
    			button1.$set(button1_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(button0.$$.fragment, local);

    			transition_in(button1.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(button0.$$.fragment, local);
    			transition_out(button1.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(button0, detaching);

    			if (detaching) {
    				detach_dev(t);
    			}

    			destroy_component(button1, detaching);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_default_slot_3.name, type: "slot", source: "(69:12) <Col class=\"d-inline-flex justify-content-between align-items-start\">", ctx });
    	return block;
    }

    // (68:8) <Row class="fixed-bottom p-3">
    function create_default_slot_2(ctx) {
    	var current;

    	var col = new Col({
    		props: {
    		class: "d-inline-flex justify-content-between align-items-start",
    		$$slots: { default: [create_default_slot_3] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	const block = {
    		c: function create() {
    			col.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			mount_component(col, target, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var col_changes = {};
    			if (changed.$$scope) col_changes.$$scope = { changed, ctx };
    			col.$set(col_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(col.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(col.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(col, detaching);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_default_slot_2.name, type: "slot", source: "(68:8) <Row class=\"fixed-bottom p-3\">", ctx });
    	return block;
    }

    // (51:4) <Container fluid class="text-center h-100">
    function create_default_slot_1(ctx) {
    	var t0, t1, current;

    	var row0 = new Row({
    		props: {
    		class: "p-5",
    		$$slots: { default: [create_default_slot_12] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	var row1 = new Row({
    		props: {
    		class: "justify-content-center p-4",
    		$$slots: { default: [create_default_slot_6] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	var row2 = new Row({
    		props: {
    		class: "fixed-bottom p-3",
    		$$slots: { default: [create_default_slot_2] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	const block = {
    		c: function create() {
    			row0.$$.fragment.c();
    			t0 = space();
    			row1.$$.fragment.c();
    			t1 = space();
    			row2.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			mount_component(row0, target, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(row1, target, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(row2, target, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var row0_changes = {};
    			if (changed.$$scope || changed.flutterLogoCanvas) row0_changes.$$scope = { changed, ctx };
    			row0.$set(row0_changes);

    			var row1_changes = {};
    			if (changed.$$scope) row1_changes.$$scope = { changed, ctx };
    			row1.$set(row1_changes);

    			var row2_changes = {};
    			if (changed.$$scope) row2_changes.$$scope = { changed, ctx };
    			row2.$set(row2_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(row0.$$.fragment, local);

    			transition_in(row1.$$.fragment, local);

    			transition_in(row2.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(row0.$$.fragment, local);
    			transition_out(row1.$$.fragment, local);
    			transition_out(row2.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(row0, detaching);

    			if (detaching) {
    				detach_dev(t0);
    			}

    			destroy_component(row1, detaching);

    			if (detaching) {
    				detach_dev(t1);
    			}

    			destroy_component(row2, detaching);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_default_slot_1.name, type: "slot", source: "(51:4) <Container fluid class=\"text-center h-100\">", ctx });
    	return block;
    }

    // (50:0) <Unselectable>
    function create_default_slot(ctx) {
    	var current;

    	var container = new Container({
    		props: {
    		fluid: true,
    		class: "text-center h-100",
    		$$slots: { default: [create_default_slot_1] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	const block = {
    		c: function create() {
    			container.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			mount_component(container, target, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var container_changes = {};
    			if (changed.$$scope || changed.flutterLogoCanvas) container_changes.$$scope = { changed, ctx };
    			container.$set(container_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(container.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(container.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(container, detaching);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_default_slot.name, type: "slot", source: "(50:0) <Unselectable>", ctx });
    	return block;
    }

    function create_fragment$c(ctx) {
    	var current;

    	var unselectable = new Unselectable({
    		props: {
    		$$slots: { default: [create_default_slot] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	const block = {
    		c: function create() {
    			unselectable.$$.fragment.c();
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			mount_component(unselectable, target, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var unselectable_changes = {};
    			if (changed.$$scope || changed.flutterLogoCanvas) unselectable_changes.$$scope = { changed, ctx };
    			unselectable.$set(unselectable_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(unselectable.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(unselectable.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(unselectable, detaching);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$c.name, type: "component", source: "", ctx });
    	return block;
    }

    function instance$c($$self, $$props, $$invalidate) {
    	
        //import Flare from '@2dimensions/flare-js'

        let flutterLogoCanvas;
        let flutterLogo;
        onMount(() => {
            //console.log(Flare);
            /*
            flutterLogo = new Flare.Graphics(flutterLogoCanvas,()=>{
                window.requestAnimationFrame();
                Flare.ActorLoader.load("./assets/animations/SCLogo.flr", function (error) {
                    if (error) {
                        console.log("failed to load actor file...", error);
                    }
                });
                Flare.Actor.initialize();
            });

             */
            /*
            flutterLogo = new Flare.Graphics(flutterLogoCanvas,()=>{
                window.requestAnimationFrame();
            });
            let actor = new Flare.Actor();
            flutterLogo.load("./assets/animations/SCLogo.flr", function (error) {
                if (error) {
                    console.log("failed to load actor file...", error);
                }
            });
            Flare.Actor.initialize();

             */

        });

    	function canvas_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			$$invalidate('flutterLogoCanvas', flutterLogoCanvas = $$value);
    		});
    	}

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ('flutterLogoCanvas' in $$props) $$invalidate('flutterLogoCanvas', flutterLogoCanvas = $$props.flutterLogoCanvas);
    		if ('flutterLogo' in $$props) flutterLogo = $$props.flutterLogo;
    	};

    	return { flutterLogoCanvas, canvas_binding };
    }

    class Menu extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$c, create_fragment$c, safe_not_equal, []);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "Menu", options, id: create_fragment$c.name });
    	}
    }

    /* src/routes/Settings.svelte generated by Svelte v3.12.1 */

    const file$c = "src/routes/Settings.svelte";

    // (14:12) <Col>
    function create_default_slot_8$1(ctx) {
    	var h2, t_1, h6;

    	const block = {
    		c: function create() {
    			h2 = element("h2");
    			h2.textContent = "Settings";
    			t_1 = space();
    			h6 = element("h6");
    			h6.textContent = "Tool that solves questionable science problems";
    			add_location(h2, file$c, 14, 16, 308);
    			add_location(h6, file$c, 15, 16, 342);
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, h2, anchor);
    			insert_dev(target, t_1, anchor);
    			insert_dev(target, h6, anchor);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(h2);
    				detach_dev(t_1);
    				detach_dev(h6);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_default_slot_8$1.name, type: "slot", source: "(14:12) <Col>", ctx });
    	return block;
    }

    // (13:8) <Row class="p-5">
    function create_default_slot_7$1(ctx) {
    	var current;

    	var col = new Col({
    		props: {
    		$$slots: { default: [create_default_slot_8$1] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	const block = {
    		c: function create() {
    			col.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			mount_component(col, target, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var col_changes = {};
    			if (changed.$$scope) col_changes.$$scope = { changed, ctx };
    			col.$set(col_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(col.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(col.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(col, detaching);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_default_slot_7$1.name, type: "slot", source: "(13:8) <Row class=\"p-5\">", ctx });
    	return block;
    }

    // (20:12) <Col xs="8">
    function create_default_slot_6$1(ctx) {
    	const block = {
    		c: noop,
    		m: noop,
    		d: noop
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_default_slot_6$1.name, type: "slot", source: "(20:12) <Col xs=\"8\">", ctx });
    	return block;
    }

    // (19:8) <Row class="justify-content-center p-4">
    function create_default_slot_5$1(ctx) {
    	var current;

    	var col = new Col({
    		props: {
    		xs: "8",
    		$$slots: { default: [create_default_slot_6$1] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	const block = {
    		c: function create() {
    			col.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			mount_component(col, target, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var col_changes = {};
    			if (changed.$$scope) col_changes.$$scope = { changed, ctx };
    			col.$set(col_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(col.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(col.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(col, detaching);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_default_slot_5$1.name, type: "slot", source: "(19:8) <Row class=\"justify-content-center p-4\">", ctx });
    	return block;
    }

    // (25:16) <Button outline color="dark" class="align-self-start order-1" href="#/">
    function create_default_slot_4$1(ctx) {
    	var t;

    	const block = {
    		c: function create() {
    			t = text("Back");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(t);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_default_slot_4$1.name, type: "slot", source: "(25:16) <Button outline color=\"dark\" class=\"align-self-start order-1\" href=\"/\">", ctx });
    	return block;
    }

    // (24:12) <Col class="d-inline-flex justify-content-between align-items-start">
    function create_default_slot_3$1(ctx) {
    	var current;

    	var button = new Button({
    		props: {
    		outline: true,
    		color: "dark",
    		class: "align-self-start order-1",
    		href: "#/",
    		$$slots: { default: [create_default_slot_4$1] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	const block = {
    		c: function create() {
    			button.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			mount_component(button, target, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var button_changes = {};
    			if (changed.$$scope) button_changes.$$scope = { changed, ctx };
    			button.$set(button_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(button.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(button.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(button, detaching);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_default_slot_3$1.name, type: "slot", source: "(24:12) <Col class=\"d-inline-flex justify-content-between align-items-start\">", ctx });
    	return block;
    }

    // (23:8) <Row class="fixed-bottom p-3">
    function create_default_slot_2$1(ctx) {
    	var current;

    	var col = new Col({
    		props: {
    		class: "d-inline-flex justify-content-between align-items-start",
    		$$slots: { default: [create_default_slot_3$1] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	const block = {
    		c: function create() {
    			col.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			mount_component(col, target, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var col_changes = {};
    			if (changed.$$scope) col_changes.$$scope = { changed, ctx };
    			col.$set(col_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(col.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(col.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(col, detaching);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_default_slot_2$1.name, type: "slot", source: "(23:8) <Row class=\"fixed-bottom p-3\">", ctx });
    	return block;
    }

    // (12:4) <Container fluid class="text-center h-100">
    function create_default_slot_1$1(ctx) {
    	var t0, t1, current;

    	var row0 = new Row({
    		props: {
    		class: "p-5",
    		$$slots: { default: [create_default_slot_7$1] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	var row1 = new Row({
    		props: {
    		class: "justify-content-center p-4",
    		$$slots: { default: [create_default_slot_5$1] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	var row2 = new Row({
    		props: {
    		class: "fixed-bottom p-3",
    		$$slots: { default: [create_default_slot_2$1] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	const block = {
    		c: function create() {
    			row0.$$.fragment.c();
    			t0 = space();
    			row1.$$.fragment.c();
    			t1 = space();
    			row2.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			mount_component(row0, target, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(row1, target, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(row2, target, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var row0_changes = {};
    			if (changed.$$scope) row0_changes.$$scope = { changed, ctx };
    			row0.$set(row0_changes);

    			var row1_changes = {};
    			if (changed.$$scope) row1_changes.$$scope = { changed, ctx };
    			row1.$set(row1_changes);

    			var row2_changes = {};
    			if (changed.$$scope) row2_changes.$$scope = { changed, ctx };
    			row2.$set(row2_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(row0.$$.fragment, local);

    			transition_in(row1.$$.fragment, local);

    			transition_in(row2.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(row0.$$.fragment, local);
    			transition_out(row1.$$.fragment, local);
    			transition_out(row2.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(row0, detaching);

    			if (detaching) {
    				detach_dev(t0);
    			}

    			destroy_component(row1, detaching);

    			if (detaching) {
    				detach_dev(t1);
    			}

    			destroy_component(row2, detaching);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_default_slot_1$1.name, type: "slot", source: "(12:4) <Container fluid class=\"text-center h-100\">", ctx });
    	return block;
    }

    // (11:0) <Unselectable>
    function create_default_slot$1(ctx) {
    	var current;

    	var container = new Container({
    		props: {
    		fluid: true,
    		class: "text-center h-100",
    		$$slots: { default: [create_default_slot_1$1] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	const block = {
    		c: function create() {
    			container.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			mount_component(container, target, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var container_changes = {};
    			if (changed.$$scope) container_changes.$$scope = { changed, ctx };
    			container.$set(container_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(container.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(container.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(container, detaching);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_default_slot$1.name, type: "slot", source: "(11:0) <Unselectable>", ctx });
    	return block;
    }

    function create_fragment$d(ctx) {
    	var current;

    	var unselectable = new Unselectable({
    		props: {
    		$$slots: { default: [create_default_slot$1] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	const block = {
    		c: function create() {
    			unselectable.$$.fragment.c();
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			mount_component(unselectable, target, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var unselectable_changes = {};
    			if (changed.$$scope) unselectable_changes.$$scope = { changed, ctx };
    			unselectable.$set(unselectable_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(unselectable.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(unselectable.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(unselectable, detaching);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$d.name, type: "component", source: "", ctx });
    	return block;
    }

    class Settings extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, null, create_fragment$d, safe_not_equal, []);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "Settings", options, id: create_fragment$d.name });
    	}
    }

    /* src/routes/News/News.svelte generated by Svelte v3.12.1 */

    const file$d = "src/routes/News/News.svelte";

    // (12:8) <Col>
    function create_default_slot_9$1(ctx) {
    	var h2, t_1, h6;

    	const block = {
    		c: function create() {
    			h2 = element("h2");
    			h2.textContent = "SmartCalc 0.3.0";
    			t_1 = space();
    			h6 = element("h6");
    			h6.textContent = "News";
    			add_location(h2, file$d, 12, 12, 223);
    			add_location(h6, file$d, 13, 12, 260);
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, h2, anchor);
    			insert_dev(target, t_1, anchor);
    			insert_dev(target, h6, anchor);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(h2);
    				detach_dev(t_1);
    				detach_dev(h6);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_default_slot_9$1.name, type: "slot", source: "(12:8) <Col>", ctx });
    	return block;
    }

    // (11:4) <Row class="p-5">
    function create_default_slot_8$2(ctx) {
    	var current;

    	var col = new Col({
    		props: {
    		$$slots: { default: [create_default_slot_9$1] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	const block = {
    		c: function create() {
    			col.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			mount_component(col, target, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var col_changes = {};
    			if (changed.$$scope) col_changes.$$scope = { changed, ctx };
    			col.$set(col_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(col.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(col.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(col, detaching);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_default_slot_8$2.name, type: "slot", source: "(11:4) <Row class=\"p-5\">", ctx });
    	return block;
    }

    // (20:16) <Col>
    function create_default_slot_7$2(ctx) {
    	const block = {
    		c: noop,
    		m: noop,
    		d: noop
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_default_slot_7$2.name, type: "slot", source: "(20:16) <Col>", ctx });
    	return block;
    }

    // (19:12) <Row>
    function create_default_slot_6$2(ctx) {
    	var current;

    	var col = new Col({
    		props: {
    		$$slots: { default: [create_default_slot_7$2] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	const block = {
    		c: function create() {
    			col.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			mount_component(col, target, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var col_changes = {};
    			if (changed.$$scope) col_changes.$$scope = { changed, ctx };
    			col.$set(col_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(col.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(col.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(col, detaching);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_default_slot_6$2.name, type: "slot", source: "(19:12) <Row>", ctx });
    	return block;
    }

    // (18:8) <Col xs="8">
    function create_default_slot_5$2(ctx) {
    	var current;

    	var row = new Row({
    		props: {
    		$$slots: { default: [create_default_slot_6$2] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	const block = {
    		c: function create() {
    			row.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			mount_component(row, target, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var row_changes = {};
    			if (changed.$$scope) row_changes.$$scope = { changed, ctx };
    			row.$set(row_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(row.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(row.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(row, detaching);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_default_slot_5$2.name, type: "slot", source: "(18:8) <Col xs=\"8\">", ctx });
    	return block;
    }

    // (17:4) <Row class="justify-content-center p-4">
    function create_default_slot_4$2(ctx) {
    	var current;

    	var col = new Col({
    		props: {
    		xs: "8",
    		$$slots: { default: [create_default_slot_5$2] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	const block = {
    		c: function create() {
    			col.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			mount_component(col, target, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var col_changes = {};
    			if (changed.$$scope) col_changes.$$scope = { changed, ctx };
    			col.$set(col_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(col.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(col.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(col, detaching);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_default_slot_4$2.name, type: "slot", source: "(17:4) <Row class=\"justify-content-center p-4\">", ctx });
    	return block;
    }

    // (28:12) <Button outline color="dark" class="align-self-start order-1" href="#/">
    function create_default_slot_3$2(ctx) {
    	var t;

    	const block = {
    		c: function create() {
    			t = text("Back");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(t);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_default_slot_3$2.name, type: "slot", source: "(28:12) <Button outline color=\"dark\" class=\"align-self-start order-1\" href=\"/\">", ctx });
    	return block;
    }

    // (27:8) <Col class="d-inline-flex justify-content-between align-items-start">
    function create_default_slot_2$2(ctx) {
    	var current;

    	var button = new Button({
    		props: {
    		outline: true,
    		color: "dark",
    		class: "align-self-start order-1",
    		href: "#/",
    		$$slots: { default: [create_default_slot_3$2] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	const block = {
    		c: function create() {
    			button.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			mount_component(button, target, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var button_changes = {};
    			if (changed.$$scope) button_changes.$$scope = { changed, ctx };
    			button.$set(button_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(button.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(button.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(button, detaching);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_default_slot_2$2.name, type: "slot", source: "(27:8) <Col class=\"d-inline-flex justify-content-between align-items-start\">", ctx });
    	return block;
    }

    // (26:4) <Row class="fixed-bottom p-3">
    function create_default_slot_1$2(ctx) {
    	var current;

    	var col = new Col({
    		props: {
    		class: "d-inline-flex justify-content-between align-items-start",
    		$$slots: { default: [create_default_slot_2$2] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	const block = {
    		c: function create() {
    			col.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			mount_component(col, target, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var col_changes = {};
    			if (changed.$$scope) col_changes.$$scope = { changed, ctx };
    			col.$set(col_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(col.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(col.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(col, detaching);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_default_slot_1$2.name, type: "slot", source: "(26:4) <Row class=\"fixed-bottom p-3\">", ctx });
    	return block;
    }

    // (10:0) <Container fluid class="text-center h-100">
    function create_default_slot$2(ctx) {
    	var t0, t1, current;

    	var row0 = new Row({
    		props: {
    		class: "p-5",
    		$$slots: { default: [create_default_slot_8$2] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	var row1 = new Row({
    		props: {
    		class: "justify-content-center p-4",
    		$$slots: { default: [create_default_slot_4$2] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	var row2 = new Row({
    		props: {
    		class: "fixed-bottom p-3",
    		$$slots: { default: [create_default_slot_1$2] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	const block = {
    		c: function create() {
    			row0.$$.fragment.c();
    			t0 = space();
    			row1.$$.fragment.c();
    			t1 = space();
    			row2.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			mount_component(row0, target, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(row1, target, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(row2, target, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var row0_changes = {};
    			if (changed.$$scope) row0_changes.$$scope = { changed, ctx };
    			row0.$set(row0_changes);

    			var row1_changes = {};
    			if (changed.$$scope) row1_changes.$$scope = { changed, ctx };
    			row1.$set(row1_changes);

    			var row2_changes = {};
    			if (changed.$$scope) row2_changes.$$scope = { changed, ctx };
    			row2.$set(row2_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(row0.$$.fragment, local);

    			transition_in(row1.$$.fragment, local);

    			transition_in(row2.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(row0.$$.fragment, local);
    			transition_out(row1.$$.fragment, local);
    			transition_out(row2.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(row0, detaching);

    			if (detaching) {
    				detach_dev(t0);
    			}

    			destroy_component(row1, detaching);

    			if (detaching) {
    				detach_dev(t1);
    			}

    			destroy_component(row2, detaching);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_default_slot$2.name, type: "slot", source: "(10:0) <Container fluid class=\"text-center h-100\">", ctx });
    	return block;
    }

    function create_fragment$e(ctx) {
    	var current;

    	var container = new Container({
    		props: {
    		fluid: true,
    		class: "text-center h-100",
    		$$slots: { default: [create_default_slot$2] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	const block = {
    		c: function create() {
    			container.$$.fragment.c();
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			mount_component(container, target, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var container_changes = {};
    			if (changed.$$scope) container_changes.$$scope = { changed, ctx };
    			container.$set(container_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(container.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(container.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(container, detaching);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$e.name, type: "component", source: "", ctx });
    	return block;
    }

    class News extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, null, create_fragment$e, safe_not_equal, []);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "News", options, id: create_fragment$e.name });
    	}
    }

    /* src/routes/Math/modes/Main.svelte generated by Svelte v3.12.1 */

    const file$e = "src/routes/Math/modes/Main.svelte";

    // (11:8) <Col>
    function create_default_slot_2$3(ctx) {
    	var h1, t_1, p;

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "Welcome in math mode";
    			t_1 = space();
    			p = element("p");
    			p.textContent = "Select from different modes as needed";
    			add_location(h1, file$e, 11, 12, 159);
    			add_location(p, file$e, 14, 12, 231);
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    			insert_dev(target, t_1, anchor);
    			insert_dev(target, p, anchor);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(h1);
    				detach_dev(t_1);
    				detach_dev(p);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_default_slot_2$3.name, type: "slot", source: "(11:8) <Col>", ctx });
    	return block;
    }

    // (10:4) <Row>
    function create_default_slot_1$3(ctx) {
    	var current;

    	var col = new Col({
    		props: {
    		$$slots: { default: [create_default_slot_2$3] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	const block = {
    		c: function create() {
    			col.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			mount_component(col, target, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var col_changes = {};
    			if (changed.$$scope) col_changes.$$scope = { changed, ctx };
    			col.$set(col_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(col.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(col.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(col, detaching);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_default_slot_1$3.name, type: "slot", source: "(10:4) <Row>", ctx });
    	return block;
    }

    // (9:0) <Container>
    function create_default_slot$3(ctx) {
    	var current;

    	var row = new Row({
    		props: {
    		$$slots: { default: [create_default_slot_1$3] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	const block = {
    		c: function create() {
    			row.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			mount_component(row, target, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var row_changes = {};
    			if (changed.$$scope) row_changes.$$scope = { changed, ctx };
    			row.$set(row_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(row.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(row.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(row, detaching);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_default_slot$3.name, type: "slot", source: "(9:0) <Container>", ctx });
    	return block;
    }

    function create_fragment$f(ctx) {
    	var current;

    	var container = new Container({
    		props: {
    		$$slots: { default: [create_default_slot$3] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	const block = {
    		c: function create() {
    			container.$$.fragment.c();
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			mount_component(container, target, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var container_changes = {};
    			if (changed.$$scope) container_changes.$$scope = { changed, ctx };
    			container.$set(container_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(container.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(container.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(container, detaching);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$f.name, type: "component", source: "", ctx });
    	return block;
    }

    class Main extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, null, create_fragment$f, safe_not_equal, []);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "Main", options, id: create_fragment$f.name });
    	}
    }

    /* src/routes/Math/modes/Smart.svelte generated by Svelte v3.12.1 */

    function create_fragment$g(ctx) {
    	var current;

    	var input = new Input({
    		props: { label: "Type your math problem" },
    		$$inline: true
    	});

    	const block = {
    		c: function create() {
    			input.$$.fragment.c();
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			mount_component(input, target, anchor);
    			current = true;
    		},

    		p: noop,

    		i: function intro(local) {
    			if (current) return;
    			transition_in(input.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(input.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(input, detaching);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$g.name, type: "component", source: "", ctx });
    	return block;
    }

    class Smart extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, null, create_fragment$g, safe_not_equal, []);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "Smart", options, id: create_fragment$g.name });
    	}
    }

    /* src/routes/Math/modes/Functions.svelte generated by Svelte v3.12.1 */

    function create_fragment$h(ctx) {
    	var t;

    	const block = {
    		c: function create() {
    			t = text("Func");
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},

    		p: noop,
    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(t);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$h.name, type: "component", source: "", ctx });
    	return block;
    }

    class Functions extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, null, create_fragment$h, safe_not_equal, []);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "Functions", options, id: create_fragment$h.name });
    	}
    }

    /* src/routes/Math/modes/PlusMinus.svelte generated by Svelte v3.12.1 */

    function create_fragment$i(ctx) {
    	var t;

    	const block = {
    		c: function create() {
    			t = text("+ -");
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},

    		p: noop,
    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(t);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$i.name, type: "component", source: "", ctx });
    	return block;
    }

    class PlusMinus extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, null, create_fragment$i, safe_not_equal, []);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "PlusMinus", options, id: create_fragment$i.name });
    	}
    }

    /* src/routes/Math/modes/TimesDivide.svelte generated by Svelte v3.12.1 */

    function create_fragment$j(ctx) {
    	const block = {
    		c: noop,

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: noop,
    		p: noop,
    		i: noop,
    		o: noop,
    		d: noop
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$j.name, type: "component", source: "", ctx });
    	return block;
    }

    class TimesDivide extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, null, create_fragment$j, safe_not_equal, []);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "TimesDivide", options, id: create_fragment$j.name });
    	}
    }

    /* src/routes/Math/modes/PowerRoot.svelte generated by Svelte v3.12.1 */

    function create_fragment$k(ctx) {
    	const block = {
    		c: noop,

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: noop,
    		p: noop,
    		i: noop,
    		o: noop,
    		d: noop
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$k.name, type: "component", source: "", ctx });
    	return block;
    }

    class PowerRoot extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, null, create_fragment$k, safe_not_equal, []);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "PowerRoot", options, id: create_fragment$k.name });
    	}
    }

    /* src/routes/Math/Math.svelte generated by Svelte v3.12.1 */

    const file$f = "src/routes/Math/Math.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.item = list[i];
    	return child_ctx;
    }

    // (46:20) <NavItem>
    function create_default_slot_9$2(ctx) {
    	var h2, a;

    	const block = {
    		c: function create() {
    			h2 = element("h2");
    			a = element("a");
    			a.textContent = "Math";
    			attr_dev(a, "class", "text-secondary text-decoration-none");
    			attr_dev(a, "href", "#/Math");
    			add_location(a, file$f, 47, 28, 1427);
    			add_location(h2, file$f, 46, 24, 1394);
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, h2, anchor);
    			append_dev(h2, a);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(h2);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_default_slot_9$2.name, type: "slot", source: "(46:20) <NavItem>", ctx });
    	return block;
    }

    // (55:28) <NavLink class="btn-outline-dark m-1" href="{item.to}">
    function create_default_slot_8$3(ctx) {
    	var t_value = ctx.item.text + "", t;

    	const block = {
    		c: function create() {
    			t = text(t_value);
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},

    		p: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(t);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_default_slot_8$3.name, type: "slot", source: "(55:28) <NavLink class=\"btn-outline-dark m-1\" href=\"{item.to}\">", ctx });
    	return block;
    }

    // (54:24) <NavItem>
    function create_default_slot_7$3(ctx) {
    	var t, current;

    	var navlink = new NavLink({
    		props: {
    		class: "btn-outline-dark m-1",
    		href: ctx.item.to,
    		$$slots: { default: [create_default_slot_8$3] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	const block = {
    		c: function create() {
    			navlink.$$.fragment.c();
    			t = space();
    		},

    		m: function mount(target, anchor) {
    			mount_component(navlink, target, anchor);
    			insert_dev(target, t, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var navlink_changes = {};
    			if (changed.$$scope) navlink_changes.$$scope = { changed, ctx };
    			navlink.$set(navlink_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(navlink.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(navlink.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(navlink, detaching);

    			if (detaching) {
    				detach_dev(t);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_default_slot_7$3.name, type: "slot", source: "(54:24) <NavItem>", ctx });
    	return block;
    }

    // (53:20) {#each menu as item}
    function create_each_block(ctx) {
    	var current;

    	var navitem = new NavItem({
    		props: {
    		$$slots: { default: [create_default_slot_7$3] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	const block = {
    		c: function create() {
    			navitem.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			mount_component(navitem, target, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var navitem_changes = {};
    			if (changed.$$scope) navitem_changes.$$scope = { changed, ctx };
    			navitem.$set(navitem_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(navitem.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(navitem.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(navitem, detaching);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_each_block.name, type: "each", source: "(53:20) {#each menu as item}", ctx });
    	return block;
    }

    // (45:16) <Nav vertical class="text-secondary m-1">
    function create_default_slot_6$3(ctx) {
    	var t, each_1_anchor, current;

    	var navitem = new NavItem({
    		props: {
    		$$slots: { default: [create_default_slot_9$2] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	let each_value = ctx.menu;

    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			navitem.$$.fragment.c();
    			t = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},

    		m: function mount(target, anchor) {
    			mount_component(navitem, target, anchor);
    			insert_dev(target, t, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var navitem_changes = {};
    			if (changed.$$scope) navitem_changes.$$scope = { changed, ctx };
    			navitem.$set(navitem_changes);

    			if (changed.menu) {
    				each_value = ctx.menu;

    				let i;
    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(changed, child_ctx);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				group_outros();
    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}
    				check_outros();
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(navitem.$$.fragment, local);

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(navitem.$$.fragment, local);

    			each_blocks = each_blocks.filter(Boolean);
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(navitem, detaching);

    			if (detaching) {
    				detach_dev(t);
    			}

    			destroy_each(each_blocks, detaching);

    			if (detaching) {
    				detach_dev(each_1_anchor);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_default_slot_6$3.name, type: "slot", source: "(45:16) <Nav vertical class=\"text-secondary m-1\">", ctx });
    	return block;
    }

    // (61:16) <Button outline color="dark" href="#/" class="m-1 mt-auto">
    function create_default_slot_5$3(ctx) {
    	var t;

    	const block = {
    		c: function create() {
    			t = text("Back");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(t);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_default_slot_5$3.name, type: "slot", source: "(61:16) <Button outline color=\"dark\" href=\"/\" class=\"m-1 mt-auto\">", ctx });
    	return block;
    }

    // (44:12) <Col xs="auto" md="auto" class="h-100 bg-light d-flex flex-column shadow-lg">
    function create_default_slot_4$3(ctx) {
    	var t, current;

    	var nav = new Nav({
    		props: {
    		vertical: true,
    		class: "text-secondary m-1",
    		$$slots: { default: [create_default_slot_6$3] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	var button = new Button({
    		props: {
    		outline: true,
    		color: "dark",
    		href: "#/",
    		class: "m-1 mt-auto",
    		$$slots: { default: [create_default_slot_5$3] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	const block = {
    		c: function create() {
    			nav.$$.fragment.c();
    			t = space();
    			button.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			mount_component(nav, target, anchor);
    			insert_dev(target, t, anchor);
    			mount_component(button, target, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var nav_changes = {};
    			if (changed.$$scope) nav_changes.$$scope = { changed, ctx };
    			nav.$set(nav_changes);

    			var button_changes = {};
    			if (changed.$$scope) button_changes.$$scope = { changed, ctx };
    			button.$set(button_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(nav.$$.fragment, local);

    			transition_in(button.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(nav.$$.fragment, local);
    			transition_out(button.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(nav, detaching);

    			if (detaching) {
    				detach_dev(t);
    			}

    			destroy_component(button, detaching);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_default_slot_4$3.name, type: "slot", source: "(44:12) <Col xs=\"auto\" md=\"auto\" class=\"h-100 bg-light d-flex flex-column shadow-lg\">", ctx });
    	return block;
    }

    // (43:8) <Unselectable>
    function create_default_slot_3$3(ctx) {
    	var current;

    	var col = new Col({
    		props: {
    		xs: "auto",
    		md: "auto",
    		class: "h-100 bg-light d-flex flex-column shadow-lg",
    		$$slots: { default: [create_default_slot_4$3] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	const block = {
    		c: function create() {
    			col.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			mount_component(col, target, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var col_changes = {};
    			if (changed.$$scope) col_changes.$$scope = { changed, ctx };
    			col.$set(col_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(col.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(col.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(col, detaching);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_default_slot_3$3.name, type: "slot", source: "(43:8) <Unselectable>", ctx });
    	return block;
    }

    // (66:8) <Col xs="auto">
    function create_default_slot_2$4(ctx) {
    	var section, current;

    	var router = new Router({
    		props: {
    		prefix: prefix,
    		routes: ctx.routes
    	},
    		$$inline: true
    	});

    	const block = {
    		c: function create() {
    			section = element("section");
    			router.$$.fragment.c();
    			attr_dev(section, "class", "w-auto");
    			add_location(section, file$f, 66, 12, 2154);
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, section, anchor);
    			mount_component(router, section, null);
    			current = true;
    		},

    		p: noop,

    		i: function intro(local) {
    			if (current) return;
    			transition_in(router.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(router.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(section);
    			}

    			destroy_component(router);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_default_slot_2$4.name, type: "slot", source: "(66:8) <Col xs=\"auto\">", ctx });
    	return block;
    }

    // (42:4) <Row class="h-100">
    function create_default_slot_1$4(ctx) {
    	var t, current;

    	var unselectable = new Unselectable({
    		props: {
    		$$slots: { default: [create_default_slot_3$3] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	var col = new Col({
    		props: {
    		xs: "auto",
    		$$slots: { default: [create_default_slot_2$4] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	const block = {
    		c: function create() {
    			unselectable.$$.fragment.c();
    			t = space();
    			col.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			mount_component(unselectable, target, anchor);
    			insert_dev(target, t, anchor);
    			mount_component(col, target, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var unselectable_changes = {};
    			if (changed.$$scope) unselectable_changes.$$scope = { changed, ctx };
    			unselectable.$set(unselectable_changes);

    			var col_changes = {};
    			if (changed.$$scope) col_changes.$$scope = { changed, ctx };
    			col.$set(col_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(unselectable.$$.fragment, local);

    			transition_in(col.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(unselectable.$$.fragment, local);
    			transition_out(col.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(unselectable, detaching);

    			if (detaching) {
    				detach_dev(t);
    			}

    			destroy_component(col, detaching);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_default_slot_1$4.name, type: "slot", source: "(42:4) <Row class=\"h-100\">", ctx });
    	return block;
    }

    // (41:0) <Container fluid class="h-100">
    function create_default_slot$4(ctx) {
    	var current;

    	var row = new Row({
    		props: {
    		class: "h-100",
    		$$slots: { default: [create_default_slot_1$4] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	const block = {
    		c: function create() {
    			row.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			mount_component(row, target, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var row_changes = {};
    			if (changed.$$scope) row_changes.$$scope = { changed, ctx };
    			row.$set(row_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(row.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(row.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(row, detaching);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_default_slot$4.name, type: "slot", source: "(41:0) <Container fluid class=\"h-100\">", ctx });
    	return block;
    }

    function create_fragment$l(ctx) {
    	var current;

    	var container = new Container({
    		props: {
    		fluid: true,
    		class: "h-100",
    		$$slots: { default: [create_default_slot$4] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	const block = {
    		c: function create() {
    			container.$$.fragment.c();
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			mount_component(container, target, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var container_changes = {};
    			if (changed.$$scope) container_changes.$$scope = { changed, ctx };
    			container.$set(container_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(container.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(container.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(container, detaching);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$l.name, type: "component", source: "", ctx });
    	return block;
    }

    const prefix = '/math';

    function instance$d($$self) {
    	

        const menu = [
            {to: "#/math/Smart", text: 'Smart mode'},
            {to: "#/math/FNC", text: 'Functions'},
            {to: "#/math/PM", text: '+ -'},
            {to: "#/math/TD", text: '* /'},
            {to: "#/math/PR", text: 'Power & root'},
        ];
        const routes = {
            '/Smart': Smart,
            '/FNC': Functions,
            '/PM': PlusMinus,
            '/TD': TimesDivide,
            '/PR': PowerRoot,
            '/*': Main,
        };

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {};

    	return { menu, routes };
    }

    class Math extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$d, create_fragment$l, safe_not_equal, []);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "Math", options, id: create_fragment$l.name });
    	}
    }

    /* src/routes/Electro/modes/Main.svelte generated by Svelte v3.12.1 */

    const file$g = "src/routes/Electro/modes/Main.svelte";

    // (11:8) <Col>
    function create_default_slot_2$5(ctx) {
    	var h1, t_1, p;

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "Welcome in math electro";
    			t_1 = space();
    			p = element("p");
    			p.textContent = "Select from different modes as needed";
    			add_location(h1, file$g, 11, 12, 151);
    			add_location(p, file$g, 14, 12, 226);
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    			insert_dev(target, t_1, anchor);
    			insert_dev(target, p, anchor);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(h1);
    				detach_dev(t_1);
    				detach_dev(p);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_default_slot_2$5.name, type: "slot", source: "(11:8) <Col>", ctx });
    	return block;
    }

    // (10:4) <Row>
    function create_default_slot_1$5(ctx) {
    	var current;

    	var col = new Col({
    		props: {
    		$$slots: { default: [create_default_slot_2$5] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	const block = {
    		c: function create() {
    			col.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			mount_component(col, target, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var col_changes = {};
    			if (changed.$$scope) col_changes.$$scope = { changed, ctx };
    			col.$set(col_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(col.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(col.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(col, detaching);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_default_slot_1$5.name, type: "slot", source: "(10:4) <Row>", ctx });
    	return block;
    }

    // (9:0) <Container>
    function create_default_slot$5(ctx) {
    	var current;

    	var row = new Row({
    		props: {
    		$$slots: { default: [create_default_slot_1$5] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	const block = {
    		c: function create() {
    			row.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			mount_component(row, target, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var row_changes = {};
    			if (changed.$$scope) row_changes.$$scope = { changed, ctx };
    			row.$set(row_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(row.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(row.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(row, detaching);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_default_slot$5.name, type: "slot", source: "(9:0) <Container>", ctx });
    	return block;
    }

    function create_fragment$m(ctx) {
    	var current;

    	var container = new Container({
    		props: {
    		$$slots: { default: [create_default_slot$5] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	const block = {
    		c: function create() {
    			container.$$.fragment.c();
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			mount_component(container, target, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var container_changes = {};
    			if (changed.$$scope) container_changes.$$scope = { changed, ctx };
    			container.$set(container_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(container.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(container.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(container, detaching);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$m.name, type: "component", source: "", ctx });
    	return block;
    }

    class Main$1 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, null, create_fragment$m, safe_not_equal, []);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "Main", options, id: create_fragment$m.name });
    	}
    }

    /* src/routes/Electro/modes/OhmsLaw.svelte generated by Svelte v3.12.1 */

    function create_fragment$n(ctx) {
    	const block = {
    		c: noop,

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: noop,
    		p: noop,
    		i: noop,
    		o: noop,
    		d: noop
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$n.name, type: "component", source: "", ctx });
    	return block;
    }

    class OhmsLaw extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, null, create_fragment$n, safe_not_equal, []);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "OhmsLaw", options, id: create_fragment$n.name });
    	}
    }

    /* src/routes/Electro/modes/Components.svelte generated by Svelte v3.12.1 */

    function create_fragment$o(ctx) {
    	const block = {
    		c: noop,

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: noop,
    		p: noop,
    		i: noop,
    		o: noop,
    		d: noop
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$o.name, type: "component", source: "", ctx });
    	return block;
    }

    class Components extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, null, create_fragment$o, safe_not_equal, []);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "Components", options, id: create_fragment$o.name });
    	}
    }

    /* src/routes/Electro/modes/MagneticField.svelte generated by Svelte v3.12.1 */

    function create_fragment$p(ctx) {
    	const block = {
    		c: noop,

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: noop,
    		p: noop,
    		i: noop,
    		o: noop,
    		d: noop
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$p.name, type: "component", source: "", ctx });
    	return block;
    }

    class MagneticField extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, null, create_fragment$p, safe_not_equal, []);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "MagneticField", options, id: create_fragment$p.name });
    	}
    }

    /* src/routes/Electro/modes/InductionLaw.svelte generated by Svelte v3.12.1 */

    function create_fragment$q(ctx) {
    	const block = {
    		c: noop,

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: noop,
    		p: noop,
    		i: noop,
    		o: noop,
    		d: noop
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$q.name, type: "component", source: "", ctx });
    	return block;
    }

    class InductionLaw extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, null, create_fragment$q, safe_not_equal, []);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "InductionLaw", options, id: create_fragment$q.name });
    	}
    }

    /* src/routes/Electro/modes/RLC.svelte generated by Svelte v3.12.1 */

    function create_fragment$r(ctx) {
    	const block = {
    		c: noop,

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: noop,
    		p: noop,
    		i: noop,
    		o: noop,
    		d: noop
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$r.name, type: "component", source: "", ctx });
    	return block;
    }

    class RLC extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, null, create_fragment$r, safe_not_equal, []);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "RLC", options, id: create_fragment$r.name });
    	}
    }

    /* src/routes/Electro/Electro.svelte generated by Svelte v3.12.1 */

    const file$h = "src/routes/Electro/Electro.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.item = list[i];
    	return child_ctx;
    }

    // (48:20) <NavItem>
    function create_default_slot_12$1(ctx) {
    	var h2, a;

    	const block = {
    		c: function create() {
    			h2 = element("h2");
    			a = element("a");
    			a.textContent = "Electro";
    			attr_dev(a, "class", "text-secondary text-decoration-none");
    			attr_dev(a, "href", "#/Math");
    			add_location(a, file$h, 49, 28, 1507);
    			add_location(h2, file$h, 48, 24, 1474);
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, h2, anchor);
    			append_dev(h2, a);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(h2);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_default_slot_12$1.name, type: "slot", source: "(48:20) <NavItem>", ctx });
    	return block;
    }

    // (68:53) 
    function create_if_block_2$2(ctx) {
    	var current;

    	var navitem = new NavItem({
    		props: {
    		$$slots: { default: [create_default_slot_11$1] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	const block = {
    		c: function create() {
    			navitem.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			mount_component(navitem, target, anchor);
    			current = true;
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(navitem.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(navitem.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(navitem, detaching);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_if_block_2$2.name, type: "if", source: "(68:53) ", ctx });
    	return block;
    }

    // (62:65) 
    function create_if_block_1$3(ctx) {
    	var current;

    	var navitem = new NavItem({
    		props: {
    		$$slots: { default: [create_default_slot_10$1] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	const block = {
    		c: function create() {
    			navitem.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			mount_component(navitem, target, anchor);
    			current = true;
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(navitem.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(navitem.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(navitem, detaching);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_if_block_1$3.name, type: "if", source: "(62:65) ", ctx });
    	return block;
    }

    // (56:24) {#if item.text === "Ohm's law"}
    function create_if_block$3(ctx) {
    	var current;

    	var navitem = new NavItem({
    		props: {
    		$$slots: { default: [create_default_slot_9$3] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	const block = {
    		c: function create() {
    			navitem.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			mount_component(navitem, target, anchor);
    			current = true;
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(navitem.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(navitem.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(navitem, detaching);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_if_block$3.name, type: "if", source: "(56:24) {#if item.text === \"Ohm's law\"}", ctx });
    	return block;
    }

    // (69:28) <NavItem>
    function create_default_slot_11$1(ctx) {
    	var h5;

    	const block = {
    		c: function create() {
    			h5 = element("h5");
    			h5.textContent = "AC";
    			add_location(h5, file$h, 69, 32, 2375);
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, h5, anchor);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(h5);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_default_slot_11$1.name, type: "slot", source: "(69:28) <NavItem>", ctx });
    	return block;
    }

    // (63:28) <NavItem>
    function create_default_slot_10$1(ctx) {
    	var h5;

    	const block = {
    		c: function create() {
    			h5 = element("h5");
    			h5.textContent = "DC";
    			add_location(h5, file$h, 63, 32, 2130);
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, h5, anchor);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(h5);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_default_slot_10$1.name, type: "slot", source: "(63:28) <NavItem>", ctx });
    	return block;
    }

    // (57:28) <NavItem>
    function create_default_slot_9$3(ctx) {
    	var h5;

    	const block = {
    		c: function create() {
    			h5 = element("h5");
    			h5.textContent = "Basic";
    			add_location(h5, file$h, 57, 32, 1870);
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, h5, anchor);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(h5);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_default_slot_9$3.name, type: "slot", source: "(57:28) <NavItem>", ctx });
    	return block;
    }

    // (76:28) <NavLink class="btn-outline-dark m-1" href="{item.to}">
    function create_default_slot_8$4(ctx) {
    	var t_value = ctx.item.text + "", t;

    	const block = {
    		c: function create() {
    			t = text(t_value);
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},

    		p: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(t);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_default_slot_8$4.name, type: "slot", source: "(76:28) <NavLink class=\"btn-outline-dark m-1\" href=\"{item.to}\">", ctx });
    	return block;
    }

    // (75:24) <NavItem>
    function create_default_slot_7$4(ctx) {
    	var t, current;

    	var navlink = new NavLink({
    		props: {
    		class: "btn-outline-dark m-1",
    		href: ctx.item.to,
    		$$slots: { default: [create_default_slot_8$4] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	const block = {
    		c: function create() {
    			navlink.$$.fragment.c();
    			t = space();
    		},

    		m: function mount(target, anchor) {
    			mount_component(navlink, target, anchor);
    			insert_dev(target, t, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var navlink_changes = {};
    			if (changed.$$scope) navlink_changes.$$scope = { changed, ctx };
    			navlink.$set(navlink_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(navlink.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(navlink.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(navlink, detaching);

    			if (detaching) {
    				detach_dev(t);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_default_slot_7$4.name, type: "slot", source: "(75:24) <NavItem>", ctx });
    	return block;
    }

    // (55:20) {#each menu as item}
    function create_each_block$1(ctx) {
    	var current_block_type_index, if_block, t, current;

    	var if_block_creators = [
    		create_if_block$3,
    		create_if_block_1$3,
    		create_if_block_2$2
    	];

    	var if_blocks = [];

    	function select_block_type(changed, ctx) {
    		if (ctx.item.text === "Ohm's law") return 0;
    		if (ctx.item.text === 'Magnetic field') return 1;
    		if (ctx.item.text === 'AC') return 2;
    		return -1;
    	}

    	if (~(current_block_type_index = select_block_type(null, ctx))) {
    		if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	}

    	var navitem = new NavItem({
    		props: {
    		$$slots: { default: [create_default_slot_7$4] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			t = space();
    			navitem.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			if (~current_block_type_index) if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, t, anchor);
    			mount_component(navitem, target, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var navitem_changes = {};
    			if (changed.$$scope) navitem_changes.$$scope = { changed, ctx };
    			navitem.$set(navitem_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);

    			transition_in(navitem.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(if_block);
    			transition_out(navitem.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (~current_block_type_index) if_blocks[current_block_type_index].d(detaching);

    			if (detaching) {
    				detach_dev(t);
    			}

    			destroy_component(navitem, detaching);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_each_block$1.name, type: "each", source: "(55:20) {#each menu as item}", ctx });
    	return block;
    }

    // (47:16) <Nav vertical class="text-secondary m-1">
    function create_default_slot_6$4(ctx) {
    	var t, each_1_anchor, current;

    	var navitem = new NavItem({
    		props: {
    		$$slots: { default: [create_default_slot_12$1] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	let each_value = ctx.menu;

    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			navitem.$$.fragment.c();
    			t = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},

    		m: function mount(target, anchor) {
    			mount_component(navitem, target, anchor);
    			insert_dev(target, t, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var navitem_changes = {};
    			if (changed.$$scope) navitem_changes.$$scope = { changed, ctx };
    			navitem.$set(navitem_changes);

    			if (changed.menu) {
    				each_value = ctx.menu;

    				let i;
    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(changed, child_ctx);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				group_outros();
    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}
    				check_outros();
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(navitem.$$.fragment, local);

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(navitem.$$.fragment, local);

    			each_blocks = each_blocks.filter(Boolean);
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(navitem, detaching);

    			if (detaching) {
    				detach_dev(t);
    			}

    			destroy_each(each_blocks, detaching);

    			if (detaching) {
    				detach_dev(each_1_anchor);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_default_slot_6$4.name, type: "slot", source: "(47:16) <Nav vertical class=\"text-secondary m-1\">", ctx });
    	return block;
    }

    // (82:16) <Button outline color="dark" href="#/" class="m-1 mt-auto">
    function create_default_slot_5$4(ctx) {
    	var t;

    	const block = {
    		c: function create() {
    			t = text("Back");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(t);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_default_slot_5$4.name, type: "slot", source: "(82:16) <Button outline color=\"dark\" href=\"/\" class=\"m-1 mt-auto\">", ctx });
    	return block;
    }

    // (46:12) <Col xs="auto" md="auto" class="h-100 bg-light d-flex flex-column shadow-lg">
    function create_default_slot_4$4(ctx) {
    	var t, current;

    	var nav = new Nav({
    		props: {
    		vertical: true,
    		class: "text-secondary m-1",
    		$$slots: { default: [create_default_slot_6$4] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	var button = new Button({
    		props: {
    		outline: true,
    		color: "dark",
    		href: "#/",
    		class: "m-1 mt-auto",
    		$$slots: { default: [create_default_slot_5$4] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	const block = {
    		c: function create() {
    			nav.$$.fragment.c();
    			t = space();
    			button.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			mount_component(nav, target, anchor);
    			insert_dev(target, t, anchor);
    			mount_component(button, target, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var nav_changes = {};
    			if (changed.$$scope) nav_changes.$$scope = { changed, ctx };
    			nav.$set(nav_changes);

    			var button_changes = {};
    			if (changed.$$scope) button_changes.$$scope = { changed, ctx };
    			button.$set(button_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(nav.$$.fragment, local);

    			transition_in(button.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(nav.$$.fragment, local);
    			transition_out(button.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(nav, detaching);

    			if (detaching) {
    				detach_dev(t);
    			}

    			destroy_component(button, detaching);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_default_slot_4$4.name, type: "slot", source: "(46:12) <Col xs=\"auto\" md=\"auto\" class=\"h-100 bg-light d-flex flex-column shadow-lg\">", ctx });
    	return block;
    }

    // (45:8) <Unselectable>
    function create_default_slot_3$4(ctx) {
    	var current;

    	var col = new Col({
    		props: {
    		xs: "auto",
    		md: "auto",
    		class: "h-100 bg-light d-flex flex-column shadow-lg",
    		$$slots: { default: [create_default_slot_4$4] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	const block = {
    		c: function create() {
    			col.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			mount_component(col, target, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var col_changes = {};
    			if (changed.$$scope) col_changes.$$scope = { changed, ctx };
    			col.$set(col_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(col.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(col.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(col, detaching);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_default_slot_3$4.name, type: "slot", source: "(45:8) <Unselectable>", ctx });
    	return block;
    }

    // (87:8) <Col xs="auto">
    function create_default_slot_2$6(ctx) {
    	var section, current;

    	var router = new Router({
    		props: {
    		prefix: prefix$1,
    		routes: ctx.routes
    	},
    		$$inline: true
    	});

    	const block = {
    		c: function create() {
    			section = element("section");
    			router.$$.fragment.c();
    			attr_dev(section, "class", "w-auto");
    			add_location(section, file$h, 87, 12, 3019);
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, section, anchor);
    			mount_component(router, section, null);
    			current = true;
    		},

    		p: noop,

    		i: function intro(local) {
    			if (current) return;
    			transition_in(router.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(router.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(section);
    			}

    			destroy_component(router);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_default_slot_2$6.name, type: "slot", source: "(87:8) <Col xs=\"auto\">", ctx });
    	return block;
    }

    // (44:4) <Row class="h-100">
    function create_default_slot_1$6(ctx) {
    	var t, current;

    	var unselectable = new Unselectable({
    		props: {
    		$$slots: { default: [create_default_slot_3$4] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	var col = new Col({
    		props: {
    		xs: "auto",
    		$$slots: { default: [create_default_slot_2$6] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	const block = {
    		c: function create() {
    			unselectable.$$.fragment.c();
    			t = space();
    			col.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			mount_component(unselectable, target, anchor);
    			insert_dev(target, t, anchor);
    			mount_component(col, target, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var unselectable_changes = {};
    			if (changed.$$scope) unselectable_changes.$$scope = { changed, ctx };
    			unselectable.$set(unselectable_changes);

    			var col_changes = {};
    			if (changed.$$scope) col_changes.$$scope = { changed, ctx };
    			col.$set(col_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(unselectable.$$.fragment, local);

    			transition_in(col.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(unselectable.$$.fragment, local);
    			transition_out(col.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(unselectable, detaching);

    			if (detaching) {
    				detach_dev(t);
    			}

    			destroy_component(col, detaching);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_default_slot_1$6.name, type: "slot", source: "(44:4) <Row class=\"h-100\">", ctx });
    	return block;
    }

    // (43:0) <Container fluid class="h-100">
    function create_default_slot$6(ctx) {
    	var current;

    	var row = new Row({
    		props: {
    		class: "h-100",
    		$$slots: { default: [create_default_slot_1$6] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	const block = {
    		c: function create() {
    			row.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			mount_component(row, target, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var row_changes = {};
    			if (changed.$$scope) row_changes.$$scope = { changed, ctx };
    			row.$set(row_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(row.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(row.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(row, detaching);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_default_slot$6.name, type: "slot", source: "(43:0) <Container fluid class=\"h-100\">", ctx });
    	return block;
    }

    function create_fragment$s(ctx) {
    	var current;

    	var container = new Container({
    		props: {
    		fluid: true,
    		class: "h-100",
    		$$slots: { default: [create_default_slot$6] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	const block = {
    		c: function create() {
    			container.$$.fragment.c();
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			mount_component(container, target, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var container_changes = {};
    			if (changed.$$scope) container_changes.$$scope = { changed, ctx };
    			container.$set(container_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(container.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(container.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(container, detaching);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$s.name, type: "component", source: "", ctx });
    	return block;
    }

    const prefix$1 = '/math';

    function instance$e($$self) {
    	

        const menu = [
            {to: "#/electro/OHML", text: "Ohm's law"},
            {to: "#/electro/CMPT", text: 'Electro components'},
            {to: "#/electro/MGNF", text: 'Magnetic field'},
            {to: "#/electro/INDL", text: 'Induction law'},
            {to: "#/electro/AC", text: 'AC'},
            {to: "#/electro/RLCC", text: 'RLC circuits'},
        ];
        const routes = {
            '/OHML': OhmsLaw,
            '/CMPT': Components,
            '/MGNF': MagneticField,
            '/INDL': InductionLaw,
            '/RLCC': RLC,
            '/*': Main$1,
        };

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {};

    	return { menu, routes };
    }

    class Electro extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$e, create_fragment$s, safe_not_equal, []);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "Electro", options, id: create_fragment$s.name });
    	}
    }

    /* src/routes/Physics/Physics.svelte generated by Svelte v3.12.1 */

    const file$i = "src/routes/Physics/Physics.svelte";

    // (15:16) <Unselectable>
    function create_default_slot_7$5(ctx) {
    	var h1, t_1, h2;

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "Work In Progress";
    			t_1 = space();
    			h2 = element("h2");
    			h2.textContent = "Coming soon";
    			add_location(h1, file$i, 15, 20, 408);
    			attr_dev(h2, "class", "mb-5");
    			add_location(h2, file$i, 18, 20, 500);
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    			insert_dev(target, t_1, anchor);
    			insert_dev(target, h2, anchor);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(h1);
    				detach_dev(t_1);
    				detach_dev(h2);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_default_slot_7$5.name, type: "slot", source: "(15:16) <Unselectable>", ctx });
    	return block;
    }

    // (13:8) <Col class="h-100 d-flex flex-column justify-content-center">
    function create_default_slot_6$5(ctx) {
    	var div, current;

    	var unselectable = new Unselectable({
    		props: {
    		$$slots: { default: [create_default_slot_7$5] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	const block = {
    		c: function create() {
    			div = element("div");
    			unselectable.$$.fragment.c();
    			attr_dev(div, "class", "pb-5");
    			add_location(div, file$i, 13, 12, 338);
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(unselectable, div, null);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var unselectable_changes = {};
    			if (changed.$$scope) unselectable_changes.$$scope = { changed, ctx };
    			unselectable.$set(unselectable_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(unselectable.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(unselectable.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(div);
    			}

    			destroy_component(unselectable);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_default_slot_6$5.name, type: "slot", source: "(13:8) <Col class=\"h-100 d-flex flex-column justify-content-center\">", ctx });
    	return block;
    }

    // (12:4) <Row class="h-100">
    function create_default_slot_5$5(ctx) {
    	var current;

    	var col = new Col({
    		props: {
    		class: "h-100 d-flex flex-column justify-content-center",
    		$$slots: { default: [create_default_slot_6$5] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	const block = {
    		c: function create() {
    			col.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			mount_component(col, target, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var col_changes = {};
    			if (changed.$$scope) col_changes.$$scope = { changed, ctx };
    			col.$set(col_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(col.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(col.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(col, detaching);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_default_slot_5$5.name, type: "slot", source: "(12:4) <Row class=\"h-100\">", ctx });
    	return block;
    }

    // (29:16) <Button outline color="dark" class="align-self-start order-1" href="#/">
    function create_default_slot_4$5(ctx) {
    	var t;

    	const block = {
    		c: function create() {
    			t = text("Back");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(t);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_default_slot_4$5.name, type: "slot", source: "(29:16) <Button outline color=\"dark\" class=\"align-self-start order-1\" href=\"/\">", ctx });
    	return block;
    }

    // (28:12) <Unselectable>
    function create_default_slot_3$5(ctx) {
    	var current;

    	var button = new Button({
    		props: {
    		outline: true,
    		color: "dark",
    		class: "align-self-start order-1",
    		href: "#/",
    		$$slots: { default: [create_default_slot_4$5] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	const block = {
    		c: function create() {
    			button.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			mount_component(button, target, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var button_changes = {};
    			if (changed.$$scope) button_changes.$$scope = { changed, ctx };
    			button.$set(button_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(button.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(button.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(button, detaching);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_default_slot_3$5.name, type: "slot", source: "(28:12) <Unselectable>", ctx });
    	return block;
    }

    // (27:8) <Col class="d-inline-flex justify-content-between align-items-start">
    function create_default_slot_2$7(ctx) {
    	var current;

    	var unselectable = new Unselectable({
    		props: {
    		$$slots: { default: [create_default_slot_3$5] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	const block = {
    		c: function create() {
    			unselectable.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			mount_component(unselectable, target, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var unselectable_changes = {};
    			if (changed.$$scope) unselectable_changes.$$scope = { changed, ctx };
    			unselectable.$set(unselectable_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(unselectable.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(unselectable.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(unselectable, detaching);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_default_slot_2$7.name, type: "slot", source: "(27:8) <Col class=\"d-inline-flex justify-content-between align-items-start\">", ctx });
    	return block;
    }

    // (26:4) <Row class="fixed-bottom p-3">
    function create_default_slot_1$7(ctx) {
    	var current;

    	var col = new Col({
    		props: {
    		class: "d-inline-flex justify-content-between align-items-start",
    		$$slots: { default: [create_default_slot_2$7] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	const block = {
    		c: function create() {
    			col.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			mount_component(col, target, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var col_changes = {};
    			if (changed.$$scope) col_changes.$$scope = { changed, ctx };
    			col.$set(col_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(col.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(col.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(col, detaching);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_default_slot_1$7.name, type: "slot", source: "(26:4) <Row class=\"fixed-bottom p-3\">", ctx });
    	return block;
    }

    // (11:0) <Container fluid class="text-center h-100">
    function create_default_slot$7(ctx) {
    	var t, current;

    	var row0 = new Row({
    		props: {
    		class: "h-100",
    		$$slots: { default: [create_default_slot_5$5] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	var row1 = new Row({
    		props: {
    		class: "fixed-bottom p-3",
    		$$slots: { default: [create_default_slot_1$7] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	const block = {
    		c: function create() {
    			row0.$$.fragment.c();
    			t = space();
    			row1.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			mount_component(row0, target, anchor);
    			insert_dev(target, t, anchor);
    			mount_component(row1, target, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var row0_changes = {};
    			if (changed.$$scope) row0_changes.$$scope = { changed, ctx };
    			row0.$set(row0_changes);

    			var row1_changes = {};
    			if (changed.$$scope) row1_changes.$$scope = { changed, ctx };
    			row1.$set(row1_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(row0.$$.fragment, local);

    			transition_in(row1.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(row0.$$.fragment, local);
    			transition_out(row1.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(row0, detaching);

    			if (detaching) {
    				detach_dev(t);
    			}

    			destroy_component(row1, detaching);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_default_slot$7.name, type: "slot", source: "(11:0) <Container fluid class=\"text-center h-100\">", ctx });
    	return block;
    }

    function create_fragment$t(ctx) {
    	var current;

    	var container = new Container({
    		props: {
    		fluid: true,
    		class: "text-center h-100",
    		$$slots: { default: [create_default_slot$7] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	const block = {
    		c: function create() {
    			container.$$.fragment.c();
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			mount_component(container, target, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var container_changes = {};
    			if (changed.$$scope) container_changes.$$scope = { changed, ctx };
    			container.$set(container_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(container.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(container.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(container, detaching);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$t.name, type: "component", source: "", ctx });
    	return block;
    }

    class Physics extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, null, create_fragment$t, safe_not_equal, []);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "Physics", options, id: create_fragment$t.name });
    	}
    }

    /* src/App.svelte generated by Svelte v3.12.1 */

    function create_fragment$u(ctx) {
    	var current;

    	var router = new Router({
    		props: { routes: ctx.routes },
    		$$inline: true
    	});

    	const block = {
    		c: function create() {
    			router.$$.fragment.c();
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			mount_component(router, target, anchor);
    			current = true;
    		},

    		p: noop,

    		i: function intro(local) {
    			if (current) return;
    			transition_in(router.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(router.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(router, detaching);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$u.name, type: "component", source: "", ctx });
    	return block;
    }

    function instance$f($$self) {
    	

        const routes = {
            '/': Menu,
            '/news': News,
            '/settings':Settings,
            '/math': Math,
            '/math/*': Math,
            '/electro': Electro,
            '/electro/*': Electro,
            '/physics': Physics,
            '/physics/*': Physics,
        };

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {};

    	return { routes };
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$f, create_fragment$u, safe_not_equal, []);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "App", options, id: create_fragment$u.name });
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    	}
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
