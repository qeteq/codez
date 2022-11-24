import { component, h } from './utils.js';

export const Spinner = component(() => h('div', 'spinner'));

export const Loader = component(({ value }, { useDestroy }) => {
    const progressBar = h('progress', { value: 0, max: 100 });
    const progressText = h('span');
    const loader = h('div', 'loader', [progressBar, progressText]);

    const unsubscribe = value.subscribe((newValue) => {
        const rounded = Math.floor(newValue * 100);
        progressBar.value = rounded;
        progressText.textContent = `${rounded}%`;
    }, true);

    useDestroy(() => {
        unsubscribe();
    });

    return loader;
});
