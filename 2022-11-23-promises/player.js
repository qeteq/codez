import { component, h } from './utils.js';

function formatTime(time) {
    if (!Number.isFinite(time)) {
        return '--:--';
    }
    const seconds = String(Math.floor(time % 60)).padStart(2, '0');
    const minutes = String(Math.floor(time / 60)).padStart(2, '0');
    return `${minutes}:${seconds}`;
}

export const Player = component((aud, { useDestroy }) => {
    const btn = h('button', 'play', 'Play');
    const currentTime = h('span');
    const duration = h('span');
    const progress = h('progress', { min: 0, max: 1 });

    let playScheduled = false;
    function handleClick() {
        const paused = aud.paused;

        if (paused) {
            if (!playScheduled) {
                playScheduled = true;
                aud.play()
                    .catch((err) => {
                        if (err.name === 'AbortError') {
                            // ignore
                            return;
                        }
                        throw err;
                    })
                    .finally(() => {
                        playScheduled = false;
                    });
            }
        } else {
            aud.pause();
        }
    }

    function update() {
        btn.textContent = aud.paused ? 'Play' : 'Pause';
        currentTime.textContent = formatTime(aud.currentTime);
        duration.textContent = formatTime(aud.duration);
    }

    function animate() {
        const elapsed = aud.currentTime / aud.duration;
        progress.value = Number.isFinite(elapsed) ? elapsed : 0;
        frameId = requestAnimationFrame(animate);
    }
    let frameId = requestAnimationFrame(animate);

    btn.addEventListener('click', handleClick);

    aud.addEventListener('play', update);
    aud.addEventListener('pause', update);
    aud.addEventListener('ended', update);
    aud.addEventListener('timeupdate', update);
    aud.addEventListener('durationchange', update);

    useDestroy(() => {
        cancelAnimationFrame(frameId);
        aud.removeEventListener('play', update);
        aud.removeEventListener('pause', update);
        aud.removeEventListener('ended', update);
        aud.removeEventListener('timeupdate', update);
        aud.removeEventListener('durationchange', update);
    });

    update();

    return h('div', 'player', [
        btn,
        h('span', 'time', [currentTime, ' / ', duration]),
        progress,
    ]);
});
