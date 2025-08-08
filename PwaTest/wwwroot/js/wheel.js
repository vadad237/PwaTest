window.wheel = (function () {
    let angle = 0;

    function draw(names) {
        const canvas = document.getElementById('wheelCanvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const radius = canvas.width / 2;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (!names || names.length === 0) return;
        const arc = 2 * Math.PI / names.length;
        for (let i = 0; i < names.length; i++) {
            ctx.beginPath();
            ctx.fillStyle = `hsl(${360 * i / names.length},70%,70%)`;
            ctx.moveTo(radius, radius);
            ctx.arc(radius, radius, radius, angle + i * arc, angle + (i + 1) * arc);
            ctx.lineTo(radius, radius);
            ctx.fill();
            ctx.save();
            ctx.translate(radius, radius);
            ctx.rotate(angle + i * arc + arc / 2);
            ctx.textAlign = 'right';
            ctx.fillStyle = '#000';
            ctx.font = '16px sans-serif';
            ctx.fillText(names[i], radius - 10, 10);
            ctx.restore();
        }
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.moveTo(radius, 20);
        ctx.lineTo(radius - 10, 0);
        ctx.lineTo(radius + 10, 0);
        ctx.closePath();
        ctx.fill();
    }

    function spin(names) {
        if (!names || names.length === 0) return '';
        return new Promise(resolve => {
            const total = Math.random() * 2 * Math.PI + 10 * 2 * Math.PI;
            const startAngle = angle;
            const start = performance.now();
            const duration = 4000;
            function frame(now) {
                const t = Math.min((now - start) / duration, 1);
                const ease = 1 - Math.pow(1 - t, 3);
                angle = startAngle + total * ease;
                draw(names);
                if (t < 1) {
                    requestAnimationFrame(frame);
                } else {
                    const arc = 2 * Math.PI / names.length;
                    const offset = (3 * Math.PI / 2 - (angle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
                    const index = Math.floor(offset / arc);
                    resolve(names[index]);
                }
            }
            requestAnimationFrame(frame);
        });
    }

    return { draw, spin };
})();
