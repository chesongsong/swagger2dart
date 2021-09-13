//1.  拿到swagger返回的内容，解析数据类型
//2.  根据swagger的内容，生成dart model
import got from "got";
import PathDomain from "./domain/path";
const init = async () => {
    const response = await got('http://xxxx.com/');
    const res = JSON.parse(response.body);
    new PathDomain("/xx/xx",res)
        .generateCodes()
        .writeFile()
   
}
init();
