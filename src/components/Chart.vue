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
    width: { type: Number },
    height: { type: Number },
    data: { type: Array, required: true },
    activeColor: { type: String, default: "#f75c4b" },
    onclickPointer: { type: Function, default: () => {} },
    position: { type: String },
  },

  setup(props) {
    const chart = ref(null);

    const COLORS = {
      active: props.activeColor,
      inactive: "#d3d3d3",
      white: "#ffffff",
      black: "#000000",
      gold: "#ffcc00",
    };

    const STROKE_WIDTHS = {
      level: 2,
      block: 5,
      blockHover: 7,
      subchild: 1,
      subchildHover: 2,
      circleMain: 1.5,
      circleHover: 3,
    };

    const ANIMATION_DURATIONS = {
      hover: 200,
      click: 150,
      ripple: 600,
    };

    const groupDataByLevel = (data) => {
      const grouped = Object.values(
        data.reduce((aggObj, item) => {
          if (!aggObj[item.level]) {
            aggObj[item.level] = { level: item.level, items: [] };
          }
          aggObj[item.level].items.push({
            name: item.name,
            subchild: item.subchild || [],
            onprogress: item.onprogress,
            progressItem: item.progressItem,
          });
          return aggObj;
        }, {})
      );

      return grouped.sort((a, b) => a.level - b.level);
    };

    const calculatePyramidCoordinates = (level, maxLevel, width, height) => {
      const levelHeight = height / maxLevel;
      const yTop = (level - 1) * levelHeight;
      const yBottom = level * levelHeight;

      if (level === 1) {
        return [
          { x: width / 2, y: yTop },
          { x: width / 2 - (width * (level / maxLevel)) / 2, y: yBottom },
          { x: width / 2 + (width * (level / maxLevel)) / 2, y: yBottom },
        ];
      }

      const widthAtTopLevel = width * ((level - 1) / maxLevel);
      const widthAtBottomLevel = width * (level / maxLevel);

      return [
        { x: width / 2 - widthAtTopLevel / 2, y: yTop },
        { x: width / 2 - widthAtBottomLevel / 2, y: yBottom },
        { x: width / 2 + widthAtBottomLevel / 2, y: yBottom },
        { x: width / 2 + widthAtTopLevel / 2, y: yTop },
      ];
    };

    const calculateItemCoordinates = (items, levelCoordinates, level) => {
      const itemCoordinates = [];

      if (level === 1) {
        const triangleBase = levelCoordinates[2].x - levelCoordinates[1].x;
        const yTop = levelCoordinates[0].y;
        const yBottom = levelCoordinates[1].y;

        items.forEach((item, idx) => {
          if (items.length === 1) {
            itemCoordinates.push({
              ...item,
              coordinates: levelCoordinates,
              originalItem: item,
            });
          } else {
            const sectionWidth = triangleBase / items.length;
            const sectionLeft = levelCoordinates[1].x + idx * sectionWidth;
            const sectionRight = sectionLeft + sectionWidth;

            itemCoordinates.push({
              ...item,
              coordinates: [
                { x: props.width / 2, y: yTop },
                { x: sectionLeft, y: yBottom },
                { x: sectionRight, y: yBottom },
              ],
              originalItem: item,
            });
          }
        });
      } else {
        const topWidth = levelCoordinates[3].x - levelCoordinates[0].x;
        const bottomWidth = levelCoordinates[2].x - levelCoordinates[1].x;

        items.forEach((item, idx) => {
          const startPct = idx / items.length;
          const endPct = (idx + 1) / items.length;

          const x1 = levelCoordinates[0].x + topWidth * startPct;
          const x2 = levelCoordinates[1].x + bottomWidth * startPct;
          const x3 = levelCoordinates[1].x + bottomWidth * endPct;
          const x4 = levelCoordinates[0].x + topWidth * endPct;

          itemCoordinates.push({
            ...item,
            coordinates: [
              { x: x1, y: levelCoordinates[0].y },
              { x: x2, y: levelCoordinates[1].y },
              { x: x3, y: levelCoordinates[2].y },
              { x: x4, y: levelCoordinates[3].y },
            ],
            originalItem: item,
          });
        });
      }

      return itemCoordinates;
    };

    const createPyramidLayout = (data) => {
      const result = [];
      const maxLevel = Math.max(...data.map((d) => d.level));

      data.forEach((levelData) => {
        const coordinates = calculatePyramidCoordinates(
          levelData.level,
          maxLevel,
          props.width,
          props.height
        );

        const itemCoordinates = calculateItemCoordinates(
          levelData.items,
          coordinates,
          levelData.level
        );

        result.push({
          level: levelData.level,
          items: levelData.items,
          coordinates,
          itemCoordinates,
        });
      });

      return result;
    };

    const addRippleEffect = (group, x, y) => {
      const ripple = group
        .append("circle")
        .attr("cx", x)
        .attr("cy", y)
        .attr("r", 0)
        .style("fill", "none")
        .style("stroke", COLORS.white)
        .style("stroke-width", 2)
        .style("opacity", 0.8)
        .style("pointer-events", "none");

      ripple
        .transition()
        .duration(ANIMATION_DURATIONS.ripple)
        .attr("r", 30)
        .style("opacity", 0)
        .remove();
    };

    const addPulseEffect = (group, x, y) => {
      const pulseRing = group
        .append("circle")
        .attr("cx", x)
        .attr("cy", y)
        .attr("r", 10)
        .style("fill", "none")
        .style("stroke", COLORS.gold)
        .style("stroke-width", 2)
        .style("opacity", 0.8)
        .style("pointer-events", "none");

      pulseRing
        .transition()
        .duration(1000)
        .attr("r", 20)
        .style("opacity", 0)
        .remove();
    };

    const addClickRingEffect = (group, x, y) => {
      const clickRing = group
        .append("circle")
        .attr("cx", x)
        .attr("cy", y)
        .attr("r", 6)
        .style("fill", "none")
        .style("stroke", COLORS.white)
        .style("stroke-width", 3)
        .style("opacity", 1)
        .style("pointer-events", "none");

      clickRing
        .transition()
        .duration(500)
        .attr("r", 25)
        .style("opacity", 0)
        .style("stroke-width", 1)
        .remove();
    };

    const createLevelDividers = (svg, pyramidData) => {
      pyramidData.forEach((levelData, i) => {
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
            .attr("stroke", COLORS.white)
            .attr("stroke-width", STROKE_WIDTHS.level);
        }
      });
    };

    const createBlockDividers = (itemGroup, item, levelData, idx) => {
      const isLastItem = idx === levelData.itemCoordinates.length - 1;
      if (isLastItem) return;

      if (levelData.level === 1 && levelData.itemCoordinates.length > 1) {
        itemGroup
          .append("line")
          .attr("x1", item.coordinates[0].x)
          .attr("y1", item.coordinates[0].y)
          .attr("x2", item.coordinates[2].x)
          .attr("y2", item.coordinates[2].y)
          .attr("stroke", COLORS.white)
          .attr("stroke-width", STROKE_WIDTHS.level);
      } else if (levelData.level > 1) {
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
          .attr("stroke", COLORS.white)
          .attr("stroke-width", STROKE_WIDTHS.level);
      }
    };

    const calculateSubchildCoordinates = (
      item,
      child,
      childIdx,
      subchildCount,
      yTop,
      yBottom,
      levelData
    ) => {
      const subchildHeight = (yBottom - yTop) / subchildCount;
      const subchildY = yTop + childIdx * subchildHeight;
      const subchildBottomY = subchildY + subchildHeight;

      let topLeftX, topRightX, bottomLeftX, bottomRightX;

      if (levelData.level === 1) {
        const topProgress = (subchildY - yTop) / (yBottom - yTop);
        const bottomProgress = (subchildBottomY - yTop) / (yBottom - yTop);
        const triangleWidth = item.coordinates[2].x - item.coordinates[1].x;

        if (item.coordinates.length === 3) {
          const midPoint = (item.coordinates[1].x + item.coordinates[2].x) / 2;
          const topWidth = triangleWidth * topProgress;
          const bottomWidth = triangleWidth * bottomProgress;

          topLeftX = midPoint - topWidth / 2;
          topRightX = midPoint + topWidth / 2;
          bottomLeftX = midPoint - bottomWidth / 2;
          bottomRightX = midPoint + bottomWidth / 2;
        } else {
          topLeftX = item.coordinates[0].x;
          topRightX = item.coordinates[0].x;
          bottomLeftX = item.coordinates[1].x;
          bottomRightX = item.coordinates[2].x;
        }
      } else {
        const topProgress = (subchildY - yTop) / (yBottom - yTop);
        const bottomProgress = (subchildBottomY - yTop) / (yBottom - yTop);

        topLeftX =
          item.coordinates[0].x +
          topProgress * (item.coordinates[1].x - item.coordinates[0].x);
        bottomLeftX =
          item.coordinates[0].x +
          bottomProgress * (item.coordinates[1].x - item.coordinates[0].x);

        topRightX =
          item.coordinates[3].x -
          topProgress * (item.coordinates[3].x - item.coordinates[2].x);
        bottomRightX =
          item.coordinates[3].x -
          bottomProgress * (item.coordinates[3].x - item.coordinates[2].x);
      }

      return [
        { x: topLeftX, y: subchildY },
        { x: bottomLeftX, y: subchildBottomY },
        { x: bottomRightX, y: subchildBottomY },
        { x: topRightX, y: subchildY },
      ];
    };

    const createSubchildSections = (itemGroup, item, levelData, line) => {
      const subchild = item.subchild;
      const subchildCount = subchild.length;
      const yTop = item.coordinates[0].y;
      const yBottom =
        item.coordinates.length > 1 ? item.coordinates[1].y : yTop + 30;

      const subchildGroup = itemGroup
        .append("g")
        .attr("class", "subchild-group");

      subchild.forEach((child, childIdx) => {
        const subchildCoords = calculateSubchildCoordinates(
          item,
          child,
          childIdx,
          subchildCount,
          yTop,
          yBottom,
          levelData
        );

        const singleSubchildGroup = subchildGroup
          .append("g")
          .attr("class", "single-subchild")
          .attr("data-subchild-idx", childIdx);

        const subchildPath = singleSubchildGroup
          .append("path")
          .attr("d", line(subchildCoords))
          .style("fill", COLORS[child.onprogress ? "active" : "inactive"])
          .style("stroke", COLORS.white)
          .style("stroke-width", STROKE_WIDTHS.subchild)
          .style("pointer-events", "all")
          .style("cursor", "pointer")
          .style("transition", "all 0.2s ease")
          .on("mouseover", function () {
            d3.select(this)
              .style(
                "filter",
                "brightness(0.9) drop-shadow(0 0 8px rgba(255,255,255,0.3))"
              )
              .style("stroke-width", STROKE_WIDTHS.subchildHover);
          })
          .on("mouseout", function () {
            d3.select(this)
              .style("filter", "none")
              .style("stroke-width", STROKE_WIDTHS.subchild);
          })
          .on("click", (event) => {
            event.stopPropagation();

            subchildPath
              .transition()
              .duration(100)
              .style("transform", "scale(0.98)")
              .transition()
              .duration(100)
              .style("transform", "scale(1)");
          });

        const subchildCenterX =
          (subchildCoords[0].x +
            subchildCoords[1].x +
            subchildCoords[2].x +
            subchildCoords[3].x) /
          4;
        const subchildCenterY = (subchildCoords[0].y + subchildCoords[2].y) / 2;

        singleSubchildGroup
          .append("circle")
          .attr("cx", subchildCenterX)
          .attr("cy", subchildCenterY)
          .attr("r", 5)
          .attr("fill", COLORS.white)
          .attr("stroke", COLORS.black)
          .attr("stroke-width", 1)
          .style("cursor", "pointer")
          .style("pointer-events", "all")
          .style("transition", "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)")
          .on("mouseover", function () {
            d3.select(this)
              .transition()
              .duration(ANIMATION_DURATIONS.hover)
              .attr("r", 8)
              .attr("fill", COLORS.gold)
              .attr("stroke-width", 2)
              .style("filter", "drop-shadow(0 0 8px rgba(255, 204, 0, 0.6))");
          })
          .on("mouseout", function () {
            d3.select(this)
              .transition()
              .duration(ANIMATION_DURATIONS.hover)
              .attr("r", 5)
              .attr("fill", COLORS.white)
              .attr("stroke-width", 1)
              .style("filter", "none");
          })
          .on("click", (event) => {
            event.stopPropagation();

            d3.select(event.target)
              .transition()
              .duration(100)
              .attr("r", 3)
              .transition()
              .duration(ANIMATION_DURATIONS.click)
              .attr("r", 8)
              .transition()
              .duration(100)
              .attr("r", 5);

            props.onclickPointer(child);
          });
      });
    };

    const createMainCircleButton = (
      itemGroup,
      item,
      levelData,
      textX,
      textY
    ) => {
      itemGroup
        .append("circle")
        .attr("cx", textX)
        .attr("cy", textY)
        .attr("r", 6)
        .attr("fill", COLORS.white)
        .attr("stroke", COLORS.black)
        .attr("stroke-width", STROKE_WIDTHS.circleMain)
        .style("cursor", "pointer")
        .style("pointer-events", "all")
        .style("transition", "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)")
        .on("mouseover", function () {
          d3.select(this)
            .transition()
            .duration(250)
            .attr("r", 10)
            .attr("fill", COLORS.gold)
            .attr("stroke-width", STROKE_WIDTHS.circleHover)
            .style("filter", "drop-shadow(0 0 12px rgba(255, 204, 0, 0.8))");

          addPulseEffect(itemGroup, textX, textY);
        })
        .on("mouseout", function () {
          d3.select(this)
            .transition()
            .duration(250)
            .attr("r", 6)
            .attr("fill", COLORS.white)
            .attr("stroke-width", STROKE_WIDTHS.circleMain)
            .style("filter", "none");
        })
        .on("click", (event) => {
          event.stopPropagation();

          const clickedCircle = d3.select(event.target);
          clickedCircle
            .transition()
            .duration(100)
            .attr("r", 4)
            .transition()
            .duration(ANIMATION_DURATIONS.hover)
            .attr("r", 12)
            .transition()
            .duration(ANIMATION_DURATIONS.click)
            .attr("r", 6);

          addClickRingEffect(itemGroup, textX, textY);

          props.onclickPointer(item);
        });
    };

    const createItemBlocks = (svg, pyramidData, line) => {
      pyramidData.forEach((levelData) => {
        const levelGroup = svg
          .append("g")
          .attr("class", "level-group")
          .attr("data-level", levelData.level);

        levelData.itemCoordinates.forEach((item, idx) => {
          if (!item.coordinates || item.coordinates.length === 0) return;

          const itemGroup = levelGroup
            .append("g")
            .attr("class", "item-group")
            .attr("data-item-idx", idx);

          const shapePath = itemGroup
            .append("path")
            .attr("d", line(item.coordinates))
            .style("fill", COLORS[item.onprogress ? "active" : "inactive"])
            .style("stroke", COLORS.white)
            .style("stroke-width", STROKE_WIDTHS.block)
            .style("pointer-events", "all")
            .style("cursor", "pointer")
            .style("transition", "all 0.3s ease")
            .on("mouseover", function (event) {
              d3.select(this)
                .style(
                  "filter",
                  "brightness(0.9) drop-shadow(0 0 10px rgba(255,255,255,0.5))"
                )
                .style("stroke-width", STROKE_WIDTHS.blockHover)
                .style("transform", "translateZ(5px)")
                .style("z-index", 100);

              const [x, y] = d3.pointer(event, this);
              addRippleEffect(itemGroup, x, y);
            })
            .on("mouseout", function () {
              d3.select(this)
                .style("filter", "none")
                .style("stroke-width", STROKE_WIDTHS.block)
                .style("transform", "none")
                .style("z-index", "auto");
            })
            .on("click", (event) => {
              event.stopPropagation();

              shapePath
                .transition()
                .duration(ANIMATION_DURATIONS.click)
                .style("transform", "scale(0.95)")
                .transition()
                .duration(ANIMATION_DURATIONS.click)
                .style("transform", "scale(1)");
            });

          createBlockDividers(itemGroup, item, levelData, idx);

          const xValues = item.coordinates.map((coord) => coord.x);
          const xCenter =
            xValues.reduce((sum, x) => sum + x, 0) / xValues.length;
          const yTop = item.coordinates[0].y;
          const yBottom =
            item.coordinates.length > 1 ? item.coordinates[1].y : yTop + 30;

          if (item.subchild && item.subchild.length > 0) {
            createSubchildSections(itemGroup, item, levelData, line);
          } else {
            let textX, textY;

            if (levelData.level === 1 && item.coordinates.length === 3) {
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
              textX = xCenter;
              textY = yTop + (yBottom - yTop) / 2;
            }

            createMainCircleButton(itemGroup, item, levelData, textX, textY);
          }
        });
      });
    };

    const createPyramidChart = () => {
      if (!chart.value) return;

      d3.select(chart.value).selectAll("*").remove();

      const svg = d3
        .select(chart.value)
        .append("svg")
        .attr("width", props.width)
        .attr("height", props.height)
        .attr("class", "pyramid-svg")
        .style("pointer-events", "all")
        .style("position", "relative")
        .style("z-index", "10")
        .append("g");

      const grouped = groupDataByLevel(props.data);
      const pyramidData = createPyramidLayout(grouped);
      const line = d3
        .line()
        .x((d) => d.x)
        .y((d) => d.y)
        .curve(d3.curveLinearClosed);

      createLevelDividers(svg, pyramidData);
      createItemBlocks(svg, pyramidData, line);
    };

    onMounted(() => {
      createPyramidChart();
    });

    watch(
      () => [props.data, props.width, props.height, props.activeColor],
      () => {
        createPyramidChart();
      },
      { deep: true }
    );

    return { chart };
  },
};
</script>

