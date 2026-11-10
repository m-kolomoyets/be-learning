import NodeEventEmitter from 'node:events';

type SignUpPayload = {
    email: string;
    nickname: string;
};

type EventListenerFunction = (...args: any[]) => void;
type EventListenerMap = Map<string, EventListenerFunction[]>;
class CustomEventEmitter {
    private listeners: EventListenerMap = new Map<string, EventListenerFunction[]>();

    on(eventName: string, listener: EventListenerFunction) {
        if (!this.listeners.has(eventName)) {
            this.listeners.set(eventName, [listener]);
            return;
        }

        this.listeners.get(eventName)?.push(listener);

        return () => {
            this.off(eventName, listener);
        };
    }

    once(eventName: string, listener: EventListenerFunction) {
        const cb: EventListenerFunction = (...args) => {
            listener(...args);
            this.off(eventName, cb);
        };

        this.on(eventName, cb);
    }

    off(eventName: string, listenerToRemove?: EventListenerFunction) {
        if (!this.listeners.has(eventName)) {
            throw new Error('Invalid event name: no listeners');
        }

        if (!listenerToRemove) {
            this.listeners.delete(eventName);
            return;
        }

        const filteredListeners =
            this.listeners.get(eventName)?.filter((listener) => {
                return listener != listenerToRemove;
            }) ?? [];

        if (!filteredListeners.length) {
            this.listeners.delete(eventName);
            return;
        }

        this.listeners.set(eventName, filteredListeners);
    }

    emit(eventName: string, ...payload: any[]) {
        if (!this.listeners.has(eventName)) {
            throw new Error('Invalid event name: no listeners');
        }

        const events = this.listeners.get(eventName);

        events?.forEach((listener) => {
            listener(payload);
        });
    }
}

const appEvents = new NodeEventEmitter();
const customAppEvents = new CustomEventEmitter();

appEvents.on('user:signup', (payload: SignUpPayload) => {
    console.log('user sign up triggered', payload);
});
customAppEvents.on('user:signup', (payload: SignUpPayload) => {
    console.log('user sign up triggered', payload);
});

const signUp = () => {
    const user: SignUpPayload = {
        email: 'hello@gmail.com',
        nickname: 'hello',
    };

    console.log('user sign up started');

    appEvents.emit('user:signup', user);
    customAppEvents.emit('user:signup', user);
};

signUp();
