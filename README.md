# 说明

项目处于dev状态，没有完善一键运行脚本。

页面版和此项目核心源：https://github.com/laden666666/vue-i18n-tools


scan .vue, export Chinese Text Json and set $t() by Chinese key

提取vue文件中的中文字符到一个指定的json文件格式中，并将原有的字符串加上vue-i18n的$t()或者this.$t()规则。

以中文字符作为key。
## 运行
ts-node ./src/bin/index.ts tests/
## 遗留问题：
- [ ] 文字中间有变量，如： `试用期剩余{{leftDays}}天`，被替换为`{{$t('试用期剩余')}}{{$t('天')}}`
- [ ] 文字中间有页面标签，如：`升级为正式版需保证账户余额达到{0}元，请前往<span style="text-decoration: underline; color: #36a1f8; cursor: pointer;">账户中心</span>充值。`，作为json文件中的key时有符号问题。
- [ ] 文字中间变量应该加转义符号，如："当前余额不足，请联系"{0}"的超级管理员充值"，应该为"当前余额不足，请联系{0}的超级管理员充值"。
- [ ] 两个文件的JSON被合并到一个文件中，导致一个文件有两个`[{}]`、`[{}]`。
- [ ] 多变量替换时，出现乱码，如：`let content = $\{this.packageName\[discount\]\}，文档导出${discount * 10}折，${formatTime}到期`,被替换为`let content = this.$t('{0}，文档导出{1}折，{2}到期', [this.packageName[discount],discount * 10$$%33%$$formatTime])`，应该为：`let content = this.$t('{0}，文档导出{1}折，{2}到期', [this.packageName[discount],discount * 10,formatTime])`
- [ ] 变量间隔替换问题，如：`<div v-if="discount < 1">文档优惠({{discount * 10}}折)：-{{(totalPrice - discountPrice) | priceFormat}}</div>`，被替换为`<div v-if="discount < 1">{{$t('文档优惠(')}}{{$t('折)：-')}}scount * 10}}折)：-{{(totalPrice - discountPrice) | priceFormat}}</div>`
- [ ] `jsx`语法不支持,如：
```javascript
renderTimeHeader (h, { column, $index }) {
  // element 2.4.2不支持slot header
  return (
    <div class="timeTableHeader" style="line-height:30px!important;">
      <span>开始日期</span>
      <br/>
      <span>结束日期</span>
    </div>
  )
}
```
## ToDo
- [ ] 一键脚本
- [ ] 出现国际化特征文案如`$t() `字符的不再次进行替换成`$t($t())`
- [ ] 选出迭代更新的文件
- [ ] key值转为小写填充到vue文件中
