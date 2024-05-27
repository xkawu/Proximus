export default function formatTime(ms: number) {
    const d = Math.floor(ms / (1000 * 60 * 60 * 24));
    ms = ms % (1000 * 60 * 60 * 24);

    const h = Math.floor(ms / (1000 * 60 * 60));
    ms = ms % (1000 * 60 * 60);

    const m = Math.floor(ms / (1000 * 60));
    ms = ms % (1000 * 60);

    const s = Math.floor(ms / 1000);
    ms = Math.floor(ms % 1000);

    const values = [
        d > 0 ? `${d}d` : null,
        h > 0 ? `${h}h` : null,
        m > 0 ? `${m}m` : null,
        s > 0 ? `${s}s` : null,
        ms > 0 ? `${ms}ms` : null,
    ].filter((v) => v !== null);
    const text = values.join(" ");

    return {
        d,
        h,
        m,
        s,
        ms,
        text,
    };
}
