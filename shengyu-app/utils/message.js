import { createApp } from 'vue';

const showToast = (options) => {
  const { message, type = 'success', duration = 2000 } = options;
  
  const toastApp = createApp({
    template: `
      <cute-toast 
        :message="message" 
        :type="type" 
        :duration="duration" 
        ref="toast"
      />
    `,
    data() {
      return { message, type, duration };
    },
    mounted() {
      this.$refs.toast.show();
    }
  });
  
  const toast = toastApp.mount(document.createElement('div'));
  document.body.appendChild(toast.$el);
};

const showModal = (options) => {
  return new Promise((resolve) => {
    const { 
      title = '提示', 
      content = '', 
      confirmText = '确定', 
      cancelText = '取消',
      closeOnClickOverlay = true
    } = options;
    
    const modalApp = createApp({
      template: `
        <cute-modal 
          :visible="visible"
          :title="title"
          :content="content"
          :confirmText="confirmText"
          :cancelText="cancelText"
          :closeOnClickOverlay="closeOnClickOverlay"
          @confirm="handleConfirm"
          @cancel="handleCancel"
        />
      `,
      data() {
        return { 
          visible: true, 
          title, 
          content, 
          confirmText, 
          cancelText,
          closeOnClickOverlay
        };
      },
      methods: {
        handleConfirm() {
          this.visible = false;
          resolve(true);
        },
        handleCancel() {
          this.visible = false;
          resolve(false);
        }
      }
    });
    
    const modal = modalApp.mount(document.createElement('div'));
    document.body.appendChild(modal.$el);
  });
};

export { showToast, showModal };
