/**
 * Simple helper for creating html elements
 *
 * @template {keyof HTMLElementTagNameMap} T
 * @param {T} tag
 * @param {string | HTMLElementTagNameMap[T] | null} [classNameOrProperties]
 * @param {Array<HTMLElement[] | HTMLElement>} [children]
 * @returns {HTMLElementTagNameMap[T]}
 */
export const h = (tag, classNameOrProperties, ...children) => {
    const el = document.createElement(tag);
    const props =
        typeof classNameOrProperties === 'string'
            ? { className: classNameOrProperties }
            : classNameOrProperties;
    if (props) {
        Object.assign(el, props);
    }
    el.append(...children.flat());
    return el;
};

/**
 * @typedef Component
 * @property {() => void} destroy
 * @property {() => HTMLElement} render
 * @property {(children: Array<HTMLElement | Component>) => void} append
 */

const kEl = Symbol('el');

function isComponent(obj) {
    return obj && kEl in obj;
}

function append(parent, children) {
    console.warn('Not tested');
    const nodes = children.map((ch) => (isComponent(ch) ? ch.el : ch));
    parent.append(...nodes);
}

/**
 * @template {any} T
 * @param {(props: T, ctx: { useDestroy(cb: () => void) })} fn
 * @returns {(props: T) => Component}
 */
export const component = (fn) => (props) => {
    let el = null;
    let children = [];
    let destroyCallback = null;

    const ctx = {
        useDestroy(cb) {
            if (destroyCallback) {
                throw new Error('Multiple destroy hooks are not supported');
            }
            destroyCallback = cb;
        },
    };

    return {
        /** @private */
        get [kEl]() {
            return el;
        },

        render() {
            if (el) {
                throw new Error('Rendering twice is not supported');
            }
            el = fn(props, ctx);
            if (children.length) {
                append(el, children);
            }
            return el;
        },

        destroy() {
            children.forEach((ch) => {
                if (isComponent(ch)) {
                    ch.destroy();
                }
            });

            if (destroyCallback) {
                destroyCallback();
            }

            if (el) {
                el.remove();
            }
        },

        append(...list) {
            children.push(...list);
            if (el) {
                append(el, list);
            }
        },
    };
};

export const observable = (value) => {
    let listeners = [];

    function accessor(...args) {
        if (args.length === 0) {
            return value;
        }
        const [next] = args;
        if (value !== next) {
            value = next;
            listeners.forEach((l) => l(value));
        }
    }

    accessor.subscribe = (listener, notifyInitially = false) => {
        const unique = (v) => listener(v);
        listeners.push(unique);

        let stillSubscribed = true;

        if (notifyInitially) {
            queueMicrotask(() => {
                if (stillSubscribed) {
                    unique(value);
                }
            });
        }

        return () => {
            stillSubscribed = false;
            let index = listeners.indexOf(unique);
            if (index >= 0) {
                listeners.splice(index, 1);
            }
        };
    };

    return accessor;
};
