interface Node {
  rowIndex: number; // z position
  colIndex: number; // x position
}

interface PathNode extends Node {
  parent?: PathNode;
  costToHere: number;
  costToEnd: number;
  costTotal: number;
}

export class AStar {
  grid: Node[][] = [];

  // Should be inferred from the scene, not the other way around
  constructor(gridSize = 10) {
    // Create the grid of nodes
    for (let row = 0; row < gridSize; row++) {
      this.grid[row] = [];

      for (let col = 0; col < gridSize; col++) {
        this.grid[row][col] = { rowIndex: row, colIndex: col };
      }
    }
  }

  getNeighbours(grid: Node[][], node: Node) {
    // No diagonals - only cardinal directions
    const row = node.rowIndex;
    const col = node.colIndex;

    // North is in row above at same column
    const north = grid[row - 1][col];

    // South is in row below at same column
    const south = grid[row + 1][col];

    // West is in same row at prev column
    const west = grid[row][col - 1];

    // East is in same row at next column
    const east = grid[row][col + 1];

    const neighbours = [north, south, west, east].filter(
      (node) => node !== null
    );

    return neighbours;
  }

  nodesAreEqual(a: Node, b: Node): boolean {
    return a.rowIndex === b.rowIndex && a.colIndex === b.colIndex;
  }

  getClosestNode(x: number, z: number) {
    const nearestX = Math.round(x);
    const nearestZ = Math.round(z);

    return this.grid[z][x];
  }
}
