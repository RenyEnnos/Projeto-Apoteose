export function showModal(content) {
    document.getElementById('modal-content').innerHTML = content;
    document.getElementById('modal-container').style.display = 'flex';
}

export function closeModal() {
    document.getElementById('modal-container').style.display = 'none';
}
