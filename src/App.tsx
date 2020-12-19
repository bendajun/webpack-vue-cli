
import { defineComponent } from 'vue';

export default defineComponent({
  render: function() {
    const a = 12345;
    const b: number = a;
    return <div>{b + 1}</div>;
  }
});
