<template>
  <div id="app">
    <h1>D3.js Pyramid Chart in Vue</h1>
    <div class="scene">
      <div class="pyramid-container" v-if="chartData.length > 0">
        <PyramidChart
          :data="chartData"
          :width="400"
          :height="500"
          activeColor="#f75c4b"
          :onclickPointer="handleClick"
          position="left"
        />
        <PyramidChart
          :data="chartData"
          :width="400"
          :height="500"
          activeColor="#a2d97e"
          :onclickPointer="handleClick"
          position="right"
        />
      </div>
    </div>
    <!-- Popup Modal -->
    <PopupModal
      :show="showPopup"
      :item="selectedItem"
      @close="closePopup"
      v-if="selectedItem"
    />
  </div>
</template>

<script>
import PyramidChart from "./components/Chart.vue";
import PopupModal from "./components/PopupModal.vue";
import { chartData as importedChartData } from "./data/chart.ts";
export default {
  name: "App",
  components: {
    PyramidChart,
    PopupModal,
  },
  data() {
    return {
      showPopup: false,
      selectedItem: null,
      chartData: importedChartData, // assign imported data to reactive property
    };
  },
  methods: {
    handleClick(item) {
      this.selectedItem = item;
      this.showPopup = true;
      console.log("Clicked item:", item);
      console.log("Clicked item name:", item.onprogress);
    },
    closePopup() {
      this.showPopup = false;
      this.selectedItem = null;
    },
  },
};
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 20px;
  padding: 0 20px;
}

.controls {
  margin-bottom: 20px;
}

button {
  background-color: #4f84ff;
  color: white;
  border: none;
  padding: 8px 15px;
  margin: 0 5px;
  border-radius: 4px;
  cursor: pointer;
}

button:hover {
  background-color: #3a6fff;
}

.data-display {
  margin-top: 30px;
  text-align: left;
  max-width: 700px;
  margin-left: auto;
  margin-right: auto;
  background-color: #f5f5f5;
  padding: 15px;
  border-radius: 5px;
}

pre {
  overflow-x: auto;
}

/* 3D scene container with enhanced perspective */
.scene {
  margin: 150px auto;
}

.pyramid-container {
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  position: relative;
  width: 100%;
  height: 100%;
}
</style>
