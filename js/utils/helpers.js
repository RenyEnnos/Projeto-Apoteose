export function log(message, type = '', day = 0) {
    const logContent = document.getElementById('log-content');
    const entry = document.createElement('div');
    entry.className = `log-entry ${type ? `log-${type}` : ''}`;
    entry.innerHTML = `<span style="color:#888;">[D${day}]</span> ${message}`;
    logContent.appendChild(entry);
    logContent.scrollTop = logContent.scrollHeight;
}
