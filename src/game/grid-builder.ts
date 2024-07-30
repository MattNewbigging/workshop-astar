import * as THREE from "three";

interface GridCell {
  posX: number;
  posZ: number;
  obstacle: boolean;
}

export class GridBuilder {
  grid: GridCell[][] = [];

  constructor(public gridSize = 10) {
    // Basic grid with unit-sized cells
    const grid: GridCell[][] = [];

    for (let z = 0; z < gridSize; z++) {
      // Init the array for this row
      grid[z] = [];

      for (let x = 0; x < gridSize; x++) {
        // Column cell
        const obstacle = Math.random() > 0.8;
        grid[z][x] = { posX: x, posZ: z, obstacle };
      }
    }

    this.grid = grid;
  }
}
