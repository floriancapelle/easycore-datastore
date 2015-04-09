/**
 * Sandbox Setter/Getter data store extension
 * Simple setting and getting of data cross-module
 *
 * Tip: use private variables in the modules as well, get the value once and just subscribe for updates.
 */
// AMD, Node, or browser global
(function( root, factory ) {
    if ( typeof define === 'function' && define.amd ) {
        // AMD. Register as an anonymous module.
        define(['easycore'], factory);
    } else if ( typeof exports === 'object' ) {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.
        module.exports = factory(require('easycore'));
    } else {
        // Browser globals (root is window)
        factory(root.easyCore);
    }
}(this, function( easyCore ) {
    easyCore.registerExtension('datastore', function( core, extensionSettings ) {
        /**
         * Default configuration
         * @namespace
         * @property {object} defaults
         * @property {object} defaults.exposeData - add the data variable to the sandbox prototype - NOT RECOMMENDED FOR PRODUCTION
         * @property {object} defaults.constants - default constants, will be added to data pool on init, cannot be overwritten
         */
        var defaults = {
            exposeData: false,
            constants: {}
        };

        /**
         * DataStore api
         *
         * @param {object} [settings] - DataStore settings
         */
        var DataStore = function( settings ) {
            var self = this;
            /** @type {object} - merged conf */
            var conf = core.extend(true, {}, defaults, settings);

            /** @type {object} - data pool */
            var data = {};

            /** @type {object} - get access to the sandbox mediator */
            var sandboxMediator = new core.Mediator({channelId: 'sandbox'});

            /** @type {string[]} - keys marked as constant */
            var constants = [];

            // add the default constants to the data pool and mark them
            for ( var defaultConstant in conf.constants ) {
                data[defaultConstant] = conf.constants[defaultConstant];
                constants.push(defaultConstant);
            }

            // set data
            // and trigger an event with name and value to publish the data update
            this.set = function( name, value, options ) {
                options = options || {};

                if ( !name ) {
                    core.trigger('error', 'dataStore.set', 'faulty name argument');
                    return;
                }
                if ( arguments.length === 1 ) {
                    core.trigger('error', 'dataStore.set', 'missing "value" argument (name: ' + name + ')');
                    return;
                }

                if ( constants.indexOf(name) != -1 ) {
                    core.trigger('error', 'dataStore.set', 'cannot override, name marked as constant (name: ' + name + ')');
                    return;
                }
                if ( options.constant === true ) {
                    constants.push(name);
                }

                data[name] = value;
                sandboxMediator.trigger('set:dataStore', name, value);
                sandboxMediator.trigger('set:' + name + ':dataStore', value);
            };

            // get data
            // and trigger an event with name to publish the data retrieval
            // (mainly for monitoring and debugging purposes).
            this.get = function( name ) {
                if ( !name ) {
                    core.trigger('error', 'dataStore.get', 'faulty name argument');
                    return;
                }

                sandboxMediator.trigger('get:dataStore', name);

                return data[name];
            };

            // remove data
            // and trigger an event with name to publish the data removal
            this.remove = function( name ) {
                if ( !name ) {
                    core.trigger('error', 'dataStore.remove', 'faulty name argument');
                    return;
                }

                if ( constants.indexOf(name) != -1 ) {
                    core.trigger('error', 'dataStore.remove', 'cannot remove, name marked as constant (name: ' + name + ')');
                    return;
                }

                data[name] = null;
                sandboxMediator.trigger('remove:dataStore', name);
                sandboxMediator.trigger('remove:' + name + ':dataStore');
            };

            if ( conf.exposeData === true ) {
                this.data = data;
            }
        };

        // Provide the constructor to create more stores if required.
        // Also prepare a single instance for immediate fun
        core.extend(core.Sandbox.prototype, {
            DataStore: DataStore,
            dataStore: new DataStore(extensionSettings)
        });

    });
}));