import * as fs from 'fs';
import * as glob from 'glob';
import * as path from 'path';

import { config } from './i18nConfig';
import { markString, interpolationMark } from './parse/common';
import vueCodeString from './parse/vueCodeString';

const autokeyPrefix = config.autokeyPrefix;
const autoZhKey = config.autoZhKey;
const exclude = config.exclude;
const keyFileName = config.keyFileName;
const targetDir = config.targetDir;

// 扫描文件目录，注意路径
/**
 *
 * @param rootPath
 */
export function scan(rootPath: string) {
  glob(`${rootPath}/**/*.vue`, { ignore: exclude.map(pattern => `${rootPath}/${pattern}`) }, (er, files) => {
    files.forEach((pathFilename, index) => {
      if (pathFilename.includes('node_modules')) {
        return;
      }
      // 如果文件目录带了_，是测试用例
      if (pathFilename.indexOf('_') !== -1) {
        return;
      }
      // 文件名字，用于后面构造json里的名称
      const data = fs.readFileSync(pathFilename, 'utf-8');
      const filename = path.parse(pathFilename).name.toLowerCase();
      const result = vueCodeString.extractStringFromVue(data, {
        filter: hit,
      });
      // 解析页面，找到替换的位置，插入-||和||-包裹的格式数字进行标记
      const replaceCode = result.result;
      const findWordArr = result.extractString.map(item => {
        return {
          ...item,
          used: true,
          // 默认word代替key
          key: autoZhKey ? item.word : '',
        };
      });
      if (!replaceCode) {
        return '';
      }
      // 没有替换$t()变量
      let showReplaceCode = findWordArr.reduce((replaceCode: any, findWord: any, index: number) => {
        if (!findWord.used) {
          if (replaceCode.indexOf(`${markString[0]}${findWord.index}${interpolationMark[0]}`) > -1) {
            let start = replaceCode.indexOf(`${markString[0]}${findWord.index}${interpolationMark[0]}`);
            let end =
              replaceCode.indexOf(`${interpolationMark[1]}${findWord.index}${markString[1]}`) +
              `${markString[1]}${findWord.index}${interpolationMark[1]}`.length;
            return replaceCode.substr(0, start) + findWord.originalCode + replaceCode.substr(end);
          } else {
            return replaceCode.replace(markString[0] + findWord.index + markString[1], findWord.originalCode);
          }
        } else {
          replaceCode = replaceCode.replace(markString[0] + findWord.index + markString[1], findWord.replaceCode);
        }
        return replaceCode;
      }, replaceCode);
      //  替换页面元素相应的标记并输出json格式文案
      const keyArr: string[][] = [];
      const html = showReplaceCode;
      // 生成的键值对JSON格式键名前缀
      const nameSpaceName = autokeyPrefix ? filename + '_' : '';
      const resultHtml = findWordArr.reduce((replaceCode: any, word: any, index: number) => {
        // 构造新的解析页面
        if (!word.used) {
          if (replaceCode.indexOf(`${markString[0]}${word.index}${interpolationMark[0]}`) > -1) {
            let start = replaceCode.indexOf(`${markString[0]}${word.index}${interpolationMark[0]}`),
              end =
                replaceCode.indexOf(`${interpolationMark[1]}${word.index}${markString[1]}`) +
                `${markString[1]}${word.index}${interpolationMark[1]}`.length;
            return replaceCode.substr(0, start) + word.originalCode + replaceCode.substr(end);
          } else {
            return replaceCode.replace(markString[0] + word.index + markString[1], word.originalCode);
          }
        } else {
          let key = getKeyName(nameSpaceName || '', String(word.key));
          keyArr.push([key, word.word]);
          let quotationMarks = "'";
          let t = '$t';
          if (word.replaceType === 'vue-attr' && "'" === word.quotationMarks) {
            quotationMarks = '"';
          }
          if (word.replaceType === 'js') {
            t = 'this.$t';
          }
          return replaceCode
            .replace(`${markString[0]}${index}${markString[1]}`, `${t}(${quotationMarks}${word.key}${quotationMarks})`)
            .replace(
              `${markString[0]}${index}${interpolationMark[0]}`,
              `${t}(${quotationMarks}${word.key}${quotationMarks}, [`,
            )
            .replace(`${interpolationMark[1]}${index}${interpolationMark[0]}`, `, `)
            .replace(`${interpolationMark[1]}${index}${markString[1]}`, `])`)
        }
      }, html);
      // 构造键值对
      // 同步写入文件
      fs.writeFileSync(pathFilename, resultHtml);
      // 去重
      const uniqueFindWordArr: any = uniqueArray(keyArr)
      const keyMap: any = uniqueFindWordArr.map(([key, value]: [any, any]) => `"${key}": "${value.replace(/[\n]/g, '')}"`).join(',\n');
      // rimraf.sync(targetDir);
      fs.mkdir(targetDir, function(err) {
        if (err) {
          return;
        }
      });
      // 判断内容为空则不追加空内容，生成多文件还是单文件
      if (keyMap) {
        const formatterKeyMap = JSON.parse(JSON.stringify(getJsonFormat(keyMap, index, files.length, pathFilename, keyFileName)));
        if (pathFilename) {
          let regFileName = pathFilename.match('[^/]+(?!.*/)')
          let vueFileName = keyFileName ? keyFileName : regFileName && regFileName[0]
          fs.appendFileSync(`${targetDir}/${vueFileName}.json`, `${formatterKeyMap}`);
        }
      }
    });
  });
}
// 过滤中文
function hit(code: any) {
  return /[\u4e00-\u9fa5]/.test(code);
}
// 同文件中去重,固定值过滤
function uniqueArray(...arr: Array<Object>) {
  const res = new Map();
  let arrValues: any = arr[0]
  return arrValues.filter((a: any) => {
    return !res.has(a[0]) && res.set(a[0], 1)
  })
}
// 键名称
function getKeyName(...str: string[]) {
  str = str
    .filter(str => str)
    .reduce((arr: string[], name: string) => {
      return [...arr, ...name.trim().split(/\s+/g)];
    }, []);
  return str
    .slice(0, 3)
    .map(name => name.toLowerCase())
    .join('_');
}
// json格式
function getJsonFormat(keys: any, index: number, length: number, pathFilename: string, keyFileName: string) {
  if (keyFileName) {
    // 指定的生成单文件
    let startBrace;
    let endBrace;
    if (index !== 0) {
      startBrace = `"${pathFilename}": {\r\n`;
    } else {
      startBrace = `[{\r\n"${pathFilename}": {\r\n`;
    }
    if (index !== length - 1) {
      endBrace = `},\r\n`;
    } else {
      endBrace = `}\r\n}]`;
    }
    return `${startBrace}\r\n${keys}\r\n${endBrace}\r\n`;
  } else {
    // 生成多个文件
    return `[{\r\n${keys}\r\n}]\r\n`;
  }
}
