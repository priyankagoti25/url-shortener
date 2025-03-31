import {createServer} from 'http'
import {readFile, writeFile} from 'fs/promises'
import path from "path";

const PORT = 3000
const DATA_FILE = path.join("data", "links.json")

const serverFile = async (res, filePath, contentType) => {
    try {
        const data = await readFile(filePath)
        res.writeHead(200,{'Content-Type': contentType})
        res.end(data)
    } catch (error) {
        res.writeHead(404, {'Content-Type': 'text/plain'})
        res.end("404 Page not found")
    }
}

const loadLinks = async () => {
    try {
        const data = await readFile(DATA_FILE,"utf-8")
        return JSON.parse(data)

    } catch (error){
        if(error.code === 'ENOENT'){
            await writeFile(DATA_FILE,JSON.stringify({}))
            return {}
        }
        throw error
    }
}

const saveLinks = async  (links) => {
    await writeFile(DATA_FILE,JSON.stringify(links))
}

const server = createServer(async (req, res)=>{
        if(req.method ===  "GET"){
            if(req.url === "/"){
                return await serverFile(res,path.join("public", "index.html"), "text/html")
            } else if(req.url === "/style.css"){
                return await serverFile(res,path.join("public", "style.css"), "text/css")
            } else if(req.url === "/links") {
                const links = await loadLinks()
                res.writeHead(200,{"Content-Type":"application/json"})
                res.end(JSON.stringify(links))
            }
        }
        if(req.method === "POST" && req.url === "/shorten") {
            const links = await loadLinks()
            let body=""
            req.on("data",(chunk)=>{
                body+=chunk
            })

            req.on("end",async ()=>{
                const {url, shortCode} = JSON.parse(body)
                if(!url){
                    res.writeHead(400,{"Content-Type":"text/plain"})
                    return res.end("URL is required")
                }
                if(links[shortCode]){
                    res.writeHead(400,{"Content-Type":"text/plain"})
                    return res.end("Short code already exists. Please choose another")
                }
                links[shortCode] = url
                await saveLinks(links)
                res.writeHead(200,{"Content-Type": "application/json"})
                res.end(JSON.stringify({success: true, shortCode}))
            })

        }
})


server.listen(PORT,()=>{
    console.log(`Listening on PORT `,PORT)
})