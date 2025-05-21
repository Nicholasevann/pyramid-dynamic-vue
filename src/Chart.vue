<template>
  <div
    ref="chart"
    :class="position === 'left' ? 'chart-left' : 'chart-right'"
  ></div>
</template>

<script>
import * as d3 from "d3";
import { onMounted, ref, watch } from "vue";

export default {
  name: "PyramidChart",
  props: {
    width: {
      type: Number,
    },
    height: {
      type: Number,
    },
    data: {
      type: Array,
      required: true,
    },
    activeColor: {
      type: String,
      default: "#f75c4b",
    },
    onclickPointer: {
      type: Function,
      default: () => {},
    },
    position: {
      type: String,
    },
  },
  setup(props) {
    const chart = ref(null);

    // Function to wrap text to fit maximum character length
    const wrapText = (text, maxLength = 15) => {
      if (!text || typeof text !== "string") return [""];

      const words = text.split(" ");
      const lines = [];
      let currentLine = "";

      words.forEach((word) => {
        const testLine = currentLine ? `${currentLine} ${word}` : word;

        if (testLine.length <= maxLength) {
          currentLine = testLine;
        } else {
          if (currentLine) lines.push(currentLine);

          // Check if single word is longer than maxLength
          if (word.length > maxLength) {
            // Split the long word
            for (let i = 0; i < word.length; i += maxLength) {
              const chunk = word.substring(i, i + maxLength);
              lines.push(chunk);
            }
            currentLine = "";
          } else {
            currentLine = word;
          }
        }
      });

      if (currentLine) lines.push(currentLine);

      return lines.length ? lines : [""];
    };

    // Function to create the pyramid chart
    const createPyramidChart = () => {
      if (!chart.value) return;

      // Clear previous chart if it exists
      d3.select(chart.value).selectAll("*").remove();

      const width = props.width;
      const height = props.height;

      // Create color scale using the activeColor prop
      const baseColors = {
        true: props.activeColor, // Use activeColor prop for onprogress = true
        false: "#d3d3d3", // Gray for onprogress = false
      };

      // Create SVG with improved pointer events handling
      const svg = d3
        .select(chart.value)
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("class", "pyramid-svg")
        .style("pointer-events", "all") // Ensure pointer events work with 3D transforms
        .append("g");

      // Group data by level
      const grouped = Object.values(
        props.data.reduce((aggObj, item) => {
          if (!aggObj[item.level]) {
            aggObj[item.level] = { level: item.level, items: [] };
          }
          aggObj[item.level].items.push({
            name: item.name,
            subchild: item.subchild || [],
            onprogress: item.onprogress,
          });
          return aggObj;
        }, {})
      );

      // Sort grouped data by level (ascending)
      grouped.sort((a, b) => a.level - b.level);

      // Define custom D3 pyramid layout function
      const pyramid = (data) => {
        const result = [];
        const baseWidth = width;
        const maxLevel = Math.max(...data.map((d) => d.level));
        const levels = data.length;

        // Process data from top to bottom (level 1 at top as triangle tip)
        data.forEach((d, i) => {
          const level = d.level;
          // Calculate the vertical position (y) based on level
          const levelHeight = height / maxLevel;

          const yTop = (level - 1) * levelHeight;
          const yBottom = level * levelHeight;

          let coordinates = [];

          if (level === 1) {
            // For level 1, create a triangle (pointed tip)
            coordinates = [
              // Tip point
              { x: width / 2, y: yTop },
              // Bottom left
              {
                x: width / 2 - (baseWidth * (level / maxLevel)) / 2,
                y: yBottom,
              },
              // Bottom right
              {
                x: width / 2 + (baseWidth * (level / maxLevel)) / 2,
                y: yBottom,
              },
            ];
          } else {
            // For other levels, create trapezoids
            // Calculate width at current level and previous level
            const widthAtTopLevel = baseWidth * ((level - 1) / maxLevel);
            const widthAtBottomLevel = baseWidth * (level / maxLevel);

            coordinates = [
              // Top left
              { x: width / 2 - widthAtTopLevel / 2, y: yTop },
              // Bottom left
              { x: width / 2 - widthAtBottomLevel / 2, y: yBottom },
              // Bottom right
              { x: width / 2 + widthAtBottomLevel / 2, y: yBottom },
              // Top right
              { x: width / 2 + widthAtTopLevel / 2, y: yTop },
            ];
          }

          // Calculate individual blocks for items at this level
          const items = d.items;
          const itemCoordinates = [];

          if (items.length > 0) {
            // Handle level 1 (triangle) - support multiple items
            if (level === 1) {
              // Calculate coordinates for each item in level 1
              const triangleHeight = yBottom - yTop;
              const triangleBase = coordinates[2].x - coordinates[1].x;

              items.forEach((item, idx) => {
                // If there's only one item, use the whole triangle
                if (items.length === 1) {
                  itemCoordinates.push({
                    name: item.name,
                    subchild: item.subchild,
                    onprogress: item.onprogress,
                    coordinates: coordinates,
                    originalItem: item,
                  });
                } else {
                  // For multiple items, divide the triangle vertically
                  // Calculate the section width for this item (divide horizontally)
                  const sectionWidth = triangleBase / items.length;
                  const sectionLeft = coordinates[1].x + idx * sectionWidth;
                  const sectionRight = sectionLeft + sectionWidth;

                  // Each section forms a triangle from the top point to its base section
                  const itemCoords = [
                    { x: width / 2, y: yTop }, // Shared top point
                    { x: sectionLeft, y: yBottom }, // Bottom left
                    { x: sectionRight, y: yBottom }, // Bottom right
                  ];

                  itemCoordinates.push({
                    name: item.name,
                    subchild: item.subchild,
                    onprogress: item.onprogress,
                    coordinates: itemCoords,
                    originalItem: item,
                  });
                }
              });
            } else {
              // Width available for each block at top and bottom of the level
              const topWidth = coordinates[3].x - coordinates[0].x;
              const bottomWidth = coordinates[2].x - coordinates[1].x;

              // Calculate coordinates for each item
              items.forEach((item, idx) => {
                const startPctTop = idx / items.length;
                const endPctTop = (idx + 1) / items.length;
                const startPctBottom = idx / items.length;
                const endPctBottom = (idx + 1) / items.length;

                // Calculate the item's coordinates
                const x1 = coordinates[0].x + topWidth * startPctTop;
                const x2 = coordinates[1].x + bottomWidth * startPctBottom;
                const x3 = coordinates[1].x + bottomWidth * endPctBottom;
                const x4 = coordinates[0].x + topWidth * endPctTop;

                const itemCoords = [
                  { x: x1, y: coordinates[0].y }, // Top left
                  { x: x2, y: coordinates[1].y }, // Bottom left
                  { x: x3, y: coordinates[2].y }, // Bottom right
                  { x: x4, y: coordinates[3].y }, // Top right
                ];

                itemCoordinates.push({
                  name: item.name,
                  subchild: item.subchild,
                  onprogress: item.onprogress,
                  coordinates: itemCoords,
                  originalItem: item,
                });
              });
            }
          }

          result.push({
            level: d.level,
            items: d.items,
            coordinates: coordinates,
            itemCoordinates: itemCoordinates,
          });
        });

        return result;
      };

      // Create the line generator
      const line = d3
        .line()
        .x((d) => d.x)
        .y((d) => d.y)
        .curve(d3.curveLinearClosed);

      // Process data with the pyramid layout
      const pyramidData = pyramid(grouped);

      // Draw level dividers first (horizontal lines between levels)
      pyramidData.forEach((levelData, i) => {
        // Skip the first level (no line above it)
        if (i > 0) {
          const yLine = levelData.coordinates[0].y;
          const xLeft = levelData.coordinates[0].x;
          const xRight = levelData.coordinates[3].x;

          svg
            .append("line")
            .attr("x1", xLeft)
            .attr("y1", yLine)
            .attr("x2", xRight)
            .attr("y2", yLine)
            .attr("stroke", "#ffffff")
            .attr("stroke-width", 2);
        }
      });

      // Draw individual block shapes
      pyramidData.forEach((levelData) => {
        // Create a group for this level for better organization
        const levelGroup = svg
          .append("g")
          .attr("class", "level-group")
          .attr("data-level", levelData.level);

        levelData.itemCoordinates.forEach((item, idx) => {
          // Skip if coordinates are not properly defined
          if (!item.coordinates || item.coordinates.length === 0) return;

          // Create a group for this item
          const itemGroup = levelGroup
            .append("g")
            .attr("class", "item-group")
            .attr("data-item-idx", idx);

          // Draw the shape - now using onprogress status for coloring
          itemGroup
            .append("path")
            .attr("d", line(item.coordinates))
            .style("fill", baseColors[item.onprogress])
            .style("stroke", "#ffffff")
            .style("stroke-width", 5)
            .style("pointer-events", "all")
            .on("click", () => {
              props.onclickPointer({
                level: levelData.level,
                name: item.name,
                item: item.originalItem,
              });
            });

          // For level 1 with multiple items, add vertical dividers between sections
          if (
            levelData.level === 1 &&
            levelData.itemCoordinates.length > 1 &&
            idx < levelData.itemCoordinates.length - 1
          ) {
            const nextItem = levelData.itemCoordinates[idx + 1];

            // Draw a divider line from the top point to the bottom
            itemGroup
              .append("line")
              .attr("x1", item.coordinates[0].x)
              .attr("y1", item.coordinates[0].y)
              .attr("x2", item.coordinates[2].x)
              .attr("y2", item.coordinates[2].y)
              .attr("stroke", "#ffffff")
              .attr("stroke-width", 2);
          }
          // Draw vertical dividers between blocks for other levels (except the last block)
          else if (
            idx < levelData.itemCoordinates.length - 1 &&
            levelData.level > 1
          ) {
            const nextItem = levelData.itemCoordinates[idx + 1];

            // Get coordinates for the divider line
            // Make sure item.coordinates contains index 3 and 2 (for level 1, this might not be true)
            const x1 =
              item.coordinates.length > 3
                ? item.coordinates[3].x
                : item.coordinates[0].x;
            const y1 =
              item.coordinates.length > 3
                ? item.coordinates[3].y
                : item.coordinates[0].y;
            const x2 =
              item.coordinates.length > 2
                ? item.coordinates[2].x
                : item.coordinates[1].x;
            const y2 =
              item.coordinates.length > 2
                ? item.coordinates[2].y
                : item.coordinates[1].y;

            itemGroup
              .append("line")
              .attr("x1", x1)
              .attr("y1", y1)
              .attr("x2", x2)
              .attr("y2", y2)
              .attr("stroke", "#ffffff")
              .attr("stroke-width", 2);
          }

          // Calculate text position - safely handle arrays
          const xValues = item.coordinates.map((coord) => coord.x);
          const xCenter =
            xValues.reduce((sum, x) => sum + x, 0) / xValues.length;

          const yTop = item.coordinates[0].y;
          const yBottom =
            item.coordinates.length > 1 ? item.coordinates[1].y : yTop + 30; // Use default if not available

          // Handle subchildren - place them inside the parent block with vertical dividers
          if (item.subchild && item.subchild.length > 0) {
            // Calculate block dimensions
            const blockHeight = yBottom - yTop;
            const subchild = item.subchild;
            const subchildCount = subchild.length;

            // Calculate height per subchild
            const subchildHeight = blockHeight / subchildCount;

            // Create a group for subchildren
            const subchildGroup = itemGroup
              .append("g")
              .attr("class", "subchild-group");

            // Create subchild sections
            subchild.forEach((child, childIdx) => {
              const subchildY = yTop + childIdx * subchildHeight;
              const subchildBottomY = subchildY + subchildHeight;
              const subChildColor = baseColors[child.onprogress];

              // Calculate width at top and bottom of this subchild section
              let topLeftX, topRightX, bottomLeftX, bottomRightX;

              if (levelData.level === 1) {
                // For level 1 (triangular sections)
                const topProgress = (subchildY - yTop) / (yBottom - yTop);
                const bottomProgress =
                  (subchildBottomY - yTop) / (yBottom - yTop);
                const triangleWidth =
                  item.coordinates[2].x - item.coordinates[1].x;

                if (item.coordinates.length === 3) {
                  // Vertical division case (triangle)
                  const midPoint =
                    (item.coordinates[1].x + item.coordinates[2].x) / 2;
                  const topWidth = triangleWidth * topProgress;
                  const bottomWidth = triangleWidth * bottomProgress;

                  topLeftX = midPoint - topWidth / 2;
                  topRightX = midPoint + topWidth / 2;
                  bottomLeftX = midPoint - bottomWidth / 2;
                  bottomRightX = midPoint + bottomWidth / 2;
                } else {
                  // Use the entire width of this section
                  topLeftX = item.coordinates[0].x;
                  topRightX = item.coordinates[0].x;
                  bottomLeftX = item.coordinates[1].x;
                  bottomRightX = item.coordinates[2].x;
                }
              } else {
                // For other levels (trapezoids)
                const topProgress = (subchildY - yTop) / (yBottom - yTop);
                const bottomProgress =
                  (subchildBottomY - yTop) / (yBottom - yTop);

                const topWidth = item.coordinates[3].x - item.coordinates[0].x;
                const bottomWidth =
                  item.coordinates[2].x - item.coordinates[1].x;

                topLeftX =
                  item.coordinates[0].x +
                  topProgress * (item.coordinates[1].x - item.coordinates[0].x);
                bottomLeftX =
                  item.coordinates[0].x +
                  bottomProgress *
                    (item.coordinates[1].x - item.coordinates[0].x);

                const topWidthAtSubchild = topWidth * (1 - topProgress);
                const bottomWidthAtSubchild =
                  bottomWidth * (1 - bottomProgress);

                topRightX =
                  item.coordinates[3].x -
                  topProgress * (item.coordinates[3].x - item.coordinates[2].x);
                bottomRightX =
                  item.coordinates[3].x -
                  bottomProgress *
                    (item.coordinates[3].x - item.coordinates[2].x);
              }

              // Create individual subchild group
              const singleSubchildGroup = subchildGroup
                .append("g")
                .attr("class", "single-subchild")
                .attr("data-subchild-idx", childIdx);

              // Create subchild section with correct color
              const subchildCoords = [
                { x: topLeftX, y: subchildY },
                { x: bottomLeftX, y: subchildBottomY },
                { x: bottomRightX, y: subchildBottomY },
                { x: topRightX, y: subchildY },
              ];

              // Draw subchild section with appropriate color
              singleSubchildGroup
                .append("path")
                .attr("d", line(subchildCoords))
                .style("fill", subChildColor)
                .style("stroke", "#ffffff")
                .style("stroke-width", 1)
                .style("pointer-events", "all")
                .on("click", () => {
                  props.onclickPointer({
                    level: levelData.level,
                    name: item.name,
                    subchild: child,
                    item: item.originalItem,
                  });
                });

              // Calculate center point for text placement
              const subchildCenterX =
                (topLeftX + topRightX + bottomLeftX + bottomRightX) / 4;
              const subchildCenterY = (subchildY + subchildBottomY) / 2;

              // Wrap text and add name in the center of subchild section
              const wrappedText = wrapText(child.name);
              const lineHeight = 14; // Adjust as needed

              // Add text group
              const textGroup = singleSubchildGroup
                .append("g")
                .attr("class", "text-group");

              wrappedText.forEach((line, lineIdx) => {
                textGroup
                  .append("text")
                  .attr("x", subchildCenterX)
                  .attr(
                    "y",
                    subchildCenterY -
                      ((wrappedText.length - 1) * lineHeight) / 2 +
                      lineIdx * lineHeight
                  )
                  .attr("text-anchor", "middle")
                  .attr("alignment-baseline", "middle")
                  .style("font-size", "8px")
                  .style("fill", "#ffffff")
                  .style("pointer-events", "none") // Prevent text from intercepting clicks
                  .text(line);
              });

              // Add enhanced pointer circle with hover effects
              singleSubchildGroup
                .append("circle")
                .attr("cx", subchildCenterX)
                .attr("cy", subchildCenterY + 25)
                .attr("r", 5) // Slightly larger for better clickability
                .attr("fill", "#ffffff")
                .attr("stroke", "#000000")
                .attr("stroke-width", 1)
                .style("cursor", "pointer")
                .style("pointer-events", "all") // Ensure pointer events work with transforms
                .on("mouseover", function () {
                  d3.select(this)
                    .transition()
                    .duration(150)
                    .attr("r", 7)
                    .attr("fill", "#ffcc00"); // Highlight color on hover
                })
                .on("mouseout", function () {
                  d3.select(this)
                    .transition()
                    .duration(150)
                    .attr("r", 5)
                    .attr("fill", "#ffffff");
                })
                .on("click", () => {
                  // Call the onclickPointer prop function
                  props.onclickPointer({
                    level: levelData.level,
                    name: item.name,
                    subchild: child,
                    item: item.originalItem,
                  });
                });
            });
          } else {
            // For blocks without subchildren, add the name in the center
            const yCenter = yTop + (yBottom - yTop) / 2;

            // Calculate center point for text and pointer
            let textX, textY;

            if (levelData.level === 1 && item.coordinates.length === 3) {
              // For level 1 vertical divisions (triangles), calculate center point
              // (barycenter of the triangle)
              textX =
                (item.coordinates[0].x +
                  item.coordinates[1].x +
                  item.coordinates[2].x) /
                3;
              textY =
                (item.coordinates[0].y +
                  item.coordinates[1].y +
                  item.coordinates[2].y) /
                3;
            } else {
              // For all other shapes (standard blocks)
              textX = xCenter;
              textY = yCenter;
            }

            // Add text group
            const textGroup = itemGroup.append("g").attr("class", "text-group");

            // Wrap text for the section name
            const wrappedText = wrapText(item.name);
            const lineHeight = 14; // Adjust as needed

            // Add wrapped name lines
            wrappedText.forEach((line, lineIdx) => {
              textGroup
                .append("text")
                .attr("x", textX)
                .attr(
                  "y",
                  textY -
                    ((wrappedText.length - 1) * lineHeight) / 2 +
                    lineIdx * lineHeight
                )
                .attr("text-anchor", "middle")
                .attr("alignment-baseline", "middle")
                .style("font-size", "8px")
                .style("fill", "#ffffff")
                .style("pointer-events", "none") // Prevent text from intercepting clicks
                .text(line);
            });

            // Position for pointer
            const pointerY = textY + 4 + wrappedText.length * 7;

            // Add enhanced pointer circle with hover effects
            itemGroup
              .append("circle")
              .attr("cx", textX)
              .attr("cy", pointerY)
              .attr("r", 5) // Slightly larger for better clickability
              .attr("fill", "#ffffff")
              .attr("stroke", "#000000")
              .attr("stroke-width", 1)
              .style("cursor", "pointer")
              .style("pointer-events", "all") // Ensure pointer events work with transforms
              .on("mouseover", function () {
                d3.select(this)
                  .transition()
                  .duration(150)
                  .attr("r", 7)
                  .attr("fill", "#ffcc00"); // Highlight color on hover
              })
              .on("mouseout", function () {
                d3.select(this)
                  .transition()
                  .duration(150)
                  .attr("r", 5)
                  .attr("fill", "#ffffff");
              })
              .on("click", () => {
                // Call the onclickPointer prop function
                props.onclickPointer({
                  level: levelData.level,
                  name: item.name,
                  item: item.originalItem,
                });
              });
          }
        });
      });
    };

    // Create chart when component is mounted
    onMounted(() => {
      createPyramidChart();
    });

    // Watch for changes in data or dimensions and redraw
    watch(
      () => [props.data, props.width, props.height, props.activeColor],
      () => {
        createPyramidChart();
      },
      { deep: true }
    );

    return {
      chart,
    };
  },
};
</script>