<style scoped>
.chart-left {
  transform: rotateY(-25deg) rotateZ(16deg) rotateX(15deg);
  transform-origin: right center;
  margin-right: -80px;
  transform-style: preserve-3d;
  position: relative;
  z-index: 2;
  width: min-content;
  height: min-content;
  backface-visibility: hidden;
  isolation: isolate;
  overflow: visible;
}

.chart-right {
  transform: rotateY(25deg) rotateZ(-16deg) rotateX(15deg);
  transform-origin: left center;
  margin-left: -80px;
  transform-style: preserve-3d;
  position: relative;
  z-index: 1;
  width: min-content;
  height: min-content;
  backface-visibility: hidden;
  isolation: isolate;
  overflow: visible;
}

.pyramid-svg {
  pointer-events: all !important;
  position: relative;
  z-index: 10;
  overflow: visible;
}

.level-group,
.item-group,
.subchild-group,
.single-subchild {
  pointer-events: all;
}

svg path,
svg circle {
  pointer-events: all !important;
  cursor: pointer;
}

.chart-left,
.chart-right {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.chart-left:hover {
  z-index: 10;
  transform: rotateY(-25deg) rotateZ(16deg) rotateX(15deg) translateZ(20px)
    scale(1.02);
  filter: drop-shadow(0 10px 30px rgba(0, 0, 0, 0.3)) brightness(1.05);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.chart-right:hover {
  z-index: 10;
  transform: rotateY(25deg) rotateZ(-16deg) rotateX(15deg) translateZ(20px)
    scale(1.02);
  filter: drop-shadow(0 10px 30px rgba(0, 0, 0, 0.3)) brightness(1.05);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.chart-left:not(:hover),
.chart-right:not(:hover) {
  opacity: 1;
  transition: all 0.3s ease;
}

.charts-wrapper:hover .chart-left:not(:hover),
.charts-wrapper:hover .chart-right:not(:hover) {
  opacity: 0.7;
  transform-origin: center;
}

.pyramid-svg {
  transition: filter 0.3s ease;
}

svg path {
  transition: all 0.2s ease;
}

svg circle {
  transition: all 0.2s ease;
}

.chart-left,
.chart-right {
  -webkit-transform-style: preserve-3d;
  -webkit-backface-visibility: hidden;
}

.chart-left svg,
.chart-right svg {
  position: relative;
  z-index: inherit;
}
</style>
