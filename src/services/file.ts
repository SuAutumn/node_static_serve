import * as fs from 'fs';
import * as path from 'path';
import * as url from 'url';
import { IncomingMessage } from 'http';
import { log } from './utils';

function getPath(p: string) {
  return path.resolve(__dirname, p)
}

const INDEX_FILE = './index.html'

export default class WebFile {
  public static cachePool: { [x: string]: string | Buffer } = {}; // 文件读取缓存
  private req: IncomingMessage;
  private readonly url: url.UrlWithParsedQuery;
  readonly resource: string; // 文件路径和名称
  private ext: string; // 文件扩展名
  readonly mimeType: string; // 请求文件的MIMETYPE
  private _mtime: string; // 文件 modify time
  private static root = ''; // 文件相对根路径

  constructor(req: IncomingMessage) {
    this.req = req;
    this.url = url.parse(req.url || INDEX_FILE, true);
    this.resource = WebFile.getPathname(this.url.pathname);
    this.ext = WebFile.fileType(this.resource).toUpperCase();
    this.mimeType = WebFile.getMimeType(this.ext);
    this._mtime = ''; // file modify time cache.
  }
  get mtime() {
    if (!this._mtime) {
      try {
        this._mtime = fs.statSync(this.resource).mtime.toString();
      } catch (error) {
        this._mtime = '';
      }

    }
    return this._mtime;
  }
  /** 设置文件的根路径 */
  static setRoot(root: string) {
    WebFile.root = getPath(root);
  }

  /** 获取文件全路径 */
  static getPathname(pathname?: string) {
    if (!pathname || pathname === '/')
      pathname = INDEX_FILE;
    return path.join(WebFile.root, pathname)
  }

  static fileType(pathname: string) {
    let m = pathname.match(/\.[\w]+$/);
    return m ? m[0] : 'html'
  }

  read() {
    return fs.readFileSync(this.resource, {
      encoding: 'utf-8'
    })
  }

  static getMimeType(fileExt: string): string {
    return MIMETYPE[fileExt] || MIMETYPE.EMPTY;
  }


  public static cacheFileBuffer(pathname: string, content?: string | Buffer): undefined | string | Buffer {
    if (content) {
      WebFile.cachePool[pathname] = content;
    } else {
      return WebFile.cachePool[pathname];
    }
  }
}

const MIMETYPE: { [x: string]: string } = {
  EMPTY: '*/*',
  HTML: 'text/html; chartset=utf-8',
  CSS: 'text/css; chartset=utf-8',
  JS: 'text/javascript; chartset=utf-8',
  ICO: 'image/x-icon',
  '/': 'text/html; chartset=utf-8',
  PNG: 'image/png',
  JPG: 'image/jpeg',
  JPEG: 'image/jpeg',
  SVG: 'image/svg+xml',
  GIF: 'image/gif',
  JSON: 'application/json; chartset=utf-8',
  WOFF: 'font/woff',
  TTF: 'font/ttf',
  OTF: 'font/otf'
}