<!-- Test -->
<template>
  <div class="test">
    <!-- 测试模板内注释 -->
    {{'测试2'}}
    {{'测试2'}}
  </div>
</template>

<script>
export default {
  // 测试注释data
  name: 'Test',
  data () {
    return {
      // 测试注释return data
      tste: false,
      test: ''
    }
  },
  methods: {
    // 测试注释method
    test2 () {
      this.$noti('这里是method里面的测试')
      console.log('这里是测试console')
    }
  },
  created () {}
}

</script>
<style lang='less' scoped>
.test {
  // 测试样式注释
}
</style>
