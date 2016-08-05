import { ConstellationSocket, SocketOptions } from './socket';

export class Carina {
    /**
     * Set the websocket implementation.
     * You will likely not need to set this in a browser environment.
     * You will not need to set this if WebSocket is globally available.
     * 
     * @example 
     * Carina.WebSocket = require('ws');
     */
    public static set WebSocket(ws: any) {
        ConstellationSocket.WebSocket = ws;
    }

    public static get WebSocket() {
        return ConstellationSocket.WebSocket;
    }

    /**
     * Set the Promise implementation.
     * You will not need to set this if Promise is globally available.
     * 
     * @example 
     * Carina.Promise = require('bluebird');
     */
    public static set Promise(promise: any) {
        ConstellationSocket.Promise = promise;
    }

    public static get Promise() {
        return ConstellationSocket.Promise;
    }

    public socket;

    private waiting: StringMap<Promise<any>> = {};

    constructor(options: SocketOptions = {}) {
        this.socket = new ConstellationSocket(options);
    }

    /**
     * @callback onSubscriptionCb
     * @param {Object} data - The payload for the update.
     */

    /**
     * Subscribe to a live event
     * 
     * @param {string} slug
     * @param {onSubscriptionCb} cb - Called each time we receive an event for this slug.
     * @returns {Promise.<>} Resolves once subscribed. Any errors will reject.
     */
    public subscribe(slug: string, cb: (data: StringMap<any>) => void): Promise<any> {
        this.socket.on(`event:live`, data => {
            if (data.channel === slug) {
                cb(data.payload);
            }
        });

        return this
        .waitFor(`subscription:${slug}`, () => {
            return this.socket.execute('livesubscribe', { events: [slug] });
        })
        .catch(err => {
            this.stopWaiting(`subscription:${slug}`);
            throw err;
        });
    }

    /**
     * Unsubscribe from a live event.
     * 
     * @param {string} slug
     * @returns {Promise.<>} Resolves once unsubscribed. Any errors will reject.
     */
    public unsubscribe(slug: string) {
        this.stopWaiting(`subscription:${slug}`);
        return this.socket.execute('liveunsubscribe', { events: [slug] });
    }

    private waitFor<T>(identifier: string, cb?: () => Promise<T>): Promise<T> {
        if (this.waiting[identifier]) {
            return this.waiting[identifier];
        }

        return this.waiting[identifier] = cb();
    }

    private stopWaiting(identifier: string) {
        delete this.waiting[identifier];
    }
}
