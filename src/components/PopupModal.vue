<template>
  <div v-if="show" class="popup-overlay" @click="close">
    <div class="popup-modal" @click.stop>
      <div class="popup-header">
        <h2>{{ item.name }}</h2>
        <button class="close-btn" @click="close">×</button>
      </div>
      <div class="popup-content">
        <div class="status-section">
          <div
            class="progress-item"
            v-for="(progress, index) in item.progressItem"
            :key="index"
          >
            <span class="label">{{ progress.field }}</span>
            <span class="value">{{ progress.value }}</span>
          </div>
          <div class="status-indicator">
            <span class="status-label">Status:</span>
            <span
              :class="[
                'status-badge',
                item.onprogress ? 'in-progress' : 'completed',
              ]"
            >
              {{ item.onprogress ? "In Progress" : "Completed" }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "PopupModal",
  props: {
    show: { type: Boolean, required: true },
    item: { type: Object, required: true },
  },
  emits: ["close"],
  methods: {
    close() {
      this.$emit("close");
    },
  },
};
</script>

<style scoped>
.popup-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.popup-modal {
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1),
    0 10px 10px -5px rgba(0, 0, 0, 0.04);
  max-width: 400px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  position: relative;
  animation: modalSlideIn 0.3s ease-out;
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 24px 16px 24px;
  border-bottom: 1px solid #e5e7eb;
}

.popup-header h2 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: #1f2937;
}

.close-btn {
  background: none;
  border: none;
  font-size: 28px;
  color: #6b7280;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: all 0.2s;
}

.close-btn:hover {
  background-color: #f3f4f6;
  color: #374151;
}

.popup-content {
  padding: 24px;
}

.status-section h3 {
  margin: 0 0 20px 0;
  font-size: 18px;
  font-weight: 600;
  color: #374151;
}

.progress-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f3f4f6;
}

.progress-item:last-child {
  border-bottom: none;
}

.progress-item .label {
  font-size: 16px;
  color: #374151;
  font-weight: 500;
}

.progress-item .value {
  font-size: 16px;
  color: #6b7280;
  font-weight: 600;
}

.status-indicator {
  margin-top: 20px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.status-label {
  font-size: 16px;
  font-weight: 600;
  color: #374151;
}

.status-badge {
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.status-badge.in-progress {
  background-color: #fef3c7;
  color: #d97706;
}

.status-badge.completed {
  background-color: #d1fae5;
  color: #059669;
}

/* Responsive design */
@media (max-width: 768px) {
  .popup-modal {
    margin: 20px;
    max-width: none;
    width: calc(100% - 40px);
  }

  .popup-header {
    padding: 20px 20px 12px 20px;
  }

  .popup-content {
    padding: 20px;
  }

  .popup-header h2 {
    font-size: 20px;
  }
}
</style>
