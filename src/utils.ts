// 大写转驼峰AxxxBxxx -> axxBxx
const toHump = (str: string) => {
    return str.replace(str.charAt(0), str.charAt(0).toLocaleLowerCase());
}
const toUp = (str: string) => {
    return str.replace(str.charAt(0), str.charAt(0).toLocaleUpperCase());
}
const toDartType = (type: string, format?: string) => {
    const typeMapping = {
        'integer': 'int',
        'string': 'String',
        'array': 'List',
        'boolean': 'bool'
    }
    return typeMapping[type];
}
const getRefClassName = (ref: string) => {
    return toUp(ref.split('/').pop());
}
export default { toHump, toDartType, getRefClassName, toUp }