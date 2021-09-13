import Generate from './generate';
import utils from '../utils';
import { ResponseSuccess, Response, Types } from '../../types';
const fs = require('fs');
const spawn = require('child_process').spawn;
// import Types from '../../types';
class PathDomain {
    code: string = '';
    pathName: string = '';
    paths: any = {};
    definitions: object = {};
    className: string = 'MyModel';
    modelDependes: string[] = [];
    erros: string[] = [];
    attrs: object = {};
    constructor(pathName: string, dependes: Response) {
        this.pathName = pathName;
        this.paths = dependes.paths;
        this.definitions = dependes.definitions;
    }

    writeFile() {
        if (this.erros.length > 0) return;
        fs.writeFile(`./models/${this.modelDependes[0]}.dart`, this.code, (err) => {
            if (err) {
                return console.log(err)
            }

            const free = spawn('dart', ['format', './models']);
            // 捕获标准输出并将其打印到控制台 
            free.stdout.on('data', function (data) {
                console.log('格式化models文件夹成功:\n' + data);
            });

            // 捕获标准错误输出并将其打印到控制台 
            free.stderr.on('data', function (data) {
                console.log('格式化models文件夹失败:\n' + data);

            });

        })

    }

    generateCodes() {
        let itemsName = '';
        const responseStructure = this.paths[this.pathName] || {};
        const { get, post, put } = responseStructure;
        const { responses } = get || post || put;
        // 拿到返回成功的响应体内容
        const successResponse = responses['200'];
        // // 拿到返回的schema
        const { schema } = successResponse;

        if (schema.items) {
            const { items, type } = schema
            itemsName = utils.getRefClassName(items["$ref"]);
            // /最外层是数组，那么items就是数组内的每一项
            if (type && type == Types.Array) {
                this.attrs[utils.toHump(itemsName)] = `List<${itemsName}>`
            } else {

            }
        }
        else {
            if (schema.type != undefined) {
                if (schema.type !== 'array' || schema.type != 'object') {
                    const msg = "返回值为boolean值，不需要转化为json";
                    this.erros.push(msg)
                    console.error(msg);
                    return this;
                }
            } else {
                itemsName = schema['$ref'].split('/').pop();
            }




        }
        const generate = new Generate(this.className, this.attrs)
        const containerCode = generate.build();
        const codes: string[] = this.createModelDefinitions(itemsName);
        codes.unshift(containerCode);
        this.code = codes.join("\n");
        return this;
    }


    // new PathDomain("/account-trade/agency-balance-expenditure", res);
    // 提取$ref 中的依赖model name 并转换为大写
    getModelNameByModelBody(modelName: string, dependes: string[]) {
        const modelBody = this.definitions[modelName];
        const stringModelBody = JSON.stringify(modelBody);
        const regexp = /(?<=#).*?(?=\")/g;
        const res = stringModelBody.match(regexp);
        if (res) {
            res.forEach((item) => {
                const className = item.split("/").pop();
                if (!dependes.includes(className)) {
                    dependes.push(className);
                }
                return this.getModelNameByModelBody(className, dependes);
            })
        }
        return null;
    }
    // 生成model class
    createClass(name: string) {
        const attrs = {};
        const currentModel = this.definitions[name];
        const { type, properties } = currentModel;
        if (type === 'object') {
            Object.keys(properties).forEach((key) => {
                // java swagger 类型转换成dart类型
                // TODO 需要对引用类型的数据递归处理
                const item = properties[key];
                const ctype = item.type

                if (ctype == 'object') {
                    // 如果有该属性,则 additionalProperties 中的$ref是object中的数据类型Map<String,xxx> 范型T
                    if (!!item.additionalProperties) {
                        if (!!item.additionalProperties.$ref) {
                            const ref = item.additionalProperties.$ref
                            const additionalPropertiesClassName = utils.getRefClassName(ref);
                        }
                        // TODO 待定 key一直变动，暂时没有好的方案处理
                    }
                } else if (ctype == 'array') {
                    if (item.items.$ref) {
                        const ref = item.items.$ref
                        const className = utils.getRefClassName(ref);
                        attrs[key] = `List<${className}>`;
                    } else {
                        const type = utils.toDartType(item.items.type);
                        attrs[key] = `List<${type}>`;
                    }

                } else if (ctype == undefined) {
                    // 无type
                    const ref = item.$ref
                    const className = utils.getRefClassName(ref);
                    attrs[key] = className;
                }
                else {
                    const dartType = utils.toDartType(ctype);
                    attrs[key] = dartType;
                }
            })
        } else {
            throw new Error("不是object类型");
        }
        return new Generate(name, attrs).build();

    }

    // 生成依赖model
    createModelDefinitions(modelName: string) {
        this.modelDependes = [modelName];
        this.getModelNameByModelBody(modelName, this.modelDependes);
        return this.modelDependes.map((name) => {
            return this.createClass(name);
        })

    }

}
export default PathDomain;