<style scoped>
.chart-left {
  transform: rotateY(-35deg) rotateZ(26deg) rotateX(15deg);
  transform-origin: right center;
  margin-right: -100px;
  transform-style: preserve-3d;
  position: relative;
  z-index: 1; /* Fixed z-index */
  width: min-content;
  height: min-content;
}

.chart-right {
  transform: rotateY(35deg) rotateZ(-26deg) rotateX(15deg);
  transform-origin: left center;
  margin-left: -100px;
  transform-style: preserve-3d;
  position: relative;
  z-index: 1; /* Fixed z-index - slightly lower than left chart */
}

/* Ensure SVG elements remain interactive despite transforms */
.pyramid-svg {
  pointer-events: all;
  position: relative;
  z-index: auto;
}

/* Enhanced pointer event handling for nested elements */
.level-group {
  pointer-events: all;
}

.item-group {
  pointer-events: all;
}

.subchild-group {
  pointer-events: all;
}

/* Ensure text doesn't interfere with clicks */
.text-group {
  pointer-events: none;
}

/* Fix for 3D transformed elements - ensure they can be clicked */
svg path,
svg circle {
  pointer-events: all !important;
  cursor: pointer;
}

/* Add element isolation for better stacking context in 3D */
.chart-left,
.chart-right {
  isolation: isolate;
  backface-visibility: hidden;
}

/* Make sure the pointer events are properly captured */
.chart-left:hover,
.chart-right:hover {
  z-index: 2; /* Bring active chart to front when hovered */
}
</style>
