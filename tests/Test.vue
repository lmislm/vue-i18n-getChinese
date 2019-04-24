<!-- Test -->
<template>
  <div class="test">
    <!-- 测试模板内注释 -->{{'这里是测试！！！！'}}
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
