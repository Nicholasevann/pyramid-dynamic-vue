<template>
  <div id="app">
    <h1>D3.js Pyramid Chart in Vue</h1>
    <div class="flex-row flex"></div>
    <PyramidChart :data="chartData" :width="1000" :height="750" />
    <div class="data-display">
      <h3>Current Data:</h3>
      <pre>{{ JSON.stringify(chartData, null, 2) }}</pre>
    </div>
  </div>
</template>

<script>
import PyramidChart from "./Chart.vue";

export default {
  name: "App",
  components: {
    PyramidChart,
  },
  data() {
    return {
      chartData: [
        { name: "Production optimization", level: 1, onprogress: true },
        { name: "Cost vigilance", level: 1, onprogress: true },
        {
          name: "DE",
          level: 2,
          subchild: [
            { subLevel: 1, name: "Operational Efficienct", onprogress: true },
            {
              subLevel: 2,
              name: "Deliver Profitable Project",
              onprogress: false,
            },
          ],
        },
        { name: "Operational Cost", level: 2, onprogress: false },
        { name: "Decresing Methane Intensity", level: 2, onprogress: true },
        { name: "Operating Performance", level: 3, onprogress: true },
        { name: "More Energy", level: 4, onprogress: true },
        { name: "Growing Cash Flow", level: 4, onprogress: true },
      ],
    };
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
</style>
