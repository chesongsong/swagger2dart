import utils from "../utils";
const DART_TYPES = ['bool', 'String', 'int', 'double'];
class Generate {
    classStructure: object;
    className: string;
    keys: string[];
    constructor(className: string, classStructure: object) {
        this.classStructure = classStructure;
        this.className = utils.toUp(className);
        this.keys = Object.keys(this.classStructure) || [];
    }
    // 构建class初始属性
    private buildClassInitalProps() {
        return this.keys.map((key) => {
            return `${this.classStructure[key]} ${key};`
        }).join('\n\t\t ');
    }

    private buildConstructorFn() {
        const constructorAttrs = this.keys.map((key) => {
            const v = this.classStructure[key];
            return `this.${key}`;
        }).join(',')
        return `${this.className}({${constructorAttrs}});`
    }
    private buildFromJson() {
        const jsonConvertContent = this.keys.map((key) => {
            const type = this.classStructure[key] as string;
            //  基本类型，直接取值
            if (DART_TYPES.includes(type)) {
                return `${key} = json['${key}'];`
            } else if (type.indexOf("List<") > -1) {
                // 这里传过来的是带类型的List  eg: List<xxxx>
                const ModelType = type.replace("List<", "").replace(">", "");

                if (DART_TYPES.includes(ModelType)) {
                    return `${key} = json['${key}'].cast<${ModelType}>();`
                }
                return `if (json['${key}'] != null) {
                    ${key} = new ${type}();
                    json['${key}'].forEach((v) {
                      ${key}.add(new ${ModelType}.fromJson(v));
                    });
                  }
                `
            } else {
                return `${key} = json['${key}']!= null ? new ${type}.fromJson(json['${key}']) : null;`
            }

        }).join('\n\t\t ');
        return `
           ${this.className}.fromJson(Map<String, dynamic> json) {
                ${jsonConvertContent}
            }
        `
    }

    private buildToJson() {
        const constructorAttrs = this.keys.map((key) => {


            const type = this.classStructure[key] as string;
            //  基本类型，直接取值
            if (DART_TYPES.includes(type)) {
                return `data['${key}'] = this.${key};`;
            } else if (type.indexOf("List<") > -1) {
                // 这里传过来的是带类型的List  eg: List<xxxx>
                const ModelType = type.replace("List<", "").replace(">", "");
                if (DART_TYPES.includes(ModelType)) {
                    return `data['${key}'] = this.${key};`
                }
                return `
                    if (this.${key} != null) {
                        data['${key}'] = this.${key}.map((v) => v.toJson()).toList();
                    }
                `
            } else {
                return `
                if (this.${key} != null) {
                    data['${key}'] = this.${key}.toJson();
                  }
                `
            }

        }).join('\n\t\t ')
        return `
            Map<String,dynamic> toJson() {
                final Map<String, dynamic> data = new Map<String, dynamic>();
                ${constructorAttrs}
                return data;
            }
        
        `
    }

    build() {
        if (Object.keys(this.classStructure).length < 1) {
            return '';
        }
        const props = this.buildClassInitalProps();
        const constructorFn = this.buildConstructorFn();
        const fromJson = this.buildFromJson();
        const toJson = this.buildToJson();
        return `
            class ${this.className} {
                ${props}
                
                ${constructorFn}

                ${fromJson}

                ${toJson}
            }
          `
    }
}

export default Generate;