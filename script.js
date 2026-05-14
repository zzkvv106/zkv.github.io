// Close boxes functionality
document.querySelectorAll('.close-box').forEach(box => {
    box.addEventListener('click', (e) => {
        const win = e.target.closest('.window');
        win.style.display = 'none';

        // Restart desktop if all closed
        const visibleWindows = Array.from(document.querySelectorAll('.window')).filter(w => w.style.display !== 'none');
        if (visibleWindows.length === 0) {
            setTimeout(() => {
                if (confirm("All windows closed. Restart desktop?")) {
                    document.querySelectorAll('.window').forEach(w => w.style.display = 'flex');
                }
            }, 500);
        }
    });
});