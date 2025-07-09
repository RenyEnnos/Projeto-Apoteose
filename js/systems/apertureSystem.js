export function initApertureGrid(size) {
    const grid = [];
    for (let i = 0; i < size * size; i++) {
        grid[i] = { marks: {} };
    }
    return grid;
}

export function terraformCell(grid, x, y, size, daoType, amount) {
    const index = y * size + x;
    const cell = grid[index];
    if (!cell.marks[daoType]) cell.marks[daoType] = 0;
    cell.marks[daoType] += amount;
}
