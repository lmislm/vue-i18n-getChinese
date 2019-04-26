## 
遗留问题：
- [ ] 文字中间有变量，如： `试用期剩余{{leftDays}}天`，被替换为`{{$t('试用期剩余')}}{{$t('天')}}`
- [ ] 文字中间有页面标签，如：`升级为正式版需保证账户余额达到{0}元，请前往<span style="text-decoration: underline; color: #36a1f8; cursor: pointer;">账户中心</span>充值。`，作为json文件中的key时有符号问题。
- [ ] 文字中间变量应该加转义符号，如："当前余额不足，请联系"{0}"的超级管理员充值"，应该为"当前余额不足，请联系{0}的超级管理员充值"。
- [ ] 两个文件的JSON被合并到一个文件中，导致一个文件有两个`[{}]`、`[{}]`。
- [ ] 多变量替换时，出现乱码，如：`let content = $\{this.packageName\[discount\]\}，文档导出${discount * 10}折，${formatTime}到期`,被替换为`let content = this.$t('{0}，文档导出{1}折，{2}到期', [this.packageName[discount],discount * 10$$%33%$$formatTime])`，应该为：`let content = this.$t('{0}，文档导出{1}折，{2}到期', [this.packageName[discount],discount * 10,formatTime])`

