const http = require('http');
const fs = require('fs').promises;
const path = require('path');
const url = require('url');
const os = require('os');

const PORT = 3000;
const FILE_DIR = path.join(__dirname, 'files');

// Ensure files directory exists
(async () => {
  try {
    await fs.mkdir(FILE_DIR, { recursive: true });
  } catch (err) {
    console.error('Failed to create files directory:', err);
    process.exit(1);
  }
})();

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const query = parsedUrl.query;
  const action = query.action;
  const filename = query.name;
  const filepath = filename ? path.join(FILE_DIR, filename) : null;

  res.setHeader('Content-Type', 'text/plain');

  try {
    if (action === 'create') {
      if (!filename || !query.content) {
        return res.end('Missing filename or content');
      }
      await fs.writeFile(filepath, query.content);
      return res.end(`File '${filename}' created`);
    }

    else if (action === 'read') {
      if (!filename) return res.end('Missing filename');
      const data = await fs.readFile(filepath, 'utf-8');
      return res.end(`Content:\n\n${data}`);
    }

    else if (action === 'delete') {
      if (!filename) return res.end('Missing filename');
      await fs.unlink(filepath);
      return res.end(`File '${filename}' deleted`);
    }

    else if (action === 'list') {
      const files = await fs.readdir(FILE_DIR);
      return res.end(`Files:\n\n${files.join('\n')}`);
    }

    else if (action === 'rename') {
      const { oldname, newname } = query;
      if (!oldname || !newname) return res.end('Missing oldname or newname');
      const oldpath = path.join(FILE_DIR, oldname);
      const newpath = path.join(FILE_DIR, newname);
      await fs.rename(oldpath, newpath);
      return res.end(`Renamed '${oldname}' to '${newname}'`);
    }

    else if (action === 'meta') {
      if (!filename) return res.end('Missing filename');
      const stats = await fs.stat(filepath);
      const meta = `
File: ${filename}
Size: ${stats.size} bytes
Created: ${stats.birthtime}
Modified: ${stats.mtime}
`;
      return res.end(meta);
    }

    else if (action === 'systeminfo') {
      const info = `
System Info
User: ${os.userInfo().username}
OS: ${os.type()} ${os.arch()}
CPU Cores: ${os.cpus().length}
Free RAM: ${(os.freemem() / 1024 / 1024).toFixed(2)} MB
Uptime: ${(os.uptime() / 60).toFixed(1)} minutes
`;
      return res.end(info);
    }

    else {
      return res.end(`Available actions: create, read, delete, list, rename, meta, systeminfo`);
    }

  } catch (error) {
    console.error('Server error:', error);
    return res.end(`Error: ${error.message}`);
  }
});

server.listen(PORT, () => {
  console.log(`File Manager running at http://localhost:${PORT}`);
});
