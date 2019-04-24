import * as fs from 'fs'
import * as glob from 'glob' 
import * as path from 'path'

import {config} from './i18nConfig'
import vueCodeString from './parse/vueCodeString'
import {markString, interpolationMark} from './parse/common'

const targetDir = config.targetDir
const exclude = config.exclude
const autoZhKey = config.autoZhKey
const keyFileName = config.keyFileName
const autokeyPrefix = config.autokeyPrefix
const findPath = config.findPath

// 扫描文件目录，注意路径
// run(findPath ? findPath : path.join(__dirname))
/**
 * 
 * @param rootPath
 */
export function scan(rootPath: string) {
    glob(`${rootPath}/**/*.vue`, { ignore: exclude.map(pattern=>`${rootPath}/${pattern}`) }, (er, files) => {
        files.forEach((pathFilename, index) => {
            if (pathFilename.includes('node_modules')) return
            // 如果文件目录带了_，是测试用例
            if (pathFilename.indexOf('_') !== -1) return
            // 文件名字，用于后面构造json里的名称
            let filename = path.parse(pathFilename).name.toLowerCase()
            function hit(code: any){
              return /[\u4e00-\u9fa5]/.test(code)
            }
            let data = fs.readFileSync(pathFilename, 'utf-8')
            let result = vueCodeString.extractStringFromVue(data, {
                filter: hit
            })
            // 解析页面，找到替换的位置，插入-||和||-包裹的格式数字进行标记
            let replaceCode = result.result
            let findWordArr = result.extractString.map(item=>{
                return {
                    ...item,
                    used: true,
                    // 默认word代替key
                    key: autoZhKey ? item.word : ''
                }
            })
            if(!replaceCode){
                return ''
            }
            // 没有替换$t()变量
            let showReplaceCode = findWordArr.reduce((replaceCode, findWord, index)=>{
                if(!findWord.used){
                    if(replaceCode.indexOf(`${markString[0]}${findWord.index}${interpolationMark[0]}`) > -1){
                        let start = replaceCode.indexOf(`${markString[0]}${findWord.index}${interpolationMark[0]}`),
                        end = replaceCode.indexOf(`${interpolationMark[1]}${findWord.index}${markString[1]}`) + `${markString[1]}${findWord.index}${interpolationMark[1]}`.length
                        return replaceCode.substr(0, start) + findWord.originalCode + replaceCode.substr(end)
                    } else {
                        return replaceCode.replace(markString[0] + findWord.index + markString[1], findWord.originalCode)
                    }
                } else {
                    replaceCode = replaceCode.replace(markString[0] + findWord.index + markString[1], findWord.replaceCode)
                }
                return replaceCode
            }, replaceCode)
            //  替换页面元素相应的标记并输出json格式文案
            let keyArr: never[] | string[][] = []
            let html  = showReplaceCode
            // 生成的键值对JSON格式键名前缀
            let nameSpaceName = autokeyPrefix ? filename + '_' : ''
            let resultHtml = findWordArr.reduce((replaceCode: any, word, index)=>{
                // 构造新的解析页面
                if(!word.used){
                    if(replaceCode.indexOf(`${markString[0]}${word.index}${interpolationMark[0]}`) > -1){
                        let start = replaceCode.indexOf(`${markString[0]}${word.index}${interpolationMark[0]}`),
                        end = replaceCode.indexOf(`${interpolationMark[1]}${word.index}${markString[1]}`) + `${markString[1]}${word.index}${interpolationMark[1]}`.length
                        return replaceCode.substr(0, start) + word.originalCode + replaceCode.substr(end)
                    } else {
                        return replaceCode.replace(markString[0] + word.index + markString[1], word.originalCode)
                    }
                } else {
                    let key = getKeyName(nameSpaceName || '', word.key)
                    keyArr.push([key, word.word])
                    let quotationMarks = '\''
                    let t = '$t'
                    if(word.replaceType === 'vue-attr' && '\'' === word.quotationMarks){
                        quotationMarks = '"'
                    }
                    if(word.replaceType === 'js'){
                        t = 'this.$t'
                    }
                    return replaceCode.replace(`${markString[0]}${index}${markString[1]}`, `${t}(${quotationMarks}${word.key}${quotationMarks})`)
                        .replace(`${markString[0]}${index}${interpolationMark[0]}`, `${t}(${quotationMarks}${word.key}${quotationMarks}, [`)
                        .replace(`${interpolationMark[1]}${index}${interpolationMark[0]}`, ``)
                        .replace(`${interpolationMark[1]}${index}${markString[1]}`, ``)
                }
            }, html)
            // 构造键值对
            // 同步写入文件
            fs.writeFileSync(pathFilename, resultHtml)
            let keyMap = keyArr.map(([key, value])=>`"${key}": "${value.replace(/[\n]/g, '')}"`).join(',\n')
            // rimraf.sync(targetDir);
            fs.mkdir(targetDir, function (err) {
                if (err) {
                    return
                }
            });
            // 判断内容为空则不追加空内容
            if (keyMap) {
                let formatterKeyMap = JSON.parse(JSON.stringify(getJsonFormat(keyMap, index, files.length, pathFilename)))
                fs.appendFileSync(`${targetDir}/${keyFileName}.json`, `${formatterKeyMap}`);
            }
        })
    });
}
// 键名称
function getKeyName(...str: string[]){
    str = str.filter(str=>str).reduce((arr, name) => {
        return [...arr, ...(name.trim().split(/\s+/g))]
    }, [])
    return str.slice(0, 3).map(name=>name.toLowerCase()).join('_')
}
// json格式
function getJsonFormat (keys: any, index: number, length: number, pathFilename: string) {
    let startBrace
    let endBrace
    if (index !== 0) {
        startBrace = `"${pathFilename}": {\r\n`
    } else {
        startBrace = `[{\r\n"${pathFilename}": {\r\n`
    }
    if (index !== length - 1) {
        endBrace = `},\r\n`
    } else {
        endBrace = `}\r\n}]`
    }
    return `${startBrace}\r\n${keys}\r\n${endBrace}\r\n`
}
