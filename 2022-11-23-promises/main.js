import { Player } from './player.js';
import { h } from './utils.js';

function getPlaceholderImage() {
    const img = new Image();
    img.src = 'https://avatars.githubusercontent.com/u/11501370?s=200&v=4';
    return img;
}

async function loadBirdsJson() {
    const response = await fetch('/birds_data.json');

    if (!response.ok) {
        throw new Error('Invalid request');
    }

    const data = await response.json();
    return data.flat().slice(0, 6);
}

async function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = src;
        img.addEventListener('load', () => resolve(img));
        img.addEventListener('error', (e) => reject(e.error));
    });
}

async function preloadAudio(src) {
    return new Promise((resolve, reject) => {
        const audio = new Audio(src);
        audio.prefetch = 'metadata';
        audio.addEventListener('loadedmetadata', () => resolve(audio));
        audio.addEventListener('error', (e) => reject(e.error));
    });
}

async function loadContent() {
    const birdsData = await loadBirdsJson();

    const imagesPromise = Promise.all(
        birdsData.map(({ image }) => {
            return loadImage(image).catch((error) => {
                console.error(error);
                return getPlaceholderImage();
            });
        })
    );

    const audiosPromise = Promise.all(
        birdsData.map(async ({ audio }) => {
            return preloadAudio(audio).catch(() => null);
        })
    );

    const [images, audios] = await Promise.all([imagesPromise, audiosPromise]);

    return birdsData.map((item, index) => {
        return {
            ...item,
            image: images[index],
            audio: audios[index],
        };
    });
}

async function renderApp(root) {
    const { Spinner } = await import('./loading.js');
    const loader = Spinner();
    const container = h('div', 'load-screen', loader.render());
    root.append(container);

    try {
        const data = await loadContent();
        container.remove();
        loader.destroy();
        renderGallery(root, data);
    } catch (error) {
        container.remove();
        loader.destroy();
        renderError(root, error);
    }
}

function renderError(root, e) {
    root.append(h('h1', null, `ERROR: ${e.message}`));
}

function renderGallery(root, data) {
    console.log(data);
    const content = h('div', 'gallery', [
        h('h1', null, 'Gallery'),
        ...data.map(({ name, image, description, audio }) =>
            h('div', 'gallery-item', [
                h('h2', 'name', name),
                image,
                h('div', 'desc', [
                    h('p', null, description),
                    audio ? Player(audio).render() : 'NO AUDIO',
                ]),
            ])
        ),
    ]);

    root.append(content);
}

renderApp(document.body);
