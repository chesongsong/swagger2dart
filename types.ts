export enum Types {
    Array = 'array',
    Object = 'object'
}
export interface AtomType {
    type?: Types;
    items: {
        "$ref": string;
    }
}
export interface ResponseSuccess {
    description: string;
    schema: AtomType;
};
export interface Response {
    definitions: object;
    paths: object;
}