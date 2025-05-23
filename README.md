# D3.js Pyramid Chart in Vue

This project visualizes hierarchical data as interactive 3D pyramid charts using Vue 3 and D3.js. Each block and sub-block in the pyramid can be clicked to show detailed progress information in a popup modal.

## Features

- **3D Pyramid Visualization:** Two mirrored pyramids with 3D transforms.
- **Interactive Blocks:** Clickable blocks and sub-blocks with hover and click animations.
- **Popup Modal:** Displays progress details for the selected item.
- **Customizable Colors:** Each pyramid can have its own active color.
- **Responsive Design:** Works on desktop and mobile screens.

## Project Structure

- `src/App.vue` - Main app, renders the pyramids and handles popup state.
- `src/components/Chart.vue` - D3.js pyramid chart component.
- `src/components/PopupModal.vue` - Popup modal for showing progress details.
- `src/data/chart.ts` - Example data for the pyramids.

## Getting Started

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Run the development server:**

   ```bash
   npm run dev
   ```

3. **Open your browser:**  
   Visit `http://localhost:5173` (or the port shown in your terminal).

## Usage

- Click any circle button in the pyramid to open the popup modal with progress details.
- The data for each block and sub-block is defined in `src/data/chart.ts`.

## Customization

- **Add/Edit Data:**  
  Modify `src/data/chart.ts` to change the pyramid structure and progress items.
- **Change Colors:**  
  Pass a different `activeColor` prop to the `PyramidChart` component in `App.vue`.

## Dependencies

- [Vue 3](https://vuejs.org/)
- [D3.js](https://d3js.org/)

## License

MIT
