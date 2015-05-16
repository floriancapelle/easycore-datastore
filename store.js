/**
 * Sandbox Setter/Getter store extension
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
    easyCore.register('store', 'extension', function( core, settings, moreParams ) {
        /** @type {object} - sandbox mediator, shorthand */
        var sandboxMediator = moreParams.sandboxMediator;
        /** @type {object} - core settings, shorthand */
        var coreSettings = moreParams.coreSettings;

        /** @type {object} - store pool */
        var stores = {};

        /**
         * Add a new module type 'store'.
         *
         * We can rely on storeId and creator being a string and a function
         * as they are already checked in the core.register function.
         *
         * @param storeId
         * @param creator
         * @returns void
         */
        core.moduleTypeMap.store = function( storeId, creator ) {
            if ( stores[storeId] ) {
                this.trigger('error', 'register-store', 'Given id exists already: ' + storeId);
                return;
            }

            stores[storeId] = new creator(core, coreSettings.stores[storeId]);
        };

        core.Sandbox.prototype.setData = function( key, value ) {
            var store;

            if ( !key ) {
                core.trigger('error', 'setData', 'faulty key');
                return false;
            }
            if ( arguments.length === 1 ) {
                core.trigger('error', 'setData', 'missing "value" argument (key: ' + key + ')');
                return false;
            }

            try {
                for ( store in stores ) {
                    if ( stores[store].set(key, value) === true ) {
                        sandboxMediator.trigger('setData', key, value);
                        sandboxMediator.trigger('setData:' + key + ':store', value);
                    }
                }
                return true;
            } catch ( err ) {
                core.trigger('error', 'setData', err.toString());
                return false;
            }
        };

        core.Sandbox.prototype.getData = function( key ) {
            var store,
                data;

            if ( !key ) {
                core.trigger('error', 'getData', 'faulty key');
            }

            try {
                for ( store in stores ) {
                    data = stores[store].get(key);
                    if ( data ) return data;
                }
            } catch ( err ) {
                core.trigger('error', 'setData', err.toString());
            }
        };

    });
}));