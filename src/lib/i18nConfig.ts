const config = {
  autoZhKey: true,
  exclude: [],
  autokeyPrefix: false, // true则以文件名称加_为键名
  findPath: 'tests',
  keyFileName: 'zh_pro', // 默认值为空，则每个文件都会生成一个json文件
  targetDir: 'i18n-messages', // 新建文件名
};
export { config };
