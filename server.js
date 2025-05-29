const http = require('http')
const fs = require('fs')
const path = require('path')
const url = require('url')
const os = require('os')

const PORT = 3000
const FILE_DIR = path.join(__dirname, 'files')

if (!fs.existsSync(FILE_DIR)) {
  fs.mkdirSync(FILE_DIR)
}

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true)
  const query = parsedUrl.query
  const action = query.action
  const filename = query.name
  const filepath = filename ? path.join(FILE_DIR, filename) : null

  res.setHeader('Content-Type', 'text/plain')

  if (action === 'create') {
    if (!filename || !query.content) return res.end('Missing filename or content')
    fs.writeFile(filepath, query.content, err => {
      res.end(err ? 'Error creating file' : `File '${filename}' created`)
    })
  }

  else if (action === 'read') {
    if (!filename) return res.end('Missing filename')
    fs.readFile(filepath, 'utf-8', (err, data) => {
      res.end(err ? 'File not found' : `Content:\n\n${data}`)
    })
  }

  else if (action === 'delete') {
    if (!filename) return res.end('Missing filename')
    fs.unlink(filepath, err => {
      res.end(err ? 'Cannot delete file' : `File '${filename}' deleted`)
    })
  }

  else if (action === 'list') {
    fs.readdir(FILE_DIR, (err, files) => {
      res.end(err ? 'Error listing files' : `Files:\n\n${files.join('\n')}`)
    })
  }

  else if (action === 'rename') {
    const oldname = query.oldname
    const newname = query.newname
    if (!oldname || !newname) return res.end('Missing oldname or newname')
    const oldpath = path.join(FILE_DIR, oldname)
    const newpath = path.join(FILE_DIR, newname)
    fs.rename(oldpath, newpath, err => {
      res.end(err ? 'Rename failed' : `Renamed '${oldname}' to '${newname}'`)
    })
  }

  else if (action === 'meta') {
    if (!filename) return res.end('Missing filename')
    fs.stat(filepath, (err, stats) => {
      if (err) return res.end('File not found')
      const meta = `
File: ${filename}
Size: ${stats.size} bytes
Created: ${stats.birthtime}
Modified: ${stats.mtime}
`
      res.end(meta)
    })
  }

  else if (action === 'systeminfo') {
    const info = `
System Info
User: ${os.userInfo().username}
OS: ${os.type()} ${os.arch()}
CPU Cores: ${os.cpus().length}
Free RAM: ${(os.freemem() / 1024 / 1024).toFixed(2)} MB
Uptime: ${(os.uptime() / 60).toFixed(1)} minutes
`
    res.end(info)
  }

  else {
    res.end(`Available actions: create, read, delete, list, rename, meta, systeminfo`)
  }
})

server.listen(PORT, () => {
  console.log(`File Manager running at http://localhost:${PORT}`)
})
