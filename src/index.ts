import * as http from 'http';
import * as path from 'path';

import WebFile from './services/file';
import { log, flag, cast_time } from './services/utils';

/**
 * test_staic_root
 */
const ROOT: string = path.resolve(__dirname, '../../../test_static');
const PORT: number = 3000;

WebFile.setRoot(ROOT);

http.createServer((req: http.IncomingMessage, res: http.ServerResponse) => {
  let file = new WebFile(req);
  if (file.mtime) {
    /**
    * 根据modify time进行缓存处理。
    * @todo: 还有一些缓存字段 eg: expires, etag
    */
    if (file.mtime === req.headers['if-modified-since']) {
      let f = flag()
      http_304(res, file);
      log(`304 time: `, cast_time(f));
    } else {
      let f = flag()
      http_200(res, file)
      log(`200 time: `, cast_time(f));
    }
  } else {
    let f = flag()
    http_404(res, file);
    log(`404 time: `, cast_time(f));
  }
}).listen(PORT);

function http_200(res: http.ServerResponse, file: WebFile) {
  res.writeHead(200, {
    'Cache-Control': 'no-cache',
    'Content-Type': file.mimeType,
    'Last-Modified': file.mtime
  });
  // cache file;
  let content = WebFile.cacheFileBuffer(file.resource);
  if (!content) {
    content = file.read();
    WebFile.cacheFileBuffer(file.resource, content);
  }
  res.end(content)
}

function http_304(res: http.ServerResponse, file: WebFile) {
  res.writeHead(304, {
    'Cache-Control': 'no-cache',
    'Content-Type': file.mimeType,
    'Last-Modified': file.mtime
  })
  res.end()
}

function http_404(res: http.ServerResponse, file: WebFile) {
  log('not found: ', file.resource)
  res.statusCode = 404;
  res.end()
}
