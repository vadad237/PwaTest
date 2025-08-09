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
        const container = canvas.parentElement ? canvas.parentElement.parentElement : null;
        const containerWidth = container ? container.clientWidth : window.innerWidth;
        const size = Math.min(containerWidth, 600);
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

    function showSaveModal() {
        const modalEl = document.getElementById('saveModal');
        if (!modalEl) return;
        const modal = new bootstrap.Modal(modalEl);
        modal.show();
    }

    function hideSaveModal() {
        const modalEl = document.getElementById('saveModal');
        if (!modalEl) return;
        const modal = bootstrap.Modal.getInstance(modalEl);
        if (modal) {
            modal.hide();
        }
    }

    function openDb() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('wheelHistory', 1);
            request.onupgradeneeded = () => {
                const db = request.result;
                if (!db.objectStoreNames.contains('history')) {
                    db.createObjectStore('history', { autoIncrement: true });
                }
            };
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    function saveHistory(names, label) {
        if (!names || names.length === 0 || !label) return Promise.resolve();
        return openDb().then(db => {
            return new Promise((resolve, reject) => {
                const tx = db.transaction('history', 'readwrite');
                tx.objectStore('history').add({ label, names, savedAt: new Date() });
                tx.oncomplete = () => { db.close(); resolve(); };
                tx.onerror = () => { db.close(); reject(tx.error); };
            });
        });
    }

    function getHistory() {
        return openDb().then(db => {
            return new Promise((resolve, reject) => {
                const tx = db.transaction('history', 'readonly');
                const store = tx.objectStore('history');
                const request = store.openCursor();
                const all = [];
                request.onsuccess = e => {
                    const cursor = e.target.result;
                    if (cursor) {
                        const value = cursor.value;
                        all.push({ id: cursor.key, label: value.label, names: value.names });
                        cursor.continue();
                    } else {
                        db.close();
                        resolve(all);
                    }
                };
                request.onerror = () => { db.close(); reject(request.error); };
            });
        });
    }

    function deleteHistory(id) {
        return openDb().then(db => {
            return new Promise((resolve, reject) => {
                const tx = db.transaction('history', 'readwrite');
                tx.objectStore('history').delete(id);
                tx.oncomplete = () => { db.close(); resolve(); };
                tx.onerror = () => { db.close(); reject(tx.error); };
            });
        });
    }


    function downloadCsvTemplate() {
        const content = ['Name', 'Item 1', 'Item 2', 'Item 3', 'Item 4'].join('\n');
        const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'import-template.csv';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    function downloadExcelTemplate() {
        if (typeof XLSX === 'undefined') return;
        const ws = XLSX.utils.aoa_to_sheet([
            ['Name'],
            ['Item 1'],
            ['Item 2'],
            ['Item 3'],
            ['Item 4']
        ]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Template');
        const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([wbout], { type: 'application/octet-stream' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'import-template.xlsx';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    window.addEventListener('resize', () => draw());

    return { draw, spin, showWinnerModal, hideWinnerModal, showSaveModal, hideSaveModal, saveHistory, getHistory, deleteHistory, downloadCsvTemplate, downloadExcelTemplate };
})();
