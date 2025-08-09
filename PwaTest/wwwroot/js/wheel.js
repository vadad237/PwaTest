window.wheel = (function () {
    let angle = 0;
    let currentNames = [];

    function draw(names, resetAngle) {
        currentNames = names !== undefined ? names : currentNames;
        if (resetAngle) {
            angle = 0;
        }
        const canvas = document.getElementById('wheelCanvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const size = Math.min(canvas.parentElement.clientWidth, 600);
        canvas.width = size;
        canvas.height = size;
        const radius = size / 2;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (!currentNames || currentNames.length === 0) return;
        const arc = 2 * Math.PI / currentNames.length;
        for (let i = 0; i < currentNames.length; i++) {
            ctx.beginPath();
            ctx.fillStyle = `hsl(${360 * i / currentNames.length},70%,70%)`;
            ctx.moveTo(radius, radius);
            ctx.arc(radius, radius, radius, angle + i * arc, angle + (i + 1) * arc);
            ctx.lineTo(radius, radius);
            ctx.fill();
            ctx.save();
            ctx.translate(radius, radius);
            ctx.rotate(angle + i * arc + arc / 2);
            ctx.textAlign = 'right';
            ctx.fillStyle = '#000';
            const fontSize = Math.max(16, radius * 0.1067);
            ctx.font = `${fontSize}px sans-serif`;
            ctx.fillText(currentNames[i], radius - 10, radius * 0.0667);
            ctx.restore();
        }
        ctx.fillStyle = '#000';
        ctx.beginPath();
        const arrowHeight = radius * 0.0667;
        const arrowHalfWidth = radius * 0.0333;
        ctx.moveTo(radius, arrowHeight);
        ctx.lineTo(radius - arrowHalfWidth, 0);
        ctx.lineTo(radius + arrowHalfWidth, 0);
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

    function showWinnerModal() {
        const modalEl = document.getElementById('winnerModal');
        if (!modalEl) return;
        const modal = new bootstrap.Modal(modalEl);
        modal.show();
    }

    function hideWinnerModal() {
        const modalEl = document.getElementById('winnerModal');
        if (!modalEl) return;
        const modal = bootstrap.Modal.getInstance(modalEl);
        if (modal) {
            modal.hide();
        }
    }

    window.addEventListener('resize', () => draw());

    return { draw, spin, showWinnerModal, hideWinnerModal };
})();
