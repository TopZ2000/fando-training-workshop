import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
const root = path.resolve('dist');
let html = await readFile(path.join(root, 'index.html'), 'utf8');
const scripts = [...html.matchAll(/<script[^>]+src="([^"]+)"[^>]*><\/script>/g)];
const styles = [...html.matchAll(/<link[^>]+href="([^"]+\.css)"[^>]*>/g)];
for (const match of scripts) {
  const file = path.resolve(root, match[1]);
  if (!file.startsWith(root + path.sep)) throw new Error('构建资源路径越界');
  const code = await readFile(file, 'utf8');
  html = html.replace(match[0], () => `<script type="module">${code.replace(/<\/script/gi,'<\\/script')}</script>`);
}
for (const match of styles) {
  const file = path.resolve(root, match[1]);
  if (!file.startsWith(root + path.sep)) throw new Error('样式路径越界');
  const css = await readFile(file, 'utf8');
  html = html.replace(match[0], () => `<style>${css}</style>`);
}
// 将原模拟参考 Word 内嵌，离线版本移动到其他目录后仍可下载。
const doc = await readFile(path.join(root, 'materials', 'Q3-reference.docx'));
html = html.replaceAll('./materials/Q3-reference.docx', `data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,${doc.toString('base64')}`);
await mkdir('release', {recursive:true});
await writeFile('release/FanDo-培训工作坊-离线评审版.html', html);
console.log('离线评审版已生成，线上部署仍使用 dist。');
